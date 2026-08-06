import type { CompleteWeapon } from "./data"
import type { WeaponCategory } from "./types"

// Weapons with no camo system at all (like Base Melee) are shown in the
// Arsenal for completeness but never count toward any stat, since there's
// nothing to actually complete on them.
function trackedOnly(weapons: CompleteWeapon[]) {
  return weapons.filter((weapon) => !weapon.noCamos)
}

export function getOverallCompletion(weapons: CompleteWeapon[]) {
  const tracked = trackedOnly(weapons)
  if (!tracked.length) return 0

  return Math.round(
    tracked.reduce((sum, weapon) => sum + weapon.completion, 0) /
      tracked.length
  )
}

export function getGoldCount(weapons: CompleteWeapon[]) {
  return trackedOnly(weapons).filter((weapon) => weapon.gold).length
}

export function getDiamondCount(weapons: CompleteWeapon[]) {
  return trackedOnly(weapons).filter((weapon) => weapon.diamond).length
}

export function getPlatinumCount(
  weapons: CompleteWeapon[],
  categories: WeaponCategory[]
) {
  const tracked = trackedOnly(weapons)
  return categories.filter((category) => {
    const categoryWeapons = tracked.filter(
      (weapon) => weapon.category === category
    )

    if (!categoryWeapons.length) return false

    // Platinum is sticky once earned — checking the stored flag (rather
    // than re-deriving "does everyone currently have Gold") means a new
    // weapon added to this category later doesn't retroactively revoke
    // a Platinum you already earned before it existed.
    return categoryWeapons.some((weapon) => weapon.platinum)
  }).length
}

export function hasDamascus(
  weapons: CompleteWeapon[],
  ogWeaponIds: string[]
) {
  return ogWeaponIds.every((id) => {
    const weapon = weapons.find((w) => w.id === id)
    return weapon?.platinum === true
  })
}

export function getCategoryProgress(
  weapons: CompleteWeapon[],
  category: WeaponCategory
) {
  const categoryWeapons = trackedOnly(weapons).filter(
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
  return trackedOnly(weapons)
    .filter((weapon) => !weapon.gold)
    .sort((a, b) => b.completion - a.completion)
    .slice(0, limit)
}
