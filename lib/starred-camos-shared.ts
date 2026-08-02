"use client"

import { createClient } from "./supabase/client"

// Best guess at the original local-storage key names, based on the
// pattern used when the DMZ star was added. If your real
// starred-camo-store.ts used a different key for the Seasonal one, the
// Seasonal star just won't auto-migrate — everything else still works,
// you'd just need to re-click it once.
const LEGACY_SEASONAL_KEY = "grindbase-starred-camo"
const LEGACY_DMZ_KEY = "grindbase-starred-dmz-camo"

type SupabaseClient = ReturnType<typeof createClient>
type RealtimeChannel = ReturnType<SupabaseClient["channel"]>

type Store = {
  seasonalId: string | null
  dmzId: string | null
}

let state: Store = { seasonalId: null, dmzId: null }
let isHydrated = false
let currentUserId: string | null = null
let authWired = false
let realtimeChannel: RealtimeChannel | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

async function hydrateForUser(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("starred_camos")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("Failed to load starred camos:", error)
    isHydrated = true
    emit()
    return
  }

  if (data) {
    state = { seasonalId: data.seasonal_camo_id, dmzId: data.dmz_camo_id }
  } else {
    const legacySeasonal = typeof window !== "undefined" ? localStorage.getItem(LEGACY_SEASONAL_KEY) : null
    const legacyDmz = typeof window !== "undefined" ? localStorage.getItem(LEGACY_DMZ_KEY) : null

    if (legacySeasonal || legacyDmz) {
      state = { seasonalId: legacySeasonal, dmzId: legacyDmz }
      const { error: upsertError } = await supabase
        .from("starred_camos")
        .upsert(
          { user_id: userId, seasonal_camo_id: legacySeasonal, dmz_camo_id: legacyDmz },
          { onConflict: "user_id" }
        )
      if (upsertError) console.error("Failed to migrate starred camos to the cloud:", upsertError)
    } else {
      state = { seasonalId: null, dmzId: null }
    }
  }

  isHydrated = true
  emit()
}

function unsubscribeRealtime() {
  if (!realtimeChannel) return
  const supabase = createClient()
  supabase.removeChannel(realtimeChannel)
  realtimeChannel = null
}

// Keeps every open tab/device on this account in sync: any change written to
// starred_camos — by this tab, another tab, or another device — gets pushed
// back down here and merged into local state. Requires Realtime to be
// turned on for starred_camos in Supabase (Database → Publications).
function subscribeRealtime(userId: string) {
  unsubscribeRealtime()
  const supabase = createClient()
  realtimeChannel = supabase
    .channel(`starred_camos_${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "starred_camos", filter: `user_id=eq.${userId}` },
      (payload) => {
        // It's one row per user, so DELETE just means "back to nothing starred".
        if (payload.eventType === "DELETE") {
          state = { seasonalId: null, dmzId: null }
          emit()
          return
        }
        const row = payload.new
        if (!row || !("user_id" in row)) return
        state = { seasonalId: row.seasonal_camo_id ?? null, dmzId: row.dmz_camo_id ?? null }
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
      state = { seasonalId: null, dmzId: null }
      isHydrated = true
      unsubscribeRealtime()
      emit()
    }
  })
}

async function persist() {
  if (!currentUserId) return
  const supabase = createClient()
  const { error } = await supabase
    .from("starred_camos")
    .upsert(
      { user_id: currentUserId, seasonal_camo_id: state.seasonalId, dmz_camo_id: state.dmzId },
      { onConflict: "user_id" }
    )
  if (error) console.error("Failed to save starred camos:", error)
}

export function toggleSeasonalStar(camoId: string) {
  state = { ...state, seasonalId: state.seasonalId === camoId ? null : camoId }
  emit()
  persist()
}

export function toggleDmzStar(camoId: string) {
  state = { ...state, dmzId: state.dmzId === camoId ? null : camoId }
  emit()
  persist()
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  ensureAuthWired()
  return () => listeners.delete(listener)
}

export function getSnapshot() {
  return state
}

export function getServerSnapshot() {
  return state
}

export function isHydratedNow() {
  return isHydrated
}
