## Goal
When parents (and teachers) view a CCA activity or session, surface the **venue image** if a venue is tagged, and continue to use the **club's own uploaded photo** when present. Today only the activity's `image_url` is shown; venue images (`venues.image_url`) are loaded nowhere on the CCA surfaces.

## Current state
- `cca_activities` has `image_url` (club's own photo) + `venue_id` (FK to `venues`) + `location_id` (FK to `school_locations`).
- `cca_sessions` has `venue_id` + `location_id`, but no own image.
- `venues.image_url` exists in DB but is never fetched by any CCA hook.
- `useCcaActivities`, `useEligibleCcaActivities`, `useCcaSessions`, `useUpcomingCcaSessions` only join `school_locations(name)` — never `venues`.
- `CcaDetailsSheet` already renders `activity.imageUrl` via `<CcaActivityImage>`.
- `SessionDetailsSheet` renders no image today.

## Image precedence (the rule we'll use everywhere)
1. **Club's own photo** (`cca_activities.image_url`) — highest priority. This is the existing behaviour.
2. **Venue image** (`venues.image_url` joined via `venue_id`) — used when no club photo is set.
3. Otherwise → the existing placeholder `<CcaActivityImage>` already shows.

For sessions: a session inherits the activity's photo; if the session itself overrides the venue (`cca_sessions.venue_id`) we prefer that session's venue image over the activity venue image, but the activity's own `image_url` still wins if set.

## Changes

### Hooks (extend SELECT + types)
- `src/hooks/useCcaActivities.ts` — add `venue:venues!cca_activities_venue_id_fkey(id, name, image_url)` to the select, map to `activity.venue = { id, name, imageUrl }`. Add `venue` to the `CcaActivity` type.
- `src/hooks/useEligibleCcaActivities.ts` — same join + same mapping for the parent-facing path.
- `src/hooks/useCcaSessions.ts` — add `venue:venues!cca_sessions_venue_id_fkey(id, name, image_url)` to the session select.
- `src/hooks/useUpcomingCcaSessions.ts` — same join for the parent home widget.

(Joins are read-only and parent RLS already allows reading `venues`; verify with one `pg_policies` check before shipping. If RLS blocks parent reads, add a read-only policy in a small migration.)

### UI
- `src/components/cca/CcaDetailsSheet.tsx` — change `displayImageUrl` to fall back to `activity.venue?.imageUrl` when the club has no own photo. No other layout change.
- `src/components/cca/SessionDetailsSheet.tsx` — add a hero image at the top using the same precedence: session venue image → activity image → activity venue image. Reuse `<CcaActivityImage>` so cache-busting + placeholder behave identically. Keep it compact (the sheet is already information-dense).
- (Optional polish, low risk) `src/components/cca/CcaActivityCard.tsx` — keep the card image as-is (activity's own photo) so list density doesn't change.

## Out of scope
- No DB migrations unless the RLS check shows parents can't read `venues`.
- No new image upload flow; venue images are uploaded elsewhere already.
- No changes to lesson plans, attendance, or any non-CCA surface.

## Verification
1. Pick one activity with `image_url = NULL` and `venue_id` set whose venue has an image → parent CCA detail shows the venue image.
2. Pick one activity with both set → parent detail still shows the club's own photo (precedence preserved).
3. Open a session for the same activity → SessionDetailsSheet shows a hero image with the same precedence.
4. Pick an activity with neither → existing placeholder still renders, nothing broken.
5. Confirm no TS errors and no new console/network errors after build.
