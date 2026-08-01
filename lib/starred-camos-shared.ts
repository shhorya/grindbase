"use client"

import { createClient } from "./supabase/client"

// Best guess at the original local-storage key names, based on the
// pattern used when the DMZ star was added. If your real
// starred-camo-store.ts used a different key for the Seasonal one, the
// Seasonal star just won't auto-migrate — everything else still works,
// you'd just need to re-click it once.
const LEGACY_SEASONAL_KEY = "grindbase-starred-camo"
const LEGACY_DMZ_KEY = "grindbase-starred-dmz-camo"

type Store = {
  seasonalId: string | null
  dmzId: string | null
}

let state: Store = { seasonalId: null, dmzId: null }
let isHydrated = false
let currentUserId: string | null = null
let authWired = false
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
      state = { seasonalId: null, dmzId: null }
      isHydrated = true
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
