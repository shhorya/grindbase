"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Check, Lock, SlidersHorizontal, Unlock } from "lucide-react"
import { HudNav } from "@/components/hud-nav"
import { GoldBar } from "@/components/gold-bar"
import { useDmzData } from "@/lib/use-dmz-data"
import { cn } from "@/lib/utils"
import type { WeaponCategory } from "@/lib/types"

type Filter = "all" | "owned" | "unowned"

const CATEGORIES: WeaponCategory[] = [
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

export function DmzCamoExplorer({ camoId }: { camoId: string }) {
  const { camoStats, isOwned, toggle } = useDmzData()
  const [filter, setFilter] = useState<Filter>("owned")
  const [category, setCategory] = useState<WeaponCategory | "all">("all")

  const camo = camoStats.find((c) => c.id === camoId)

  const filtered = useMemo(() => {
    if (!camo) return []
    let list = camo.eligibleWeapons
    if (category !== "all") list = list.filter((w) => w.category === category)
    switch (filter) {
      case "owned":
        return list.filter((w) => isOwned(w.id, camoId))
      case "unowned":
        return list.filter((w) => !isOwned(w.id, camoId))
      default:
        return list
    }
  }, [camo, filter, category, isOwned, camoId])

  if (!camo) return null

  const pct = camo.totalEligible > 0 ? Math.round((camo.ownedCount / camo.totalEligible) * 100) : 0

  return (
    <div className="min-h-screen bg-hud-grid">
      <HudNav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link
          href="/dmz"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to DMZ Recon
        </Link>

        <div className="hud-corner mt-4 flex items-center gap-6 rounded-2xl border border-border/70 glass-strong p-6 glow-gold-sm">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border/60">
            <Image src={camo.texture} alt={camo.name} fill className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
              {camo.season}
            </span>
            <div className="flex items-baseline justify-between gap-4">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{camo.name}</h1>
              <div className="shrink-0 text-right">
                <div className="font-mono text-2xl font-semibold text-gold">{pct}%</div>
                <p className="text-xs text-muted-foreground">
                  {camo.ownedCount}/{camo.totalEligible} weapons
                </p>
              </div>
            </div>
            <GoldBar value={pct} className="mt-3 h-2" />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 hidden items-center gap-1.5 text-xs tracking-widest text-muted-foreground uppercase sm:flex">
              <SlidersHorizontal className="size-3.5" />
              Category
            </span>
            <Chip active={category === "all"} onClick={() => setCategory("all")}>
              All
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                {c}
              </Chip>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 hidden text-xs tracking-widest text-muted-foreground uppercase sm:inline">
              Status
            </span>
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>
              All
            </Chip>
            <Chip active={filter === "owned"} onClick={() => setFilter("owned")}>
              Owned
            </Chip>
            <Chip active={filter === "unowned"} onClick={() => setFilter("unowned")}>
              Unowned
            </Chip>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((w) => {
              const owned = isOwned(w.id, camoId)
              return (
                <div
                  key={w.id}
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 glass p-4 transition-all duration-300",
                    owned ? "hover:-translate-y-1 hover:border-gold/40 hover:glow-gold-sm" : "opacity-60"
                  )}
                >
                  <Link
                    href={`/weapons/${w.id}`}
                    className="absolute inset-0 z-0"
                    aria-label={`View ${w.name} details`}
                  />
                  <span className="pointer-events-none relative z-10 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                    {w.category}
                  </span>
                  <div className="pointer-events-none relative z-10 my-3 h-28 w-full overflow-hidden rounded-xl border border-border/50 bg-[radial-gradient(circle_at_center,theme(colors.secondary/60%),transparent_70%)]">
                    <div className="absolute inset-0 bg-background/40" />
                    <Image src={w.image} alt={w.name} fill className="relative object-contain p-2" />
                    {!owned && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                        <Lock className="size-5 text-muted-foreground transition-all duration-300 ease-out group-hover:scale-125 group-hover:opacity-0" />
                        <Unlock className="absolute size-5 text-foreground opacity-0 transition-all duration-300 ease-out group-hover:scale-125 group-hover:opacity-100" />
                      </div>
                    )}
                  </div>
                  <h3 className="pointer-events-none relative z-10 text-base font-medium">{w.name}</h3>
                  <button
                    type="button"
                    onClick={() => toggle(w.id, camoId)}
                    className={cn(
                      "relative z-20 mt-3 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                      owned
                        ? "border-gold/50 bg-gold/15 text-gold"
                        : "border-border/70 bg-secondary/30 text-muted-foreground hover:border-border hover:text-foreground"
                    )}
                  >
                    {owned ? (
                      <>
                        <Check className="size-3.5" />
                        Unlocked
                      </>
                    ) : (
                      <>
                        <Lock className="size-3.5" />
                        Unlock
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 py-16 text-center">
            <p className="text-sm text-muted-foreground">No weapons match this filter.</p>
          </div>
        )}
      </main>
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
        active
          ? "border-gold/50 bg-gold/15 text-gold glow-gold-sm"
          : "border-border/70 bg-secondary/30 text-muted-foreground hover:border-border hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}
