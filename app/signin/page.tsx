import Image from "next/image"
import { GoogleSignIn } from "@/components/google-sign-in"

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-hud-grid px-4">
      <div className="hud-corner flex w-full max-w-sm flex-col items-center rounded-2xl border border-border/70 glass-strong p-8 text-center glow-gold-sm">
        <span className="relative flex size-12 items-center justify-center overflow-hidden rounded-md border border-gold/40 bg-gold/10 glow-gold-sm">
          <Image src="/logo.png" alt="GrindBase" fill className="object-contain p-1.5" />
        </span>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          Welome to GrindBase.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Authorize with Google to gain access.
        </p>
        <div className="mt-8">
          <GoogleSignIn next={next ?? "/dashboard"} />
        </div>
      </div>
    </div>
  )
}