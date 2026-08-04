# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GrindBase** is a Call of Duty: Mobile (CODM) camo tracker — a Next.js app where signed-in users track their per-weapon completion across four camo systems (Gold/Platinum/Diamond mastery, Seasonal, DMZ, and Damascus). State lives in Supabase so progress follows the user across devices in realtime.

## Commands

- `pnpm dev` — start the dev server (Next.js 16, App Router)
- `pnpm build` — production build
- `pnpm start` — serve the production build
- `pnpm lint` — run ESLint across the project
- `node update-weapons.js` — one-off script that regex-patches `lib/weapons.ts` to add the `eligibleSeasonalCamos: 36` field to every weapon entry. Run this only when first introducing/updating that field.

There is no test suite — verification is by dev-server + manual click-through.

## Architecture

### Routing (App Router)
- `/` — public marketing landing (`app/page.tsx`), shows live stats to anyone
- `/signin` — Google OAuth entry; redirect target carried via `?next=…`
- `/auth/callback/route.ts` — Supabase OAuth code-exchange, ends at `/dashboard`
- `/dashboard`, `/weapons`, `/weapons/[id]`, `/seasonal`, `/seasonal/[camoId]`, `/dmz`, `/dmz/[camoId]`, `/damascus`, `/profile` — all are **server components** that call `supabase.auth.getUser()` and `redirect("/signin?next=…")` if unauthenticated. The actual UI lives in `<X>Content` / `<X>Explorer` client components in `components/`.

### Auth & middleware
- Browser client: `lib/supabase/client.ts` (`createBrowserClient`)
- Server client: `lib/supabase/server.ts` (cookies-based, async)
- Middleware: `proxy.ts` (Next 16 naming) wires `lib/supabase/middleware.ts → updateSession` so cookies refresh on every request matched by the `matcher` config at the bottom of `proxy.ts`.
- Sign-in is Google OAuth only (`components/google-sign-in.tsx`).

### State stores — three parallel shapes

All three progress stores live in `lib/` and follow the **same pattern** (hand-rolled `useSyncExternalStore` over module-level state, Supabase-backed, with realtime `postgres_changes` subscriptions + a one-time localStorage → cloud migration):

| Store | Backing table | Hook | What's stored |
|---|---|---|---|
| `progress-store.ts` | `weapon_progress` | `useWeaponProgress()` | Per-weapon `WeaponProgress` (owned / gold / platinum / diamond / completion / matchesRemaining / diamondProgress / goldUnlockedAt) |
| `seasonal-store.ts` | `seasonal_progress` | `useSeasonalProgress()` | `Record<"weaponId:camoId", boolean>` ownership + per-row `matches` counter (for tournament-style camos) |
| `dmz-store.ts` | `dmz_progress` | `useDmzProgress()` | `Record<"weaponId:camoId", boolean>` |
| `starred-camos-shared.ts` (+ two thin wrappers in `starred-camo-store.ts`, `starred-dmz-camo-store.ts`) | `starred_camos` | `useStarredCamo()` / `useStarredDmzCamo()` | One row per user: `seasonal_camo_id`, `dmz_camo_id` (the user's currently "focused" camo) |

Critical detail all four stores share: `localWriteVersion` is bumped on every local mutation, and hydrates compare it at completion to abort if a write happened mid-fetch (prevents stale cloud reads from overwriting fresh local edits).

Realtime requires Supabase **Database → Replication** to be turned on for each table.

The composition roots consumed by the UI are in `lib/`:
- `useCamoData()` merges static `lib/weapons.ts` with `useWeaponProgress()` into `CompleteWeapon = Weapon & WeaponProgress`
- `useSeasonalData()` joins `lib/seasonal-camos.ts` + `lib/weapons.ts` + `useSeasonalProgress()`, computing each camo's eligible-weapons + owned count via `SEASONAL_CAMO_EXCLUDED_BY_WEAPON`
- `useDmzData()` does the analogous join for DMZ

### Domain data (static, hand-edited)
- `lib/weapons.ts` — full weapon catalog (id, name, category, image path, `eligibleSeasonalCamos`, optional `dmzSeason1` / `dmzSeason2` / `noCamos`). Ordered by category with section banners.
- `lib/seasonal-camos.ts` — ordered list of seasonal camos (`order: 1..36`); camos with `unlockType: "matches"` and `matchesTarget` count matches instead of bool ownership
- `lib/dmz-camos.ts` — two seasons of color camos, generated from color-name arrays (edit the arrays to change the catalog)
- `lib/constants.ts` — `CATEGORIES`, `CATEGORY_IMAGES`, `DIAMOND_REQUIREMENTS` + `DIAMOND_REQUIREMENT_OVERRIDES`, current season badge
- `lib/data.ts` — **legacy server-only data facade**. Exposes `completeWeapons`, `stats`, `tierMeta`, `categories`, `recommendedGrinds()` etc. built against the default progress, used by SSR/static pages that don't read live state. New client components should prefer the `use*Data()` hooks.

### Eligibility / "no-camos" semantics
`calculations.ts → trackedOnly()` filters out weapons with `noCamos: true` (e.g. base Melee) before *any* stat calculation. Anything counting toward Diamond/Gold/Platinum must respect this filter.

### UI layer
- `components/ui/*` — shadcn/ui (style `base-nova`, Tailwind v4), installed via the `shadcn` package using `components.json` aliases (`@/components`, `@/lib/utils`).
- `components/<feature>-content.tsx` / `components/<feature>-explorer.tsx` — the actual authenticated UI for each route.
- Styling: dark-only `app/globals.css` defines a gold/platinum/diamond palette as `--gold`, `--platinum`, `--diamond` CSS variables and exposes them to Tailwind via `@theme inline`. Custom utilities like `hud-corner`, `glass`, `glass-strong`, `glow-gold`, `bg-hud-grid` live there. Font is Inter + JetBrains Mono via `next/font/google`.
- `next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `images.unoptimized: true` — image domains are not restricted because no external `<Image>` sources are used.

### Path alias
`@/*` maps to project root (see `tsconfig.json`). Always import from `@/…`, not relative `../../`.

## Common invariants
- New state added to the four progress stores must follow the existing hydrate/migrate/realtime shape. Don't introduce a new persistence mechanism without mirroring `localWriteVersion` race protection.
- "Gold-unlock timestamp" is a side-effect: setting `gold: true` via `updateWeaponInStore` also stamps `goldUnlockedAt = Date.now()`. The landing page's "recently unlocked" feed reads that field; don't break it.
- Per-camo eligibility has two layers: the `eligibleSeasonalCamos` count on each weapon (newest-N rule) **and** the explicit `SEASONAL_CAMO_EXCLUDED_BY_WEAPON` map in `use-seasonal-data.ts` for scattered-gaps cases. Add new exclusion lists there, not in the weapon records.
- DMZ eligibility uses `DMZ_NO_ACCESS` and `DMZ_SEASON_2_ONLY` sets in `use-dmz-data.ts`. Adjust those rather than per-weapon flags when adding/removing DMZ eligibility.
