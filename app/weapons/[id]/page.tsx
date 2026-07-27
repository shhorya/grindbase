import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { weapons } from "@/lib/weapons"
import { WeaponDetailContent } from "@/components/weapon-detail-content"

export function generateStaticParams() {
  return weapons.map((w) => ({ id: w.id }))
}

export default async function WeaponDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin?next=/weapons")
  }

  const { id } = await params
  const weaponExists = weapons.some((w) => w.id === id)
  if (!weaponExists) notFound()

  return <WeaponDetailContent weaponId={id} />
}