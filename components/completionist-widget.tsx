"use client"

import { useState } from "react"
import Image from "next/image"
import { Check, ChevronDown } from "lucide-react"
import {
  BASIC_CAMO_CATEGORIES,
  BASIC_CAMO_CATEGORY_IMAGES,
  type BasicCamoCategory,
} from "@/lib/basic-camos"
import { useBasicCamoData, BASIC_CAMO_TOTAL } from "@/lib/use-basic-camo-data"
import type { CompleteWeapon } from "@/lib/use-camo-data"
import { cn } from "@/lib/utils"

export function CompletionistWidget({
  weapon,
  onFlipGold,
}: {
  weapon: CompleteWeapon
  onFlipGold: () => void
}) {
  const { camos, isOwned, toggle, setManyOwned, getOwnedCount } = useBasicCamoData()
  const [expanded, setExpanded] = useState<BasicCamoCategory | null>(null)

  const realTotal = getOwnedCount(weapon.id)
  const displayTotal = weapon.gold ? BASIC_CAMO_TOTAL : realTotal

  function categoryCamos(category: BasicCamoCategory) {
    return camos.filter((c) => c.category === category).sort((a, b) => a.tier - b.tier)
  }

  function ownedInCategory(category: BasicCamoCategory) {
    if (weapon.gold) return 10
    return categoryCamos(category).filter((c) => isOwned(weapon.id, c.id)).length
  }

  // Sequential/lock-step: unlocking tier N unlocks 1..N, locking tier N
  // locks N..10 — never a gap in the middle of a category.
  function handleToggleCamo(category: BasicCamoCategory, tier: number) {
    const list = categoryCamos(category)
    const currentlyOwned = list.filter((c) => isOwned(weapon.id, c.id)).length
    const clickedIsOwned = tier <= currentlyOwned

    const targetOwnedCount = clickedIsOwned ? tier - 1 : tier
    const toOwn = list.filter((c) => c.tier <= targetOwnedCount).map((c) => c.id)
    const toClear = list.filter((c) => c.tier > targetOwnedCount).map((c) => c.id)

    if (toOwn.length > 0) setManyOwned(weapon.id, toOwn, true)
    if (toClear.length > 0) setManyOwned(weapon.id, toClear, false)

    const newTotal = realTotal - currentlyOwned + targetOwnedCount
    if (newTotal === BASIC_CAMO_TOTAL && !weapon.gold) onFlipGold()
    if (newTotal < BASIC_CAMO_TOTAL && weapon.gold) onFlipGold()
  }

  function handleToggleCategoryComplete(category: BasicCamoCategory) {
    const list = categoryCamos(category)
    const currentlyOwned = list.filter((c) => isOwned(weapon.id, c.id)).length
    const allOwned = currentlyOwned === list.length
    const ids = list.map((c) => c.id)
    setManyOwned(weapon.id, ids, !allOwned)

    const newTotal = allOwned ? realTotal - currentlyOwned : realTotal - currentlyOwned + list.length
    if (newTotal === BASIC_CAMO_TOTAL && !weapon.gold) onFlipGold()
    if (newTotal < BASIC_CAMO_TOTAL && weapon.gold) onFlipGold()
  }

  return (
    <div id="completionist-widget" className="overflow-hidden rounded-2xl border border-border/70 glass">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
        <h2 className="text-sm font-semibold tracking-wide text-gold uppercase">Completionist</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {displayTotal}/{BASIC_CAMO_TOTAL}
        </span>
      </div>

      <div className="flex flex-col gap-2 p-3 pb-0 sm:flex-row">
        {BASIC_CAMO_CATEGORIES.map((category) => {
          const owned = ownedInCategory(category)
          const complete = owned === 10
          const isExpanded = expanded === category
          return (
            <div
              key={category}
              className={cn(
                "group flex flex-1 items-center gap-2 border px-2.5 py-2 transition-all mb-3",
                isExpanded ? "rounded-t-xl rounded-b-none border-b-0 mb-0" : "rounded-xl",
                complete
                  ? "border-gold/50 bg-gold/10 glow-gold-sm"
                  : isExpanded
                    ? "border-gold/40 bg-gold/5"
                    : "border-border/60 bg-secondary/20 hover:border-gold/40 hover:bg-gold/5 hover:glow-gold-sm"
              )}
            >
              <button
                type="button"
                onClick={() => handleToggleCategoryComplete(category)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                aria-label={`Toggle all ${category} camos`}
              >
                <div
                  className={cn(
                    "relative size-9 shrink-0 overflow-hidden rounded-md border",
                    complete ? "border-gold/50" : "border-border/50 group-hover:border-gold/40"
                  )}
                >
                  <Image src={BASIC_CAMO_CATEGORY_IMAGES[category]} alt={category} fill className="object-cover" />
                </div>
                <div className="min-w-0">
                  <div className={cn("truncate text-xs font-medium", complete && "text-gold")}>{category}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{owned}/10</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : category)}
                aria-label={isExpanded ? `Collapse ${category}` : `Expand ${category}`}
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-foreground opacity-40 transition-all duration-200 hover:scale-110 hover:opacity-100 hover:text-gold"
              >
                <ChevronDown className={cn("size-4 transition-transform duration-200", isExpanded && "rotate-180")} />
              </button>
            </div>
          )
        })}
      </div>

      {expanded && (
        <div className="mx-3 mb-3 -mt-2 rounded-b-xl border border-t-0 border-gold/40 bg-gold/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gold">{expanded}</span>
            <button
              type="button"
              onClick={() => handleToggleCategoryComplete(expanded)}
              className="rounded-lg border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-medium text-gold hover:bg-gold/20"
            >
              {ownedInCategory(expanded) === 10 ? "Lock All" : "Unlock All"}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {categoryCamos(expanded).map((camo) => {
              const owned = weapon.gold || isOwned(weapon.id, camo.id)
              return (
                <button
                  key={camo.id}
                  type="button"
                  onClick={() => handleToggleCamo(expanded, camo.tier)}
                  className={cn(
                    "group/tile relative overflow-hidden rounded-xl border p-3 text-left transition-all",
                    owned
                      ? "border-gold/50 bg-gold/5 hover:border-gold/70"
                      : "border-border/60 bg-secondary/20 opacity-70 hover:opacity-100"
                  )}
                >
                  <div className="relative h-16 w-full overflow-hidden rounded-lg">
                    <Image src={camo.texture} alt={camo.name} fill className="object-cover" />
                    {owned && (
                      <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-gold text-primary-foreground">
                        <Check className="size-3" />
                      </span>
                    )}
                  </div>
                  <span className="mt-2 block truncate text-xs font-medium">{camo.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}