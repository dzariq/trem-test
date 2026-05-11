# Mobile Wrapper Readiness Audit (iOS App Store + Google Play)

Audit of the current codebase against what breaks once wrapped with Capacitor. Findings are grouped by severity, each with a concrete fix.

## Current state (good)

- Capacitor 8 installed (core, ios, android, filesystem, share, status-bar, preferences, browser).
- `capacitor.config.ts` set with `appId: com.collinz.school`, `androidScheme: https`, no dev `server.url` baked in (good for production builds).
- Safe-area CSS variables wired (`--safe-top/bottom/left/right`) and applied in `app-shell`, bottom nav, fixed CTAs.
- StatusBar overlay configured in `main.tsx` with native guard.
- Supabase auth uses `persistSession: true` (per memory) — survives app relaunch.
- `BrowserRouter` + Lovable SPA fallback on web; on native Capacitor serves from local files so deep refresh isn't a concern.
- Export pipeline (`saveAndShareBlob`) already branches web vs native using Filesystem + Share — solid foundation.

## Critical issues (must fix before submitting to stores)

1. **`index.html` metadata is still the Lovable default.**
   - `<title>Lovable App</title>`, description "Lovable Generated Project", `og:image` pointing to lovable.dev. App Store/Play Store screenshots and link previews will look unbranded.
   - Fix: real title (`Collinz School`), description, theme-color meta, apple-touch-icon link, and proper OG tags. Add `<meta name="apple-mobile-web-app-capable" content="yes">` and `<meta name="mobile-web-app-capable" content="yes">`.

2. **`public/manifest.webmanifest` is broken.**
   - Icon `src` paths use `../icons/...` (relative to manifest). On native Capacitor those resolve outside the web bundle and 404. The file also has no `name`, `short_name`, `start_url`, `display`, `background_color`, `theme_color`.
   - Also: `type: image/png` while files are `.webp` → mismatch.
   - Fix: rebuild manifest with correct absolute paths (e.g. `/icons/icon-192.png`), full required fields, and ship icons in `public/icons/` as PNG (Apple/Play stores require PNG). Generate via `@capacitor/assets` (already a devDep) from a single 1024×1024 source.

3. **Native app icons & splash screens not generated.**
   - No `resources/icon.png` or `resources/splash.png` checked in. Without these `npx cap sync` ships the default Capacitor icon — Apple will reject.
   - Fix: add `resources/icon.png` (1024×1024) and `resources/splash.png` (2732×2732), document `npx capacitor-assets generate`.

4. **External link handling won't behave on native.**
   - `window.open(url, "_blank")` is used in `AnnouncementDrawer`, `HandbookReportDialog`, `PDFViewerDialog`, `ImagePreviewDialog`, `ContactPage` (Google Maps), and `<a target="_blank">` in `AnnouncementsListDrawer`, `AnnouncementDetailPage`. On Capacitor `_blank` opens an in-app webview that often appears blank or traps the user (no close affordance), and on iOS App Store review this is flagged.
   - Fix: introduce a small `openExternal(url)` helper that uses `@capacitor/browser` (`Browser.open`) on native and `window.open` on web. Replace all the call sites listed.

5. **Telephone deep link not safe on iPad / non-phone native.**
   - `ContactPage` uses `window.location.href = "tel:..."`. On iPad without phone capability this throws "page can't be loaded" full screen.
   - Fix: detect native via `Capacitor.getPlatform()` and use `<a href="tel:">` or guard.

## High priority

6. **Login phone OTP hits an external n8n webhook from the device.**
   - `OTP_REQUEST_URL` / `OTP_VERIFY_URL` point to `collinz.app.n8n.cloud`. iOS App Transport Security is fine (HTTPS), but: (a) hard-coded URL in source, no env flag; (b) CORS will fail in native unless server allows the Capacitor origin (`capacitor://localhost` on iOS, `https://localhost` on Android). Also subject to App Store reject if traffic isn't documented in privacy.
   - Fix: move URLs to `VITE_OTP_*` env, add the Capacitor origins to n8n CORS allowlist, and document in privacy policy.

7. **Supabase OAuth / magic-link redirect URL.**
   - Anywhere `signInWithOtp` / `signInWithOAuth` is used must pass `emailRedirectTo`/`redirectTo` that resolves on native. Native scheme is `https://localhost` (Android) or `capacitor://localhost` (iOS), not your published URL — these won't be in Supabase's allow-list out of the box.
   - Fix: add a deep-link scheme (e.g. `app.collinz://auth-callback`), register with `@capacitor/app` `appUrlOpen`, list it in Supabase Auth → URL Configuration, and use it as redirect on native.

8. **`localStorage` for session/portal/campus.**
   - Works on Capacitor WebView today, but iOS aggressively evicts WebView storage when device is low on space; users get silently logged out and lose campus/portal selection.
   - Fix: mirror the three keys (`selected_portal`, `active_campus_code`, `session_started_at`) and the Supabase auth token via `@capacitor/preferences` (already installed) on native.

9. **Hardware back button on Android is unhandled.**
   - Currently it will exit the app from any screen. Play Store review expects back to navigate within the app first.
   - Fix: small hook listening to `App.addListener('backButton', ...)` that calls `navigate(-1)` if history exists, otherwise prompts exit.

10. **Bottom nav scroll-hide listener attached to a query-selected element.**
    - `BottomNavigation` / `TeacherBottomNavigation` look up `[data-app-scroll="true"]` once on mount. If the element isn't in the DOM yet (route transition), they fall back to `window` and never re-attach. Minor UX glitch but visible on first screen after sign-in.
    - Fix: use a ref / context ref to the scroll container, or re-query inside an effect that watches route changes.

11. **PDF preview using native `window.open` won't work in the WebView.**
    - `PDFViewerDialog` and `HandbookReportDialog` open the raw PDF URL in a new tab. Native WebView can't render PDF reliably (Android WebView refuses; iOS opens but no controls). Memory `[Mobile PDF Pagination]` already exists.
    - Fix: on native, download the PDF then open via `Browser.open(file://…)` or `Share.share` so the system PDF viewer handles it. Reuse `saveAndShareBlob`.

## Medium priority

12. **`viewport-fit=cover` is set, but no `theme-color` meta** — Android status bar will be white in PWA installs / TWA fallback. Add `<meta name="theme-color" content="#0a8a5c">` matching primary.

13. **Camera/photo upload** (`ProfilePage`, `CcaImageUpload`) currently uses standard `<input type="file" accept="image/*">`. Works in WebView but you lose camera-quality control and gallery integration. Optional: add `@capacitor/camera` for native-quality picker (Apple won't reject either way).

14. **No App Tracking Transparency / privacy manifest.** Apple now requires a `PrivacyInfo.xcprivacy` file declaring all reasons for filesystem, UserDefaults, etc. Without it, builds uploaded after May 1 2024 are rejected.
    - Fix: add `ios/App/App/PrivacyInfo.xcprivacy` listing CT.UserDefaults (`CA92.1`), File timestamp (`C617.1`), system boot time if used, etc.

15. **Network requests visibility.** Add `NSAppTransportSecurity` exceptions only if non-HTTPS endpoints are used (none found — good). Document.

16. **Splash screen plugin not installed.** No `@capacitor/splash-screen` → app launches into white flash. Install + configure `launchAutoHide: false`, hide after first paint.

17. **Push notifications (memory mentions Parent Attendance Notifications via DB triggers).** Today it's all in-app polling. If you want OS-level push for App Store value, add `@capacitor/push-notifications` + APNs/FCM. Not blocking, but worth scoping.

## Low priority / polish

- Remove `console.log`s from `nativeDownload.ts` and any `[*_DEBUG]` tags in production builds (use `if (import.meta.env.DEV)`).
- Capacitor 8 `@capacitor/browser` is `^7.0.1` — version mismatch warning on `cap sync`. Bump to 8.x.
- `@capacitor/cli` listed in both `dependencies` and `devDependencies`-equivalent — keep only as dev.
- `index.html` has comment "TODO: Set the document title" still present.
- Add `prefers-reduced-motion` guard on framer animations (Apple reviewers test this).

## Technical: deliverables grouped by file

```
index.html                          → real meta + theme-color + apple meta
public/manifest.webmanifest         → rebuild correctly
public/icons/*.png                  → add 192/512 PNG (and full set)
resources/icon.png, splash.png      → 1024 / 2732 sources
capacitor.config.ts                 → add SplashScreen + scheme config
src/lib/native/openExternal.ts      → new helper
src/lib/native/storage.ts           → Preferences mirror for auth/portal/campus
src/hooks/useAndroidBackButton.ts   → new
src/hooks/useNativePdfOpen.ts       → reuse saveAndShareBlob
src/contexts/AuthContext.tsx        → Preferences mirror, native redirect URLs
src/pages/Login.tsx                 → env-driven OTP URLs, native redirectTo
src/pages/ContactPage.tsx           → openExternal + tel guard
src/components/AnnouncementDrawer.tsx
src/components/AnnouncementsListDrawer.tsx
src/components/HandbookReportDialog.tsx
src/components/PDFViewerDialog.tsx
src/components/announcements/ImagePreviewDialog.tsx
src/pages/AnnouncementDetailPage.tsx
                                    → swap window.open / target=_blank
src/components/layout/{BottomNavigation,TeacherBottomNavigation}.tsx
                                    → ref-based scroll listener
ios/App/App/PrivacyInfo.xcprivacy   → new
package.json                        → add @capacitor/splash-screen, push-notifications (optional), bump @capacitor/browser
```

## Suggested execution order

1. Branding & manifest (#1, #2, #3, #12) — needed for any test build to look like a real app.
2. External link + tel + PDF (#4, #5, #11) — biggest visible bugs after wrapping.
3. Auth/storage/back button (#6, #7, #8, #9) — biggest invisible bugs.
4. Privacy manifest + splash (#14, #16) — required for App Store submission.
5. Polish (#10, #13, #15, #17 + low-pri).

## Out of scope (ask before doing)

- Push notifications (#17) — needs APNs cert + FCM project.
- Native camera plugin (#13) — only if you want better photo UX.
- In-app purchases / Sign in with Apple (Apple requires Sign in with Apple if you offer Google sign-in — not currently used, so OK).

Once you approve, I'll proceed in the order above. I can also do a single "phase 1 only" pass first if you'd rather ship a beta build to TestFlight before doing the deeper work.
