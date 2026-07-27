export type SeasonalCamoSource =
  | "Seasonal"
  | "Zombies"
  | "Tournament"
  | "Secret Cache"
  | "Event"

export interface SeasonalCamoKillQuota {
  category: string
  kills: number
}

export interface SeasonalCamo {
  id: string
  name: string
  texture: string
  order: number // 1 = oldest, 36 = newest
  source: SeasonalCamoSource
  unlockType?: "matches" // camos that unlock via a global match counter instead of per-weapon
  matchesTarget?: number
  killQuotas?: SeasonalCamoKillQuota[]
}

export const SEASONAL_CAMOS: SeasonalCamo[] = [
  {
    id: "aether-crystal",
    name: "Aether Crystal",
    texture: "/seasonal/aether-crystal.webp",
    order: 1,
    source: "Zombies",
    unlockType: "matches",
    matchesTarget: 6,
    killQuotas: [
      { category: "Assault Rifles & LMGs", kills: 25 },
      { category: "Sniper Rifles", kills: 8 },
      { category: "SMGs", kills: 25 },
      { category: "Shotguns", kills: 12 },
      { category: "Marksman Rifles", kills: 8 },
      { category: "Pistols", kills: 15 },
    ],
  },
  { id: "red-sprite", name: "Red Sprite", texture: "/seasonal/red-sprite.webp", order: 2, source: "Tournament" },
  { id: "glacial-ripple", name: "Glacial Ripple", texture: "/seasonal/glacial-ripple.webp", order: 3, source: "Tournament" },
  { id: "polychromatic", name: "Polychromatic", texture: "/seasonal/polychromatic.webp", order: 4, source: "Tournament" },
  { id: "blistering-magma", name: "Blistering Magma", texture: "/seasonal/blistering-magma.webp", order: 5, source: "Tournament" },
  { id: "golden-emerald", name: "Golden Emerald", texture: "/seasonal/golden-emerald.webp", order: 6, source: "Tournament" },
  { id: "fluorescence", name: "Fluorescence", texture: "/seasonal/fluorescence.webp", order: 7, source: "Tournament" },
  { id: "pixelated-aggression", name: "Pixelated Aggression", texture: "/seasonal/pixelated-aggression.webp", order: 8, source: "Tournament" },
  { id: "making-waves", name: "Making Waves", texture: "/seasonal/making-waves.webp", order: 9, source: "Tournament" },
  { id: "assault-pattern", name: "Assault Pattern", texture: "/seasonal/assault-pattern.webp", order: 10, source: "Tournament" },
  { id: "ice-locked", name: "Ice Locked", texture: "/seasonal/ice-locked.webp", order: 11, source: "Tournament" },
  { id: "opalescence", name: "Opalescence", texture: "/seasonal/opalescence.webp", order: 12, source: "Tournament" },
  { id: "golden-opportunity", name: "Golden Opportunity", texture: "/seasonal/golden-opportunity.webp", order: 13, source: "Tournament" },
  { id: "futuristic", name: "Futuristic", texture: "/seasonal/futuristic.webp", order: 14, source: "Tournament" },
  { id: "carmine", name: "Carmine", texture: "/seasonal/carmine.webp", order: 15, source: "Tournament" },
  { id: "dream-aurora", name: "Dream Aurora", texture: "/seasonal/dream-aurora.webp", order: 16, source: "Event" },
  { id: "mystic-burst", name: "Mystic Burst", texture: "/seasonal/mystic-burst.webp", order: 17, source: "Tournament" },
  { id: "nephrite", name: "Nephrite", texture: "/seasonal/nephrite.webp", order: 18, source: "Tournament" },
  { id: "power-nova", name: "Power Nova", texture: "/seasonal/power-nova.webp", order: 19, source: "Secret Cache" },
  { id: "shimmer", name: "Shimmer", texture: "/seasonal/shimmer.webp", order: 20, source: "Tournament" },
  { id: "ivory", name: "Ivory", texture: "/seasonal/ivory.webp", order: 21, source: "Tournament" },
  { id: "lunar-tear", name: "Lunar Tear", texture: "/seasonal/lunar-tear.webp", order: 22, source: "Event" },
  { id: "ocean-waves", name: "Ocean Waves", texture: "/seasonal/ocean-waves.webp", order: 23, source: "Secret Cache" },
  { id: "astronomy", name: "Astronomy", texture: "/seasonal/astronomy.webp", order: 24, source: "Event" },
  { id: "sunken-gambit", name: "Sunken Gambit", texture: "/seasonal/sunken-gambit.webp", order: 25, source: "Tournament" },
  { id: "psychic-distortion", name: "Psychic Distortion", texture: "/seasonal/psychic-distortion.webp", order: 26, source: "Secret Cache" },
  { id: "stained-panes", name: "Stained Panes", texture: "/seasonal/stained-panes.webp", order: 27, source: "Tournament" },
  { id: "scorch-melt", name: "Scorch Melt", texture: "/seasonal/scorch-melt.webp", order: 28, source: "Secret Cache" },
  { id: "t-3-infused", name: "T-3 Infused", texture: "/seasonal/t-3-infused.webp", order: 29, source: "Tournament" },
  { id: "gilded-mist", name: "Gilded Mist", texture: "/seasonal/gilded-mist.webp", order: 30, source: "Secret Cache" },
  { id: "rime", name: "Rime", texture: "/seasonal/rime.webp", order: 31, source: "Tournament" },
  { id: "incandescent", name: "Incandescent", texture: "/seasonal/incandescent.webp", order: 32, source: "Secret Cache" },
  { id: "griffins-victory", name: "Griffin's Victory", texture: "/seasonal/griffins-victory.webp", order: 33, source: "Tournament" },
  { id: "melted-amethyst", name: "Melted Amethyst", texture: "/seasonal/melted-amethyst.webp", order: 34, source: "Secret Cache" },
  { id: "fractal-visions", name: "Fractal Visions", texture: "/seasonal/fractal-visions.webp", order: 35, source: "Event" },
  { id: "white-paint", name: "White Paint", texture: "/seasonal/white-paint.webp", order: 36, source: "Tournament" },
]