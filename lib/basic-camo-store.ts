"use client"

import { useCallback, useSyncExternalStore } from "react"
import { createClient } from "./supabase/client"

const CACHE_KEY = "grindbase-cache-basic-camo-progress"

type SupabaseClient = ReturnType<typeof createClient>
type RealtimeChannel = ReturnType<SupabaseClient["channel"]>

function key(weaponId: string, camoId: string) {
  return `${weaponId}:${camoId}`
}

function loadCache(): Record<string, boolean> | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveCache(data: Record<string, boolean>) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // Storage full/unavailable — cache is a nice-to-have, not critical.
  }
}

const cachedInitial = loadCache()
let state: Record<string, boolean> = cachedInitial ?? {}
let isHydrated = cachedInitial !== null
let currentUserId: string | null = null
let authWired = false
let realtimeChannel: RealtimeChannel | null = null
let localWriteVersion = 0
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

async function fetchAllRows(userId: string) {
  const supabase = createClient()
  const PAGE_SIZE = 1000
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allRows: any[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from("basic_camo_progress")
      .select("*")
      .eq("user_id", userId)
      .range(from, from + PAGE_SIZE - 1)
    if (error) return { data: null, error }
    if (!data || data.length === 0) break
    allRows = allRows.concat(data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return { data: allRows, error: null }
}

async function hydrateForUser(userId: string) {
  const versionAtStart = localWriteVersion
  const { data, error } = await fetchAllRows(userId)

  if (error) {
    console.error("Failed to load basic camo progress:", error)
    isHydrated = true
    emit()
    return
  }

  if (versionAtStart !== localWriteVersion) {
    isHydrated = true
    emit()
    return
  }

  const next: Record<string, boolean> = {}
  ;(data ?? []).forEach((row) => {
    next[key(row.weapon_id, row.camo_id)] = row.owned
  })
  state = next
  isHydrated = true
  saveCache(state)
  emit()
}

function unsubscribeRealtime() {
  if (!realtimeChannel) return
  const supabase = createClient()
  supabase.removeChannel(realtimeChannel)
  realtimeChannel = null
}

function subscribeRealtime(userId: string) {
  unsubscribeRealtime()
  const supabase = createClient()
  realtimeChannel = supabase
    .channel(`basic_camo_progress_${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "basic_camo_progress", filter: `user_id=eq.${userId}` },
      (payload) => {
        const row = payload.eventType === "DELETE" ? payload.old : payload.new
        if (!row || !("weapon_id" in row) || !("camo_id" in row)) return
        const k = key(row.weapon_id, row.camo_id)
        state = { ...state, [k]: row.owned ?? false }
        saveCache(state)
        emit()
      }
    )
    .subscribe()
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
      subscribeRealtime(uid)
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
      subscribeRealtime(uid)
    } else if (!uid && currentUserId) {
      currentUserId = null
      state = {}
      isHydrated = true
      unsubscribeRealtime()
      emit()
    }
  })
}

async function toggleInStore(weaponId: string, camoId: string) {
  localWriteVersion++
  const k = key(weaponId, camoId)
  const nextOwned = !state[k]
  state = { ...state, [k]: nextOwned }
  saveCache(state)
  emit()

  if (!currentUserId) return
  const supabase = createClient()
  const { error } = await supabase.from("basic_camo_progress").upsert(
    { user_id: currentUserId, weapon_id: weaponId, camo_id: camoId, owned: nextOwned },
    { onConflict: "user_id,weapon_id,camo_id" }
  )
  if (error) console.error("Failed to save basic camo progress:", error)
}

async function setManyOwnedInStore(weaponId: string, camoIds: string[], owned: boolean) {
  localWriteVersion++
  const nextState = { ...state }
  camoIds.forEach((camoId) => {
    nextState[key(weaponId, camoId)] = owned
  })
  state = nextState
  saveCache(state)
  emit()

  if (!currentUserId) return
  const supabase = createClient()
  const rows = camoIds.map((camoId) => ({
    user_id: currentUserId,
    weapon_id: weaponId,
    camo_id: camoId,
    owned,
  }))
  const { error } = await supabase
    .from("basic_camo_progress")
    .upsert(rows, { onConflict: "user_id,weapon_id,camo_id" })
  if (error) console.error("Failed to bulk-save basic camo progress:", error)
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

export function useBasicCamoProgress() {
  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const isOwned = useCallback(
    (weaponId: string, camoId: string) => !!progress[key(weaponId, camoId)],
    [progress]
  )

  const toggle = useCallback((weaponId: string, camoId: string) => {
    toggleInStore(weaponId, camoId)
  }, [])

  const setManyOwned = useCallback((weaponId: string, camoIds: string[], owned: boolean) => {
    setManyOwnedInStore(weaponId, camoIds, owned)
  }, [])

  return { progress, isOwned, toggle, setManyOwned, hydrated: isHydrated }
}