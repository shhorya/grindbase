"use client"

import { useCallback, useSyncExternalStore } from "react"
import { weapons } from "./weapons"
import type { WeaponProgress } from "./progress"

const STORAGE_KEY = "grindbase-progress"

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

function loadFromStorage(): WeaponProgress[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return buildDefault()
    const parsed: WeaponProgress[] = JSON.parse(raw)
    const byId = new Map(parsed.map((p) => [p.weaponId, p]))
    return weapons.map(
      (weapon) =>
        byId.get(weapon.id) ?? {
          weaponId: weapon.id,
          owned: false,
          gold: false,
          platinum: false,
          diamond: false,
          completion: 0,
          matchesRemaining: 0,
          diamondProgress: 0,
        }
    )
  } catch {
    return buildDefault()
  }
}

// Module-level singleton — every component subscribes to this same state,
// instead of each holding its own useState copy. This is what keeps
// /weapons, /damascus, the dashboard, and the nav in sync with each other.
let state: WeaponProgress[] = buildDefault()
let isHydrated = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function persist() {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function hydrate() {
  if (isHydrated || typeof window === "undefined") return
  const loaded = loadFromStorage()

  // Enforce: Diamond implies Gold, in case old data predates that rule.
  let changed = false
  state = loaded.map((p) => {
    if (p.diamond && !p.gold) {
      changed = true
      return { ...p, gold: true, completion: 100 }
    }
    return p
  })
  isHydrated = true
  if (changed) persist()
  emit()
}

function updateWeaponInStore(weaponId: string, patch: Partial<WeaponProgress>) {
  // Record exactly when a weapon crosses into Gold, so "recently unlocked"
  // can be based on real time instead of guesswork. Only stamps on the
  // transition to true — toggling gold off doesn't erase the record.
  const finalPatch: Partial<WeaponProgress> = { ...patch }
  if (patch.gold === true) {
    ;(finalPatch as Partial<WeaponProgress> & { goldUnlockedAt?: number }).goldUnlockedAt = Date.now()
  }
  state = state.map((p) => (p.weaponId === weaponId ? { ...p, ...finalPatch } : p))
  persist()
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  hydrate()
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