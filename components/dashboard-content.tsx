"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  Award,
  ChevronLeft,
  ChevronRight,
  Diamond,
  Flame,
  Gem,
  Medal,
  Radar,
  Trophy,
} from "lucide-react"
import { HudNav } from "@/components/hud-nav"
import { CircularProgress } from "@/components/circular-progress"
import { GoldBar } from "@/components/gold-bar"
import { Button } from "@/components/ui/button"
import { categories, categoryProgress } from "@/lib/data"
import { CATEGORY_SHOWCASE_WEAPON, getDiamondRequirement } from "@/lib/constants"
import type { DiamondRequirement } from "@/lib/constants"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCamoData } from "@/lib/use-camo-data"
import { useBasicCamoData, BASIC_CAMO_TOTAL } from "@/lib/use-basic-camo-data"
import { useSeasonalData } from "@/lib/use-seasonal-data"
import { useDmzData } from "@/lib/use-dmz-data"
import { getDmzDisplayName } from "@/lib/dmz-camos"
import { useStarredCamo } from "@/lib/starred-camo-store"
import { useStarredDmzCamo } from "@/lib/starred-dmz-camo-store"
import { cn } from "@/lib/utils"

export function DashboardContent() {
  const { weapons, stats } = useCamoData()
  const { getOwnedCount } = useBasicCamoData()
  const [totalView, setTotalView] = useState<"gold" | "diamond">("gold")
  const [grindView, setGrindView] = useState<"gold" | "diamond">("gold")
  const grinds = weapons
    .filter((w) => !w.diamond)
    .map((w) => {
      const req = getDiamondRequirement(w)
      const target = req.target
      const current = Math.min(w.diamondProgress ?? 0, target)
      const diamondPct = target > 0 ? Math.round((current / target) * 100) : 0
      return { ...w, diamondPct, diamondRemaining: Math.max(0, target - current), diamondReq: req }
    })
    .sort((a, b) => b.diamondPct - a.diamondPct)
  const goldGrinds = weapons
    .filter((w) => !w.gold)
    .map((w) => {
      const goldCount = getOwnedCount(w.id)
      const goldPct = Math.round((goldCount / BASIC_CAMO_TOTAL) * 100)
      return { ...w, goldCount, goldPct }
    })
    .sort((a, b) => b.goldPct - a.goldPct)
  const { camoStats } = useSeasonalData()
  const { camoStats: dmzCamoStats } = useDmzData()
  const dmzOwned = dmzCamoStats.reduce((sum, c) => sum + c.ownedCount, 0)
  const dmzTotal = dmzCamoStats.reduce((sum, c) => sum + c.totalEligible, 0)
  const { starredId } = useStarredCamo()
  const { starredId: dmzStarredId } = useStarredDmzCamo()

  const starredCamo = camoStats.find((c) => c.id === starredId) ?? null
  const seasonalPct = starredCamo && starredCamo.totalEligible > 0
    ? Math.round((starredCamo.ownedCount / starredCamo.totalEligible) * 100)
    : 0

  // All camos, in release order — not just a "top few" subset.
  const allSeasonal = [...camoStats].sort((a, b) => a.order - b.order)
  const allDmz = [...dmzCamoStats].sort((a, b) => a.order - b.order)

  // Uses its own separate star, not the Seasonal one — same behavior as
  // Seasonal: shows the placeholder until you star a DMZ camo.
  const dmzStarred = dmzCamoStats.find((c) => c.id === dmzStarredId) ?? null
  const dmzHero = dmzStarred
  const dmzHeroPct = dmzHero && dmzHero.totalEligible > 0
    ? Math.round((dmzHero.ownedCount / dmzHero.totalEligible) * 100)
    : 0

  const tierCards = [
    {
      label: "Gold",
      icon: Trophy,
      value: stats.goldCount,
      total: stats.weaponsTotal,
      tone: "gold" as const,
      ring: "border-gold/40 bg-gold/10 text-gold",
      href: "/weapons?status=gold&tier=gold",
    },
    {
      label: "Diamond",
      icon: Diamond,
      value: stats.diamondCount,
      total: stats.weaponsTotal,
      tone: "diamond" as const,
      ring: "border-diamond/40 bg-diamond/10 text-diamond",
      href: "/weapons?status=diamond&tier=diamond",
    },
    {
      label: "Platinum",
      icon: Medal,
      value: stats.platinumCount,
      total: stats.weaponsTotal,
      tone: "platinum" as const,
      ring: "border-platinum/40 bg-white/5 text-platinum",
      href: "/weapons?status=gold&tier=platinum",
    },
    {
      label: "Damascus",
      icon: Award,
      value: stats.damascusUnlocked ? stats.weaponsTotal : 0,
      total: stats.weaponsTotal,
      tone: "damascus" as const,
      ring: "border-purple-400/40 bg-gradient-to-br from-red-500/15 to-blue-500/15 text-purple-300",
      href: "/damascus",
    },
  ]

  return (
    <div className="min-h-screen bg-hud-grid">
      <HudNav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs tracking-[0.25em] text-gold">
            / COMMAND CENTER
          </span>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Mastery Dashboard
          </h1>
          <p className="text-muted-foreground">COD Mobile Arsenal Progress</p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div
            className={cn(
              "hud-corner relative flex flex-col items-center justify-center rounded-2xl border border-border/70 glass p-8 transition-shadow",
              totalView === "diamond" ? "glow-diamond-sm" : "glow-gold-sm"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tracking-widest text-muted-foreground">
                TOTAL COMPLETION
              </span>
              <Select value={totalView} onValueChange={(v) => setTotalView(v as "gold" | "diamond")}>
                <SelectTrigger
                  size="sm"
                  className={cn(
                    "h-7 gap-1.5 rounded-full border px-3 font-mono text-xs font-semibold uppercase tracking-widest glow-gold-sm",
                    totalView === "diamond"
                      ? "border-diamond/40 bg-diamond/10 text-diamond glow-diamond-sm"
                      : "border-gold/40 bg-gold/10 text-gold"
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-28 border-border/70 bg-popover">
                  <SelectItem value="gold" className="font-mono text-xs uppercase tracking-widest text-gold data-highlighted:bg-gold/10">
                    Gold
                  </SelectItem>
                  <SelectItem value="diamond" className="font-mono text-xs uppercase tracking-widest text-diamond data-highlighted:bg-diamond/10">
                    Diamond
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4">
              <CircularProgress
                value={
                  totalView === "gold"
                    ? Math.round((stats.goldCount / stats.weaponsTotal) * 100)
                    : Math.round((stats.diamondCount / stats.weaponsTotal) * 100)
                }
                size={200}
                label="Arsenal"
                tone={totalView}
                sublabel={
                  totalView === "gold"
                    ? `${stats.goldCount}/${stats.weaponsTotal} weapons gold`
                    : `${stats.diamondCount}/${stats.weaponsTotal} weapons diamond`
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:col-span-2">
            {tierCards.map((t) => {
              const Icon = t.icon
              const pct = Math.round((t.value / t.total) * 100)
              return (
                <Link
                  key={t.label}
                  href={t.href}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 glass p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/30"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex size-11 items-center justify-center rounded-xl border ${t.ring}`}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {pct}%
                    </span>
                  </div>
                  <div className="mt-6">
                    <div className="text-sm text-muted-foreground">{t.label}</div>
                    <div className="mt-1 font-mono text-3xl font-semibold tabular-nums">
                      {t.value}
                      <span className="text-lg text-muted-foreground">/{t.total}</span>
                    </div>
                    <div className="mt-3">
                      <GoldBar value={pct} tone={t.tone} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Seasonal + DMZ (equal size, stacked) beside a tall Recommended Grind */}
        <div className="mt-4 flex flex-col gap-4 lg:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {/* Seasonal Camo Progress */}
            <div className="relative overflow-hidden rounded-2xl border border-border/70 glass p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="size-4 text-gold" />
                  <h2 className="text-lg font-medium">Seasonal Camo Progress</h2>
                </div>
                <Link
                  href="/seasonal"
                  className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-xs text-gold hover:bg-gold/20"
                >
                  View All
                </Link>
              </div>
              {starredCamo ? (
                <Link href={`/seasonal/${starredCamo.id}`} className="block">
                  <div className="mt-6 flex items-center gap-4">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border/60">
                      <Image
                        src={starredCamo.texture}
                        alt={starredCamo.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="font-mono text-3xl font-semibold text-gold text-glow-gold">
                            {seasonalPct}%
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {starredCamo.name}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {starredCamo.ownedCount}/{starredCamo.totalEligible} guns
                        </div>
                      </div>
                      <div className="mt-3">
                        <GoldBar value={seasonalPct} className="h-2" />
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                  Star a camo on the{" "}
                  <Link href="/seasonal" className="text-gold hover:underline">
                    Seasonal Vault
                  </Link>{" "}
                  page to track it here.
                </div>
              )}

              <ScrollableRow>
                {allSeasonal.map((c) => {
                  const p = c.totalEligible > 0 ? Math.round((c.ownedCount / c.totalEligible) * 100) : 0
                  return (
                    <Link
                      key={c.id}
                      href={`/seasonal/${c.id}`}
                      className="w-40 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-secondary/30 transition-colors hover:border-gold/40"
                    >
                      <div className="relative h-24 w-full">
                        <Image src={c.texture} alt={c.name} fill className="object-cover" />
                      </div>
                      <div className="p-3">
                        <div className="truncate text-xs font-medium">{c.name}</div>
                        <div className="mt-1 font-mono text-sm text-gold">{p}%</div>
                        <div className="mt-1.5">
                          <GoldBar value={p} className="h-1" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </ScrollableRow>
            </div>

            {/* DMZ Recon Camos — same structure and size as Seasonal above */}
            <div className="relative overflow-hidden rounded-2xl border border-border/70 glass p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radar className="size-4 text-gold" />
                  <h2 className="text-lg font-medium">DMZ Recon Camos</h2>
                </div>
                <Link
                  href="/dmz"
                  className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-xs text-gold hover:bg-gold/20"
                >
                  View All
                </Link>
              </div>
              {dmzHero ? (
                <Link href={`/dmz/${dmzHero.id}`} className="block">
                  <div className="mt-6 flex items-center gap-4">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border/60">
                      <Image src={dmzHero.texture} alt={dmzHero.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="font-mono text-3xl font-semibold text-gold text-glow-gold">
                            {dmzHeroPct}%
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {getDmzDisplayName(dmzHero)}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {dmzHero.ownedCount}/{dmzHero.totalEligible} guns
                        </div>
                      </div>
                      <div className="mt-3">
                        <GoldBar value={dmzHeroPct} className="h-2" />
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                  {`${dmzOwned}/${dmzTotal} weapons unlocked so far. Head to the `}
                  <Link href="/dmz" className="text-gold hover:underline">
                    DMZ Recon
                  </Link>
                  {" page to start tracking."}
                </div>
              )}

              <ScrollableRow>
                {allDmz.map((c) => {
                  const p = c.totalEligible > 0 ? Math.round((c.ownedCount / c.totalEligible) * 100) : 0
                  return (
                    <Link
                      key={c.id}
                      href={`/dmz/${c.id}`}
                      className="w-40 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-secondary/30 transition-colors hover:border-gold/40"
                    >
                      <div className="relative h-24 w-full">
                        <Image src={c.texture} alt={c.name} fill className="object-cover" />
                      </div>
                      <div className="p-3">
                        <div className="truncate text-xs font-medium">{getDmzDisplayName(c)}</div>
                        <div className="mt-1 font-mono text-sm text-gold">{p}%</div>
                        <div className="mt-1.5">
                          <GoldBar value={p} className="h-1" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </ScrollableRow>
            </div>
          </div>

          {/* Recommended Grind — tall block, matches the combined height of the two stacked cards */}
          <div
            className={cn(
              "relative flex h-[780px] flex-col overflow-hidden rounded-2xl border glass p-6 transition-colors duration-300 lg:w-80 lg:shrink-0",
              grindView === "diamond" ? "border-diamond/25 glow-diamond-sm" : "border-gold/25 glow-gold-sm"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {grindView === "diamond" ? (
                  <Gem className="size-4 text-diamond" />
                ) : (
                  <Trophy className="size-4 text-gold" />
                )}
                <h2 className="text-lg font-medium">Recommended Grind</h2>
              </div>
              <Select value={grindView} onValueChange={(v) => setGrindView(v as "gold" | "diamond")}>
                <SelectTrigger
                  size="sm"
                  className={cn(
                    "h-7 gap-1.5 rounded-full border px-3 font-mono text-xs font-semibold uppercase tracking-widest",
                    grindView === "diamond"
                      ? "border-diamond/40 bg-diamond/10 text-diamond glow-diamond-sm"
                      : "border-gold/40 bg-gold/10 text-gold glow-gold-sm"
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-28 border-border/70 bg-popover">
                  <SelectItem value="gold" className="font-mono text-xs uppercase tracking-widest text-gold data-highlighted:bg-gold/10">
                    Gold
                  </SelectItem>
                  <SelectItem value="diamond" className="font-mono text-xs uppercase tracking-widest text-diamond data-highlighted:bg-diamond/10">
                    Diamond
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {grindView === "diamond" ? "Closest weapons to Diamond" : "Closest weapons to Gold"}
            </p>
            <div
              className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {grindView === "diamond" ? (
                <>
                  {grinds.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Every weapon is already Diamond — nothing left to grind here.
                    </p>
                  )}
                  {grinds.map((w) => (
                    <Link
                      key={w.id}
                      href={`/weapons/${w.id}`}
                      className="group flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3 transition-colors hover:border-diamond/40 hover:bg-secondary/60"
                    >
                      <div className="relative h-10 w-16 shrink-0">
                        <Image src={w.image} alt={w.name} fill className="object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="truncate text-sm font-medium">{w.name}</span>
                          <span className="font-mono text-xs text-diamond">{w.diamondPct}%</span>
                        </div>
                        <GoldBar value={w.diamondPct} tone="diamond" className="mt-1.5" />
                        <span className="mt-1.5 block text-[11px] text-muted-foreground">
                          {grindRemainingLabel(w.diamondReq, w.diamondRemaining)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </>
              ) : (
                <>
                  {goldGrinds.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Every weapon is already Gold — nothing left to grind here.
                    </p>
                  )}
                  {goldGrinds.map((w) => (
                    <Link
                      key={w.id}
                      href={`/weapons/${w.id}`}
                      className="group flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3 transition-colors hover:border-gold/40 hover:bg-secondary/60"
                    >
                      <div className="relative h-10 w-16 shrink-0">
                        <Image src={w.image} alt={w.name} fill className="object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="truncate text-sm font-medium">{w.name}</span>
                          <span className="font-mono text-xs text-gold">{w.goldPct}%</span>
                        </div>
                        <GoldBar value={w.goldPct} tone="gold" className="mt-1.5" />
                        <span className="mt-1.5 block text-[11px] text-muted-foreground">
                          {w.goldCount}/{BASIC_CAMO_TOTAL} camos
                        </span>
                      </div>
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Weapon Categories</h2>
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/weapons" />}
              className="text-muted-foreground hover:text-foreground"
            >
              View all
              <ArrowRight className="size-4" />
            </Button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => {
              const cp = categoryProgress(weapons, c)
              return (
                <Link
                  key={c}
                  href={`/weapons?category=${encodeURIComponent(c)}`}
                  className="group relative overflow-hidden rounded-2xl border border-border/70 glass p-5 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:glow-gold-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-medium">{c}</div>
                      <div className="text-xs text-muted-foreground">
                        {cp.total} weapons · {cp.gold} gold
                      </div>
                    </div>
                    <span className="font-mono text-2xl font-semibold text-gold">
                      {cp.completion}%
                    </span>
                  </div>
                  <div className="relative mt-4 h-16">
                    <Image
                      src={
                        weapons.find((w) => w.id === CATEGORY_SHOWCASE_WEAPON[c])?.image ??
                        cp.weapons[0]?.image ??
                        "/weapon-ar.png"
                      }
                      alt={c}
                      fill
                      className="object-contain opacity-90 transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}

function ScrollableRow({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const CARD_WIDTH = 172 // w-40 (160px) card + gap-3 (12px)

  function handleScroll() {
    if (scrollRef.current) setShowLeft(scrollRef.current.scrollLeft > 10)
  }

  function scrollByCards(direction: 1 | -1) {
    scrollRef.current?.scrollBy({ left: direction * CARD_WIDTH * 3, behavior: "smooth" })
  }

  return (
    <div className="relative mt-6">
      {showLeft && (
        <button
          type="button"
          onClick={() => scrollByCards(-1)}
          className="absolute left-1 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/50 text-foreground backdrop-blur-md transition-colors hover:bg-background/80"
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-4" />
        </button>
      )}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => scrollByCards(1)}
        className="absolute right-1 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/50 text-foreground backdrop-blur-md transition-colors hover:bg-background/80"
        aria-label="Scroll right"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}

function grindRemainingLabel(req: DiamondRequirement, remaining: number) {
  if (req.type === "kills") return `~${remaining} kills left`
  if (req.type === "objective") return `~${remaining} UAVs left to destroy`
  return `~${remaining} matches left`
}
