"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, SlidersHorizontal, Star } from "lucide-react"
import { HudNav } from "@/components/hud-nav"
import { GoldBar } from "@/components/gold-bar"
import { Input } from "@/components/ui/input"
import { useDmzData } from "@/lib/use-dmz-data"
import { getDmzDisplayName, type DmzSeason } from "@/lib/dmz-camos"
import { useStarredDmzCamo } from "@/lib/starred-dmz-camo-store"
import { cn } from "@/lib/utils"

const SEASONS: DmzSeason[] = ["Season 1: Flux", "Season 2: Constellation's End"]

export function DmzContent() {
  const { camoStats } = useDmzData()
  const { starredId, toggleStar } = useStarredDmzCamo()
  const [season, setSeason] = useState<DmzSeason | "all">("all")
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    let list = camoStats
    if (season !== "all") list = list.filter((c) => c.season === season)
    if (query.trim()) {
      list = list.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))
    }
    return list
  }, [camoStats, season, query])

  return (
    <div className="min-h-screen bg-hud-grid">
      <HudNav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs tracking-[0.25em] text-gold">/ DMZ RECON</span>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">DMZ Recon Camos</h1>
          <p className="text-muted-foreground">
            All DMZ: Recon camos released so far. Click a camo to see and track weapons.
          </p>
        </div>

        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search camos by name…"
            className="h-14 rounded-2xl border-border/70 bg-card/60 pl-12 text-base backdrop-blur-xl focus-visible:border-gold/50 focus-visible:ring-gold/20"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="mr-1 hidden items-center gap-1.5 text-xs tracking-widest text-muted-foreground uppercase sm:flex">
            <SlidersHorizontal className="size-3.5" />
            Season
          </span>
          <Chip active={season === "all"} onClick={() => setSeason("all")}>
            All
          </Chip>
          {SEASONS.map((s) => (
            <Chip key={s} active={season === s} onClick={() => setSeason(s)}>
              {s}
            </Chip>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((camo) => {
            const pct = camo.totalEligible > 0 ? Math.round((camo.ownedCount / camo.totalEligible) * 100) : 0
            return (
              <div
                key={camo.id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-border/70 glass p-4 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:glow-gold-sm",
                  starredId === camo.id && "border-gold/60 glow-gold-sm"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleStar(camo.id)}
                  className={cn(
                    "absolute right-3 top-3 z-10 flex size-7 items-center justify-center rounded-full border backdrop-blur-md transition-colors",
                    starredId === camo.id
                      ? "border-gold/60 bg-gold/20 text-gold"
                      : "border-border/70 bg-background/60 text-muted-foreground hover:text-gold"
                  )}
                  aria-label="Star this camo"
                >
                  <Star className="size-3.5" fill={starredId === camo.id ? "currentColor" : "none"} />
                </button>
                <Link href={`/dmz/${camo.id}`}>
                  <div className="relative h-40 w-full overflow-hidden rounded-xl border border-border/50">
                    <Image src={camo.texture} alt={camo.name} fill className="object-cover" />
                  </div>
                  <span className="mt-2 block font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                    {camo.season}
                  </span>
                  <div className="mt-1 flex items-center justify-between">
                    <h3 className="text-sm font-medium">{getDmzDisplayName(camo)}</h3>
                    <span className="font-mono text-xs text-gold">
                      {camo.ownedCount}/{camo.totalEligible}
                    </span>
                  </div>
                  <GoldBar value={pct} className="mt-2" />
                </Link>
              </div>
            )
          })}
        </div>
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
