"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Check, Lock, Minus, Plus, Unlock } from "lucide-react"
import { HudNav } from "@/components/hud-nav"
import { GoldBar } from "@/components/gold-bar"
import { DraggableProgressBar } from "@/components/draggable-progress-bar"
import { useCamoData } from "@/lib/use-camo-data"
import { useSeasonalData } from "@/lib/use-seasonal-data"
import { useDmzData } from "@/lib/use-dmz-data"
import { getDmzDisplayName } from "@/lib/dmz-camos"
import { getDiamondRequirement } from "@/lib/constants"
import { cn } from "@/lib/utils"

const AETHER_CAMO_ID = "aether-crystal"
const AETHER_MATCH_TARGET = 6

export function WeaponDetailContent({ weaponId }: { weaponId: string }) {
  const { weapons, updateWeapon } = useCamoData()
  const { camoStats, isOwned, toggle, getMatchProgress, setMatchProgress } = useSeasonalData()
  const { camoStats: dmzCamoStats, isOwned: isDmzOwned, toggle: toggleDmz } = useDmzData()

  const weapon = weapons.find((w) => w.id === weaponId)
  if (!weapon) return null

  if (weapon.noCamos) {
    return (
      <div className="min-h-screen bg-hud-grid">
        <HudNav />
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <Link
            href="/weapons"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Arsenal
          </Link>

          <div className="hud-corner mt-4 flex flex-col gap-6 rounded-3xl border border-border/70 glass-strong p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-[radial-gradient(circle_at_center,theme(colors.secondary/60%),transparent_70%)] sm:h-44 sm:w-64">
              <div className="absolute inset-0 bg-background/40" />
              <Image src={weapon.image} alt={weapon.name} fill className="relative object-contain p-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-mono text-xs tracking-[0.25em] text-muted-foreground">
                {weapon.category.toUpperCase()}
              </span>
              <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">{weapon.name}</h1>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-border/60 p-10 text-center">
            <p className="text-lg font-medium text-muted-foreground">This weapon has no grindable camos.</p>
            <p className="mt-2 text-sm text-muted-foreground/70">
              {weapon.name} doesn't have a camo system in-game, so there's nothing to track here.
            </p>
          </div>
        </main>
      </div>
    )
  }

  const req = getDiamondRequirement(weapon)
  const diamondCurrent = Math.min(weapon.diamondProgress ?? 0, req.target)
  const diamondPct = req.target > 0 ? Math.round((diamondCurrent / req.target) * 100) : 0

  const eligibleCamos = camoStats.filter((c) => c.eligibleWeapons.some((w) => w.id === weapon.id))
  const ownedCamos = eligibleCamos.filter((c) => isOwned(weapon.id, c.id))

  const eligibleDmzCamos = dmzCamoStats.filter((c) => c.eligibleWeapons.some((w) => w.id === weapon.id))
  const ownedDmzCamos = eligibleDmzCamos.filter((c) => isDmzOwned(weapon.id, c.id))

  const damascusUnlocked = weapons.every((w) => w.gold)

  function toggleField(field: "gold" | "platinum" | "diamond") {
    const current = weapon!
    const next = !current[field]

    if (field === "platinum") {
      const categoryWeapons = weapons.filter((w) => w.category === current.category)
      categoryWeapons.forEach((w) => {
        updateWeapon(w.id, next ? { gold: true, platinum: true, completion: 100 } : { platinum: false })
      })
      return
    }

    const patch: Record<string, unknown> = { [field]: next }

    if (field === "gold") {
      patch.completion = next ? 100 : 0

      if (next) {
        const categoryWeapons = weapons.filter((w) => w.category === current.category)
        const categoryHasPlatinum = categoryWeapons.some((w) => w.platinum)

        if (categoryHasPlatinum) {
          // Category already earned Platinum before this weapon existed
          // (or before you golded it) — catch it up automatically.
          patch.platinum = true
        } else {
          // Does golding this weapon complete the category for the first
          // time? If so, grant Platinum to everyone in it right now.
          const allOthersGold = categoryWeapons
            .filter((w) => w.id !== current.id)
            .every((w) => w.gold)
          if (allOthersGold) {
            patch.platinum = true
            categoryWeapons
              .filter((w) => w.id !== current.id)
              .forEach((w) => updateWeapon(w.id, { platinum: true }))
          }
        }
      }

      if (!next) {
        patch.platinum = false
        const categoryHadPlatinum = weapons.some((w) => w.category === current.category && w.platinum)
        if (categoryHadPlatinum) {
          weapons
            .filter((w) => w.category === current.category && w.id !== current.id)
            .forEach((w) => updateWeapon(w.id, { platinum: false }))
        }
      }
    }
    if (field === "diamond") {
      if (next) {
        patch.gold = true
        patch.completion = 100
        patch.diamondProgress = req.target
      } else {
        patch.diamondProgress = 0
      }
    }
    updateWeapon(current.id, patch)
  }

  function setDiamondProgress(value: number) {
    const clamped = Math.max(0, Math.min(value, req.target))
    const patch: Record<string, unknown> = { diamondProgress: clamped }

    // Logging any Diamond progress at all means you're already grinding
    // matches on this weapon — which means it must already be Gold.
    if (clamped >= 1 && !weapon!.gold) {
      patch.gold = true
      patch.completion = 100
    }

    if (clamped >= req.target && !weapon!.diamond) {
      patch.diamond = true
    } else if (clamped < req.target && weapon!.diamond) {
      patch.diamond = false
    }

    updateWeapon(weapon!.id, patch)
  }

  return (
    <div className="min-h-screen bg-hud-grid">
      <HudNav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link
          href="/weapons"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Arsenal
        </Link>

        {/* Hero */}
        <div className="hud-corner mt-4 flex flex-col gap-6 rounded-3xl border border-border/70 glass-strong p-6 glow-gold-sm sm:flex-row sm:items-center sm:p-8">
          <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-[radial-gradient(circle_at_center,theme(colors.secondary/60%),transparent_70%)] sm:h-44 sm:w-64">
            <div className="absolute inset-0 bg-background/40" />
            <Image src={weapon.image} alt={weapon.name} fill className="relative object-contain p-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-mono text-xs tracking-[0.25em] text-gold">
              {weapon.category.toUpperCase()}
            </span>
            <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">{weapon.name}</h1>
            <div className="mt-3 flex items-center gap-3">
              <span className="font-mono text-2xl font-semibold text-gold">{weapon.completion}%</span>
              <span className="text-sm text-muted-foreground">overall completion</span>
            </div>
            <div className="mt-3">
              <GoldBar value={weapon.completion} />
            </div>
          </div>
        </div>

        {/* Tier toggles */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <TierToggle label="Gold" tone="gold" active={weapon.gold} onClick={() => toggleField("gold")} />
          <TierToggle
            label="Platinum"
            tone="platinum"
            active={weapon.platinum}
            onClick={() => toggleField("platinum")}
            hint="Whole category"
          />
          <TierToggle
            label="Diamond"
            tone="diamond"
            active={weapon.diamond}
            onClick={() => toggleField("diamond")}
          />
          <Link
            href="/damascus"
            className={cn(
              "group flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all",
              damascusUnlocked
                ? "border-purple-400/50 bg-gradient-to-br from-red-500/10 to-blue-500/10 glow-damascus-sm"
                : "border-border/70 bg-secondary/20 hover:border-border"
            )}
          >
            <span className="relative flex size-8 items-center justify-center">
              {damascusUnlocked ? (
                <Unlock className="size-5 text-purple-300 transition-transform duration-300 ease-out group-hover:scale-125" />
              ) : (
                <>
                  <Lock className="size-5 text-muted-foreground transition-all duration-300 ease-out group-hover:scale-125 group-hover:opacity-0" />
                  <Unlock className="absolute size-5 text-foreground opacity-0 transition-all duration-300 ease-out group-hover:scale-125 group-hover:opacity-100" />
                </>
              )}
            </span>
            <span
              className={cn(
                "text-lg font-semibold",
                damascusUnlocked
                  ? "bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 bg-clip-text text-transparent"
                  : "text-foreground"
              )}
            >
              Damascus
            </span>
            <span className="text-xs text-muted-foreground">
              {damascusUnlocked ? "Unlocked" : "View progress"}
            </span>
          </Link>
        </div>

        {/* Diamond progress */}
        <div className="mt-6 rounded-2xl border border-diamond/25 glass p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-diamond">Diamond Progress</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {req.type === "objective"
                  ? `Destroy ${req.target} ${req.unitLabel}`
                  : `${req.target} ${req.unitLabel} required`}
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl font-semibold text-diamond">
                {diamondCurrent}/{req.target}
              </div>
              <div className="text-xs text-muted-foreground">{diamondPct}%</div>
            </div>
          </div>

          <div className="mt-4">
            <DraggableProgressBar
              value={diamondCurrent}
              max={req.target}
              onChange={setDiamondProgress}
              tone="diamond"
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => setDiamondProgress(diamondCurrent - 1)}
              className="flex size-8 items-center justify-center rounded-lg border border-border/70 bg-secondary/30 text-muted-foreground hover:border-border hover:text-foreground"
            >
              <Minus className="size-4" />
            </button>
            <input
              type="number"
              value={diamondCurrent}
              onChange={(e) => setDiamondProgress(Number(e.target.value) || 0)}
              className="h-8 w-20 rounded-lg border border-border/70 bg-secondary/30 text-center text-sm outline-none focus-visible:border-diamond/50"
            />
            <button
              onClick={() => setDiamondProgress(diamondCurrent + 1)}
              className="flex size-8 items-center justify-center rounded-lg border border-border/70 bg-secondary/30 text-muted-foreground hover:border-border hover:text-foreground"
            >
              <Plus className="size-4" />
            </button>
            <button
              onClick={() => setDiamondProgress(diamondCurrent + 10)}
              className="ml-auto rounded-lg border border-border/70 bg-secondary/30 px-3 py-1.5 text-sm text-muted-foreground hover:border-border hover:text-foreground"
            >
              +10
            </button>
          </div>
        </div>

        {/* Seasonal camos */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Seasonal Camos</h2>
              <p className="text-sm text-muted-foreground">
                {ownedCamos.length}/{eligibleCamos.length} unlocked for this weapon
              </p>
            </div>
          </div>

          {eligibleCamos.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {eligibleCamos.map((camo) => {
                const owned = isOwned(weapon.id, camo.id)
                const isAether = camo.id === AETHER_CAMO_ID

                if (isAether) {
  const aetherStats = camoStats.find((c) => c.id === AETHER_CAMO_ID)
  const matchTarget = aetherStats?.matchesTarget ?? AETHER_MATCH_TARGET
  const currentRaw = getMatchProgress(weapon!.id, AETHER_CAMO_ID)
  const current = Math.min(Math.max(0, currentRaw), matchTarget)
  const w = weapon!

  function changeMatch(delta: number) {
    const next = Math.min(Math.max(0, current + delta), matchTarget)
    setMatchProgress(w.id, AETHER_CAMO_ID, next)
    if (next >= matchTarget && !owned) toggle(w.id, AETHER_CAMO_ID)
    if (next < matchTarget && owned) toggle(w.id, AETHER_CAMO_ID)
  }

  function handleUnlockToggle() {
    if (owned) {
      setMatchProgress(w.id, AETHER_CAMO_ID, 0)
      toggle(w.id, AETHER_CAMO_ID)
    } else {
      setMatchProgress(w.id, AETHER_CAMO_ID, matchTarget)
      toggle(w.id, AETHER_CAMO_ID)
    }
  }

  return (
    <div
      key={camo.id}
      className={cn(
        "group relative overflow-hidden rounded-xl border p-3 text-left transition-all",
        owned
          ? "border-gold/50 bg-gold/5 hover:border-gold/70"
          : "border-border/60 bg-secondary/20 opacity-70 hover:opacity-100"
      )}
    >
      <div className="relative h-16 w-full overflow-hidden rounded-lg">
        <Image src={camo.texture} alt={camo.name} fill className="object-cover" />

        {!owned && <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px]" />}

        {owned && (
          <span className="absolute left-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-gold text-primary-foreground">
            <Check className="size-3" />
          </span>
        )}

        {/* count pill — top-right, opposite corner from the name below */}
        <div className="absolute right-1.5 top-1.5">
          <span className="rounded-full bg-background/70 px-2 py-0.5 font-mono text-[10px] font-semibold text-gold backdrop-blur-sm">
            {current}/{matchTarget}
          </span>
        </div>

        {/* minus / lock / plus, flanking the lock in the middle of the thumbnail */}
        <div className="absolute inset-0 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => changeMatch(-1)}
            className="flex size-4 items-center justify-center rounded-full bg-background/80 text-foreground opacity-45 transition-all duration-200 hover:scale-110 hover:opacity-100 hover:text-gold"
            aria-label="Decrease match count"
          >
            <Minus className="size-2.5" />
          </button>

          <button
            type="button"
            onClick={handleUnlockToggle}
            aria-label={owned ? "Lock Aether Crystal" : "Unlock Aether Crystal"}
            className="transition-transform duration-200 hover:scale-110"
          >
            {owned ? (
              <Unlock className="size-4 text-foreground" />
            ) : (
              <Lock className="size-4 text-muted-foreground" />
            )}
          </button>

          <button
            type="button"
            onClick={() => changeMatch(1)}
            className="flex size-4 items-center justify-center rounded-full bg-background/80 text-foreground opacity-45 transition-all duration-200 hover:scale-110 hover:opacity-100 hover:text-gold"
            aria-label="Increase match count"
          >
            <Plus className="size-2.5" />
          </button>
        </div>
      </div>

      <span className="mt-2 block truncate text-xs font-medium">{camo.name}</span>
    </div>
  )
}

                return (
                  <button
                    key={camo.id}
                    type="button"
                    onClick={() => toggle(weapon.id, camo.id)}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border p-3 text-left transition-all",
                      owned
                        ? "border-gold/50 bg-gold/5 hover:border-gold/70"
                        : "border-border/60 bg-secondary/20 opacity-70 hover:opacity-100"
                    )}
                  >
                    <div className="relative h-16 w-full overflow-hidden rounded-lg">
                      <Image src={camo.texture} alt={camo.name} fill className="object-cover" />
                      {!owned && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                          <Lock className="size-4 text-muted-foreground transition-all duration-300 ease-out group-hover:scale-125 group-hover:opacity-0" />
                          <Unlock className="absolute size-4 text-foreground opacity-0 transition-all duration-300 ease-out group-hover:scale-125 group-hover:opacity-100" />
                        </div>
                      )}
                      {owned && (
                        <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-gold text-primary-foreground">
                          <Check className="size-3" />
                        </span>
                      )}
                    </div>
                    <span className="mt-2 block truncate text-xs font-medium">{camo.name}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
              This weapon isn't eligible for any seasonal camos yet.
            </div>
          )}
        </div>

        {/* DMZ Recon camos */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">DMZ Recon Camos</h2>
              <p className="text-sm text-muted-foreground">
                {ownedDmzCamos.length}/{eligibleDmzCamos.length} unlocked for this weapon
              </p>
            </div>
          </div>

          {eligibleDmzCamos.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {eligibleDmzCamos.map((camo) => {
                const owned = isDmzOwned(weapon.id, camo.id)
                return (
                  <button
                    key={camo.id}
                    type="button"
                    onClick={() => toggleDmz(weapon.id, camo.id)}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border p-3 text-left transition-all",
                      owned
                        ? "border-gold/50 bg-gold/5 hover:border-gold/70"
                        : "border-border/60 bg-secondary/20 opacity-70 hover:opacity-100"
                    )}
                  >
                    <div className="relative h-16 w-full overflow-hidden rounded-lg">
                      <Image src={camo.texture} alt={camo.name} fill className="object-cover" />
                      {!owned && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                          <Lock className="size-4 text-muted-foreground transition-all duration-300 ease-out group-hover:scale-125 group-hover:opacity-0" />
                          <Unlock className="absolute size-4 text-foreground opacity-0 transition-all duration-300 ease-out group-hover:scale-125 group-hover:opacity-100" />
                        </div>
                      )}
                      {owned && (
                        <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-gold text-primary-foreground">
                          <Check className="size-3" />
                        </span>
                      )}
                    </div>
                    <span className="mt-2 block truncate text-xs font-medium">{getDmzDisplayName(camo)}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
              This weapon isn't eligible for any DMZ Recon camos yet.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

const tierStyles = {
  gold: { text: "text-gold", border: "border-gold/50", bg: "bg-gold/10", glow: "glow-gold-sm" },
  platinum: { text: "text-platinum", border: "border-platinum/50", bg: "bg-platinum/10", glow: "glow-platinum-sm" },
  diamond: { text: "text-diamond", border: "border-diamond/50", bg: "bg-diamond/10", glow: "glow-diamond-sm" },
}

function TierToggle({
  label,
  tone,
  active,
  onClick,
  hint,
}: {
  label: string
  tone: "gold" | "platinum" | "diamond"
  active: boolean
  onClick: () => void
  hint?: string
}) {
  const style = tierStyles[tone]
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all",
        active ? cn(style.border, style.bg, style.glow) : "border-border/70 bg-secondary/20 hover:border-border"
      )}
    >
      <span className="relative flex size-8 items-center justify-center">
        {active ? (
          <Unlock className={cn("size-5 transition-transform duration-300 ease-out group-hover:scale-125", style.text)} />
        ) : (
          <>
            <Lock className="size-5 text-muted-foreground transition-all duration-300 ease-out group-hover:scale-125 group-hover:opacity-0" />
            <Unlock className="absolute size-5 text-foreground opacity-0 transition-all duration-300 ease-out group-hover:scale-125 group-hover:opacity-100" />
          </>
        )}
      </span>
      <span className={cn("text-lg font-semibold", active ? style.text : "text-foreground")}>{label}</span>
      <span className="text-xs text-muted-foreground">{active ? "Unlocked" : "Locked"}</span>
      {hint && <span className="text-[10px] text-muted-foreground/70">{hint}</span>}
    </button>
  )
}