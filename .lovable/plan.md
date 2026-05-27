## Goal
Make the announcement detail view header consistent regardless of entry point (Home featured carousel vs. Announcements list page), and add a clear top-of-screen label so users always know they're in an announcement.

## Current inconsistency
- From **Home → featured announcement**: header shows **Back** (left) + **See All** (right). See All takes the user to the full Announcements page.
- From **Announcements page → tapping a card**: header shows only **Back** (left). No See All, because the parent already is the list.

This makes the chrome shift depending on entry path, which feels broken.

## Proposed design (recommended)

Single standardized header for `AnnouncementDrawer`, always rendered the same way:

```text
[ ‹ Back ]       Announcements         [ ⊟ See All ]
```

- **Left:** Back pill (existing) — pops the drawer.
- **Center:** Small section label **"Announcements"** (uppercase tracked, muted foreground). This is the section/context label — not the post title. The post title (e.g. "Collinz DNA") stays where it is today, directly under the hero image, so it keeps its visual weight as the headline of the content.
- **Right:** **See All** pill, always visible. Behaviour:
  - If opened from Home → navigates to `/parent/announcements` (current behavior).
  - If opened from the Announcements list → closes the drawer (returns to the list, which *is* See All). Same destination semantically, zero dead-ends.

This keeps the header symmetric, removes the conditional chrome, and gives users a consistent "escape to the full list" affordance from anywhere.

### Why label "Announcements", not the post title
- Header chrome should describe **where you are**, content area should describe **what you're reading**. Duplicating the post title in the header competes with the H1 directly below the image and adds no info.
- The post title can be long (truncation in the header looks bad on 390px width, especially sandwiched between two pills).
- "Announcements" mirrors the pattern used elsewhere in the app for section context.

## Technical changes
- `src/components/AnnouncementDrawer.tsx`
  - Always render the See All button; remove the `{onSeeAll && …}` gate.
  - Add a centered "ANNOUNCEMENTS" label in the header row (small caps, `text-muted-foreground`, `tracking-wide`).
  - When `onSeeAll` is not provided, See All falls back to `onClose()` so the list-page entry point gracefully returns to the list.
- `src/pages/AnnouncementsPage.tsx` (and any other consumer that omits `onSeeAll`): no change required — the drawer handles the fallback. Optionally pass an explicit `onSeeAll={onClose}` for clarity.
- No backend or data changes.

## Out of scope
- Restyling the post title, date/page pills, or PDF attachments block.
- Changing navigation outside the announcement detail view.
