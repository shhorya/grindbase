export type DmzSeason = "Season 1: Flux" | "Season 2: Constellation's End"

export interface DmzCamo {
  id: string
  name: string
  texture: string
  order: number // 1 = oldest, 20 = newest
  season: DmzSeason
}

// Just the colors — everything else (id, name, texture path, order) is
// built from this list below, so there's only one place to edit.
const SEASON_1_COLORS = [
  "Twilight",
  "Aubergine",
  "Violet Sun",
  "Borealis",
  "Amethyst",
  "Deepwater",
  "Castaway",
  "Amberleaf",
  "Ultraviolet",
  "Mauve Dusk",
]

const SEASON_2_COLORS = [
  "Turquoise",
  "Fluorite",
  "Ruby",
  "Topaz",
  "Emerald",
  "Sapphire",
  "Larimar",
  "Gold",
  "Amethyst",
  "Ametrine",
]

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

const season1: DmzCamo[] = SEASON_1_COLORS.map((color, i) => ({
  id: `dmz-s1-${slugify(color)}`,
  name: `${color} Flux`,
  texture: `/dmz/s1-${slugify(color)}.webp`,
  order: i + 1,
  season: "Season 1: Flux",
}))

const season2: DmzCamo[] = SEASON_2_COLORS.map((color, i) => ({
  id: `dmz-s2-${slugify(color)}`,
  name: `Constellation's End (${color})`,
  texture: `/dmz/s2-${slugify(color)}.webp`,
  order: SEASON_1_COLORS.length + i + 1,
  season: "Season 2: Constellation's End",
}))

export const DMZ_CAMOS: DmzCamo[] = [...season1, ...season2]

// Season 2 names are all "Constellation's End (Color)" — the season label
// above the title already says "Constellation's End", so on the card/title
// itself we just want the color. Season 1 names ("Color Flux") stay as-is.
export function getDmzDisplayName(camo: DmzCamo): string {
  if (camo.season === "Season 2: Constellation's End") {
    const match = camo.name.match(/\(([^)]+)\)/)
    return match ? match[1] : camo.name
  }
  return camo.name
}
