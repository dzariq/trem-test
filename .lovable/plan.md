## Home Page Mobile-Readiness Audit (Capacitor / Play Store + App Store)

I checked the wrapper setup and both home pages (`/parent` `HomePage.tsx` and `/teacher` `TeacherHomePage.tsx`). Overall the home page is in good shape for a native wrapper. A few small things to tighten before store submission.

### What's already good

**Capacitor wrapper**
- `capacitor.config.ts`: `appId: com.collinz.school`, `appName: Collinz School`, `webDir: dist`, splash configured (1.5s, fade), `ios.contentInset: "always"`, no live-reload `server.url` (correct for store builds).
- Installed: `@capacitor/core` 8, `android` 8, `ios` 8, `app`, `splash-screen`, `status-bar`, `browser`, `share`, `filesystem`, `preferences`, `assets`.
- `src/main.tsx`: status bar overlays WebView, light style, transparent bg, splash hidden after first paint.
- `src/App.tsx`: `useAndroidBackButton()` wired at app root.

**HTML / PWA shell**
- `index.html`: `viewport-fit=cover`, theme-color, apple-mobile-web-app meta tags, app title, format-detection off, manifest + icons linked.
- `public/manifest.webmanifest`: standalone, portrait, 192/512 icons + maskable, theme/background colors set.
- `public/icons/`: `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` present.

**Safe-area system (notch / home indicator)**
- `index.css` defines `--safe-top/bottom/left/right` with the project's `--safe-reduce: 5px` rule.
- Utilities `safe-pt`, `safe-pb`, `safe-px`, `bottom-tabbar` used consistently.
- `AppHeader` uses `safe-pt`; `AppLayout`/`TeacherAppLayout` use `pb-[calc(5rem+var(--safe-bottom))] safe-px` and `overflow-x-hidden` so the bottom nav clears the home indicator.
- Bottom navs are `fixed`, `z-50`, hide on scroll-down.

### Gaps to fix before wrapping

1. **No native projects yet.** `android/` and `ios/` directories don't exist. Before the first store build the user needs to run (locally, after exporting to GitHub):
   - `npm install`
   - `npx cap add ios` and/or `npx cap add android`
   - `npm run build && npx cap sync`
   - Generate native icons + splash from a 1024px source via `npx capacitor-assets generate` (the `@capacitor/assets` package is already installed; just need a source asset).

2. **Splash background mismatch.** `capacitor.config.ts` splash `backgroundColor: "#f5f5f5"` and manifest `background_color: "#f5f5f5"` but `theme_color` is `#0a8a5c` (brand green). Decide one: either keep neutral grey or switch splash to the brand green so the launch experience matches the in-app theme.

3. **External links / PDFs.** Home page opens `PDFViewerDialog` for the Student Timetable. On native iOS/Android, in-app PDF rendering via blob can be flaky — confirm `PDFViewerDialog` already uses `@capacitor/browser` or `Filesystem` + native viewer (it should, given `@capacitor/browser` is installed). Worth a single device test.

4. **Hardware back button on home.** `useAndroidBackButton` is global, but on the root `/parent` and `/teacher` routes Android's back should exit the app (not navigate to a blank previous entry). Verify the hook treats home routes as "minimize/exit" rather than `history.back()`.

5. **Tap-target sizing on `QuickLinks`.** Each tile is `w-11 h-11` icon inside a button with `py-1.5 px-1`. Touch target ends up ~44px which meets Apple's 44pt minimum but is right at the edge of Google's 48dp recommendation. Low priority — fine to ship, just noting.

6. **Store metadata not yet authored.** Not a code change, but for submission the user will need: app name, subtitle, description, keywords, screenshots (6.7"/6.5"/5.5" iOS, phone + 7"/10" Android), privacy policy URL, support URL, age rating, data-safety form (since auth + analytics + push are involved).

### Out of scope

- No changes to feature behavior, data fetching, or business logic.
- Other portal pages (Attendance, Calendar, Academic, Lessons) are not part of this audit.

### Proposed next step

If you'd like, I can:
- (a) Align the splash + manifest colors to the brand green, and
- (b) Add a small README section documenting the `npx cap add` / `npx cap sync` / asset-generation workflow so the wrap-and-submit process is reproducible.

Just say which (or both) and I'll switch to build mode.
