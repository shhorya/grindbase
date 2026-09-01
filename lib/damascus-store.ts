"use client"

import { useCallback, useSyncExternalStore } from "react"
import { createClient } from "./supabase/client"

const CACHE_KEY = "grindbase-cache-damascus-unlock"

type SupabaseClient = ReturnType<typeof createClient>
type RealtimeChannel = ReturnType<SupabaseClient["channel"]>

type Store = {
  weaponIds: string[]
}

function loadCache(): Store | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveCache(data: Store) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // Storage full/unavailable — cache is a nice-to-have, not critical.
  }
}

const cachedInitial = loadCache()
let state: Store = cachedInitial ?? { weaponIds: [] }
let isHydrated = cachedInitial !== null
let currentUserId: string | null = null
let authWired = false
let realtimeChannel: RealtimeChannel | null = null
let localWriteVersion = 0
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

async function hydrateForUser(userId: string) {
  const versionAtStart = localWriteVersion
  const supabase = createClient()
  const { data, error } = await supabase
    .from("damascus_unlock")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("Failed to load Damascus unlock:", error)
    isHydrated = true
    emit()
    return
  }

  if (versionAtStart !== localWriteVersion) {
    isHydrated = true
    emit()
    return
  }

  state = { weaponIds: data?.weapon_ids ?? [] }
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
    .channel(`damascus_unlock_${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "damascus_unlock", filter: `user_id=eq.${userId}` },
      (payload) => {
        if (payload.eventType === "DELETE") {
          state = { weaponIds: [] }
          saveCache(state)
          emit()
          return
        }
        const row = payload.new
        if (!row) return
        state = { weaponIds: row.weapon_ids ?? [] }
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
      state = { weaponIds: [] }
      isHydrated = true
      unsubscribeRealtime()
      emit()
    }
  })
}

async function snapshotInStore(weaponIds: string[]) {
  localWriteVersion++
  state = { weaponIds }
  saveCache(state)
  emit()

  if (!currentUserId) return
  const supabase = createClient()
  const { error } = await supabase.from("damascus_unlock").upsert(
    { user_id: currentUserId, weapon_ids: weaponIds, unlocked_at: new Date().toISOString() },
    { onConflict: "user_id" }
  )
  if (error) console.error("Failed to save Damascus unlock snapshot:", error)
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

export function useDamascusUnlock() {
  const { weaponIds } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Only ever writes once — if a snapshot already exists (even an empty
  // in-flight one from another tab), this is a no-op, so new weapons
  // added to the game later never sneak into an existing snapshot.
  const snapshotIfEmpty = useCallback((ids: string[]) => {
    if (state.weaponIds.length > 0) return
    snapshotInStore(ids)
  }, [])

  return { weaponIds, hydrated: isHydrated, snapshotIfEmpty }
}