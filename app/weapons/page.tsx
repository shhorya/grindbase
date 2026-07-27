import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { HudNav } from "@/components/hud-nav"
import { WeaponsExplorer } from "@/components/weapons-explorer"

export default async function WeaponsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string; tier?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin?next=/weapons")
  }

  const { category, status, tier } = await searchParams

  return (
    <div className="min-h-screen bg-hud-grid">
      <HudNav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs tracking-[0.25em] text-gold">
            / ARSENAL
          </span>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Weapon Locker
          </h1>
          <p className="text-muted-foreground">
            Search, filter and track every weapon on your road to Diamond.
          </p>
        </div>

        <div className="mt-8">
          <WeaponsExplorer initialCategory={category} initialStatus={status} initialTier={tier} />
        </div>
      </main>
    </div>
  )
}
