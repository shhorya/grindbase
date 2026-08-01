"use client"

import { useCallback, useSyncExternalStore } from "react"
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  toggleDmzStar,
  isHydratedNow,
} from "./starred-camos-shared"

export function useStarredDmzCamo() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggleStar = useCallback((camoId: string) => {
    toggleDmzStar(camoId)
  }, [])

  return { starredId: state.dmzId, toggleStar, hydrated: isHydratedNow() }
}
