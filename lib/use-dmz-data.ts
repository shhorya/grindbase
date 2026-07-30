"use client"

import { useMemo } from "react"
import { weapons } from "./weapons"
import { DMZ_CAMOS } from "./dmz-camos"
import { useDmzProgress } from "./dmz-store"

// Nearly every weapon supports both DMZ seasons. These are the only
// documented exceptions, based on when each gun actually joined the game
// relative to each DMZ season's timing.
const DMZ_SEASON_1_EXCLUDED = new Set(["Lachmann-556", "MX Guardian"])
const DMZ_SEASON_2_EXCLUDED = new Set(["MX Guardian"])

export function useDmzData() {
  const { isOwned, toggle, hydrated } = useDmzProgress()

  const camoStats = useMemo(() => {
    return DMZ_CAMOS.map((camo) => {
      const excluded = camo.season === "Season 1: Flux" ? DMZ_SEASON_1_EXCLUDED : DMZ_SEASON_2_EXCLUDED
      const eligibleWeapons = weapons.filter((w) => !excluded.has(w.name))
      const ownedCount = eligibleWeapons.filter((w) => isOwned(w.id, camo.id)).length

      return {
        ...camo,
        totalEligible: eligibleWeapons.length,
        ownedCount,
        eligibleWeapons,
      }
    })
  }, [isOwned])

  return { camoStats, isOwned, toggle, hydrated }
}
