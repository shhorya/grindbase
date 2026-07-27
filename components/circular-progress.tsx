import { cn } from "@/lib/utils"

type Props = {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  label?: string
  sublabel?: string
  tone?: "gold" | "diamond"
}

export function CircularProgress({
  value,
  size = 180,
  strokeWidth = 10,
  className,
  label,
  sublabel,
  tone = "gold",
}: Props) {
  const gradientId = tone === "diamond" ? "diamondStroke" : "goldStroke"
  const trackColor = tone === "diamond" ? "oklch(0.3 0.02 210)" : "oklch(0.3 0.008 260)"
  const textColorClass = tone === "diamond" ? "text-diamond" : "text-gold"
  const glowFilter =
    tone === "diamond"
      ? "drop-shadow(0 0 6px oklch(0.85 0.09 210 / 0.55))"
      : "drop-shadow(0 0 6px oklch(0.83 0.13 84 / 0.55))"
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90 overflow-visible"
  style={{ overflow: "visible" }}
>
        <defs>
          <linearGradient id="goldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.9 0.12 92)" />
            <stop offset="100%" stopColor="oklch(0.76 0.13 78)" />
          </linearGradient>
          <linearGradient id="diamondStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.88 0.09 210)" />
            <stop offset="100%" stopColor="oklch(0.65 0.09 210)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)",
            filter: glowFilter,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-mono text-4xl font-semibold tabular-nums", textColorClass)}>
          {Math.round(value)}
          <span className="text-xl">%</span>
        </span>
        {label && (
          <span className="mt-1 text-xs font-medium tracking-widest text-muted-foreground uppercase">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="mt-0.5 text-[11px] text-muted-foreground/70">{sublabel}</span>
        )}
      </div>
    </div>
  )
}
