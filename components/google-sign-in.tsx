"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function GoogleSignIn({
  next = "/dashboard",
  label = "Continue with Google",
}: {
  next?: string
  label?: string
}) {
  const signIn = async () => {
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })

    if (error) {
      console.error(error)
      alert(error.message)
    }
  }

  return (
    <Button
      size="lg"
      onClick={signIn}
      className="h-11 bg-gold px-3 text-base text-primary-foreground hover:bg-gold-bright glow-gold"
    >
      {label}
    </Button>
  )
}