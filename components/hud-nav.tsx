"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { LayoutDashboard, Target, User } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/weapons", label: "Arsenal", icon: Target },
  { href: "/profile", label: "Operator", icon: User },
]

export function HudNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 glass-strong">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative flex size-8 items-center justify-center overflow-hidden rounded-md border border-gold/40 bg-gold/10 glow-gold-sm">
            <Image src="/logo.png" alt="GrindBase" fill className="object-contain p-1" />
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-sm font-semibold tracking-tight">GRINDBASE</span>
            <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">
              CODM · HQ
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 rounded-full border border-border/70 bg-secondary/40 p-1 backdrop-blur-md">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/")
            const Icon = l.icon
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:px-4",
                  active
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <span className="absolute inset-0 rounded-full bg-gold glow-gold-sm" />
                )}
                <Icon className="relative size-4" />
                <span className="relative hidden sm:inline">{l.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
