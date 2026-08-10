"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  Award,
  Crosshair,
  Gem,
  Radar,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CircularProgress } from "@/components/circular-progress"
import { GoldBar } from "@/components/gold-bar"
import { GoogleSignIn } from "@/components/google-sign-in"
import { useCamoData } from "@/lib/use-camo-data"
import { createClient } from "@/lib/supabase/client"
import { categories } from "@/lib/data"
import { getPlatinumCount } from "@/lib/calculations"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: Target,
    title: "Every Weapon Tracked",
    desc: "Live completion across all weapon classes, from base camos to full mastery.",
  },
  {
    icon: Trophy,
    title: "Completionist Tiers",
    desc: "Follow Gold, Platinum, Damascus and Diamond progress on a single glass HUD.",
  },
  {
    icon: TrendingUp,
    title: "Smart Grind Routing",
    desc: "Get the exact next weapon to grind and the matches left to finish it.",
  },
  {
    icon: Gem,
    title: "Seasonal Camos",
    desc: "Never miss a limited camo — track every seasonal challenge before it expires.",
  },
  {
    icon: Radar,
    title: "DMZ Recon Camos",
    desc: "Track Season 1: Flux and Season 2: Constellation's End, gun by gun.",
  },
]

export default function LandingPage() {
  const { weapons, stats } = useCamoData()
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(!!data.user)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const platinumCategoryCount = getPlatinumCount(weapons, categories)

  // Weapons that actually got a recorded Gold-unlock timestamp, newest
  // first. Weapons that were already Gold before this feature existed
  // won't have one, so they simply won't show up here.
  const recentlyUnlocked = weapons
    .filter((w): w is typeof w & { goldUnlockedAt: number } => Boolean(w.goldUnlockedAt))
    .sort((a, b) => b.goldUnlockedAt - a.goldUnlockedAt)
    .slice(0, 3)

  function timeAgo(ts: number) {
    const mins = Math.floor((Date.now() - ts) / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="min-h-screen bg-hud-grid">
      {/* Marketing nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 glass-strong">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-8 items-center justify-center overflow-hidden rounded-md border border-gold/40 bg-gold/10 glow-gold-sm">
              <Image src="/logo.png" alt="GrindBase" fill className="object-contain p-1" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight">GRINDBASE</span>
              <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">
                CAMO TRACKER
              </span>
            </span>
          </div>

          {loggedIn ? (
            <nav className="flex items-center gap-1 rounded-full border border-border/70 bg-secondary/40 p-1 backdrop-blur-md">
              <Link
                href="/dashboard"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-4"
              >
                Dashboard
              </Link>
              <Link
                href="/weapons"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-4"
              >
                Arsenal
              </Link>
              <Link
                href="/profile"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-4"
              >
                Operator
              </Link>
            </nav>
          ) : (
            <GoogleSignIn label="Sign In" />
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/hero-bg.png"
            alt=""
            fill
            priority
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-start gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
              <Zap className="size-3.5" />
              SEASON 7 · TERMINATED
            </div>
            <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Unlock every{" "}
              <span className="text-gold text-glow-gold">camo</span>. Track every
              grind.
            </h1>
            <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
              Soldier, every camo tells a story. Track your progress, plan your
              next grind, and complete your arsenal one weapon at a time with{" "}
              <strong className="font-semibold text-foreground">GrindBase</strong>.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/dashboard" />}
                className="h-12 bg-gold px-6 text-base text-primary-foreground hover:bg-gold-bright glow-gold"
              >
                Open Dashboard
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="/weapons" />}
                className="h-12 border-border/80 bg-secondary/30 px-6 text-base backdrop-blur-md hover:bg-secondary/60"
              >
                Browse Arsenal
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-8">
              <Stat value={`${stats.goldCount}/${weapons.length}`} label="Gold" />
              <div className="h-8 w-px bg-border" />
              <Stat value={`${platinumCategoryCount}/${categories.length}`} label="Platinum" />
              <div className="h-8 w-px bg-border" />
              <Stat value={`${stats.diamondCount}/${weapons.length}`} label="Diamond" />
            </div>
          </div>

          {/* Hero HUD card */}
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="hud-corner relative rounded-2xl border border-border/70 glass p-6 glow-gold-sm sm:p-8">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs tracking-widest text-muted-foreground">
                  RECENTLY COMPLETED GRIND
                </span>
                <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold">
                  GRINDBASE
                </span>
              </div>
              <div className="mt-4 flex flex-col items-center">
                <CircularProgress value={stats.totalCompletion} label="Arsenal" />
              </div>
              <div className="mt-6 space-y-4">
                {recentlyUnlocked.length > 0 ? (
                  recentlyUnlocked.map((w) => (
                    <div key={w.id} className="flex items-center gap-3">
                      <div className="relative h-9 w-16 shrink-0 rounded-md bg-secondary/60">
                        <Image
                          src={w.image}
                          alt={w.name}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate font-medium">{w.name}</span>
                          <span className="font-mono text-xs text-gold">Gold</span>
                        </div>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          Unlocked {timeAgo(w.goldUnlockedAt)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground">
                    No recent unlocks yet — Gold a weapon to see it here.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <span className="font-mono text-xs tracking-[0.25em] text-gold">
            / TACTICAL ADVANTAGE
          </span>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for completionists who want it all
          </h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border/70 glass p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:glow-gold-sm"
              >
                <span className="flex size-11 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold transition-transform duration-300 group-hover:scale-110">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-medium">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="hud-corner relative overflow-hidden rounded-3xl border border-border/70 glass-strong p-2">
          <div className="rounded-2xl border border-border/60 bg-background/60 p-6 sm:p-10">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <span className="font-mono text-xs tracking-[0.25em] text-gold">
                  / COMMAND CENTER
                </span>
                <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight">
                  Nothing left untracked.
                </h2>
              </div>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/dashboard" />}
                className="border-border/80 bg-secondary/30 backdrop-blur-md hover:bg-secondary/60"
              >
                Open Dashboard
                <ArrowRight className="size-4" />
              </Button>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="flex h-full items-center justify-center rounded-2xl border border-border/60 bg-card/60 p-6">
                <CircularProgress
                  value={stats.totalCompletion}
                  size={150}
                  label="Total"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                {[
                  { label: "Gold", value: stats.goldCount, total: weapons.length, tone: "gold" as const, text: "text-gold" },
                  { label: "Platinum", value: platinumCategoryCount, total: categories.length, tone: "platinum" as const, text: "text-platinum" },
                  { label: "Diamond", value: stats.diamondCount, total: weapons.length, tone: "diamond" as const, text: "text-diamond" },
                  {
                    label: "Damascus",
                    value: stats.damascusUnlocked ? weapons.length : 0,
                    total: weapons.length,
                    tone: "damascus" as const,
                    text: "bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 bg-clip-text text-transparent",
                  },
                ].map((s) => {
                  const pct = s.total > 0 ? Math.round((s.value / s.total) * 100) : 0
                  return (
                    <div
                      key={s.label}
                      className="flex flex-col justify-between rounded-2xl border border-border/60 bg-card/60 p-5"
                    >
                      <span className="text-xs tracking-widest text-muted-foreground uppercase">
                        {s.label}
                      </span>
                      <span className={cn("mt-3 font-mono text-3xl font-semibold", s.text)}>
                        {s.value}
                        <span className="text-lg text-muted-foreground">/{s.total}</span>
                      </span>
                      <GoldBar value={pct} tone={s.tone} className="mt-3" />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <span>GrindBase: Unofficial CODM Camo Tracker.</span>
          <span className="font-mono text-xs tracking-widest">Track. Grind. Unlock.</span>
        </div>
      </footer>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-mono text-2xl font-semibold text-foreground">{value}</div>
      <div className="text-xs tracking-widest text-muted-foreground uppercase">
        {label}
      </div>
    </div>
  )
}