import { weapons } from "./weapons"
import type { WeaponProgress } from "./progress"

export const defaultProgress: WeaponProgress[] = weapons.map((weapon) => ({
  weaponId: weapon.id,
  owned: false,
  gold: false,
  platinum: false,
  diamond: false,
  completion: 0,
  matchesRemaining: 0,
  diamondProgress: 0,
}))