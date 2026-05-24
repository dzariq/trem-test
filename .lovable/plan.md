## Goal

When a parent opens a CCA session that has no notes posted yet, replace the row-by-row "No title set / No notes yet / None / No images attached / No PDFs attached" placeholders with a single friendly empty state.

Teachers (edit mode) keep seeing every section so they can still fill them in.

## Scope

File: `src/components/cca/SessionNotesSheet.tsx` — body area only. Header (date, time, location) is unchanged.

## Logic

In the body, compute:

```ts
const isParentView = !canEdit;
const hasAnyContent =
  hasTitle ||
  !!session.description?.trim() ||
  !!session.requirements?.trim() ||
  images.length > 0 ||
  pdfs.length > 0;
const showEmptyState = isParentView && !attLoading && !hasAnyContent;
```

- If `showEmptyState` is true → render a single centered empty state in place of the 5 sections:
  - Soft icon (e.g. `FileText` in a muted circle)
  - Heading: "No notes for this session yet"
  - Sub-text: "The teacher hasn't shared any notes, requirements, or attachments for this session. Check back later."
- Otherwise → render the existing sections exactly as today (so teachers, and parents on sessions that do have content, keep current behaviour).

Per-section "No images attached" / "No PDFs attached" italic lines stay only in the teacher (canEdit) view; for the parent view we already short-circuit via the empty state, so no extra branching needed there.

## Out of scope

- No changes to `SessionDetailsSheet`, attachments hook, or data model.
- No copy changes for teachers.
