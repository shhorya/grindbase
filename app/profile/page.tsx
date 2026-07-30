import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProfileContent } from "@/components/profile-content"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin?next=/profile")
  }

  return (
    <ProfileContent
      userId={user.id}
      email={user.email ?? ""}
      displayName={(user.user_metadata?.display_name as string | undefined) ?? ""}
      avatarUrl={(user.user_metadata?.avatar_url as string | undefined) ?? ""}
      tier={(user.user_metadata?.tier as number | undefined) ?? null}
      codmUid={(user.user_metadata?.codm_uid as string | undefined) ?? ""}
      createdAt={user.created_at ?? null}
    />
  )
}