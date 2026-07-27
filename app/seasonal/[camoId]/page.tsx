import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SEASONAL_CAMOS } from "@/lib/seasonal-camos"
import { SeasonalCamoExplorer } from "@/components/seasonal-camo-explorer"

export function generateStaticParams() {
  return SEASONAL_CAMOS.map((c) => ({ camoId: c.id }))
}

export default async function SeasonalCamoPage({
  params,
}: {
  params: Promise<{ camoId: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin?next=/seasonal")
  }

  const { camoId } = await params
  const camo = SEASONAL_CAMOS.find((c) => c.id === camoId)
  if (!camo) notFound()

  return <SeasonalCamoExplorer camoId={camoId} />
}