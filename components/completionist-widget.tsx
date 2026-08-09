"use client"

import { useState } from "react"
import Image from "next/image"
import { Check } from "lucide-react"
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

  function ownedInCategory(category: BasicCamoCategory) {
    if (weapon.gold) return 10
    return camos.filter((c) => c.category === category && isOwned(weapon.id, c.id)).length
  }

  function handleToggleCamo(camoId: string) {
    const wasOwned = isOwned(weapon.id, camoId)
    const newTotal = wasOwned ? realTotal - 1 : realTotal + 1
    toggle(weapon.id, camoId)
    if (newTotal === BASIC_CAMO_TOTAL && !weapon.gold) onFlipGold()
    if (newTotal < BASIC_CAMO_TOTAL && weapon.gold) onFlipGold()
  }

  function handleUnlockCategory(category: BasicCamoCategory) {
    const categoryCamoIds = camos.filter((c) => c.category === category).map((c) => c.id)
    const alreadyOwned = categoryCamoIds.filter((id) => isOwned(weapon.id, id)).length
    const newTotal = realTotal - alreadyOwned + categoryCamoIds.length
    setManyOwned(weapon.id, categoryCamoIds, true)
    if (newTotal === BASIC_CAMO_TOTAL && !weapon.gold) onFlipGold()
  }

  return (
    <div id="completionist-widget" className="overflow-hidden rounded-2xl border border-border/70 glass">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
        <h2 className="text-sm font-semibold tracking-wide text-gold uppercase">Completionist</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {displayTotal}/{BASIC_CAMO_TOTAL}
        </span>
      </div>

      <div className="flex flex-col gap-2 p-3 sm:flex-row">
        {BASIC_CAMO_CATEGORIES.map((category) => {
          const owned = ownedInCategory(category)
          const complete = owned === 10
          const isExpanded = expanded === category
          return (
            <button
              key={category}
              type="button"
              onClick={() => setExpanded(isExpanded ? null : category)}
              className={cn(
                "group flex flex-1 items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all",
                complete
                  ? "border-gold/50 bg-gold/10 glow-gold-sm"
                  : isExpanded
                    ? "border-gold/40 bg-gold/5"
                    : "border-border/60 bg-secondary/20 hover:border-gold/40 hover:bg-gold/5 hover:glow-gold-sm"
              )}
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
          )
        })}
      </div>

      {expanded && (
        <div className="border-t border-border/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gold">{expanded}</span>
            <button
              type="button"
              onClick={() => handleUnlockCategory(expanded)}
              className="rounded-lg border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-medium text-gold hover:bg-gold/20"
            >
              Unlock All
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {camos
              .filter((c) => c.category === expanded)
              .map((camo) => {
                const owned = weapon.gold || isOwned(weapon.id, camo.id)
                return (
                  <button
                    key={camo.id}
                    type="button"
                    onClick={() => handleToggleCamo(camo.id)}
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