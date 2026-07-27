"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Award, Check, Search, SlidersHorizontal, X } from "lucide-react"
import { HudNav } from "@/components/hud-nav"
import { GoldBar } from "@/components/gold-bar"
import { Input } from "@/components/ui/input"
import { useCamoData } from "@/lib/use-camo-data"
import { categories } from "@/lib/data"
import type { WeaponCategory } from "@/lib/types"
import { cn } from "@/lib/utils"

type StatusFilter = "all" | "owned" | "unowned"

export function DamascusContent() {
  const { weapons, stats, updateWeapon } = useCamoData()
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(weapons.filter((w) => !w.gold).map((w) => w.id))
  )
  const [unlocking, setUnlocking] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<WeaponCategory | "all">("all")
  const [status, setStatus] = useState<StatusFilter>("owned")

  const notGold = weapons.filter((w) => !w.gold)
  const allSelected = selected.size === notGold.length && notGold.length > 0
  const tierPct = weapons.length > 0 ? Math.round((stats.goldCount / weapons.length) * 100) : 0

  useEffect(() => {
    if (!showCelebration) return
    const timer = setTimeout(() => setShowCelebration(false), 5000)
    return () => clearTimeout(timer)
  }, [showCelebration])

  function toggleOne(id: string) {
    const weapon = weapons.find((w) => w.id === id)
    if (weapon?.gold) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(notGold.map((w) => w.id)))
  }

  function handleUnlock() {
    setUnlocking(true)
    notGold.forEach((w) => {
      if (selected.has(w.id)) {
        updateWeapon(w.id, { gold: true, platinum: true, completion: 100 })
      }
    })
    setTimeout(() => {
      setUnlocking(false)
      setShowCelebration(true)
    }, 900)
  }

  const results = useMemo(() => {
    let list = weapons.filter((w) => w.name.toLowerCase().includes(query.trim().toLowerCase()))
    if (category !== "all") list = list.filter((w) => w.category === category)
    if (status === "owned") list = list.filter((w) => w.gold)
    if (status === "unowned") list = list.filter((w) => !w.gold)
    return list
  }, [weapons, query, category, status])

  const hasFilters = category !== "all" || status !== "all" || query.length > 0

  return (
    <div className="min-h-screen bg-hud-grid">
      <HudNav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs tracking-[0.25em] text-gold">
            / DAMASCUS UNLOCK
          </span>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Select weapons to unlock together
          </h1>
          <p className="text-muted-foreground">
            Damascus requires every weapon at Gold. Select the remaining ones
            and unlock them at once.
          </p>
        </div>

        {/* Hero banner */}
        <div className="hud-corner mt-6 flex items-center gap-6 rounded-2xl border border-border/70 glass-strong p-6 glow-damascus-sm">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border/60">
            <Image src="/camo-damascus.png" alt="Damascus" fill className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
                Damascus
              </h2>
              <div className="shrink-0 text-right">
                <div className="bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 bg-clip-text font-mono text-2xl font-semibold text-transparent">
                  {tierPct}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.goldCount}/{weapons.length} weapons
                </p>
              </div>
            </div>
            <div className="mt-3">
              <GoldBar value={tierPct} tone="damascus" className="h-2" />
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-border/70 glass p-4">
          <span className="text-sm text-muted-foreground">
            <span className="font-mono font-semibold text-gold">{selected.size}</span> selected
            for unlock
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAll}
              disabled={notGold.length === 0}
              className="rounded-lg border border-border/70 bg-secondary/30 px-3 py-1.5 text-sm text-muted-foreground hover:border-border hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              {allSelected ? "Deselect All" : "Select All"}
            </button>
            <button
              onClick={handleUnlock}
              disabled={selected.size === 0 || unlocking}
              className="rounded-lg border border-gold/40 bg-gold/15 px-4 py-1.5 text-sm font-medium text-gold hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {unlocking ? "Unlocking…" : `Unlock ${selected.size} Weapons`}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search weapons by name…"
            className="h-14 rounded-2xl border-border/70 bg-card/60 pl-12 text-base backdrop-blur-xl focus-visible:border-gold/50 focus-visible:ring-gold/20"
          />
        </div>

        {/* Filters */}
        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 hidden items-center gap-1.5 text-xs tracking-widest text-muted-foreground uppercase sm:flex">
              <SlidersHorizontal className="size-3.5" />
              Category
            </span>
            <Chip active={category === "all"} onClick={() => setCategory("all")}>
              All
            </Chip>
            {categories.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                {c}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 hidden text-xs tracking-widest text-muted-foreground uppercase sm:inline">
              Status
            </span>
            <Chip active={status === "all"} onClick={() => setStatus("all")}>
              All
            </Chip>
            <Chip active={status === "owned"} onClick={() => setStatus("owned")}>
              Owned
            </Chip>
            <Chip active={status === "unowned"} onClick={() => setStatus("unowned")}>
              Unowned
            </Chip>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">{results.length}</span>{" "}
            weapon{results.length !== 1 && "s"}
          </span>
          {hasFilters && (
            <button
              onClick={() => {
                setQuery("")
                setCategory("all")
                setStatus("all")
              }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-gold"
            >
              <X className="size-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* Grid */}
        {results.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {results.map((w) => {
              const isGold = w.gold
              const isSelected = selected.has(w.id)
              return (
                <div
                  key={w.id}
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-2xl border p-4 transition-all duration-300",
                    isGold
                      ? "border-gold/40 glass glow-gold-sm"
                      : isSelected
                        ? "border-gold/30 glass hover:-translate-y-1 hover:border-gold/50"
                        : "border-border/60 glass opacity-60 hover:opacity-100 hover:-translate-y-1"
                  )}
                >
                  <Link
                    href={`/weapons/${w.id}`}
                    className="absolute inset-0 z-0"
                    aria-label={`View ${w.name} details`}
                  />

                  <div className="pointer-events-none relative z-10 flex items-start justify-between">
                    <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                      {w.category}
                    </span>
                    {isGold ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold">
                        <Check className="size-2.5" />
                        Complete
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          toggleOne(w.id)
                        }}
                        className={cn(
                          "relative z-20 flex size-5 items-center justify-center rounded-full border transition-colors",
                          isSelected
                            ? "border-gold/60 bg-gold text-primary-foreground"
                            : "border-border/70 hover:border-gold/40"
                        )}
                        aria-label="Select for unlock"
                      >
                        {isSelected && <Check className="size-3" />}
                      </button>
                    )}
                  </div>

                  <div className="pointer-events-none relative z-10 my-3 h-28 w-full overflow-hidden rounded-xl border border-border/50 bg-[radial-gradient(circle_at_center,theme(colors.secondary/60%),transparent_70%)]">
                    <div className="absolute inset-0 bg-background/40" />
                    <Image
                      src={w.image}
                      alt={w.name}
                      fill
                      className="relative object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="pointer-events-none relative z-10 mt-auto">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium">{w.name}</h3>
                      <span className="font-mono text-sm font-semibold text-gold">
                        {w.completion}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <GoldBar value={w.completion} tone="gold" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 py-16 text-center">
            <Search className="size-6 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              No weapons match your filters.
            </p>
          </div>
        )}
      </main>

      <AnimatePresence>
        {unlocking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, ease: "linear", repeat: Infinity }}
                className="flex size-24 items-center justify-center rounded-3xl border-2 border-gold bg-gold/10 glow-gold"
              >
                <Award className="size-12 text-gold" />
              </motion.span>
              <span className="mt-6 font-mono text-sm tracking-widest text-gold">
                UNLOCKING GOLD ACROSS ARSENAL
              </span>
            </motion.div>
          </motion.div>
        )}

        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="hud-corner relative flex flex-col items-center rounded-3xl border border-gold/40 glass-strong p-12 glow-gold text-center"
            >
              <button
                onClick={() => setShowCelebration(false)}
                className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full border border-border/70 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex size-24 items-center justify-center rounded-2xl border border-gold/40 bg-gold/10 glow-gold"
              >
                <Award className="size-12 text-gold" />
              </motion.span>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-6 text-4xl font-bold tracking-tight text-gold text-glow-gold"
              >
                {stats.damascusUnlocked ? "Damascus Unlocked!" : "Gold Applied"}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-2 text-sm text-muted-foreground"
              >
                This closes automatically
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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