import type { CompleteWeapon } from "./data"
import type { WeaponCategory } from "./types"

export function getOverallCompletion(weapons: CompleteWeapon[]) {
  if (!weapons.length) return 0

  return Math.round(
    weapons.reduce((sum, weapon) => sum + weapon.completion, 0) /
      weapons.length
  )
}

export function getGoldCount(weapons: CompleteWeapon[]) {
  return weapons.filter((weapon) => weapon.gold).length
}

export function getDiamondCount(weapons: CompleteWeapon[]) {
  return weapons.filter((weapon) => weapon.diamond).length
}

export function getPlatinumCount(
  weapons: CompleteWeapon[],
  categories: WeaponCategory[]
) {
  return categories.filter((category) => {
    const categoryWeapons = weapons.filter(
      (weapon) => weapon.category === category
    )

    if (!categoryWeapons.length) return false

    return categoryWeapons.every((weapon) => weapon.gold)
  }).length
}

export function hasDamascus(
  weapons: CompleteWeapon[],
  categories: WeaponCategory[]
) {
  return getPlatinumCount(weapons, categories) === categories.length
}

export function getCategoryProgress(
  weapons: CompleteWeapon[],
  category: WeaponCategory
) {
  const categoryWeapons = weapons.filter(
    (weapon) => weapon.category === category
  )

  const total = categoryWeapons.length
  const gold = categoryWeapons.filter((weapon) => weapon.gold).length

  const completion = total
    ? Math.round(
        categoryWeapons.reduce(
          (sum, weapon) => sum + weapon.completion,
          0
        ) / total
      )
    : 0

  return {
    total,
    gold,
    completion,
    weapons: categoryWeapons,
  }
}

export function getRecommendedGrinds(
  weapons: CompleteWeapon[],
  limit: number = 3
) {
  return weapons
    .filter((weapon) => !weapon.gold)
    .sort((a, b) => b.completion - a.completion)
    .slice(0, limit)
}