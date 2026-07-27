import {
  CATEGORIES,
  CAMO_TEXTURES,
  CURRENT_SEASON,
} from "./constants"

import {
  getCategoryProgress,
  getDiamondCount,
  getGoldCount,
  getOverallCompletion,
  getPlatinumCount,
  getRecommendedGrinds,
  hasDamascus,
} from "./calculations"

import { weapons } from "./weapons"
import { defaultProgress } from "./default-progress"

import type { Weapon } from "./types"
import type { WeaponProgress } from "./progress"

export type CompleteWeapon = Weapon & WeaponProgress

export type CamoTier = "Gold" | "Platinum" | "Damascus" | "Diamond"
export type WeaponStatus = "complete" | "in-progress" | "unowned"

export const completeWeapons: CompleteWeapon[] = weapons.map((weapon) => ({
  ...weapon,
  ...defaultProgress.find((p) => p.weaponId === weapon.id)!,
}))

export function getWeapon(id: string) {
  return completeWeapons.find((weapon) => weapon.id === id)
}

export function statusOf(weapon: CompleteWeapon): WeaponStatus {
  if (!weapon.owned) return "unowned"
  if (weapon.gold) return "complete"
  return "in-progress"
}

export const stats = {
  totalCompletion: getOverallCompletion(completeWeapons),

  weaponsOwned: completeWeapons.filter((w) => w.owned).length,
  weaponsTotal: completeWeapons.length,

  goldCount: getGoldCount(completeWeapons),
  platinumCount: getPlatinumCount(completeWeapons, CATEGORIES),
  diamondCount: getDiamondCount(completeWeapons),

  damascusUnlocked: hasDamascus(completeWeapons, CATEGORIES),

  seasonId: CURRENT_SEASON.id,
  seasonName: CURRENT_SEASON.name,

  seasonalOwned: 0,
  seasonalTotal: 0,
  seasonalCompletion: 0,

  matchesRemaining: completeWeapons.reduce(
    (sum, weapon) => sum + weapon.matchesRemaining,
    0
  ),
}

export const tierMeta = {
  Gold: {
    label: "Gold",
    glow: "text-gold",
    swatch: "var(--gold)",
    texture: CAMO_TEXTURES.Gold,
  },
  Platinum: {
    label: "Platinum",
    glow: "text-platinum",
    swatch: "var(--platinum)",
    texture: CAMO_TEXTURES.Platinum,
  },
  Damascus: {
    label: "Damascus",
    glow: "bg-gradient-to-r from-red-500 via-purple-400 to-blue-500 bg-clip-text text-transparent",
    swatch: "oklch(0.6 0.15 320)",
    texture: CAMO_TEXTURES.Damascus,
  },
  Diamond: {
    label: "Diamond",
    glow: "text-diamond",
    swatch: "var(--diamond)",
    texture: CAMO_TEXTURES.Diamond,
  },
} as const

export const categories = CATEGORIES
export { getDiamondRequirementLabel } from "./constants"

export const categoryProgress = getCategoryProgress

export const recommendedGrinds = () =>
  getRecommendedGrinds(completeWeapons)

export { completeWeapons as weapons }