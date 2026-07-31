"use client"

import { useMemo } from "react"
import { weapons } from "./weapons"
import { SEASONAL_CAMOS } from "./seasonal-camos"
import { useSeasonalProgress } from "./seasonal-store"

// Some weapons are missing specific individual camos rather than just "the
// oldest N are missing" — that pattern can't be expressed by the count-based
// rule alone (eligibleSeasonalCamos on each weapon), so these are subtracted
// explicitly by camo id. Add more entries here as more gaps get reported.
const SEASONAL_CAMO_EXCLUDED_BY_WEAPON: Record<string, string[]> = {
  "Spear": ["ice-locked"],
  "Machine Pistol": ["ice-locked", "opalescence", "golden-opportunity"],
}

export function useSeasonalData() {
  const { isOwned, toggle, hydrated, getMatchProgress, setMatchProgress } = useSeasonalProgress()

  const camoStats = useMemo(() => {
    return SEASONAL_CAMOS.map((camo) => {
      const eligibleWeapons = weapons.filter((w) => {
        // First 10 camos (Aether Crystal → Assault Pattern) are available to
        // every weapon regardless of when it joined the game. Beyond that,
        // it's "the N most recent camos" per weapon.
        const baseEligible = camo.order <= 10 || camo.order > 36 - w.eligibleSeasonalCamos
        if (!baseEligible) return false

        const excluded = SEASONAL_CAMO_EXCLUDED_BY_WEAPON[w.name]
        return !excluded?.includes(camo.id)
      })

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
