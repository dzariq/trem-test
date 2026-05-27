
## Lottie file check

The uploaded `.lottie` is a valid dotLottie bundle (4.2 KB, contains `manifest.json` + 1 animation JSON, ~45 KB uncompressed). Safe to ship as an app asset — small enough to import directly.

## Plan

### 1. Add the asset
- Copy the uploaded file to `src/assets/lottie/app-loader.lottie` so it gets bundled & hashed by Vite.

### 2. Install dotLottie player
- Add `@lottiefiles/dotlottie-react` (official renderer for `.lottie` files, ~30 KB gzip, supports autoplay/loop).

### 3. Create a reusable component
- New `src/components/common/LottieLoader.tsx` exporting:
  - `<LottieLoader size={32|48|64|...} className?="" />` — renders the dotLottie player at the given size, autoplay + loop, with `aria-label="Loading"`.
  - `<FullScreenLottieLoader />` — centers the loader in a `min-h-screen` container with the app background (drop-in for the current `Loader2` full-screen blocks in `ParentStudentGuard`, `TeacherGuard`, `App.tsx` Suspense fallback, route error/loading states).

### 4. Replace existing spinners
Swap every `Loader2 … animate-spin` usage to the new component. Two flavors:

- **Full-screen / route-level loaders** → `<FullScreenLottieLoader />`
  Files: `src/App.tsx` (Suspense fallback), `src/components/auth/ParentStudentGuard.tsx`, `src/components/auth/TeacherGuard.tsx`, page-level loading blocks in `TeacherHandbookPage`, `TeacherTimetablePage`, `ParentTimetablePage`, etc.

- **Inline loaders** (buttons, small cards, sheets) → `<LottieLoader size={20} />` (or 16/24 to match the previous icon size). Applies to all the dialogs/sheets/forms in the ripgrep list (CCA sheets, lesson plan forms, notifications drawer, etc.).

A search-and-replace pass over the ~30 files that import `Loader2` from `lucide-react` for spinner purposes. `Loader2` imports used as static icons (not spinning) — if any — are left alone.

### 5. Verify
- Typecheck.
- Visually confirm on `/parent/profile` and `/login` that the loader animates.

## Technical notes
- dotLottie format requires `@lottiefiles/dotlottie-react`, not `lottie-react` (the latter only handles `.json`). Using the official package keeps file size minimal and avoids extracting the JSON manually.
- Asset imported as `import loaderSrc from "@/assets/lottie/app-loader.lottie?url"` so Vite serves it with a hashed URL; the player loads it via `src={loaderSrc}`.
- No design-token changes; loader inherits surrounding background. Default size 48px to roughly match current `h-8 w-8` spinner footprint.
