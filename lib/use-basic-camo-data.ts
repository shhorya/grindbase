"use client"

import { useCallback, useMemo } from "react"
import { BASIC_CAMOS, BASIC_CAMO_IDS } from "./basic-camos"
import { useBasicCamoProgress } from "./basic-camo-store"

export const BASIC_CAMO_TOTAL = BASIC_CAMOS.length // 60

export function useBasicCamoData() {
  const { progress, isOwned, toggle, setManyOwned, hydrated } = useBasicCamoProgress()

  const ownedCountByWeapon = useMemo(() => {
    const counts: Record<string, number> = {}
    Object.entries(progress).forEach(([k, owned]) => {
      if (!owned) return
      const weaponId = k.slice(0, k.indexOf(":"))
      counts[weaponId] = (counts[weaponId] ?? 0) + 1
    })
    return counts
  }, [progress])

  const getOwnedCount = useCallback(
    (weaponId: string) => ownedCountByWeapon[weaponId] ?? 0,
    [ownedCountByWeapon]
  )

  return { camos: BASIC_CAMOS, camoIds: BASIC_CAMO_IDS, isOwned, toggle, setManyOwned, getOwnedCount, hydrated }
}