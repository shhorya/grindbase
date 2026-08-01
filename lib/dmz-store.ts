"use client"

import { useCallback, useSyncExternalStore } from "react"
import { createClient } from "./supabase/client"

const LEGACY_KEY = "grindbase-dmz-progress"

function key(weaponId: string, camoId: string) {
  return `${weaponId}:${camoId}`
}

function parseKey(k: string): { weaponId: string; camoId: string } {
  const idx = k.indexOf(":")
  return { weaponId: k.slice(0, idx), camoId: k.slice(idx + 1) }
}

function loadLegacy(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

let state: Record<string, boolean> = {}
let isHydrated = false
let currentUserId: string | null = null
let authWired = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

async function hydrateForUser(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from("dmz_progress").select("*").eq("user_id", userId)

  if (error) {
    console.error("Failed to load DMZ progress:", error)
    isHydrated = true
    emit()
    return
  }

  if (data && data.length > 0) {
    const next: Record<string, boolean> = {}
    data.forEach((row) => {
      next[key(row.weapon_id, row.camo_id)] = row.owned
    })
    state = next
  } else {
    const legacy = typeof window !== "undefined" ? loadLegacy() : {}
    if (Object.keys(legacy).length > 0) {
      state = legacy
      const rows = Object.entries(legacy).map(([k, owned]) => {
        const { weaponId, camoId } = parseKey(k)
        return { user_id: userId, weapon_id: weaponId, camo_id: camoId, owned }
      })
      const { error: upsertError } = await supabase
        .from("dmz_progress")
        .upsert(rows, { onConflict: "user_id,weapon_id,camo_id" })
      if (upsertError) console.error("Failed to migrate DMZ progress to the cloud:", upsertError)
    } else {
      state = {}
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
      state = {}
      isHydrated = true
      emit()
    }
  })
}

async function toggleInStore(weaponId: string, camoId: string) {
  const k = key(weaponId, camoId)
  const nextOwned = !state[k]
  state = { ...state, [k]: nextOwned }
  emit()

  if (!currentUserId) return
  const supabase = createClient()
  const { error } = await supabase.from("dmz_progress").upsert(
    { user_id: currentUserId, weapon_id: weaponId, camo_id: camoId, owned: nextOwned },
    { onConflict: "user_id,weapon_id,camo_id" }
  )
  if (error) console.error("Failed to save DMZ progress:", error)
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

export function useDmzProgress() {
  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const isOwned = useCallback(
    (weaponId: string, camoId: string) => !!progress[key(weaponId, camoId)],
    [progress]
  )

  const toggle = useCallback((weaponId: string, camoId: string) => {
    toggleInStore(weaponId, camoId)
  }, [])

  return { isOwned, toggle, hydrated: isHydrated }
}
