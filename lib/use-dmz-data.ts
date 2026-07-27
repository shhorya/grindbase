"use client"

import { useMemo } from "react"
import { weapons } from "./weapons"
import { DMZ_CAMOS } from "./dmz-camos"
import { useDmzProgress } from "./dmz-store"

export function useDmzData() {
  const { isOwned, toggle, hydrated } = useDmzProgress()

  const camoStats = useMemo(() => {
    return DMZ_CAMOS.map((camo) => {
      const eligibleWeapons = weapons.filter((w) =>
        camo.season === "Season 1: Flux" ? w.dmzSeason1 : w.dmzSeason2
      )
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
