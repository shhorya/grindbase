import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DMZ_CAMOS } from "@/lib/dmz-camos"
import { DmzCamoExplorer } from "@/components/dmz-camo-explorer"

export function generateStaticParams() {
  return DMZ_CAMOS.map((c) => ({ camoId: c.id }))
}

export default async function DmzCamoPage({
  params,
}: {
  params: Promise<{ camoId: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin?next=/dmz")
  }

  const { camoId } = await params
  const camo = DMZ_CAMOS.find((c) => c.id === camoId)
  if (!camo) notFound()

  return <DmzCamoExplorer camoId={camoId} />
}
