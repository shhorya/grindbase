"use client"

import { useCallback, useSyncExternalStore } from "react"
import { createClient } from "./supabase/client"

// Old local-storage keys — read only once, to migrate a device's existing
// progress into the cloud the first time that account syncs.
const LEGACY_PROGRESS_KEY = "grindbase-seasonal-progress"
const LEGACY_MATCH_KEY = "grindbase-seasonal-match-progress"

type Store = {
  progress: Record<string, boolean>
  matchProgress: Record<string, number>
}

function key(weaponId: string, camoId: string) {
  return `${weaponId}:${camoId}`
}

function parseKey(k: string): { weaponId: string; camoId: string } {
  const idx = k.indexOf(":")
  return { weaponId: k.slice(0, idx), camoId: k.slice(idx + 1) }
}

function loadLegacy(): Store {
  let progress: Record<string, boolean> = {}
  let matchProgress: Record<string, number> = {}
  try {
    const raw = localStorage.getItem(LEGACY_PROGRESS_KEY)
    if (raw) progress = JSON.parse(raw)
  } catch {
    progress = {}
  }
  try {
    const raw = localStorage.getItem(LEGACY_MATCH_KEY)
    if (raw) matchProgress = JSON.parse(raw)
  } catch {
    matchProgress = {}
  }
  return { progress, matchProgress }
}

let state: Store = { progress: {}, matchProgress: {} }
let isHydrated = false
let currentUserId: string | null = null
let authWired = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

async function hydrateForUser(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from("seasonal_progress").select("*").eq("user_id", userId)

  if (error) {
    console.error("Failed to load seasonal progress:", error)
    isHydrated = true
    emit()
    return
  }

  if (data && data.length > 0) {
    const progress: Record<string, boolean> = {}
    const matchProgress: Record<string, number> = {}
    data.forEach((row) => {
      const k = key(row.weapon_id, row.camo_id)
      progress[k] = row.owned
      if (row.matches) matchProgress[k] = row.matches
    })
    state = { progress, matchProgress }
  } else {
    const legacy = typeof window !== "undefined" ? loadLegacy() : { progress: {}, matchProgress: {} }
    const hasLegacyData =
      Object.keys(legacy.progress).length > 0 || Object.keys(legacy.matchProgress).length > 0

    if (hasLegacyData) {
      state = legacy
      const allKeys = new Set([...Object.keys(legacy.progress), ...Object.keys(legacy.matchProgress)])
      const rows = Array.from(allKeys).map((k) => {
        const { weaponId, camoId } = parseKey(k)
        return {
          user_id: userId,
          weapon_id: weaponId,
          camo_id: camoId,
          owned: legacy.progress[k] ?? false,
          matches: legacy.matchProgress[k] ?? 0,
        }
      })
      const { error: upsertError } = await supabase
        .from("seasonal_progress")
        .upsert(rows, { onConflict: "user_id,weapon_id,camo_id" })
      if (upsertError) console.error("Failed to migrate seasonal progress to the cloud:", upsertError)
    } else {
      state = { progress: {}, matchProgress: {} }
    }
  }

  isHydrated = true
  emit()
}

function ensureAuthWired() {
  if (authWired || typeof window === "undefined") return
  authWired = true
  const supabase = createClient()

  supabase.auth.getUser().then(({ data }) => {
    const uid = data.user?.id ?? null
    if (uid) {
      currentUserId = uid
      hydrateForUser(uid)
    } else {
      isHydrated = true
      emit()
    }
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    const uid = session?.user?.id ?? null
    if (uid && uid !== currentUserId) {
      currentUserId = uid
      isHydrated = false
      hydrateForUser(uid)
    } else if (!uid && currentUserId) {
      currentUserId = null
      state = { progress: {}, matchProgress: {} }
      isHydrated = true
      emit()
    }
  })
}

async function persistRow(weaponId: string, camoId: string) {
  if (!currentUserId) return
  const supabase = createClient()
  const k = key(weaponId, camoId)
  const { error } = await supabase.from("seasonal_progress").upsert(
    {
      user_id: currentUserId,
      weapon_id: weaponId,
      camo_id: camoId,
      owned: state.progress[k] ?? false,
      matches: state.matchProgress[k] ?? 0,
    },
    { onConflict: "user_id,weapon_id,camo_id" }
  )
  if (error) console.error("Failed to save seasonal progress:", error)
}

async function toggleInStore(weaponId: string, camoId: string) {
  const k = key(weaponId, camoId)
  state = { ...state, progress: { ...state.progress, [k]: !state.progress[k] } }
  emit()
  await persistRow(weaponId, camoId)
}

// Used for bulk actions like "Select All" — sends every change as ONE
// request instead of one request per weapon, so a big bulk action can't
// flood the network with dozens of simultaneous saves.
async function setManyOwnedInStore(weaponIds: string[], camoId: string, owned: boolean) {
  const nextProgress = { ...state.progress }
  weaponIds.forEach((weaponId) => {
    nextProgress[key(weaponId, camoId)] = owned
  })
  state = { ...state, progress: nextProgress }
  emit()

  if (!currentUserId) return
  const supabase = createClient()
  const rows = weaponIds.map((weaponId) => ({
    user_id: currentUserId,
    weapon_id: weaponId,
    camo_id: camoId,
    owned,
    matches: state.matchProgress[key(weaponId, camoId)] ?? 0,
  }))
  const { error } = await supabase
    .from("seasonal_progress")
    .upsert(rows, { onConflict: "user_id,weapon_id,camo_id" })
  if (error) console.error("Failed to bulk-save seasonal progress:", error)
}

async function setMatchProgressInStore(weaponId: string, camoId: string, value: number) {
  const k = key(weaponId, camoId)
  state = { ...state, matchProgress: { ...state.matchProgress, [k]: Math.max(0, value) } }
  emit()
  await persistRow(weaponId, camoId)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  ensureAuthWired()
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

function getServerSnapshot() {
  return state
}

export function useSeasonalProgress() {
  const { progress, matchProgress } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const isOwned = useCallback(
    (weaponId: string, camoId: string) => !!progress[key(weaponId, camoId)],
    [progress]
  )

  const toggle = useCallback((weaponId: string, camoId: string) => {
    toggleInStore(weaponId, camoId)
  }, [])

  const setManyOwned = useCallback((weaponIds: string[], camoId: string, owned: boolean) => {
    setManyOwnedInStore(weaponIds, camoId, owned)
  }, [])

  const getMatchProgress = useCallback(
    (weaponId: string, camoId: string) => matchProgress[key(weaponId, camoId)] ?? 0,
    [matchProgress]
  )

  const setMatchProgress = useCallback((weaponId: string, camoId: string, value: number) => {
    setMatchProgressInStore(weaponId, camoId, value)
  }, [])

  return { progress, isOwned, toggle, setManyOwned, hydrated: isHydrated, getMatchProgress, setMatchProgress }
}
