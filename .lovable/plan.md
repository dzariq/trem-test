Wire the parent mobile app into the new exam-result publishing system so results only appear after admins publish from the sibling project.

## 1. Notification type: `exam_results_published`

In `src/components/NotificationsDrawer.tsx`:
- Add `"exam_results_published"` to the `NotificationType` union.
- `getTypeIcon` → `FileText` (matches `report_card`).
- `getTypeColor` → `bg-amber-500 text-white`.

In `src/hooks/useNotifications.ts`:
- No parent-suppression entry — the type is parent-facing.
- The DB row carries `link_to = /report-cards`; remap to the parent app's actual route before navigation (parent report card lives at `/parent/academic`). Easiest: in `NotificationsDrawer.handleNotificationClick`, when `notification.type === "exam_results_published"`, replace `link_to` `/report-cards` with `/parent/academic?section=report-card&publication=<id>` (parse `publication_id` out of `source_key` `exam_publish:<id>`).

## 2. "Updated results" badge for re-publish

Track viewed publish ids per period in `localStorage` under `exam_publish_viewed` keyed by `academic_period_id` → last-viewed `publication_id`.

- When a notification with `source_key = exam_publish:<pub_id>` is clicked, write the mapping (period inferred via lookup against the publication, or carry it in the notification `data` if the sibling project includes it; otherwise read it from `exam_period_publications` after click).
- When rendering the notification list, if the latest `exam_results_published` for a given period has a `publication_id` newer than the stored value AND the user has any older viewed entry for the same period, show an `Updated results` pill next to the title.

Adds one small helper module: `src/lib/notifications/examPublishViewed.ts` (get/set/compare).

## 3. Drop the old `completed` status assumption

`academic_periods.status` enum is now only `open` | `closed`. Search the parent codebase for any condition that special-cases `'completed'` and treat it as `'closed'`. Current grep shows no parent-app references to `'completed'`, but the report-card hook reads `academic_periods` directly — verify and adjust if any client-side filter assumes the old value.

## 4. Gate parent Results view on publication existence

In `src/hooks/useStudentReportCard.ts` (the parent report-card data source for `/parent/academic`):
- After fetching the candidate `academic_period_id`s, query `exam_period_publications` filtered by those `academic_period_id`s.
- Drop any period that has no publication row from the returned exam periods, and expose `publishedAt` on each surviving period for UI labelling.
- If everything is filtered out, the existing "no data" UI in `AcademicPage.tsx` handles the empty state — no UI change required.

If RLS blocks parents from reading `exam_period_publications` directly, we will need a parent-readable view or RPC (`get_published_periods_for_student(student_ic)`); flag this back to the sibling project owner before shipping the migration.

## Cross-app coordination

This change only consumes the shared backend additions. It assumes:
- `notifications.type` accepts the string `exam_results_published` (notifications table type is text, so no migration needed here).
- `exam_period_publications` is readable by parents for their own children (or via a helper RPC). If not, request it on the sibling project before merging.

## Files touched

- `src/components/NotificationsDrawer.tsx` — type + icon + color + click remap + updated-results badge
- `src/hooks/useNotifications.ts` — none expected (parent-facing already passes through)
- `src/hooks/useStudentReportCard.ts` — filter periods by publication existence
- `src/lib/notifications/examPublishViewed.ts` — new helper for re-publish tracking

## Out of scope

- Creating any DB migration (the sibling project owns the publication schema)
- Teacher portal handling (teachers publish, not consume)
- Push notification copy changes