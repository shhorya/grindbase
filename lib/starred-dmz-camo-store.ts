"use client"

import { useCallback, useSyncExternalStore } from "react"

const STORAGE_KEY = "grindbase-starred-dmz-camo"

// Separate from Seasonal's starred-camo-store — its own storage key, its
// own slot, so starring a DMZ camo never affects the Seasonal star.
let state: string | null = null
let isHydrated = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function persist() {
  if (typeof window === "undefined") return
  if (state) {
    localStorage.setItem(STORAGE_KEY, state)
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

function hydrate() {
  if (isHydrated || typeof window === "undefined") return
  state = localStorage.getItem(STORAGE_KEY)
  isHydrated = true
  emit()
}

function toggleInStore(camoId: string) {
  state = state === camoId ? null : camoId
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

export function useStarredDmzCamo() {
  const starredId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggleStar = useCallback((camoId: string) => {
    toggleInStore(camoId)
  }, [])

  return { starredId, toggleStar }
}
