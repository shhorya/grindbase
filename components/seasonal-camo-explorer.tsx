"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Check, Lock, Minus, Plus, Search, SlidersHorizontal, Unlock } from "lucide-react"
import { HudNav } from "@/components/hud-nav"
import { GoldBar } from "@/components/gold-bar"
import { Input } from "@/components/ui/input"
import { useSeasonalData } from "@/lib/use-seasonal-data"
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

export function SeasonalCamoExplorer({ camoId }: { camoId: string }) {
  const { camoStats, isOwned, toggle, setManyOwned, getMatchProgress, setMatchProgress } = useSeasonalData()
  const [filter, setFilter] = useState<Filter>("owned")
  const [category, setCategory] = useState<WeaponCategory | "all">("all")
  const [query, setQuery] = useState("")

  const camo = camoStats.find((c) => c.id === camoId)
  const isMatchesBased = camo?.unlockType === "matches"
  const matchTarget = camo?.matchesTarget ?? 0

  function weaponIsUnlocked(weaponId: string) {
    if (isMatchesBased) return getMatchProgress(weaponId, camoId) >= matchTarget
    return isOwned(weaponId, camoId)
  }

  const filtered = useMemo(() => {
    if (!camo) return []
    let list = camo.eligibleWeapons
    if (category !== "all") list = list.filter((w) => w.category === category)
    if (query.trim()) {
      list = list.filter((w) => w.name.toLowerCase().includes(query.trim().toLowerCase()))
    }
    switch (filter) {
      case "owned":
        return list.filter((w) => weaponIsUnlocked(w.id))
      case "unowned":
        return list.filter((w) => !weaponIsUnlocked(w.id))
      default:
        return list
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camo, filter, category, query, isOwned, getMatchProgress, camoId])

  function handleSelectAll() {
    const anyUnowned = filtered.some((w) => !isOwned(w.id, camoId))
    setManyOwned(
      filtered.map((w) => w.id),
      camoId,
      anyUnowned
    )
  }

  if (!camo) return null

  const pct = camo.totalEligible > 0 ? Math.round((camo.ownedCount / camo.totalEligible) * 100) : 0
  const allSelected = filtered.length > 0 && filtered.every((w) => isOwned(w.id, camoId))

  return (
    <div className="min-h-screen bg-hud-grid">
      <HudNav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link
          href="/seasonal"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Seasonal Vault
        </Link>

        <div className="hud-corner mt-4 flex items-center gap-6 rounded-2xl border border-border/70 glass-strong p-6 glow-gold-sm">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border/60">
            <Image src={camo.texture} alt={camo.name} fill className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
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
            {isMatchesBased && (
              <p className="mt-2 text-xs text-muted-foreground">
                Unlocks per weapon after {matchTarget} Hard/Nightmare wins with that gun's kill quota.
              </p>
            )}
          </div>
        </div>

        {!isMatchesBased && (
          <div className="relative mt-6">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search weapons by name…"
              className="h-12 rounded-2xl border-border/70 bg-card/60 pl-12 text-base backdrop-blur-xl focus-visible:border-gold/50 focus-visible:ring-gold/20"
            />
          </div>
        )}

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

          <div className="flex flex-wrap items-center justify-between gap-2">
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

            {!isMatchesBased && filtered.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-sm font-medium text-gold hover:bg-gold/20"
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((w) => {
              const owned = weaponIsUnlocked(w.id)
              const current = isMatchesBased ? Math.min(getMatchProgress(w.id, camoId), matchTarget) : 0
              const matchPct = isMatchesBased && matchTarget > 0 ? Math.round((current / matchTarget) * 100) : 0

              return (
                <div
                  key={w.id}
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 glass p-4 transition-all duration-300",
                    owned
                      ? "hover:-translate-y-1 hover:border-gold/40 hover:glow-gold-sm"
                      : "opacity-60"
                  )}
                >
                  <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                    {w.category}
                  </span>
                  <div className="relative my-3 h-28 w-full overflow-hidden rounded-xl border border-border/50 bg-[radial-gradient(circle_at_center,theme(colors.secondary/60%),transparent_70%)]">
                    <div className="absolute inset-0 bg-background/40" />
                    <Image
                      src={w.image}
                      alt={w.name}
                      fill
                      className="relative object-contain p-2"
                    />
                    {!owned && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                        <Lock className="size-5 text-muted-foreground transition-all duration-300 ease-out group-hover:scale-125 group-hover:opacity-0" />
                        <Unlock className="absolute size-5 text-foreground opacity-0 transition-all duration-300 ease-out group-hover:scale-125 group-hover:opacity-100" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-base font-medium">{w.name}</h3>

                  {isMatchesBased ? (
                    <>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-gold">
                            {current}/{matchTarget}
                          </span>
                          <span className="text-muted-foreground">{matchPct}%</span>
                        </div>
                        <GoldBar value={matchPct} className="mt-1.5" />
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setMatchProgress(w.id, camoId, current - 1)}
                          className="flex size-7 items-center justify-center rounded-lg border border-border/70 bg-secondary/30 text-muted-foreground hover:border-border hover:text-foreground"
                          aria-label="Decrease"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <input
                          type="number"
                          value={current}
                          onChange={(e) => setMatchProgress(w.id, camoId, Number(e.target.value) || 0)}
                          className="h-7 w-14 rounded-lg border border-border/70 bg-secondary/30 text-center text-sm outline-none focus-visible:border-gold/50"
                        />
                        <button
                          type="button"
                          onClick={() => setMatchProgress(w.id, camoId, current + 1)}
                          className="flex size-7 items-center justify-center rounded-lg border border-border/70 bg-secondary/30 text-muted-foreground hover:border-border hover:text-foreground"
                          aria-label="Increase"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggle(w.id, camoId)}
                      className={cn(
                        "mt-3 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
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
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No weapons match this filter.
            </p>
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
