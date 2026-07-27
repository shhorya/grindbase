import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SeasonalContent } from "@/components/seasonal-content"

export default async function SeasonalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin?next=/seasonal")
  }

  return <SeasonalContent />
}