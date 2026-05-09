## Goal

Update the announcement detail/preview screens to handle the new admin authoring format:
- `announcements.content` is now sanitized HTML (TipTap output), not plain text.
- `announcement_attachments.is_primary = true` marks the cover image.
- PDF attachments should appear as a banner above the title.
- List/card snippets must strip HTML tags.

No DB changes. Existing data hooks are reused.

## Changes

### 1. Add sanitizer dependency

- Install `dompurify` and `@types/dompurify`.

### 2. Extend data layer (`src/data/announcements.ts`)

- Add `is_primary?: boolean` to `AnnouncementAttachment` type.
- In `listAnnouncements` and `getAnnouncementById`:
  - Pass `is_primary` through from the attachment row.
  - Cover-image resolution order:
    1. attachment with `is_primary = true` and image type
    2. else: first image attachment (current fallback)
  - Keep the resolved cover URL on `announcement.image` (already used by all cards).
- Add a helper `stripHtml(content: string): string` and use it inside `buildSnippet` so existing snippets are HTML-safe.

### 3. New shared HTML renderer

- New file `src/components/announcements/AnnouncementHtmlContent.tsx`:
  - Props: `html: string`, `coverUrl?: string | null`.
  - Sanitizes with DOMPurify, allowlist exactly: `p, br, strong, em, u, s, b, i, ul, ol, li, h1, h2, h3, h4, blockquote, code, pre, a, img, span, div`. Allowed attrs: `href, target, rel, src, alt, title, class, data-cover`. Force `target="_blank"` + `rel="noopener noreferrer"` on `<a>`.
  - Before render, removes any `<img>` whose `src === coverUrl` OR `data-cover="true"` to avoid duplicate cover.
  - Uses `dangerouslySetInnerHTML` inside a `prose prose-sm` themed wrapper (semantic tokens).

### 4. New PDF banner component

- New file `src/components/announcements/AnnouncementPdfBanner.tsx`:
  - Accepts `attachments` and filters by `file_type` matching `/pdf/i` (with filename fallback).
  - Renders a red-tinted strip with one chip per PDF (filename + download icon). Tap opens the existing `PDFViewerDialog`.
  - Returns `null` if no PDFs.

### 5. Update `AnnouncementDetailPage` (`src/pages/AnnouncementDetailPage.tsx`)

Reorder to: PDF banner → Title + badges → Cover image → HTML body → Other attachments → Acknowledge button.

- Replace the manual paragraph/`**bold**` parsing with `<AnnouncementHtmlContent>`.
- Render `<AnnouncementPdfBanner>` at the top.
- Cover image still uses `announcement.image` (now driven by `is_primary`).
- "Other attachments" list = attachments where not PDF AND url !== cover URL.

### 6. Update `AnnouncementDrawer` (`src/components/AnnouncementDrawer.tsx`)

- Same reordering: PDF banner row at the top of the scroll area, above the hero image.
- Replace the existing body rendering (currently just shows attachments / no body text) — add `<AnnouncementHtmlContent html={currentAnnouncement.content} coverUrl={heroImage} />` below the title/date/quick-links.
- Cover image continues to come from `firstImageAttachment` / `announcement.image`, but resolution now respects `is_primary` via the data layer.
- Quick-link chips: exclude PDFs (handled by banner) and exclude the cover image.

### 7. Snippet stripping in cards

Already covered centrally by updating `buildSnippet` in step 2, so:
- `AnnouncementListCard`, `PinnedAnnouncementCard`, `FeaturedAnnouncementCard`, `AnnouncementCarousel`, notification aggregation — all read `snippet` and need no per-component change.
- Spot-check any place that reads `content` directly for previews and switch it to `snippet` or `stripHtml(content)`.

## Out of scope

- No database migration.
- No changes to admin authoring or storage rules.
- No change to acknowledgement / read-tracking logic.

## Technical notes

- DOMPurify config:
  ```ts
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p","br","strong","em","u","s","b","i","ul","ol","li","h1","h2","h3","h4","blockquote","code","pre","a","img","span","div"],
    ALLOWED_ATTR: ["href","target","rel","src","alt","title","class","data-cover"],
  });
  ```
- Use a DOMPurify `afterSanitizeAttributes` hook to force `target=_blank` + `rel=noopener noreferrer` on links.
- Cover de-dupe: parse sanitized HTML in a `DOMParser`, drop matching `<img>`, serialize back — done inside `AnnouncementHtmlContent`.
