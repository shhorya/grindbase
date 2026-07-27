# GRINDBASE_HANDOFF.md

> **Project:** GrindBase
> **Type:** Premium Call of Duty Mobile Camo Tracker
> **Framework:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui (base-ui) + Framer Motion
> **Auth:** Supabase (Google OAuth)
> **Storage:** localStorage (per-browser, no backend sync yet)
> **Status:** Core app functional end-to-end. Auth working. Gold/Platinum/Diamond/Damascus/Seasonal all live and interconnected. Weapon detail pages rebuilt. Still no real Diamond match-tracking data source (manual only), no Supabase-synced progress, no PWA.

---

# 1. PROJECT VISION

GrindBase is **not** a marketing site. It's meant to be the best COD Mobile camo mastery tracker available — tactical HUD aesthetic (COD HQ / MWII menus / Battlefield HUD), glassmorphism, gold accents, live stats, functional UI. No SaaS-y layouts, no marketing fluff.

**Core camo mechanic (this is what the whole app tracks):**
- **Gold** — earned per weapon individually.
- **Platinum** — earned when **every weapon in a category** has Gold. All-or-nothing per category; toggling Platinum on/off for one weapon cascades to the whole category.
- **Damascus** — earned when **every weapon in the game** has Gold. All-or-nothing across all 143 weapons. Has its own dedicated unlock page/experience.
- **Diamond** — earned per weapon by hitting a category-specific requirement (see table below). Diamond auto-implies Gold (turning Diamond on force-sets Gold on too).
- **Seasonal Camos** — separate system entirely. 36 seasonal-style camos (plus real named ones now: Zombies, Tournament, Secret Cache, Event, and general Seasonal), each earnable per-weapon, with weapon eligibility scaling by weapon "age" (older weapons eligible for more camos).

Every weapon in the game is already unlocked in-game (COD Mobile doesn't lock weapons) — **there is no "Owned" concept in this app.** All 143 weapons are always visible/trackable; only camo tiers are tracked.

---

# 2. STACK

- Next.js 16, App Router, TypeScript
- Tailwind CSS v4 (`@theme inline`, `@custom-variant`, CSS vars — these show as "unknown at-rule" warnings in some editors' CSS linters; harmless, ignore)
- shadcn/ui components built on `@base-ui/react` (not Radix) — Button, Select, Input, Avatar, Badge, Card, Progress, Separator, Slider, Tabs, Tooltip
- Framer Motion (`npm install framer-motion` — was missing initially, now installed) for Damascus unlock animation
- Lucide React icons
- Supabase (`@supabase/ssr`) for Google OAuth auth
- localStorage for all camo progress (no backend database yet)

---

# 3. DATA MODEL

## lib/types.ts
```ts
export type WeaponCategory =
  | "Assault Rifle" | "SMG" | "Sniper" | "Shotgun" | "LMG"
  | "Marksman" | "Pistol" | "Launcher" | "Melee"

export interface Weapon {
  id: string
  name: string
  category: WeaponCategory
  image: string
  eligibleSeasonalCamos: number // how many of the 36 seasonal camos this weapon can earn, counted from newest backward
}
```

## lib/progress.ts
```ts
export interface WeaponProgress {
  weaponId: string
  owned: boolean          // legacy field, always forced true now — see lib/use-camo-data.ts
  gold: boolean
  platinum: boolean
  diamond: boolean
  completion: number       // 0 or 100 currently (tied to gold)
  matchesRemaining: number // legacy, mostly unused now
  diamondProgress: number  // current progress toward that weapon's Diamond requirement
}
```

## lib/weapons.ts
Flat array of **143 weapons** (no category grouping/comments in the array structure — array order is: AR block, Sniper block, LMG block, SMG block, Shotgun block, Marksman block, Pistol block, Melee block, Launcher block, all back-to-back with no section separators per user preference). Every weapon currently has `eligibleSeasonalCamos: 36` (placeholder — user will provide real per-weapon release order later to vary this).

**Weapon images are organized in category subfolders** (per latest instruction, in progress at cutoff):
```
public/weapons/ar/
public/weapons/snipers/
public/weapons/lmg/
public/weapons/smg/
public/weapons/shotgun/
public/weapons/marksman/
public/weapons/pistols/
public/weapons/melee/
public/weapons/launchers/
```
⚠️ **INCOMPLETE AT HANDOFF TIME** — the `image` path update to route through these subfolders was started but the file edit got cut off mid-response. `lib/weapons.ts` needs a full pass to prepend the correct subfolder to every `image` path (e.g. `/weapons/type-25.webp` → `/weapons/ar/type-25.webp`). This is the very next task.

## lib/constants.ts
```ts
export const CATEGORIES: WeaponCategory[] = [/* 9 categories */]

export const CATEGORY_SHOWCASE_WEAPON: Record<WeaponCategory, string> = {
  "Assault Rifle": "m4", Sniper: "dl-q33", LMG: "rpd", SMG: "rus-79u",
  Shotgun: "by15", Marksman: "kilo-bolt-action", Pistol: "mw11",
  Melee: "knife", Launcher: "fhj-18",
} // used for Dashboard category card images

export type DiamondRequirementType = "matches" | "kills" | "objective"
export interface DiamondRequirement { type: DiamondRequirementType; target: number; unitLabel: string }

export const DIAMOND_REQUIREMENTS: Record<WeaponCategory, DiamondRequirement> = {
  "Assault Rifle": { type: "matches", target: 150, unitLabel: "matches" },
  Sniper:          { type: "matches", target: 150, unitLabel: "matches" },
  SMG:             { type: "matches", target: 120, unitLabel: "matches" },
  LMG:             { type: "matches", target: 120, unitLabel: "matches" },
  Marksman:        { type: "matches", target: 120, unitLabel: "matches" },
  Shotgun:         { type: "matches", target: 80,  unitLabel: "matches" },
  Pistol:          { type: "matches", target: 80,  unitLabel: "matches" },
  Melee:           { type: "kills",   target: 500, unitLabel: "kills" },
  Launcher:        { type: "objective", target: 100, unitLabel: "UAVs destroyed" },
}

export function getDiamondRequirementLabel(category) { /* formats the above */ }
```

## lib/seasonal-camos.ts
```ts
export type SeasonalCamoSource = "Seasonal" | "Zombies" | "Tournament" | "Secret Cache" | "Event"
export interface SeasonalCamo { id: string; name: string; texture: string; order: number; source: SeasonalCamoSource }
export const SEASONAL_CAMOS: SeasonalCamo[] = [ /* 32 real entries + 5 placeholders (Camo 32–36, tagged "Seasonal") */ ]
```
Real data sourced from the CODM Fandom wiki (Tournament: 22 camos, Zombies: 1, Secret Cache: 5, Event: 3 — totaling 31, plus **Fractal Visions** added as camo #32 = the newest). 5 placeholder slots remain (Camo 32–36 renumbered — currently the array runs 1–31 real + Fractal Visions at 32 + 4 more TBD placeholders at 33–36) for camos the wiki was missing at time of writing. `order: 1` = oldest (fewest eligible weapons), `order: 36` = newest (all weapons eligible).

**Eligibility logic (already correct, no further work needed):** `camo.order > 36 - weapon.eligibleSeasonalCamos` — as `eligibleSeasonalCamos` varies per weapon (once real per-weapon data is supplied), older camos naturally have fewer eligible weapons and newer camos have more, matching the "season 1 had 89 weapons, season 2 had 90..." growth model the user described.

## lib/default-progress.ts / lib/progress-store.ts
- `progress-store.ts` (`useWeaponProgress` hook) — localStorage-backed (`localStorage key: grindbase-progress`), client-only, includes a one-time backfill effect: any weapon with `diamond: true` but `gold: false` gets Gold auto-applied on load (fixes historically-set data from before the Diamond→Gold cascade existed).

## lib/use-camo-data.ts
Central hook (`useCamoData()`) — merges static weapon list + localStorage progress into `CompleteWeapon[]`, forces `owned: true` on every weapon (Owned concept removed), and computes `stats`:
```ts
{
  totalCompletion, weaponsOwned, weaponsTotal,
  goldCount, platinumCount, diamondCount, damascusUnlocked,
  seasonalOwned, seasonalTotal, seasonalCompletion, matchesRemaining
}
```
`platinumCount` = actual count of weapons with `.platinum === true` (not category count). `damascusUnlocked` = every weapon has Gold.

## lib/starred-camo-store.ts
localStorage-backed (`grindbase-starred-camo`), single starred seasonal camo id, drives the Dashboard's seasonal widget.

## lib/use-seasonal-data.ts
`useSeasonalData()` — computes per-camo `{ ownedCount, totalEligible, eligibleWeapons }` by cross-referencing `SEASONAL_CAMOS` against each weapon's `eligibleSeasonalCamos`. Per-weapon-per-camo ownership stored in `lib/seasonal-store.ts` (localStorage key `grindbase-seasonal-progress`, keyed `"weaponId:camoId"`).

---

# 4. PAGES (all under app/, all client-rendered via matching components/*-content.tsx)

| Route | Auth Required | Purpose |
|---|---|---|
| `/` | No | Landing page. Shows "Sign In" button if logged out; shows Dashboard/Arsenal/Operator nav links if logged in (checked client-side via `supabase.auth.onAuthStateChange`). |
| `/signin?next=X` | No | Google sign-in only page. Redirects to `next` (default `/dashboard`) after auth via `app/auth/callback/route.ts`. |
| `/dashboard` | Yes | Main hub. Total Completion circle (Gold/Diamond dropdown toggle), 4 tier cards (Gold/Diamond/Platinum/Damascus — 2x2 grid, all clickable, all wired to real stats), Seasonal Camo Progress widget (starred camo + "almost complete" row, both with texture images), Recommended Grind (closest-to-Diamond weapons), Weapon Categories grid (uses `CATEGORY_SHOWCASE_WEAPON` for images). |
| `/weapons` | Yes | Arsenal. Search + Category chips + Status chips (All/Owned/Unowned — "Owned/Unowned" here means "has the tier being viewed", not the old ownership concept). Supports `?tier=gold|platinum|diamond|damascus` (shows a big banner with texture/name/%/count) and `?status=...`. Damascus tier link routes to Gold data since Damascus has no separate per-weapon toggle. Diamond+Unowned view shows `DiamondProgressCard` (progress input, not toggle buttons) instead of the normal `WeaponCard`. |
| `/weapons/[id]` | Yes | Individual weapon page. Hero (image, name, category, overall %). 4-tile row: Gold/Platinum/Diamond toggles (lock↔unlock icon crossfade on hover, tier-colored glow when active) + Damascus tile (links to `/damascus`, glows only when fully unlocked). Diamond Progress section with a draggable `<input type="range">` slider + numeric input + ±1/+10 buttons, synced bidirectionally with the toggle (hits target → auto-unlocks Diamond+Gold; drops below target while Diamond is on → un-sets Diamond). Seasonal Camos grid scoped to camos this specific weapon is eligible for, each toggleable. |
| `/damascus` | Yes | Dedicated Damascus unlock experience. Full Arsenal-style layout: hero banner (red/purple/blue gradient), search, category chips, status chips (All/Owned/Unowned, defaults to **Owned**). Grid shows **all 143 weapons** — Gold ones glow with a "Complete" badge and can't be re-selected; non-Gold ones show a selectable checkbox. "Select All" / "Unlock N Weapons" buttons. Clicking Unlock triggers a spinning Award-icon loading animation (~900ms) then a spring-animated celebration modal (auto-closes after 5s, or via X button). |
| `/seasonal` | Yes | Seasonal Vault. Search bar + Source filter chips (Zombies/Tournament/Secret Cache/Event — "Seasonal" chip intentionally removed per user request, though 4 placeholder camos are still internally tagged that source and only surface under "All" until retagged). Grid of camo cards (taller texture thumbnails, star-to-pin toggle, click → `/seasonal/[camoId]`). |
| `/seasonal/[camoId]` | Yes | Per-camo weapon list. Hero banner (texture/name/%/count, same pattern as tier banners). Category chips + Owned/Unowned/All status chips. Grid of eligible weapons for that camo, each with a lock/unlock toggle button. |
| `/profile` | Yes (⚠️ not yet enforced — see Known Issues) | **STILL BROKEN.** Was never fixed after the initial handoff. References `weapons.find(w => w.id === "ak-47")` (wrong id, real one is `"ak47"`), calls `categoryProgress(c)` missing the weapons argument, and reads `cp.avg` which doesn't exist on the return type (`categoryProgress` returns `.completion`, not `.avg`). **Will crash on load.** Needs a full rebuild pass — not started. |

---

# 5. KEY COMPONENTS

- **`components/hud-nav.tsx`** — top nav for all logged-in app pages. Logo (`/logo.png`) + "GRINDBASE" text, Dashboard/Arsenal/Operator pill nav.
- **`components/weapon-card.tsx`** — the reusable Arsenal-style weapon tile. Gold/Plat/Diamond toggle buttons (3-column grid), status badge (Complete/In Progress/Locked), click-through to `/weapons/[id]` (card body is a `<Link>`, toggle buttons `stopPropagation`/`preventDefault`).
- **`components/weapons-explorer.tsx`** — the Arsenal page's client logic. Owns all cascade rules:
  - Diamond ON → forces Gold ON.
  - Gold OFF → forces Platinum OFF + Diamond OFF, and cascades Platinum-off across the whole category if that category had Platinum.
  - Platinum toggle (either direction) cascades Gold+Platinum, or just Platinum-off, across every weapon in that category.
  - Renders the tier banner (texture, name, %, count, category-appropriate requirement text for Diamond) when `?tier=` is present.
- **`components/diamond-progress-card.tsx`** — used only in the Diamond+Unowned Arsenal view. Shows a weapon with its category's Diamond target, a numeric progress input, ±1/+10/-1 controls. Auto-unlocks Diamond when target is hit (via `weapons-explorer.tsx`'s `handleProgressChange`, which dynamically imports `DIAMOND_REQUIREMENTS`).
- **`components/damascus-content.tsx`** — see page table above.
- **`components/dashboard-content.tsx`** — see page table above. Notable: `getRecommendedGrinds` in `lib/calculations.ts` no longer filters by `owned` (that concept is gone) — just `!weapon.gold`, sorted by completion desc, top 3.
- **`components/seasonal-content.tsx`** / **`components/seasonal-camo-explorer.tsx`** — Vault + per-camo pages.
- **`components/weapon-detail-content.tsx`** — see page table above. Most recently rebuilt component; has the lock/unlock hover treatment, drag slider, full cascade logic duplicated locally (⚠️ **this cascade logic is now duplicated in three places** — `weapons-explorer.tsx`, `damascus-content.tsx` doesn't need it since it only sets Gold, and `weapon-detail-content.tsx`. Worth extracting to a shared helper in `lib/` if more cascade rules get added — not done yet, flagging as tech debt).
- **`components/circular-progress.tsx`** — now supports a `tone?: "gold" | "diamond"` prop that swaps the SVG gradient, track color, text color, and glow filter. Used by Dashboard's Total Completion widget with the Gold/Diamond `<Select>` dropdown.
- **`components/gold-bar.tsx`** — the reusable progress bar. Supports `tone: "gold" | "platinum" | "diamond" | "muted" | "damascus"` (damascus = red→purple→blue gradient). ⚠️ **Important usage gotcha that caused repeated bugs this session:** `className` passed to `<GoldBar>` styles the **inner fill bar**, not the outer track wrapper. Passing spacing utilities like `mt-2`/`mt-3` directly as `className` pushes the fill down and clips it via the track's `overflow-hidden`, making the bar look invisible/not glowing. **Correct pattern:** wrap `<GoldBar>` in a plain `<div className="mt-2">` for spacing, and only pass bar-specific classes (like `h-2`) as `className` on the component itself. This bug recurred at least 4 times across different files — worth fixing at the component level (e.g. accept a separate `wrapperClassName` prop) if it keeps tripping people up.
- **`components/google-sign-in.tsx`** — `<GoogleSignIn next="/dashboard" label="Sign In" />`, both props optional, passes `next` through the OAuth redirect URL to `app/auth/callback/route.ts`.

---

# 6. AUTH SETUP (Supabase)

- `lib/supabase/client.ts` / `lib/supabase/server.ts` — standard `@supabase/ssr` browser/server clients.
- **`proxy.ts`** (project root) — ⚠️ this is **not** `middleware.ts`. This project is on Next.js 16, which renamed the middleware convention to `proxy.ts` exporting a function named `proxy`. (We flip-flopped on this mid-project — briefly renamed to `middleware.ts` incorrectly, then reverted. `proxy.ts` exporting `proxy` is confirmed correct and currently in place.)
- `app/auth/callback/route.ts` — exchanges the OAuth code for a session, then redirects to `?next=` param (defaults to `/dashboard`).
- `app/signin/page.tsx` — the only page with a sign-in button now; landing page conditionally shows nav links vs. sign-in button based on live auth state.
- Every protected page does a **server-side** `supabase.auth.getUser()` check in its `page.tsx` and `redirect("/signin?next=/whatever")` if logged out. `/profile` does **not** have this guard yet (page is broken anyway, needs rebuild).
- **Known historical gotcha:** the Supabase anon key must be the **legacy JWT format** (`eyJhbGci...`), not the newer `sb_publishable_...` format — the newer format silently broke server-side `getUser()` calls with this project's `@supabase/ssr` version. If auth ever breaks mysteriously again with cookie-exists-but-session-not-found symptoms, check `.env.local`'s `NEXT_PUBLIC_SUPABASE_ANON_KEY` format first.

---

# 7. BRANDING

- Site name: **GrindBase**. Tab title: "GrindBase: CODM Camo Tracker". Meta description mentions GrindBase (can't be bolded — plain text field).
- Logo file: `public/logo.png`, used in `app/page.tsx` header, `components/hud-nav.tsx`, `app/signin/page.tsx` (all three needed manual updates — no shared header component exists, so any future logo/branding change must be applied in all three places).
- Favicon: user was instructed to place at `app/favicon.ico` or `app/icon.png` — confirm this actually landed and is rendering (last known status: user confirmed it was showing correctly after a hard refresh + dev server restart).
- Color tokens (in `app/globals.css` `:root`): `--gold`, `--gold-bright`, `--platinum`, `--diamond` (all defined). Damascus has **no CSS variable** — it's applied ad-hoc via Tailwind gradient utility classes (`from-red-500 via-purple-400 to-blue-500` and similar) wherever needed, plus dedicated glow classes:
```css
.glow-gold-sm, .glow-diamond-sm, .glow-platinum-sm, .glow-damascus-sm
```
all defined in `app/globals.css` under `@layer utilities`.

---

# 8. CODING STYLE / USER PREFERENCES (unchanged from original handoff, still in force)

- Keep responses short, no long explanations/theory.
- Work step by step, one file at a time.
- Always give exact Search/Replace/full-file instructions — never partial snippets when a whole file is requested.
- User is a beginner — spell out terminal steps explicitly (open terminal, exact command, what success looks like).
- User frequently copy-pastes incorrectly (dropped characters like `Record<` → `Record`, duplicated whole-file pastes, missing closing braces) — always worth a quick sanity check/offer to see the current file state before assuming an edit didn't apply.

---

# 9. KNOWN ISSUES / UNFINISHED WORK (priority order for next session)

1. **`lib/weapons.ts` image paths** — mid-edit at handoff. Every weapon's `image` field needs its category subfolder prepended (e.g. `/weapons/ar/`, `/weapons/snipers/`, `/weapons/lmg/`, `/weapons/smg/`, `/weapons/shotgun/`, `/weapons/marksman/`, `/weapons/pistols/`, `/weapons/melee/`, `/weapons/launchers/`). The actual image files also need to be moved into those subfolders in `public/weapons/`.
2. **`/profile` page is fully broken** — wrong weapon id lookup, wrong function signature calls, references a non-existent `.avg` field. Needs full rebuild using the same patterns as Dashboard (favorite weapon card, class breakdown via `categoryProgress(weapons, category)`, stat list). Also needs the auth guard added (currently the only main app page without one).
3. **Real per-weapon `eligibleSeasonalCamos` values** — every weapon is currently hardcoded to `36` (placeholder). User said they'd provide the actual weapon release order later so older/newer weapons get correct varying counts (per the "season 1 had 89 weapons, season 2 had 90..." growth model already built into the eligibility formula).
4. **5 seasonal camo placeholder slots** (currently tagged `source: "Seasonal"`, generic names "Camo 33"–"Camo 36" or similar) still need real names/sources — these are invisible in the Source filter now since the "Seasonal" chip was removed; only reachable via "All". User may want these retagged to a real source once identified, or the "Seasonal" chip restored.
5. **No real Diamond match-tracking automation** — progress is 100% manual entry (drag slider / +1/+10 buttons / number input) per weapon. No connection to any actual match-count data source.
6. **No Supabase-synced progress** — all camo/seasonal/starred data lives in localStorage only, per-browser, no cross-device sync, no backup. Phase 5 from the original roadmap (Supabase save/sync) never started beyond auth itself.
7. **Cascade logic duplication** — the Gold/Platinum/Diamond interconnection rules exist independently in `weapons-explorer.tsx` and `weapon-detail-content.tsx`. Any future rule change needs to be applied in both places or refactored into a shared `lib/` helper.
8. **`GoldBar` className footgun** — documented in section 5 above; recurring bug source, consider fixing at the component API level.
9. **No PWA / offline support** — never started (was Phase 7 in original roadmap).
10. **Weapon detail page's Damascus tile** — links to `/damascus` but that page doesn't scroll to or highlight the specific weapon you came from; minor UX polish opportunity, not a bug.

---

# 10. FUTURE ROADMAP (updated)

## Immediate next steps
1. Finish `lib/weapons.ts` image subfolder migration (in progress).
2. Rebuild `/profile` page.
3. Get real per-weapon seasonal eligibility data + remaining seasonal camo names.

## Mid-term
4. Supabase-backed progress sync (replace localStorage as source of truth, keep localStorage as cache/offline fallback).
5. Real weapon renders replacing any remaining placeholder images.
6. Extract shared cascade-logic helper to `lib/camo-cascade.ts` or similar.

## Long-term (original roadmap, still valid)
7. Achievements, forecasts, milestones.
8. PWA + offline support + notifications.

---

# 11. QUICK REFERENCE — FILE MAP

```
app/
  page.tsx                          — landing (client, auth-aware header)
  signin/page.tsx                   — sign-in only page
  auth/callback/route.ts            — OAuth callback handler
  dashboard/page.tsx                — server guard → DashboardContent
  weapons/page.tsx                  — server guard → WeaponsExplorer
  weapons/[id]/page.tsx             — server guard → WeaponDetailContent
  damascus/page.tsx                 — server guard → DamascusContent
  seasonal/page.tsx                 — server guard → SeasonalContent
  seasonal/[camoId]/page.tsx        — server guard → SeasonalCamoExplorer
  profile/page.tsx                  — ⚠️ BROKEN, no guard, not rebuilt
  layout.tsx, globals.css, favicon

components/
  hud-nav.tsx, google-sign-in.tsx
  weapon-card.tsx, weapons-explorer.tsx, diamond-progress-card.tsx
  weapon-detail-content.tsx
  dashboard-content.tsx
  damascus-content.tsx
  seasonal-content.tsx, seasonal-camo-explorer.tsx
  circular-progress.tsx, gold-bar.tsx
  ui/ (select, input, button, card, avatar, badge, progress, separator, slider, tabs, tooltip)

lib/
  types.ts, progress.ts, weapons.ts, default-progress.ts
  constants.ts (DIAMOND_REQUIREMENTS, CATEGORY_SHOWCASE_WEAPON, CATEGORIES)
  seasonal-camos.ts (SEASONAL_CAMOS)
  progress-store.ts (useWeaponProgress), use-camo-data.ts (useCamoData)
  seasonal-store.ts (useSeasonalProgress), use-seasonal-data.ts (useSeasonalData)
  starred-camo-store.ts (useStarredCamo)
  data.ts (stats, tierMeta, categoryProgress, getWeapon, statusOf, recommendedGrinds — legacy re-export layer)
  calculations.ts (getOverallCompletion, getGoldCount, getPlatinumCount, getDiamondCount, hasDamascus, getCategoryProgress, getRecommendedGrinds)
  utils.ts (cn)
  supabase/client.ts, supabase/server.ts, supabase/middleware.ts (updateSession, called from proxy.ts)

proxy.ts (project root)             — Next.js 16 middleware convention
```

---

**End of handoff.** Next session should start by confirming the `lib/weapons.ts` image path migration and public/weapons/ folder restructure, then move to fixing `/profile`.
