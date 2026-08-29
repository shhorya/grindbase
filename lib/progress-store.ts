"use client"

import { useCallback, useSyncExternalStore } from "react"
import { weapons } from "./weapons"
import { createClient } from "./supabase/client"
import type { WeaponProgress } from "./progress"

// Old local-storage key — only ever read once, to migrate a device's
// existing progress into the cloud the first time that account syncs.
const LEGACY_STORAGE_KEY = "grindbase-progress"

// Snapshot cache — written every time we get fresh data (cloud fetch,
// realtime push, or a local edit) and read synchronously on load, so a
// reload shows real numbers instantly instead of a spinner / zeroed
// defaults while we wait on the network.
const CACHE_KEY = "grindbase-cache-weapon-progress"

type SupabaseClient = ReturnType<typeof createClient>
type RealtimeChannel = ReturnType<SupabaseClient["channel"]>

function buildDefault(): WeaponProgress[] {
  return weapons.map((weapon) => ({
    weaponId: weapon.id,
    owned: false,
    gold: false,
    platinum: false,
    diamond: false,
    completion: 0,
    matchesRemaining: 0,
    diamondProgress: 0,
  }))
}

function loadCache(): WeaponProgress[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveCache(data: WeaponProgress[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // Storage full/unavailable — cache is a nice-to-have, not critical.
  }
}

function loadLegacyLocalStorage(): WeaponProgress[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function toSupabaseRow(userId: string, p: WeaponProgress) {
  return {
    user_id: userId,
    weapon_id: p.weaponId,
    owned: p.owned,
    gold: p.gold,
    platinum: p.platinum,
    diamond: p.diamond,
    completion: p.completion,
    matches_remaining: p.matchesRemaining,
    diamond_progress: p.diamondProgress,
    gold_unlocked_at: p.goldUnlockedAt ? new Date(p.goldUnlockedAt).toISOString() : null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromSupabaseRow(row: any): WeaponProgress {
  return {
    weaponId: row.weapon_id,
    owned: row.owned,
    gold: row.gold,
    platinum: row.platinum,
    diamond: row.diamond,
    completion: row.completion,
    matchesRemaining: row.matches_remaining,
    diamondProgress: row.diamond_progress,
    goldUnlockedAt: row.gold_unlocked_at ? new Date(row.gold_unlocked_at).getTime() : undefined,
  }
}

const cachedInitial = loadCache()
// One shared piece of data for the whole app — every component reads and
// writes this same state, now backed by Supabase instead of local storage,
// so it follows your account across devices.
let state: WeaponProgress[] = cachedInitial ?? buildDefault()
// A cached snapshot means the store is immediately usable — the UI shows
// real numbers right away, and the cloud fetch below quietly reconciles
// in the background instead of gating the screen behind a spinner.
let isHydrated = cachedInitial !== null
let currentUserId: string | null = null
let authWired = false
let realtimeChannel: RealtimeChannel | null = null
// Bumped on every local write. A hydrate that's still in flight when a
// click happens can otherwise resolve afterward with stale data and
// silently overwrite that click.
let localWriteVersion = 0
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

async function hydrateForUser(userId: string) {
  const versionAtStart = localWriteVersion
  const supabase = createClient()
  const { data, error } = await supabase.from("weapon_progress").select("*").eq("user_id", userId)

  if (error) {
    console.error("Failed to load weapon progress:", error)
    isHydrated = true
    emit()
    return
  }

  if (versionAtStart !== localWriteVersion) {
    // A local edit happened while this fetch was in flight — don't stomp on it.
    isHydrated = true
    emit()
    return
  }

  const defaults = buildDefault()

  if (data && data.length > 0) {
    // Cloud already has data for this account — use it as the source of
    // truth. Any weapon not yet in the cloud just stays at its default.
    const byId = new Map(data.map((row) => [row.weapon_id, fromSupabaseRow(row)]))
    state = weapons.map((w) => byId.get(w.id) ?? defaults.find((p) => p.weaponId === w.id)!)
  } else {
    // First time this account has ever synced. Check this browser's local
    // storage for existing progress and upload it once, so nothing already
    // tracked gets lost.
    const legacy = loadLegacyLocalStorage()
    if (legacy && legacy.length > 0) {
      state = weapons.map(
        (w) => legacy.find((p) => p.weaponId === w.id) ?? defaults.find((p) => p.weaponId === w.id)!
      )
      const rows = state.map((p) => toSupabaseRow(userId, p))
      const { error: upsertError } = await supabase
        .from("weapon_progress")
        .upsert(rows, { onConflict: "user_id,weapon_id" })
      if (upsertError) console.error("Failed to migrate local progress to the cloud:", upsertError)
    } else {
      state = defaults
    }
  }

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

// Keeps every open tab/device on this account in sync: any change written to
// weapon_progress — by this tab, another tab, or another device — gets
// pushed back down here and merged into local state. Requires Realtime to
// be turned on for weapon_progress in Supabase (Database → Replication).
function subscribeRealtime(userId: string) {
  unsubscribeRealtime()
  const supabase = createClient()
  realtimeChannel = supabase
    .channel(`weapon_progress_${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "weapon_progress", filter: `user_id=eq.${userId}` },
      (payload) => {
        // For DELETE, .new is empty — fall back to .old. For INSERT/UPDATE,
        // .new always has the row we want.
        const row = payload.eventType === "DELETE" ? payload.old : payload.new
        if (!row || !("weapon_id" in row)) return
        const updated = fromSupabaseRow(row)
        state = state.map((p) => (p.weaponId === updated.weaponId ? updated : p))
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
      state = buildDefault()
      isHydrated = true
      unsubscribeRealtime()
      emit()
    }
  })
}

async function updateWeaponInStore(weaponId: string, patch: Partial<WeaponProgress>) {
  localWriteVersion++
  const finalPatch: Partial<WeaponProgress> = { ...patch }
  if (patch.gold === true) {
    finalPatch.goldUnlockedAt = Date.now()
  }

  // Update local state instantly for a responsive UI, then persist.
  state = state.map((p) => (p.weaponId === weaponId ? { ...p, ...finalPatch } : p))
  saveCache(state)
  emit()

  if (!currentUserId) return
  const supabase = createClient()
  const updated = state.find((p) => p.weaponId === weaponId)
  if (!updated) return

  const { error } = await supabase
    .from("weapon_progress")
    .upsert(toSupabaseRow(currentUserId, updated), { onConflict: "user_id,weapon_id" })
  if (error) console.error("Failed to save weapon progress:", error)
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

export function useWeaponProgress() {
  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const updateWeapon = useCallback((weaponId: string, patch: Partial<WeaponProgress>) => {
    updateWeaponInStore(weaponId, patch)
  }, [])

  return { progress, updateWeapon, hydrated: isHydrated }
}