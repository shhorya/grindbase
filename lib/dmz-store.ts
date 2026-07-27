"use client"

import { useCallback, useSyncExternalStore } from "react"

const STORAGE_KEY = "grindbase-dmz-progress"

// Maps "weaponId:camoId" -> owned boolean
type DmzProgress = Record<string, boolean>

function key(weaponId: string, camoId: string) {
  return `${weaponId}:${camoId}`
}

function loadFromStorage(): DmzProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// One shared piece of data for the whole app — every page reads and writes
// this same object, instead of each page keeping its own separate copy
// that can go out of date. Same fix as progress-store.ts.
let state: DmzProgress = {}
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
  state = loadFromStorage()
  isHydrated = true
  emit()
}

function toggleInStore(weaponId: string, camoId: string) {
  const k = key(weaponId, camoId)
  state = { ...state, [k]: !state[k] }
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
