"use client"

import { useMemo } from "react"
import { CATEGORIES } from "./constants"
import {
  getDiamondCount,
  getGoldCount,
  getOverallCompletion,
  hasDamascus,
} from "./calculations"
import { weapons as staticWeapons } from "./weapons"
import { useWeaponProgress } from "./progress-store"
import type { Weapon } from "./types"
import type { WeaponProgress } from "./progress"

export type CompleteWeapon = Weapon & WeaponProgress

export function useCamoData() {
  const { progress, updateWeapon, hydrated } = useWeaponProgress()

  const weapons: CompleteWeapon[] = useMemo(
    () =>
      staticWeapons.map((weapon) => ({
        ...weapon,
        ...progress.find((p) => p.weaponId === weapon.id)!,
        owned: true,
      })),
    [progress]
  )

  const stats = useMemo(() => {
    // These few are computed directly here rather than through
    // calculations.ts, so they need their own noCamos filter too.
    const tracked = weapons.filter((w) => !w.noCamos)

    return {
      totalCompletion: getOverallCompletion(weapons),
      weaponsOwned: tracked.filter((w) => w.owned).length,
      weaponsTotal: tracked.length,
      goldCount: getGoldCount(weapons),
      platinumCount: tracked.filter((w) => w.platinum).length,
      diamondCount: getDiamondCount(weapons),
      damascusUnlocked: hasDamascus(weapons, CATEGORIES),
      seasonalOwned: 0,
      seasonalTotal: 0,
      seasonalCompletion: 0,
      matchesRemaining: tracked.reduce((s, w) => s + w.matchesRemaining, 0),
    }
  }, [weapons])

  return { weapons, stats, updateWeapon, hydrated }
}
