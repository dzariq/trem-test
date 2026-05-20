# Visa Module — Parent App

Per the uploaded spec. Tables (`parent_visa_records`, `parent_visa_periods`, `student_visa_records`, `student_visa_periods`) already exist in Supabase — read-only from parent app.

> Note: you mentioned "DNA, grades, handbook, timetable" but the actual home quick row currently shows **Info, Support, Awards, CCA** (and Grades when the feature flag is on). The Visa icon will be added to this same row.

## 1. Gating hook
Create `src/hooks/useHasVisaModule.ts`:
- React Query, `staleTime: Infinity`, keyed by `user.id`
- Returns `true` if parent has any row in `parent_visa_records` OR any of their linked students (via `student_guardians`) has a row in `student_visa_records`
- Hidden entirely otherwise — no nationality check

## 2. Dynamic quick-link row (the main ask)
Edit `src/components/home/QuickLinks.tsx`:
- Build the `quickLinks` array inside the component so it can react to `useHasVisaModule()` and the existing `FEATURES.gradeAnalysisParent` flag
- Append a Visa item only when the hook returns true:
  - icon: `Stamp` (lucide), label: `Visa`, path: `/parent/visa`
  - colors: `bg-sky-100` / `text-sky-600` (distinct from existing tiles)
- Keep everything on **one row** as count grows (4 → 5 → 6):
  - Container stays `flex justify-around`
  - Switch the tile sizing to responsive: icon box `w-12 h-12 sm:w-14 sm:h-14`, icon `h-6 w-6 sm:h-7 sm:w-7`, gap `gap-0.5`
  - Tighten horizontal padding (`px-0.5`) so 6 tiles fit on a 360px width without wrapping
- No layout change when Visa is hidden — current look preserved

## 3. `/parent/visa` page
New `src/pages/VisaPage.tsx` + route in `src/App.tsx` (under the parent layout), guarded by `useHasVisaModule()` (redirect to `/` when false):
- **My Visa** section (only if parent has records) — list `parent_visa_periods` newest first: pathway badge, sticker/ref no, issue → expiry, status chip (Active / Expiring / Expired / Renewal in progress / Cancelled), bond + insurance summary, notes
- **My Children's Visas** — one section per linked student that has `student_visa_records`, same card layout, student name as header
- Footer note: *"To update visa details, please contact the school office."* No edit controls
- React Query `staleTime: Infinity` + `postgres_changes` subscriptions on both `*_periods` tables invalidating the queries
- Status → token mapping per spec: overdue/≤7d → destructive, 8–30d → warning, 31–90d → muted, pending_renewal → sky/info, cancelled → muted + strikethrough

## 4. Notifications integration
In the existing notifications list/drawer (`useNotifications` consumers — `NotificationsDrawer`, `NotificationsPage`):
- When `type === 'visa'` render a `Stamp` icon
- Tap routes to `link_to` (already `/parent/visa`) — confirm existing deep-link handler covers this

## Out of scope
Editing visa data, bond/insurance expiry tracking, push triggers (admin app already dispatches).

## Technical notes
- Pure read-only — no migrations
- Hook lives in `src/hooks/`, data fetchers in `src/data/visa.ts`
- Reuse `AppLayout` + `AppHeader` for page chrome to match other parent pages
