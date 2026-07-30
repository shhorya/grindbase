import { cn } from "@/lib/utils"

type Props = {
  value: number
  className?: string
  trackClassName?: string
  tone?: "gold" | "platinum" | "diamond" | "muted" | "damascus"
}

const tones: Record<NonNullable<Props["tone"]>, string> = {
  gold: "bg-[linear-gradient(90deg,oklch(0.72_0.12_78),oklch(0.9_0.12_92))] shadow-[0_0_12px_-2px_oklch(0.83_0.13_84_/_0.7)]",
  platinum: "bg-[linear-gradient(90deg,oklch(0.7_0.02_240),oklch(0.92_0.02_240))]",
  diamond: "bg-[linear-gradient(90deg,oklch(0.65_0.09_210),oklch(0.88_0.09_210))] shadow-[0_0_12px_-2px_oklch(0.75_0.1_210_/_0.7)]",
  muted: "bg-[linear-gradient(90deg,oklch(0.4_0.01_260),oklch(0.6_0.01_260))]",
  damascus:
    "bg-[linear-gradient(90deg,oklch(0.6_0.22_25),oklch(0.55_0.2_320),oklch(0.6_0.15_250))] shadow-[0_0_12px_-2px_oklch(0.55_0.2_320_/_0.6)]",
}

export function GoldBar({ value, className, trackClassName, tone = "gold" }: Props) {
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-secondary/80",
        className,
        trackClassName,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-1000 ease-out", tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
