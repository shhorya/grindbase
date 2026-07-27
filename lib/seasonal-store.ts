"use client"

import { useCallback, useSyncExternalStore } from "react"

const STORAGE_KEY = "grindbase-seasonal-progress"
const MATCH_PROGRESS_KEY = "grindbase-seasonal-match-progress"

// "progress" = per-weapon ownership toggles (weaponId:camoId -> true/false)
// "matchProgress" = per-weapon numeric progress for camos that unlock via a
// match counter per weapon instead of a plain toggle (e.g. Aether Crystal)
type Store = {
  progress: Record<string, boolean>
  matchProgress: Record<string, number>
}

function key(weaponId: string, camoId: string) {
  return `${weaponId}:${camoId}`
}

function loadInitialState(): Store {
  let progress: Record<string, boolean> = {}
  let matchProgress: Record<string, number> = {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) progress = JSON.parse(raw)
  } catch {
    progress = {}
  }
  try {
    const raw = localStorage.getItem(MATCH_PROGRESS_KEY)
    if (raw) matchProgress = JSON.parse(raw)
  } catch {
    matchProgress = {}
  }
  return { progress, matchProgress }
}

// One shared piece of data for the whole app — every page reads and writes
// this same data instead of each page keeping its own separate copy.
let state: Store = { progress: {}, matchProgress: {} }
let isHydrated = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function hydrate() {
  if (isHydrated || typeof window === "undefined") return
  state = loadInitialState()
  isHydrated = true
  emit()
}

function toggleInStore(weaponId: string, camoId: string) {
  const k = key(weaponId, camoId)
  state = { ...state, progress: { ...state.progress, [k]: !state.progress[k] } }
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress))
  }
  emit()
}

function setMatchProgressInStore(weaponId: string, camoId: string, value: number) {
  const k = key(weaponId, camoId)
  state = { ...state, matchProgress: { ...state.matchProgress, [k]: Math.max(0, value) } }
  if (typeof window !== "undefined") {
    localStorage.setItem(MATCH_PROGRESS_KEY, JSON.stringify(state.matchProgress))
  }
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

export function useSeasonalProgress() {
  const { progress, matchProgress } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const isOwned = useCallback(
    (weaponId: string, camoId: string) => !!progress[key(weaponId, camoId)],
    [progress]
  )

  const toggle = useCallback((weaponId: string, camoId: string) => {
    toggleInStore(weaponId, camoId)
  }, [])

  const getMatchProgress = useCallback(
    (weaponId: string, camoId: string) => matchProgress[key(weaponId, camoId)] ?? 0,
    [matchProgress]
  )

  const setMatchProgress = useCallback((weaponId: string, camoId: string, value: number) => {
    setMatchProgressInStore(weaponId, camoId, value)
  }, [])

  return { progress, isOwned, toggle, hydrated: isHydrated, getMatchProgress, setMatchProgress }
}
