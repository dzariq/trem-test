## Issue

PDF attachments inside the announcement detail view do not render on top of the screen because of a z-index conflict:

- `AnnouncementDrawer` overlay renders at `z-[200]`.
- `PDFViewerDialog` (Radix `DialogContent` + overlay) renders at `z-[100]`.

So when the user taps a PDF chip inside an open announcement, the PDF dialog opens **behind** the full-screen drawer and looks like nothing happened (or just dims slightly). The same applies to the "PDF Attachments" banner (`AnnouncementPdfBanner`), which has its own internal `PDFViewerDialog` instance.

The standalone usages (`QuickLinks`, `TeacherTimetablePage`, etc.) are fine because nothing else covers them.

## Fix

Make sure tapping any PDF inside an opened announcement reliably opens an inline PDF viewer above the drawer.

### 1. `src/components/PDFViewerDialog.tsx`
- Add an optional `zIndexClassName?: string` prop (default unchanged).
- Apply it to `DialogContent` (and rely on the same wrapper for the overlay via a sibling class) so callers stuck under high-z overlays can lift it to e.g. `z-[300]`.
  - Simplest implementation: pass a className like `!z-[300]` into `DialogContent`. Tailwind's `!` ensures it overrides the base `z-[100]`. Overlay z-index is handled by Radix; we'll also pass an overlay class via a new prop or wrap in a portal-friendly container — minimal change: add `overlayClassName` to our local `DialogContent` (already a thin wrapper) so we can raise both layers.
- No behavior change for existing call sites (they omit the prop).

### 2. `src/components/announcements/AnnouncementPdfBanner.tsx`
- Accept an optional `onOpenPdf?: (pdf: AnnouncementAttachment) => void` prop.
- When provided, the chip's onClick calls `onOpenPdf(pdf)` instead of opening the local `PDFViewerDialog`.
- Only mount the local `PDFViewerDialog` when no `onOpenPdf` handler is supplied (keeps standalone usage working).

### 3. `src/components/AnnouncementDrawer.tsx`
- Pass `onOpenPdf={openPdf}` to `<AnnouncementPdfBanner ... />` so the banner uses the drawer's existing `pdfDialog` state.
- Render the drawer's `PDFViewerDialog` unconditionally (currently it only renders in the `!isOpen` branch). Move the JSX so it sits next to the drawer node and is always mounted.
- Pass `zIndexClassName="!z-[300]"` (or equivalent) to that `PDFViewerDialog` so it stacks above the `z-[200]` drawer.

## Verification

1. Open an announcement that has a PDF attachment (and one with the "PDF Attachments" banner).
2. Tap the PDF chip / banner item → the inline PDF viewer must appear above the announcement view, allow paging, Open, Download, and close back to the announcement.
3. Tap a PDF from a list outside the drawer (e.g. `QuickLinks` Student Timetable, `TeacherTimetablePage`) → still works as before.
4. Confirm no regression in other dialogs (no global z-index change).

## Out of scope

- No backend / Supabase changes.
- No styling of the PDF viewer beyond the z-index override.
- No change to download / "open in browser" behavior.