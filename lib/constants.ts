import { WeaponCategory } from "./types"

export const CATEGORY_IMAGES: Record<WeaponCategory, string> = {
  "Assault Rifle": "/weapon-ar.png",
  SMG: "/weapon-smg.png",
  Sniper: "/weapon-sniper.png",
  Shotgun: "/weapon-shotgun.png",
  LMG: "/weapon-lmg.png",
  Marksman: "/weapon-marksman.png",
  Pistol: "/weapon-pistol.png",
  Launcher: "/weapon-launcher.png",
  Melee: "/weapon-melee.png",
}

export const CURRENT_SEASON = {
  name: "Season 6: Take Your Heart",
  id: 6,
}

export const CAMO_TEXTURES = {
  Gold: "/camo-gold.png",
  Platinum: "/camo-platinum.png",
  Damascus: "/camo-damascus.png",
  Diamond: "/camo-diamond.png",
} as const

export const CATEGORIES: WeaponCategory[] = [
  "Assault Rifle",
  "Sniper",
  "LMG",
  "SMG",
  "Shotgun",
  "Marksman",
  "Pistol",
  "Melee",
  "Launcher",
]

export const CATEGORY_SHOWCASE_WEAPON: Record<WeaponCategory, string> = {
  "Assault Rifle": "m4",
  Sniper: "dl-q33",
  LMG: "rpd",
  SMG: "rus-79u",
  Shotgun: "by15",
  Marksman: "kilo-bolt-action",
  Pistol: "mw11",
  Melee: "knife",
  Launcher: "fhj-18",
}

export type DiamondRequirementType = "matches" | "kills" | "objective"

export interface DiamondRequirement {
  type: DiamondRequirementType
  target: number
  unitLabel: string
}

export const DIAMOND_REQUIREMENTS: Record<WeaponCategory, DiamondRequirement> = {
  "Assault Rifle": { type: "matches", target: 150, unitLabel: "matches" },
  Sniper: { type: "matches", target: 150, unitLabel: "matches" },
  SMG: { type: "matches", target: 120, unitLabel: "matches" },
  LMG: { type: "matches", target: 120, unitLabel: "matches" },
  Marksman: { type: "matches", target: 120, unitLabel: "matches" },
  Shotgun: { type: "matches", target: 80, unitLabel: "matches" },
  Pistol: { type: "matches", target: 80, unitLabel: "matches" },
  Melee: { type: "kills", target: 500, unitLabel: "kills" },
  Launcher: { type: "objective", target: 100, unitLabel: "UAVs destroyed" },
}

export function getDiamondRequirementLabel(category: WeaponCategory) {
  const req = DIAMOND_REQUIREMENTS[category]
  return req.type === "objective"
    ? `Destroy ${req.target} ${req.unitLabel}`
    : `${req.target} ${req.unitLabel}`
}