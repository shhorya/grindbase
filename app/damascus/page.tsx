import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DamascusContent } from "@/components/damascus-content"

export default async function DamascusPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin?next=/damascus")
  }

  return <DamascusContent />
}