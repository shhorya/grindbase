"use client"

import { useCallback, useSyncExternalStore } from "react"
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  toggleSeasonalStar,
  isHydratedNow,
} from "./starred-camos-shared"

export function useStarredCamo() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggleStar = useCallback((camoId: string) => {
    toggleSeasonalStar(camoId)
  }, [])

  return { starredId: state.seasonalId, toggleStar, hydrated: isHydratedNow() }
}
