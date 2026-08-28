"use client"

import { useMemo } from "react"
import { DAMASCUS_OG_WEAPON_IDS } from "./constants"
import {
  getDiamondCount,
  getGoldCount,
  getOverallCompletion,
  hasDamascus,
} from "./calculations"
import { weapons as staticWeapons } from "./weapons"
import { useWeaponProgress } from "./progress-store"
import { useBasicCamoData, BASIC_CAMO_TOTAL } from "./use-basic-camo-data"
import type { Weapon } from "./types"
import type { WeaponProgress } from "./progress"

export type CompleteWeapon = Weapon & WeaponProgress

export function useCamoData() {
  const { progress, updateWeapon, hydrated: weaponHydrated } = useWeaponProgress()
  const { getOwnedCount: getBasicCamoCount, hydrated: basicCamoHydrated } = useBasicCamoData()
  const hydrated = weaponHydrated && basicCamoHydrated

  const weapons: CompleteWeapon[] = useMemo(
    () =>
      staticWeapons.map((weapon) => {
        const base = {
          ...weapon,
          ...progress.find((p) => p.weaponId === weapon.id)!,
          owned: true,
        }
        // Already-gold weapons keep showing 100% (no regression on old
        // progress). Everyone else shows their real fraction of the 60
        // Basic Camos, live.
        const completion = base.gold
          ? 100
          : Math.round((getBasicCamoCount(weapon.id) / BASIC_CAMO_TOTAL) * 100)
        return { ...base, completion }
      }),
    [progress, getBasicCamoCount]
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
      damascusUnlocked: hasDamascus(weapons, DAMASCUS_OG_WEAPON_IDS),
      seasonalOwned: 0,
      seasonalTotal: 0,
      seasonalCompletion: 0,
      matchesRemaining: tracked.reduce((s, w) => s + w.matchesRemaining, 0),
    }
  }, [weapons])

  return { weapons, stats, updateWeapon, hydrated }
}