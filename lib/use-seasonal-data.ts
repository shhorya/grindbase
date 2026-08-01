"use client"

import { useMemo } from "react"
import { weapons } from "./weapons"
import { SEASONAL_CAMOS } from "./seasonal-camos"
import { useSeasonalProgress } from "./seasonal-store"

// Some weapons are missing specific individual camos rather than just "the
// oldest N are missing" — that pattern can't be expressed by the count-based
// rule alone (eligibleSeasonalCamos on each weapon), so these are subtracted
// explicitly by camo id. Add more entries here as more gaps get reported.
const SEASONAL_CAMO_EXCLUDED_BY_WEAPON: Record<string, string[]> = {
  // Melee
  "Spear": ["ice-locked"],

  // Pistol
  "Machine Pistol": ["ice-locked", "opalescence", "golden-opportunity"],

  // Marksman (cont.)
  "SO-14": [
    "ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine",
    "dream-aurora", "mystic-burst", "nephrite", "power-nova", "shimmer", "ivory",
    "lunar-tear", "ocean-waves", "astronomy", "sunken-gambit", "psychic-distortion",
    "stained-panes", "scorch-melt",
  ],
  "Type 63": ["ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine"],
  "M1 Garand": [
    "ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine",
    "mystic-burst", "nephrite", "power-nova",
  ],

  // Sniper
  "LW3-Tundra": ["ice-locked"],
  "3-Line Rifle": [
    "ice-locked", "opalescence", "golden-opportunity", "futuristic", "carmine",
    "mystic-burst", "nephrite", "power-nova", "shimmer", "ivory", "lunar-tear",
  ],

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
}

export function useSeasonalData() {
  const { isOwned, toggle, hydrated, getMatchProgress, setMatchProgress } = useSeasonalProgress()

  const camoStats = useMemo(() => {
    return SEASONAL_CAMOS.map((camo) => {
      const eligibleWeapons = weapons.filter((w) => {
        // First 10 camos (Aether Crystal → Assault Pattern) are available to
        // every weapon regardless of when it joined the game. Beyond that,
        // it's "the N most recent camos" per weapon.
        const baseEligible = camo.order <= 10 || camo.order > 36 - w.eligibleSeasonalCamos
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

  return { camoStats, isOwned, toggle, hydrated, getMatchProgress, setMatchProgress }
}