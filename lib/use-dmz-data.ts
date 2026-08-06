"use client"

import { useMemo } from "react"
import { weapons } from "./weapons"
import { DMZ_CAMOS } from "./dmz-camos"
import { useDmzProgress } from "./dmz-store"

// Nearly every weapon supports both DMZ seasons. These are the only
// documented exceptions, based on when each gun actually joined the game
// relative to each DMZ season's timing.
// Weapons with no DMZ camo access at all (either season).
const DMZ_NO_ACCESS = ["FSS Hurricane", "BAL-27", "Cronen Squall"]

// Weapons that only have Season 2 camos — too new to have existed for
// Season 1's release window.
const DMZ_SEASON_2_ONLY = ["Lachmann-556", "LC10", "DP27", "MX Guardian"]

const DMZ_SEASON_1_EXCLUDED = new Set([...DMZ_NO_ACCESS, ...DMZ_SEASON_2_ONLY])
const DMZ_SEASON_2_EXCLUDED = new Set(DMZ_NO_ACCESS)

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
