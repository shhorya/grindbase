"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { WeaponCard } from "@/components/weapon-card"
import { DiamondProgressCard } from "@/components/diamond-progress-card"
import { Input } from "@/components/ui/input"
import { GoldBar } from "@/components/gold-bar"
import { categories, tierMeta, getDiamondRequirementLabel } from "@/lib/data"
import { DIAMOND_REQUIREMENTS } from "@/lib/constants"
import { useCamoData, type CompleteWeapon } from "@/lib/use-camo-data"
import type { WeaponCategory } from "@/lib/types"
import { cn } from "@/lib/utils"

type StatusFilter = "all" | "owned" | "unowned"

const statusFilters: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "owned", label: "Owned" },
  { id: "unowned", label: "Unowned" },
]

export function WeaponsExplorer({
  initialCategory,
  initialStatus,
  initialTier,
}: {
  initialCategory?: string
  initialStatus?: string
  initialTier?: string
}) {
  const { weapons, updateWeapon } = useCamoData()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<WeaponCategory | "all">(
    (categories.includes(initialCategory as WeaponCategory)
      ? (initialCategory as WeaponCategory)
      : "all") as WeaponCategory | "all",
  )
  const allValidStatuses: StatusFilter[] = ["all", "owned", "unowned"]
  const [status, setStatus] = useState<StatusFilter>(
    allValidStatuses.includes(initialStatus as StatusFilter)
      ? (initialStatus as StatusFilter)
      : initialTier
        ? "owned"
        : "all"
  )

  const effectiveTier: "gold" | "platinum" | "diamond" =
    initialTier === "diamond" ? "diamond" : initialTier === "platinum" ? "platinum" : "gold"

  const tierBanner =
    initialTier === "gold"
      ? tierMeta.Gold
      : initialTier === "platinum"
        ? tierMeta.Platinum
        : initialTier === "damascus"
          ? tierMeta.Damascus
          : initialTier === "diamond"
            ? tierMeta.Diamond
            : null

  const tierOwnedCount =
    initialTier === "diamond"
      ? weapons.filter((w) => w.diamond).length
      : initialTier === "platinum"
        ? weapons.filter((w) => w.platinum).length
        : weapons.filter((w) => w.gold).length

  const tierPct = weapons.length > 0 ? Math.round((tierOwnedCount / weapons.length) * 100) : 0

  function isUnlockedForTier(w: CompleteWeapon) {
    if (effectiveTier === "diamond") return w.diamond
    if (effectiveTier === "platinum") return w.platinum
    return w.gold
  }

  function handleToggleField(
    weaponId: string,
    field: "gold" | "platinum" | "diamond"
  ) {
    const weapon = weapons.find((w) => w.id === weaponId)
    if (!weapon) return

    const next = !weapon[field]

    if (field === "platinum") {
      // Per-weapon now — no longer cascades to the rest of the category.
      // Turning it on also gilds this weapon (Platinum requires Gold);
      // turning it off only affects this weapon.
      updateWeapon(weaponId, next ? { gold: true, platinum: true, completion: 100 } : { platinum: false })
      return
    }

    const patch: Partial<CompleteWeapon> = { [field]: next } as Partial<CompleteWeapon>

    if (field === "gold") {
      patch.completion = next ? 100 : 0

      if (next) {
        const categoryWeapons = weapons.filter((w) => w.category === weapon.category)
        const categoryHasPlatinum = categoryWeapons.some((w) => w.platinum)

        if (categoryHasPlatinum) {
          // Category already earned Platinum before this weapon existed
          // (or before you golded it) — catch it up automatically.
          patch.platinum = true
        } else {
          // Does golding this weapon complete the category for the first
          // time? If so, grant Platinum to everyone in it right now.
          const allOthersGold = categoryWeapons
            .filter((w) => w.id !== weaponId)
            .every((w) => w.gold)
          if (allOthersGold) {
            patch.platinum = true
            categoryWeapons
              .filter((w) => w.id !== weaponId)
              .forEach((w) => updateWeapon(w.id, { platinum: true }))
          }
        }
      }

      if (!next) {
        // Un-golding this weapon only clears its own Platinum/Diamond.
        // Other weapons in the category, and the category's Platinum
        // badge, are untouched.
        patch.platinum = false
        patch.diamond = false
      }
    }
    if (field === "diamond") {
      if (next) {
        patch.gold = true
        patch.completion = 100
        patch.diamondProgress = DIAMOND_REQUIREMENTS[weapon.category].target
      } else {
        patch.diamondProgress = 0
      }
    }

    updateWeapon(weaponId, patch)
  }

  function handleProgressChange(weaponId: string, value: number) {
    const weapon = weapons.find((w) => w.id === weaponId)
    if (!weapon) return
    const req = weapon.category
    updateWeapon(weaponId, { diamondProgress: Math.max(0, value) })

    // Auto-unlock diamond when target reached
    import("@/lib/constants").then(({ getDiamondRequirement }) => {
      const target = getDiamondRequirement(weapon).target
      if (value >= target && !weapon.diamond) {
        handleToggleField(weaponId, "diamond")
      }
    })
  }

  const results = useMemo(() => {
    let list = weapons.filter((w) =>
      w.name.toLowerCase().includes(query.trim().toLowerCase()),
    )
    if (category !== "all") list = list.filter((w) => w.category === category)

    switch (status) {
      case "owned":
        list = list.filter((w) => isUnlockedForTier(w))
        break
      case "unowned":
        list = list.filter((w) => !isUnlockedForTier(w))
        break
    }
    return list
  }, [weapons, query, category, status, effectiveTier])

  const hasFilters = category !== "all" || status !== "all" || query.length > 0

  const showDiamondProgress = effectiveTier === "diamond" && status === "unowned"

  return (
    <div>
      {tierBanner && (
        <div
          className={cn(
            "hud-corner mb-5 flex items-center gap-6 rounded-2xl border border-border/70 glass-strong p-6",
            initialTier === "platinum"
              ? "glow-platinum-sm"
              : initialTier === "diamond"
                ? "glow-diamond-sm"
                : initialTier === "damascus"
                  ? "glow-damascus-sm"
                  : "glow-gold-sm"
          )}
        >
          <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border/60">
            <Image
              src={tierBanner.texture}
              alt={tierBanner.label}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className={cn("text-3xl font-bold tracking-tight sm:text-4xl", tierBanner.glow)}>
                {tierBanner.label}
              </h2>
              <div className="shrink-0 text-right">
                <div
                  className={cn(
                    "font-mono text-2xl font-semibold",
                    initialTier === "platinum"
                      ? "text-platinum"
                      : initialTier === "diamond"
                        ? "text-diamond"
                        : initialTier === "damascus"
                          ? "bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 bg-clip-text text-transparent"
                          : "text-gold"
                  )}
                >
                  {tierPct}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {tierOwnedCount}/{weapons.length} weapons
                </p>
              </div>
            </div>
            <div className="mt-3">
              <GoldBar
                value={tierPct}
                tone={
                  initialTier === "platinum"
                    ? "platinum"
                    : initialTier === "diamond"
                      ? "diamond"
                      : initialTier === "damascus"
                        ? "damascus"
                        : "gold"
                }
                className="h-2"
              />
            </div>
            {initialTier === "diamond" && (
              <p className="mt-2 text-xs text-muted-foreground">
                {category === "all"
                  ? "Select a category to see its exact Diamond requirement"
                  : `Requirement: ${getDiamondRequirementLabel(category)}`}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search weapons by name…"
          className="h-14 rounded-2xl border-border/70 bg-card/60 pl-12 text-base backdrop-blur-xl focus-visible:border-gold/50 focus-visible:ring-gold/20"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

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
            <Chip
              key={c}
              active={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 hidden text-xs tracking-widest text-muted-foreground uppercase sm:inline">
            Status
          </span>
          {statusFilters.map((s) => (
            <Chip
              key={s.id}
              active={status === s.id}
              onClick={() => setStatus(s.id)}
            >
              {s.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          <span className="font-mono font-semibold text-foreground">
            {results.length}
          </span>{" "}
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

      {results.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {results.map((w) =>
            showDiamondProgress ? (
              <DiamondProgressCard key={w.id} weapon={w} onProgressChange={handleProgressChange} />
            ) : (
              <WeaponCard
                key={w.id}
                weapon={w}
                onToggleField={handleToggleField}
                locked={status === "all" && !isUnlockedForTier(w)}
              />
            )
          )}
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 py-16 text-center">
          <Search className="size-6 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No weapons match your filters.
          </p>
        </div>
      )}
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
          : "border-border/70 bg-secondary/30 text-muted-foreground hover:border-border hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}