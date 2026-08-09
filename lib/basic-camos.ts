export type BasicCamoCategory = "Sand" | "Dragon" | "Splinter" | "Tiger" | "Jungle" | "Reptile"

export interface BasicCamo {
  id: string
  name: string
  category: BasicCamoCategory
  tier: number // 1-10 within its category
  order: number // 1-60 overall progression order
}

const CATEGORY_ORDER: BasicCamoCategory[] = ["Sand", "Dragon", "Splinter", "Tiger", "Jungle", "Reptile"]

const CATEGORY_LISTS: Record<BasicCamoCategory, string[]> = {
  Sand: ["Desert Snake", "Commando", "Rip 'N Tear", "Moroccan Snake", "Pitter Patter", "China Lake", "Pinstripe Suit", "Chain Link", "Nightfall", "Smoke"],
  Dragon: ["H2O", "Dirt", "Moss", "Tagged", "Black Top", "Asphalt", "Crime Scene", "Neon Pink", "Trailblazer", "Foliage"],
  Splinter: ["Tundra", "Undergrowth", "Frostbite", "Ice Breaker", "Ruins", "Arctic Seafoam", "Angles", "Autumn Dazzle", "Arctic Abstract", "Sharp Edges"],
  Tiger: ["Overgrown", "Mudslide", "Dank Forest", "Abominable", "Faded Veil", "Feral Beast", "Tiger Stripes", "Desert Cat", "Red Tiger", "Blue Tiger"],
  Jungle: ["Swamp", "Modern Woodland", "Desert Hybrid", "Sand Dance", "Marshland", "Kill Brush", "Warcom Greens", "Warcom Blues", "Nightfrost", "Canopy"],
  Reptile: ["Python", "Rattlesnake", "Komodo", "Blue Iguana", "Chupacabra", "Pink Python", "Anaconda", "Bullsnake", "Gecko", "Gartersnake"],
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export const BASIC_CAMOS: BasicCamo[] = CATEGORY_ORDER.flatMap((category, catIdx) =>
  CATEGORY_LISTS[category].map((name, i) => ({
    id: `basic-${slugify(name)}`,
    name,
    category,
    tier: i + 1,
    order: catIdx * 10 + i + 1,
  }))
)

export const BASIC_CAMO_IDS = BASIC_CAMOS.map((c) => c.id)