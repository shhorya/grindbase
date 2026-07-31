"use client"

import { useMemo } from "react"
import { weapons } from "./weapons"
import { SEASONAL_CAMOS } from "./seasonal-camos"
import { useSeasonalProgress } from "./seasonal-store"

export function useSeasonalData() {
  const { isOwned, toggle, hydrated, getMatchProgress, setMatchProgress } = useSeasonalProgress()

  const camoStats = useMemo(() => {
    return SEASONAL_CAMOS.map((camo) => {
      // The first 10 seasonal camos (Aether Crystal → Assault Pattern) are
      // available to every weapon regardless of when it joined the game.
      // Beyond that, eligibility is "the N most recent camos" per weapon.
      const eligibleWeapons = weapons.filter(
        (w) => camo.order <= 10 || camo.order > 36 - w.eligibleSeasonalCamos
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
