"use client"

import { useCallback, useRef } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { cn } from "@/lib/utils"

type Tone = "gold" | "platinum" | "diamond" | "muted" | "damascus"

const fillTones: Record<Tone, string> = {
  gold: "bg-[linear-gradient(90deg,oklch(0.72_0.12_78),oklch(0.9_0.12_92))] shadow-[0_0_12px_-2px_oklch(0.83_0.13_84_/_0.7)]",
  platinum: "bg-[linear-gradient(90deg,oklch(0.7_0.02_240),oklch(0.92_0.02_240))]",
  diamond: "bg-[linear-gradient(90deg,oklch(0.65_0.09_210),oklch(0.88_0.09_210))]",
  muted: "bg-[linear-gradient(90deg,oklch(0.4_0.01_260),oklch(0.6_0.01_260))]",
  damascus:
    "bg-[linear-gradient(90deg,oklch(0.6_0.22_25),oklch(0.55_0.2_320),oklch(0.6_0.15_250))] shadow-[0_0_12px_-2px_oklch(0.55_0.2_320_/_0.6)]",
}

const handleTones: Record<Tone, string> = {
  gold: "bg-[oklch(0.9_0.12_92)] shadow-[0_0_8px_oklch(0.83_0.13_84_/_0.8)]",
  platinum: "bg-[oklch(0.92_0.02_240)]",
  diamond: "bg-[oklch(0.88_0.09_210)] shadow-[0_0_8px_oklch(0.65_0.09_210_/_0.8)]",
  muted: "bg-[oklch(0.6_0.01_260)]",
  damascus: "bg-[oklch(0.6_0.15_250)] shadow-[0_0_8px_oklch(0.55_0.2_320_/_0.8)]",
}

type Props = {
  value: number
  min?: number
  max: number
  onChange: (value: number) => void
  tone?: Tone
  className?: string
}

export function DraggableProgressBar({ value, min = 0, max, onChange, tone = "diamond", className }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const pct = max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return
      const rect = track.getBoundingClientRect()
      const ratio = rect.width > 0 ? Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) : 0
      onChange(Math.round(min + ratio * (max - min)))
    },
    [min, max, onChange]
  )

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    updateFromClientX(e.clientX)
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.buttons !== 1) return
    updateFromClientX(e.clientX)
  }

  return (
    <div
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      className={cn(
        "relative h-2 w-full cursor-pointer touch-none select-none rounded-full bg-secondary/80",
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-150 ease-out", fillTones[tone])}
        style={{ width: `${pct}%` }}
      />
      <div
        className={cn(
          "absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background transition-transform duration-150",
          handleTones[tone]
        )}
        style={{ left: `${pct}%` }}
      />
    </div>
  )
}