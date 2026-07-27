export type WeaponCategory =
  | "Assault Rifle"
  | "SMG"
  | "Sniper"
  | "Shotgun"
  | "LMG"
  | "Marksman"
  | "Pistol"
  | "Launcher"
  | "Melee"

export type CompletionistCamo =
  | "Gold"
  | "Platinum"
  | "Damascus"
  | "Diamond"

export interface Weapon {
  id: string
  name: string
  category: WeaponCategory
  image: string
  /** How many of the 36 seasonal camos this weapon can earn, counting from newest backward. TEMP: defaults to 36 until real release order is provided. */
  eligibleSeasonalCamos: number
  dmzSeason1?: boolean
dmzSeason2?: boolean
}

export interface SeasonalCamo {
  id: string
  name: string
  owned: boolean
}

export interface DashboardStats {
  totalCompletion: number

  totalWeapons: number
  ownedWeapons: number

  gold: number
  platinum: number
  diamond: number

  damascus: boolean

  seasonalOwned: number
  seasonalTotal: number
}