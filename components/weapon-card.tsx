"use client"

import Link from "next/link"
import Image from "next/image"
import { Check, Lock } from "lucide-react"
import { GoldBar } from "@/components/gold-bar"
import { statusOf } from "@/lib/data"
import type { CompleteWeapon } from "@/lib/use-camo-data"
import { cn } from "@/lib/utils"

const statusBadge: Record<
  ReturnType<typeof statusOf>,
  { label: string; className: string }
> = {
  complete: {
    label: "Complete",
    className: "border-gold/40 bg-gold/10 text-gold",
  },
  "in-progress": {
    label: "In Progress",
    className: "border-border bg-secondary/60 text-foreground",
  },
  unowned: {
    label: "Locked",
    className: "border-border/60 bg-secondary/30 text-muted-foreground",
  },
}

export function WeaponCard({
  weapon,
  onToggleField,
  locked,
}: {
  weapon: CompleteWeapon
  onToggleField: (
    weaponId: string,
    field: "gold" | "platinum" | "diamond"
  ) => void
  locked?: boolean
}) {
  const status = statusOf(weapon)
  const badge = statusBadge[status]

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 glass p-4 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:glow-gold-sm",
        locked && "opacity-60 hover:opacity-100"
      )}
    >
      <Link
        href={`/weapons/${weapon.id}`}
        className="absolute inset-0 z-0"
        aria-label={`View ${weapon.name} details`}
      />

      <div className="pointer-events-none relative z-10 flex items-start justify-between">
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          {weapon.category}
        </span>

        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
            badge.className
          )}
        >
          {status === "complete" && <Check className="size-2.5" />}
          {badge.label}
        </span>
      </div>

      <div className="pointer-events-none relative z-10 my-3 h-28 w-full overflow-hidden rounded-xl border border-border/50 bg-[radial-gradient(circle_at_center,theme(colors.secondary/60%),transparent_70%)]">
        <div className="absolute inset-0 bg-background/40" />
        <Image
          src={weapon.image}
          alt={weapon.name}
          fill
          className="relative object-contain p-2 transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="pointer-events-none relative z-10 mt-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium">{weapon.name}</h3>
          <span className="font-mono text-sm font-semibold text-gold">
            {weapon.completion}%
          </span>
        </div>
        <div className="mt-2">
          <GoldBar value={weapon.completion} tone="gold" />
        </div>
      </div>

      <div className="relative z-10 mt-3 grid grid-cols-3 gap-1.5">
        <ToggleButton
          active={weapon.gold}
          label="Gold"
          onClick={() => onToggleField(weapon.id, "gold")}
        />
        <ToggleButton
          active={weapon.platinum}
          label="Plat"
          onClick={() => onToggleField(weapon.id, "platinum")}
        />
        <ToggleButton
          active={weapon.diamond}
          label="Diamond"
          onClick={() => onToggleField(weapon.id, "diamond")}
        />
      </div>
    </div>
  )
}

function ToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        onClick()
      }}
      className={cn(
        "relative z-20 rounded-lg border px-1.5 py-1 text-[10px] font-medium transition-colors",
        active
          ? "border-gold/50 bg-gold/15 text-gold"
          : "border-border/70 bg-secondary/30 text-muted-foreground hover:border-border hover:text-foreground"
      )}
    >
      {label}
    </button>
  )
}