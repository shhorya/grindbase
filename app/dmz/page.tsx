import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DmzContent } from "@/components/dmz-content"

export default async function DmzPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin?next=/dmz")
  }

  return <DmzContent />
}
