import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  Diamond,
  Flame,
  Percent,
  ShieldCheck,
  Star,
  Trophy,
} from "lucide-react"
import { HudNav } from "@/components/hud-nav"
import { CircularProgress } from "@/components/circular-progress"
import { GoldBar } from "@/components/gold-bar"
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  categories,
  categoryProgress,
  stats,
  weapons,
} from "@/lib/data"

const favorite = weapons.find((w) => w.id === "ak-47")!

const statList = [
  {
    icon: Percent,
    label: "Total Completion",
    value: `${stats.totalCompletion}%`,
  },
  { icon: Trophy, label: "Gold Camos", value: `${stats.goldCount}` },
  { icon: Diamond, label: "Diamond Classes", value: `${stats.diamondCount}` },
  {
    icon: ShieldCheck,
    label: "Weapons Owned",
    value: `${stats.weaponsOwned}/${stats.weaponsTotal}`,
  },
]

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-hud-grid">
      <HudNav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs tracking-[0.25em] text-gold">
            / OPERATOR
          </span>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Profile
          </h1>
        </div>

        {/* Identity card */}
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="hud-corner relative flex flex-col items-center overflow-hidden rounded-3xl border border-border/70 glass-strong p-8 text-center">
            <div className="relative">
              <Avatar size="lg" className="size-28 glow-gold ring-2 ring-gold/40">
                <AvatarImage src="/avatar.png" alt="Operator avatar" />
                <AvatarFallback>OP</AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-gold/40 bg-background px-2.5 py-0.5 font-mono text-[10px] tracking-widest text-gold">
                LVL 155
              </span>
            </div>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight">
              Ghost_Recon77
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Elite Completionist · Prestige Master
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold">
                <Flame className="size-3.5" />
                42 day streak
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
                <Star className="size-3.5" />
                Top 3%
              </span>
            </div>
          </div>

          {/* Completion ring + stats */}
          <div className="grid gap-4 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border/70 glass p-6">
                <CircularProgress
                  value={stats.totalCompletion}
                  size={150}
                  label="Total"
                />
              </div>
              <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                {statList.map((s) => {
                  const Icon = s.icon
                  return (
                    <div
                      key={s.label}
                      className="flex items-center gap-3 rounded-2xl border border-border/70 glass p-5"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <div className="font-mono text-xl font-semibold">
                          {s.value}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {s.label}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Favorite weapon + class breakdown */}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {/* Favorite weapon */}
          <Link
            href={`/weapons/${favorite.id}`}
            className="group hud-corner relative flex flex-col overflow-hidden rounded-2xl border border-gold/25 glass p-6 glow-gold-sm transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center gap-2">
              <Star className="size-4 text-gold" />
              <h2 className="text-base font-medium">Favorite Weapon</h2>
            </div>
            <div className="relative my-6 h-32 w-full overflow-hidden rounded-xl border border-border/50 bg-[radial-gradient(circle_at_center,theme(colors.secondary/60%),transparent_70%)]">
              <div className="absolute inset-0 bg-background/40" />
              <Image
                src={favorite.image}
                alt={favorite.name}
                fill
                className="relative object-contain p-3 drop-shadow-[0_0_30px_oklch(0.83_0.13_84_/_0.3)] transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="mt-auto">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">{favorite.name}</span>
                <span className="font-mono text-sm text-gold">
                  {favorite.completion}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{favorite.category}</p>
              <GoldBar value={favorite.completion} className="mt-3" />
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-gold">
                View details
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>

          {/* Class breakdown */}
          <div className="rounded-2xl border border-border/70 glass p-6 lg:col-span-2">
            <h2 className="text-base font-medium">Completion by Class</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your camo mastery across every weapon category.
            </p>
            <div className="mt-5 space-y-4">
              {categories.map((c) => {
                const cp = categoryProgress(c)
                return (
                  <div key={c} className="flex items-center gap-4">
                    <span className="w-28 shrink-0 text-sm">{c}</span>
                    <div className="flex-1">
                      <GoldBar value={cp.avg} className="h-2" />
                    </div>
                    <span className="w-10 shrink-0 text-right font-mono text-sm text-gold">
                      {cp.avg}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
