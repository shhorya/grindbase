"use client"

import { useMemo } from "react"
import { weapons } from "./weapons"
import { SEASONAL_CAMOS } from "./seasonal-camos"
import { useSeasonalProgress } from "./seasonal-store"

// Some weapons are missing specific individual camos rather than just "the
// oldest N are missing" — that pattern can't be expressed by the count-based
// rule alone (eligibleSeasonalCamos on each weapon), so these are subtracted
// explicitly by camo id. Add more entries here as more gaps get reported.
// Ordered to match the category order and weapon order used in weapons.ts.
const SEASONAL_CAMO_EXCLUDED_BY_WEAPON: Record<string, string[]> = {
  // Assault Rifle
  "Type 19": ["ice-locked"],
  "BP50": ["ice-locked", "opalescence", "golden-opportunity"],
  "LAG 53": ["ice-locked", "opalescence", "golden-opportunity", "futuristic"],
  "XM4": ["ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine", "mystic-burst"],
  "Vargo-S": [
    "ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine",
    "mystic-burst", "nephrite", "power-nova", "shimmer",
  ],
  "RAM-7": [
    "ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine",
    "mystic-burst", "nephrite", "power-nova", "shimmer", "ivory", "lunar-tear",
    "ocean-waves", "astronomy", "sunken-gambit",
  ],
  "Lachmann-556": [
    "ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine",
    "dream-aurora", "mystic-burst", "nephrite", "power-nova", "shimmer", "ivory",
    "lunar-tear", "ocean-waves", "astronomy", "sunken-gambit", "psychic-distortion",
    "stained-panes", "scorch-melt", "t-3-infused", "gilded-mist",
  ],
  "BAL-27": [
    "ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine",
    "dream-aurora", "mystic-burst", "nephrite", "power-nova", "shimmer", "ivory",
    "lunar-tear", "ocean-waves", "astronomy", "sunken-gambit", "psychic-distortion",
    "stained-panes", "scorch-melt", "t-3-infused", "gilded-mist", "rime",
    "incandescent", "griffins-victory",
  ],

  // Sniper
  "LW3-Tundra": ["ice-locked"],
  "3-Line Rifle": [
    "ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine",
    "mystic-burst", "nephrite", "power-nova", "shimmer", "ivory", "lunar-tear",
  ],

  // LMG
  "RAAL MG": ["ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine", "mystic-burst"],
  "MG 82": [
    "ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine",
    "mystic-burst", "nephrite", "power-nova", "shimmer", "ivory", "lunar-tear",
    "ocean-waves", "astronomy",
  ],
  "DP27": [
    "ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine",
    "dream-aurora", "mystic-burst", "nephrite", "power-nova", "shimmer", "ivory",
    "lunar-tear", "ocean-waves", "astronomy", "sunken-gambit", "psychic-distortion",
    "stained-panes", "scorch-melt", "t-3-infused", "gilded-mist", "rime", "incandescent",
  ],
  "MG42": [
    "ice-locked", "opalescence",
  ],

  // SMG
  "TEC-9": ["ice-locked", "opalescence"],
  "ISO": ["ice-locked", "opalescence", "golden-opportunity", "futuristic"],
  "USS 9": ["ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine"],
  "VMP": [
    "ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine",
    "mystic-burst", "nephrite", "power-nova", "shimmer",
  ],
  "Sten": [
    "ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine",
    "dream-aurora", "mystic-burst", "nephrite", "power-nova", "shimmer", "ivory",
    "lunar-tear", "ocean-waves", "astronomy", "sunken-gambit", "psychic-distortion",
  ],
  "LC10": [
    "ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine",
    "dream-aurora", "mystic-burst", "nephrite", "power-nova", "shimmer", "ivory",
    "lunar-tear", "ocean-waves", "astronomy", "sunken-gambit", "psychic-distortion",
    "stained-panes", "scorch-melt", "t-3-infused",
  ],
  "FSS Hurricane": [
    "ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine",
    "dream-aurora", "mystic-burst", "nephrite", "power-nova", "shimmer", "ivory",
    "lunar-tear", "ocean-waves", "astronomy", "sunken-gambit", "psychic-distortion",
    "stained-panes", "scorch-melt", "t-3-infused", "gilded-mist", "rime", "incandescent",
    "griffins-victory", "melted-amethyst",
  ],

  // eligibleSeasonalCamos count in weapons.ts (should be 2), not an
  // exclusion list, since it's a "newest gun, nothing beyond the base
  // 12 yet" case rather than a scattered-gaps case.

  // Shotgun
  "VLK Rogue": [
    "ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine",
    "mystic-burst", "nephrite", "power-nova",
  ],
  "Einhorn Revolving": [
    "ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine",
    "dream-aurora", "mystic-burst", "nephrite", "power-nova", "shimmer", "ivory",
    "lunar-tear", "ocean-waves", "astronomy", "sunken-gambit", "psychic-distortion",
    "stained-panes",
  ],
  "MX-Guardian": [
    "ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine",
    "dream-aurora", "mystic-burst", "nephrite", "power-nova", "shimmer", "ivory",
    "lunar-tear", "ocean-waves", "astronomy", "sunken-gambit", "psychic-distortion",
    "stained-panes", "scorch-melt", "t-3-infused", "gilded-mist", "rime",
  ],

  // Marksman
  "Type 63": ["ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine"],
  "M1 Garand": [
    "ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine",
    "mystic-burst", "nephrite", "power-nova",
  ],
  "SO-14": [
    "ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine",
    "dream-aurora", "mystic-burst", "nephrite", "power-nova", "shimmer", "ivory",
    "lunar-tear", "ocean-waves", "astronomy", "sunken-gambit", "psychic-distortion",
    "stained-panes", "scorch-melt",
  ],

  // Pistol
  "Machine Pistol": ["ice-locked", "opalescence", "golden-opportunity"],

  // Melee
  "Spear": ["ice-locked"],
}

export function useSeasonalData() {
  const { isOwned, toggle, setManyOwned, hydrated, getMatchProgress, setMatchProgress } = useSeasonalProgress()

  const camoStats = useMemo(() => {
    return SEASONAL_CAMOS.map((camo) => {
      const eligibleWeapons = weapons.filter((w) => {
        // First 10 camos (Aether Crystal → Assault Pattern) are available to
        // every weapon regardless of when it joined the game. Beyond that,
        // it's "the N most recent camos" per weapon — computed against the
        // real current camo count, not a hardcoded number, so this stays
        // correct automatically as future seasons add more camos.
        const baseEligible = camo.order <= 10 || camo.order > SEASONAL_CAMOS.length - w.eligibleSeasonalCamos
        if (!baseEligible) return false

        const excluded = SEASONAL_CAMO_EXCLUDED_BY_WEAPON[w.name]
        return !excluded?.includes(camo.id)
      })

      const ownedCount =
        camo.unlockType === "matches"
          ? eligibleWeapons.filter(
              (w) => getMatchProgress(w.id, camo.id) >= (camo.matchesTarget ?? 0)
            ).length
          : eligibleWeapons.filter((w) => isOwned(w.id, camo.id)).length

      return {
        ...camo,
        totalEligible: eligibleWeapons.length,
        ownedCount,
        eligibleWeapons,
      }
    })
  }, [isOwned, getMatchProgress])

  return { camoStats, isOwned, toggle, setManyOwned, hydrated, getMatchProgress, setMatchProgress }
}
