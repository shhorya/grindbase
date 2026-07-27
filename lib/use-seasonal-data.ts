"use client"

import { useMemo } from "react"
import { weapons } from "./weapons"
import { SEASONAL_CAMOS } from "./seasonal-camos"
import { useSeasonalProgress } from "./seasonal-store"

export function useSeasonalData() {
  const { isOwned, toggle, hydrated, getMatchProgress, setMatchProgress } = useSeasonalProgress()

  const camoStats = useMemo(() => {
    return SEASONAL_CAMOS.map((camo) => {
      const eligibleWeapons = weapons.filter(
        (w) => camo.order > 36 - w.eligibleSeasonalCamos
      )

      const ownedCount =
        camo.unlockType === "matches"
          ? eligibleWeapons.filter(
              (w) => getMatchProgress(w.id, camo.id) >= (camo.matchesTarget ?? 0)
            ).length
          : eligibleWeapons.filter((w) => isOwned(w.id, camo.id)).length

      return {
        ...camo,
        totalEligible: eligibleWeapons.length,
        ownedCount,
        eligibleWeapons,
      }
    })
  }, [isOwned, getMatchProgress])

  return { camoStats, isOwned, toggle, hydrated, getMatchProgress, setMatchProgress }
}
