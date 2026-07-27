"use client"

import { useMemo } from "react"
import { CATEGORIES } from "./constants"
import {
  getDiamondCount,
  getGoldCount,
  getOverallCompletion,
  getPlatinumCount,
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

  const stats = useMemo(
    () => ({
      totalCompletion: getOverallCompletion(weapons),
      weaponsOwned: weapons.filter((w) => w.owned).length,
      weaponsTotal: weapons.length,
      goldCount: getGoldCount(weapons),
      platinumCount: weapons.filter((w) => w.platinum).length,
      diamondCount: getDiamondCount(weapons),
      damascusUnlocked: hasDamascus(weapons, CATEGORIES),
      seasonalOwned: 0,
      seasonalTotal: 0,
      seasonalCompletion: 0,
      matchesRemaining: weapons.reduce((s, w) => s + w.matchesRemaining, 0),
    }),
    [weapons]
  )

  return { weapons, stats, updateWeapon, hydrated }
}