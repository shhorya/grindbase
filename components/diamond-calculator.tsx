"use client"

import { useState } from "react"
import { Diamond, Swords, Timer } from "lucide-react"
import { GoldBar } from "@/components/gold-bar"
import { Slider } from "@/components/ui/slider"

type Props = {
  /** kills still required to reach Diamond */
  remainingKills: number
  /** gold weapons currently owned in the class */
  goldInClass: number
  /** gold weapons required for Diamond in the class */
  goldRequired: number
}

export function DiamondCalculator({
  remainingKills,
  goldInClass,
  goldRequired,
}: Props) {
  const [killsPerMatch, setKillsPerMatch] = useState(12)
  const [minutesPerMatch, setMinutesPerMatch] = useState(9)

  const matches = remainingKills > 0 ? Math.ceil(remainingKills / killsPerMatch) : 0
  const minutes = matches * minutesPerMatch
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const classPct = Math.round((goldInClass / goldRequired) * 100)

  return (
    <div className="hud-corner relative overflow-hidden rounded-2xl border border-diamond/25 glass p-6">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg border border-diamond/40 bg-diamond/10 text-diamond">
          <Diamond className="size-4" />
        </span>
        <div>
          <h2 className="text-lg font-medium">Diamond Calculator</h2>
          <p className="text-xs text-muted-foreground">
            Estimate your grind to the next tier
          </p>
        </div>
      </div>

      {/* Class requirement */}
      <div className="mt-5 rounded-xl border border-border/60 bg-secondary/30 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Gold weapons in class</span>
          <span className="font-mono font-semibold">
            {goldInClass}
            <span className="text-muted-foreground">/{goldRequired}</span>
          </span>
        </div>
        <GoldBar value={classPct} tone="diamond" className="mt-3" />
      </div>

      {/* Sliders */}
      <div className="mt-6 space-y-6">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Swords className="size-4" />
              Kills / match
            </span>
            <span className="font-mono font-semibold text-gold">
              {killsPerMatch}
            </span>
          </div>
          <Slider
            value={[killsPerMatch]}
            min={4}
            max={30}
            step={1}
            onValueChange={(v) => setKillsPerMatch((v as number[])[0])}
            className="mt-3"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Timer className="size-4" />
              Minutes / match
            </span>
            <span className="font-mono font-semibold text-gold">
              {minutesPerMatch}
            </span>
          </div>
          <Slider
            value={[minutesPerMatch]}
            min={4}
            max={20}
            step={1}
            onValueChange={(v) => setMinutesPerMatch((v as number[])[0])}
            className="mt-3"
          />
        </div>
      </div>

      {/* Results */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Result label="Kills left" value={remainingKills.toLocaleString()} />
        <Result label="Matches" value={matches.toString()} highlight />
        <Result
          label="Est. time"
          value={remainingKills > 0 ? `${hours}h ${mins}m` : "Done"}
        />
      </div>
    </div>
  )
}

function Result({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-3 text-center ${
        highlight
          ? "border-gold/40 bg-gold/10 glow-gold-sm"
          : "border-border/60 bg-secondary/30"
      }`}
    >
      <div
        className={`font-mono text-xl font-semibold tabular-nums ${
          highlight ? "text-gold" : "text-foreground"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </div>
    </div>
  )
}
