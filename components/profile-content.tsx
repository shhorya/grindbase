"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Award,
  Camera,
  Check,
  Copy,
  Diamond,
  Flame,
  Lock,
  LogOut,
  Medal,
  Pencil,
  Radar,
  Trophy,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { HudNav } from "@/components/hud-nav"
import { GoldBar } from "@/components/gold-bar"
import { createClient } from "@/lib/supabase/client"
import { useCamoData } from "@/lib/use-camo-data"
import { useSeasonalData } from "@/lib/use-seasonal-data"
import { useDmzData } from "@/lib/use-dmz-data"
import { categories, categoryProgress } from "@/lib/data"
import { getPlatinumCount } from "@/lib/calculations"
import { cn } from "@/lib/utils"

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

const MAX_TIER = 450
const AVATAR_BUCKET = "avatars"

function formatDate(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
}

function clampTier(value: number) {
  if (Number.isNaN(value)) return 1
  return Math.min(MAX_TIER, Math.max(1, Math.round(value)))
}

function StatPill({
  icon: Icon,
  value,
  label,
  toneClass,
  href,
}: {
  icon: LucideIcon
  value: string | number
  label: string
  toneClass: string
  href: string
}) {
  return (
    <Link href={href} className="group flex items-center gap-2.5 transition-opacity hover:opacity-80">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg border transition-transform group-hover:scale-105",
          toneClass
        )}
      >
        <Icon className="size-4" />
      </span>
      <div>
        <div className="font-mono text-lg font-semibold leading-none">{value}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
      </div>
    </Link>
  )
}

export function ProfileContent({
  userId,
  email,
  displayName,
  avatarUrl,
  tier,
  codmUid,
  createdAt,
}: {
  userId: string
  email: string
  displayName: string
  avatarUrl: string
  tier: number | null
  codmUid: string
  createdAt: string | null
}) {
  const router = useRouter()
  const { weapons, stats } = useCamoData()
  const { camoStats: seasonalCamoStats, isOwned: isSeasonalOwned } = useSeasonalData()
  const { camoStats: dmzCamoStats, isOwned: isDmzOwned } = useDmzData()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [avatar, setAvatar] = useState(avatarUrl)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(displayName)
  const [currentTier, setCurrentTier] = useState(tier)
  const [uid, setUid] = useState(codmUid)

  const [draftName, setDraftName] = useState(displayName)
  const [draftTier, setDraftTier] = useState(tier ? String(tier) : "")
  const [draftUid, setDraftUid] = useState(codmUid)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [copied, setCopied] = useState(false)

  const fallbackName = email ? email.split("@")[0] : "Operator"
  const shownName = name || fallbackName
  const initials = shownName.slice(0, 2).toUpperCase() || "OP"
  const memberSince = formatDate(createdAt)

  const platinumCategoryCount = getPlatinumCount(weapons, categories)
  const damascusWeaponCount = stats.damascusUnlocked ? stats.weaponsTotal : 0

  // "Completed" = every eligible weapon owns that camo, not just any progress.
  const seasonalCompleted = seasonalCamoStats.filter(
    (c) => c.totalEligible > 0 && c.ownedCount === c.totalEligible
  ).length
  const dmzCompleted = dmzCamoStats.filter(
    (c) => c.totalEligible > 0 && c.ownedCount === c.totalEligible
  ).length

  const mostProgressed = weapons.length > 0
    ? weapons.reduce((best, w) => (w.completion > best.completion ? w : best), weapons[0])
    : null

  // This weapon's own camo counts — out of the camos it's actually
  // eligible for, not the site-wide 36/20 totals shown above.
  const featuredEligibleSeasonal = mostProgressed
    ? seasonalCamoStats.filter((c) => c.eligibleWeapons.some((w) => w.id === mostProgressed.id))
    : []
  const featuredOwnedSeasonal = mostProgressed
    ? featuredEligibleSeasonal.filter((c) => isSeasonalOwned(mostProgressed.id, c.id)).length
    : 0

  const featuredEligibleDmz = mostProgressed
    ? dmzCamoStats.filter((c) => c.eligibleWeapons.some((w) => w.id === mostProgressed.id))
    : []
  const featuredOwnedDmz = mostProgressed
    ? featuredEligibleDmz.filter((c) => isDmzOwned(mostProgressed.id, c.id)).length
    : 0

  // This weapon's own completionist camos — Gold/Diamond are per-weapon,
  // Platinum reflects whether its whole category is done.
  const featuredTierBadges = mostProgressed
    ? [
        {
          label: "Gold",
          active: mostProgressed.gold,
          icon: Trophy,
          toneClass: "border-gold/40 bg-gold/10 text-gold",
        },
        {
          label: "Diamond",
          active: mostProgressed.diamond,
          icon: Diamond,
          toneClass: "border-diamond/40 bg-diamond/10 text-diamond",
        },
        {
          label: "Platinum",
          active: mostProgressed.platinum,
          icon: Medal,
          toneClass: "border-platinum/40 bg-white/5 text-platinum",
        },
      ]
    : []

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    setError(null)
    try {
      const supabase = createClient()
      const ext = file.name.split(".").pop() || "png"
      const path = `${userId}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      })
      if (updateError) throw updateError

      setAvatar(publicUrl)
    } catch (err) {
      console.error("Avatar upload failed:", err)
      const message = err instanceof Error ? err.message : "Couldn't upload that image — try again."
      setError(message)
    } finally {
      setUploadingAvatar(false)
      e.target.value = ""
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const trimmedName = draftName.trim()
      const trimmedUid = draftUid.trim()
      const parsedTier = draftTier.trim() === "" ? null : clampTier(Number(draftTier))

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          display_name: trimmedName,
          tier: parsedTier,
          codm_uid: trimmedUid,
        },
      })
      if (updateError) throw updateError

      setName(trimmedName)
      setCurrentTier(parsedTier)
      setUid(trimmedUid)
      setIsEditing(false)
    } catch {
      setError("Couldn't save that — try again.")
    } finally {
      setSaving(false)
    }
  }

  function handleEditStart() {
    setDraftName(name)
    setDraftTier(currentTier ? String(currentTier) : "")
    setDraftUid(uid)
    setError(null)
    setIsEditing(true)
  }

  function handleCancel() {
    setError(null)
    setIsEditing(false)
  }

  async function handleCopyUid() {
    if (!uid) return
    await navigator.clipboard.writeText(uid)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/signin")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-hud-grid">
      <HudNav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Profile hero — full width, name in big gold letters, stats built in */}
        <div className="hud-corner relative overflow-hidden rounded-3xl border border-border/70 glass-strong p-8 glow-gold-sm sm:p-10">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="absolute right-6 top-6 flex items-center gap-1.5 rounded-lg border border-border/70 bg-secondary/30 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-red-400/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut className="size-3.5" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>

          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
            {/* Avatar — plain <Image>, no dependency on the Avatar
                component's own (unreliable) sizing. */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="group relative block size-36 overflow-hidden rounded-full ring-2 ring-gold/40 glow-gold-sm disabled:cursor-not-allowed"
                aria-label="Change photo"
              >
                {avatar ? (
                  <Image src={avatar} alt="Operator avatar" fill className="object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center bg-secondary/50 text-3xl font-semibold text-muted-foreground">
                    {initials}
                  </div>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/55 group-hover:opacity-100">
                  <Camera className="size-7 text-white" />
                </span>
                {uploadingAvatar && (
                  <span className="absolute inset-0 flex items-center justify-center bg-background/70">
                    <span className="size-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                  </span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="min-w-0 flex-1">
              {!isEditing ? (
                <>
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gold text-glow-gold sm:text-5xl">
                      {shownName}
                    </h1>
                    <button
                      onClick={handleEditStart}
                      className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-gold"
                      aria-label="Edit profile"
                    >
                      <Pencil className="size-4" />
                    </button>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    {currentTier != null && (
                      <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-mono text-xs font-semibold tracking-wide text-gold">
                        TIER {currentTier}
                      </span>
                    )}
                    {uid ? (
                      <span className="flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/30 px-3 py-1 font-mono text-xs text-muted-foreground">
                        UID {uid}
                        <button
                          onClick={handleCopyUid}
                          className="text-muted-foreground hover:text-gold"
                          aria-label="Copy UID"
                        >
                          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={handleEditStart}
                        className="text-xs text-muted-foreground hover:text-gold"
                      >
                        + Add your CODM UID
                      </button>
                    )}
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">
                    {email}
                    {memberSince && <span className="text-muted-foreground/60"> · since {memberSince}</span>}
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Display name</label>
                    <input
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      placeholder={fallbackName}
                      maxLength={32}
                      autoFocus
                      className="h-10 w-full max-w-xs rounded-lg border border-border/70 bg-secondary/30 px-3 text-base outline-none focus-visible:border-gold/50"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Tier (max {MAX_TIER})</label>
                      <input
                        type="number"
                        min={1}
                        max={MAX_TIER}
                        value={draftTier}
                        onChange={(e) => setDraftTier(e.target.value)}
                        placeholder="e.g. 87"
                        className="h-10 w-28 rounded-lg border border-border/70 bg-secondary/30 px-3 text-base outline-none focus-visible:border-gold/50"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">CODM UID</label>
                      <input
                        value={draftUid}
                        onChange={(e) => setDraftUid(e.target.value)}
                        placeholder="e.g. 1234567890"
                        maxLength={20}
                        className="h-10 w-44 rounded-lg border border-border/70 bg-secondary/30 px-3 text-base outline-none focus-visible:border-gold/50"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center gap-2 sm:justify-start">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/15 px-4 py-2 text-sm font-medium text-gold hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Check className="size-4" />
                      {saving ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-secondary/30 px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            </div>
          </div>

          {/* Horizontal stat strip */}
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-border/60 pt-6">
            <StatPill
              icon={Trophy}
              value={stats.goldCount}
              label="Gold"
              toneClass="border-gold/40 bg-gold/10 text-gold"
              href="/weapons?status=gold&tier=gold"
            />
            <StatPill
              icon={Medal}
              value={platinumCategoryCount}
              label="Platinum"
              toneClass="border-platinum/40 bg-white/5 text-platinum"
              href="/weapons?status=gold&tier=platinum"
            />
            <StatPill
              icon={Diamond}
              value={stats.diamondCount}
              label="Diamond"
              toneClass="border-diamond/40 bg-diamond/10 text-diamond"
              href="/weapons?status=diamond&tier=diamond"
            />
            <StatPill
              icon={Award}
              value={damascusWeaponCount}
              label="Damascus"
              toneClass="border-purple-400/40 bg-gradient-to-br from-red-500/15 to-blue-500/15 text-purple-300"
              href="/damascus"
            />
            <div className="hidden h-9 w-px bg-border/60 sm:block" />
            <StatPill
              icon={Flame}
              value={`${seasonalCompleted}/${seasonalCamoStats.length}`}
              label="Seasonal"
              toneClass="border-gold/40 bg-gold/10 text-gold"
              href="/seasonal"
            />
            <StatPill
              icon={Radar}
              value={`${dmzCompleted}/${dmzCamoStats.length}`}
              label="DMZ"
              toneClass="border-gold/40 bg-gold/10 text-gold"
              href="/dmz"
            />
          </div>
        </div>

        {/* Most progressed weapon, with its own camo stats */}
        {mostProgressed && (
          <div className="mt-4 flex flex-col gap-6 overflow-hidden rounded-2xl border border-border/70 glass p-6 sm:flex-row sm:items-center">
            <Link
              href={`/weapons/${mostProgressed.id}`}
              className="group relative h-32 w-full shrink-0 overflow-hidden rounded-xl border border-border/50 bg-[radial-gradient(circle_at_center,theme(colors.secondary/60%),transparent_70%)] sm:w-56"
            >
              <div className="absolute inset-0 bg-background/40" />
              <Image
                src={mostProgressed.image}
                alt={mostProgressed.name}
                fill
                className="relative object-contain p-3 transition-transform duration-500 group-hover:scale-105"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-muted-foreground">Most Progressed</span>
              <Link
                href={`/weapons/${mostProgressed.id}`}
                className="mt-1 flex items-center justify-between gap-4 hover:text-gold"
              >
                <h2 className="text-2xl font-bold tracking-tight">{mostProgressed.name}</h2>
                <span className="font-mono text-lg font-semibold text-gold">{mostProgressed.completion}%</span>
              </Link>
              <p className="text-sm text-muted-foreground">{mostProgressed.category}</p>
              <GoldBar value={mostProgressed.completion} className="mt-3" />

              {/* This weapon's completionist camos */}
              <div className="mt-3 flex flex-wrap gap-2">
                {featuredTierBadges.map((b) => {
                  const Icon = b.icon
                  return (
                    <Link
                      key={b.label}
                      href={`/weapons/${mostProgressed.id}`}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80",
                        b.active ? b.toneClass : "border-border/70 bg-secondary/30 text-muted-foreground"
                      )}
                    >
                      {b.active ? <Check className="size-3" /> : <Lock className="size-3" />}
                      <Icon className="size-3" />
                      {b.label}
                    </Link>
                  )
                })}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <Link href="/seasonal" className="flex items-center gap-1.5 hover:text-gold">
                  <Flame className="size-3.5 text-gold" />
                  Seasonal
                  <span className="font-mono text-foreground">
                    {featuredOwnedSeasonal}/{featuredEligibleSeasonal.length}
                  </span>
                </Link>
                <Link href="/dmz" className="flex items-center gap-1.5 hover:text-gold">
                  <Radar className="size-3.5 text-gold" />
                  DMZ
                  <span className="font-mono text-foreground">
                    {featuredOwnedDmz}/{featuredEligibleDmz.length}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Gold + Diamond, category-wise, side by side */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-gold/25 glass p-5">
            <span className="text-xs font-medium text-gold">Gold by Category</span>
            <div className="mt-4 space-y-3">
              {categories.map((c) => {
                const cp = categoryProgress(weapons, c)
                const pct = cp.total > 0 ? Math.round((cp.gold / cp.total) * 100) : 0
                return (
                  <Link
                    key={c}
                    href={`/weapons?category=${encodeURIComponent(c)}&status=gold&tier=gold`}
                    className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-1 transition-colors hover:bg-secondary/30"
                  >
                    <span className="w-24 shrink-0 text-sm">{c}</span>
                    <GoldBar value={pct} tone="gold" className="h-1.5 flex-1" />
                    <span className="w-14 shrink-0 text-right font-mono text-xs text-muted-foreground">
                      {cp.gold}/{cp.total}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-diamond/25 glass p-5">
            <span className="text-xs font-medium text-diamond">Diamond by Category</span>
            <div className="mt-4 space-y-3">
              {categories.map((c) => {
                const categoryWeapons = weapons.filter((w) => w.category === c)
                const diamondCount = categoryWeapons.filter((w) => w.diamond).length
                const total = categoryWeapons.length
                const pct = total > 0 ? Math.round((diamondCount / total) * 100) : 0
                return (
                  <Link
                    key={c}
                    href={`/weapons?category=${encodeURIComponent(c)}&status=diamond&tier=diamond`}
                    className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-1 transition-colors hover:bg-secondary/30"
                  >
                    <span className="w-24 shrink-0 text-sm">{c}</span>
                    <GoldBar value={pct} tone="diamond" className="h-1.5 flex-1" />
                    <span className="w-14 shrink-0 text-right font-mono text-xs text-muted-foreground">
                      {diamondCount}/{total}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}