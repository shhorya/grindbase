"use client"

import Link from "next/link"
import Image from "next/image"
import { Minus, Plus } from "lucide-react"
import { GoldBar } from "@/components/gold-bar"
import { getDiamondRequirement } from "@/lib/constants"
import type { CompleteWeapon } from "@/lib/use-camo-data"

export function DiamondProgressCard({
  weapon,
  onProgressChange,
}: {
  weapon: CompleteWeapon
  onProgressChange: (weaponId: string, value: number) => void
}) {
  const req = getDiamondRequirement(weapon)
  const current = Math.min(weapon.diamondProgress ?? 0, req.target)
  const pct = req.target > 0 ? Math.round((current / req.target) * 100) : 0

  function adjust(delta: number) {
    onProgressChange(weapon.id, current + delta)
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 glass p-4 opacity-80 transition-all duration-300 hover:opacity-100 hover:border-diamond/40">
      <Link
        href={`/weapons/${weapon.id}`}
        className="absolute inset-0 z-0"
        aria-label={`View ${weapon.name} details`}
      />
      <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        {weapon.category}
      </span>

      <div className="relative my-3 h-28 w-full overflow-hidden rounded-xl border border-border/50 bg-[radial-gradient(circle_at_center,theme(colors.secondary/60%),transparent_70%)]">
        <div className="absolute inset-0 bg-background/40" />
        <Image
          src={weapon.image}
          alt={weapon.name}
          fill
          className="relative object-contain p-2"
        />
      </div>

      <h3 className="text-base font-medium">{weapon.name}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {req.type === "objective"
          ? `Destroy ${req.target} ${req.unitLabel}`
          : `${req.target} ${req.unitLabel} required`}
      </p>

      <div className="mt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-mono text-diamond">
            {current}/{req.target}
          </span>
          <span className="text-xs text-muted-foreground">{pct}%</span>
        </div>
        <GoldBar value={pct} tone="diamond" className="mt-1.5" />
      </div>

      <div className="relative z-10 mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => adjust(-1)}
          className="flex size-7 items-center justify-center rounded-lg border border-border/70 bg-secondary/30 text-muted-foreground hover:border-border hover:text-foreground"
          aria-label="Decrease"
        >
          <Minus className="size-3.5" />
        </button>
        <input
          type="number"
          value={current}
          onChange={(e) => onProgressChange(weapon.id, Number(e.target.value) || 0)}
          className="h-7 w-16 rounded-lg border border-border/70 bg-secondary/30 text-center text-sm outline-none focus-visible:border-gold/50"
        />
        <button
          type="button"
          onClick={() => adjust(1)}
          className="flex size-7 items-center justify-center rounded-lg border border-border/70 bg-secondary/30 text-muted-foreground hover:border-border hover:text-foreground"
          aria-label="Increase"
        >
          <Plus className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => adjust(10)}
          className="ml-auto rounded-lg border border-border/70 bg-secondary/30 px-2 py-1 text-xs text-muted-foreground hover:border-border hover:text-foreground"
        >
          +10
        </button>
      </div>
    </div>
  )
}
