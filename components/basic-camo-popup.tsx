"use client"

import { Check, X } from "lucide-react"
import { GoldBar } from "@/components/gold-bar"
import { useBasicCamoData, BASIC_CAMO_TOTAL } from "@/lib/use-basic-camo-data"
import type { CompleteWeapon } from "@/lib/use-camo-data"
import { cn } from "@/lib/utils"

const CATEGORY_ORDER = ["Sand", "Dragon", "Splinter", "Tiger", "Jungle", "Reptile"] as const

export function BasicCamoPopup({
  weapon,
  onFlipGold,
  onClose,
}: {
  weapon: CompleteWeapon
  onFlipGold: () => void
  onClose: () => void
}) {
  const { camos, isOwned, toggle, setManyOwned, getOwnedCount } = useBasicCamoData()
  const ownedCount = getOwnedCount(weapon.id)
  const pct = Math.round((ownedCount / BASIC_CAMO_TOTAL) * 100)
  const allCamoIds = camos.map((c) => c.id)

  function handleToggleCamo(camoId: string) {
    const wasOwned = isOwned(weapon.id, camoId)
    const newCount = wasOwned ? ownedCount - 1 : ownedCount + 1
    toggle(weapon.id, camoId)
    if (newCount === BASIC_CAMO_TOTAL && !weapon.gold) onFlipGold()
    if (newCount < BASIC_CAMO_TOTAL && weapon.gold) onFlipGold()
  }

  function handleMarkAll() {
    setManyOwned(weapon.id, allCamoIds, true)
    if (!weapon.gold) onFlipGold()
  }

  function handleClearAll() {
    setManyOwned(weapon.id, allCamoIds, false)
    if (weapon.gold) onFlipGold()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-strong flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gold/30 glow-gold-sm"
      >
        <div className="shrink-0 border-b border-border/60 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
                {weapon.category}
              </span>
              <h2 className="text-xl font-semibold">{weapon.name} — Basic Camos</h2>
            </div>
            <button
              onClick={onClose}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span className="font-mono text-sm font-semibold text-gold">
              {ownedCount}/{BASIC_CAMO_TOTAL}
            </span>
            <GoldBar value={pct} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground">{pct}%</span>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={handleMarkAll}
              className="rounded-lg border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold hover:bg-gold/20"
            >
              Mark All Gold
            </button>
            <button
              onClick={handleClearAll}
              className="rounded-lg border border-border/70 bg-secondary/30 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {CATEGORY_ORDER.map((category) => {
            const categoryCamos = camos.filter((c) => c.category === category)
            return (
              <div key={category} className="mb-5 last:mb-0">
                <h3 className="mb-2 text-xs font-semibold tracking-widest text-gold uppercase">
                  {category}
                </h3>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {categoryCamos.map((camo) => {
                    const owned = isOwned(weapon.id, camo.id)
                    return (
                      <button
                        key={camo.id}
                        type="button"
                        onClick={() => handleToggleCamo(camo.id)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                          owned
                            ? "border-gold/50 bg-gold/10 text-gold"
                            : "border-border/60 bg-secondary/20 text-muted-foreground hover:border-border hover:text-foreground"
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-full border",
                            owned ? "border-gold bg-gold text-primary-foreground" : "border-border/70"
                          )}
                        >
                          {owned && <Check className="size-2.5" />}
                        </span>
                        <span className="truncate">{camo.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}