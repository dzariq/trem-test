# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Android APK builds

This project is wrapped as a native Android app using **Capacitor** (the
existing web UI runs inside a native WebView — no React Native rewrite
required).

### Option 1 — Build in the cloud via GitHub Actions (recommended)

No local Android tooling required. The workflow at
`.github/workflows/build-android-apk.yml`:

1. Builds the web app with Vite.
2. Adds the Capacitor Android platform.
3. Generates icons & splash from `resources/icon.png` and `resources/splash.png`.
4. Compiles an **unsigned release APK** with Gradle.
5. Uploads the APK as a workflow artifact.

How to trigger a build:

- **Manual only:** GitHub → Actions → "Build Android APK" → "Run workflow" →
  pick `production`, `staging`, or `development`.
- The workflow is **not** triggered automatically on push. Re-add a
  `push:` block to `.github/workflows/build-android-apk.yml` if you ever
  want CI to rebuild the APK on every commit.

How to download the APK:

- Open the completed workflow run on GitHub.
- Scroll to the **Artifacts** section at the bottom.
- Download `collinz-school-<mode>-unsigned-apk.zip`, unzip → install on device.

### Option 2 — Build locally (Windows)

Requires installing:

- **Node.js 20+** (https://nodejs.org)
- **JDK 21** — Temurin/Adoptium (https://adoptium.net)
- **Android Studio** with Android SDK 35 + build-tools 35.0.0
- Set `JAVA_HOME` and `ANDROID_HOME` environment variables.

Then:

```sh
npm install
npm run android:apk
```

This runs: build web → add Android platform → sync → assemble release APK.
Output: `android/app/build/outputs/apk/release/app-release-unsigned.apk`.

### BUNDLED vs LIVE — web update strategy

Each build is one of two **variants**, selected automatically based on
`build_mode`:

| Variant | When | Web bundle source | Web updates auto-reflect? | Works offline? |
|---|---|---|---|---|
| `BUNDLED` | `build_mode = production` | Baked into the APK at build time | ❌ No — needs new APK + reinstall | ✅ Yes |
| `LIVE` | `build_mode = development` or `staging` | Loaded from `https://collinz.app` at launch | ✅ Yes — every deploy is reflected on next app open | ❌ No (blank if offline) |

Use `LIVE` when iterating with Lovable / staging — push web changes, reopen
the app, see them immediately without rebuilding. Use `BUNDLED` for
production releases that ship to real users, the Play Store, or anywhere
offline support and App Store compliance matter.

The mechanism: `capacitor.config.ts` reads the `CAP_SERVER_URL` environment
variable. When set, Capacitor configures the WebView to load that URL.
When unset, the WebView loads the locally-bundled `dist/` files. The
workflow sets `CAP_SERVER_URL=https://collinz.app` automatically for
non-production builds.

### Which APK should I install?

Every workflow run produces **two** APK artifacts:

| Artifact | Filename inside | Installable on phones? | Purpose |
|---|---|---|---|
| `collinz-school-<mode>-<variant>-DEBUG-apk` | `app-debug.apk` | ✅ **Yes** — auto-signed with Android's debug keystore | Personal testing, demos, internal QA |
| `collinz-school-<mode>-<variant>-unsigned-release-apk` | `app-release-unsigned.apk` | ❌ **No** — Android 7+ rejects unsigned APKs ("Package appears to be invalid") | Input to a release-signing step / Play Store later |

**For installing on your own phone, always download the `-DEBUG-apk` artifact.**
The release APK is unsigned and is only useful once you've set up a release
keystore + signing step in the workflow.

Example artifact names:
- `collinz-school-production-BUNDLED-DEBUG-apk` — offline-capable, production web build
- `collinz-school-development-LIVE-DEBUG-apk` — live-loads from `https://collinz.app`

### Installing the debug APK on a device

1. Download the `collinz-school-<mode>-DEBUG-apk` artifact zip from the workflow run.
2. Unzip → you get `app-debug.apk`.
3. Transfer to the phone (USB, Google Drive, WhatsApp, etc.).
4. On the phone: **Settings → Apps → Special access → Install unknown apps**
   → enable the source you're using (file manager, browser, etc.).
5. Open `app-debug.apk` on the phone → tap **Install**.

If you previously installed a release/signed version of the app with the same
package name (`com.collinz.school`), uninstall it first — Android won't allow
overwriting an installed app with a differently-signed APK.

---

## iOS / TestFlight builds

The iOS workflow at `.github/workflows/build-ios-testflight.yml` builds an
IPA on a `macos-15` runner with Xcode 16 and (optionally) uploads it to
TestFlight via the App Store Connect API.

### Prerequisites (one-time setup)

You must have:

- A **paid Apple Developer Program** account (USD$99/year).
- Bundle ID `com.collinz.school` registered at
  https://developer.apple.com → Certificates, Identifiers & Profiles → Identifiers.
- An App Store Connect app record created at
  https://appstoreconnect.apple.com → My Apps → New App (pick the bundle ID above).

### Required GitHub repository secrets

Go to **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**
and add **all eight** of these:

| Secret name | Value |
|---|---|
| `APPLE_TEAM_ID` | 10-character Team ID (Apple Developer → Membership → Team ID) |
| `IOS_DIST_CERT_BASE64` | `base64 -i Distribution.p12` of your Apple Distribution `.p12` |
| `IOS_DIST_CERT_PASSWORD` | The password you set when exporting the `.p12` |
| `IOS_PROVISIONING_PROFILE_BASE64` | `base64 -i App_Store.mobileprovision` |
| `IOS_KEYCHAIN_PASSWORD` | Any random password (e.g. `openssl rand -base64 24`) |
| `APP_STORE_CONNECT_API_KEY_ID` | 10-character Key ID from App Store Connect → Users & Access → Integrations → Keys |
| `APP_STORE_CONNECT_API_ISSUER_ID` | UUID issuer ID from the same Keys page |
| `APP_STORE_CONNECT_API_KEY_P8` | `base64 -i AuthKey_XXXXXXXXXX.p8` of the downloaded `.p8` file |

### How to obtain each item

#### 1. Distribution certificate `.p12` (Windows users without a Mac)

Apple needs a **Certificate Signing Request (CSR)** generated from a private key.
On Windows you can do this with OpenSSL (install via
https://slproweb.com/products/Win32OpenSSL.html or use Git Bash's bundled OpenSSL):

```sh
# 1. Generate a private key
openssl genrsa -out distribution.key 2048

# 2. Generate the CSR (Common Name = your name/company, email = your Apple ID email)
openssl req -new -key distribution.key -out distribution.csr \
  -subj "/emailAddress=YOUR_APPLE_ID_EMAIL/CN=Collinz Distribution/C=MY"
```

Then:

1. Go to https://developer.apple.com → Certificates → "+" → **Apple Distribution**.
2. Upload `distribution.csr`, download the resulting `distribution.cer`.
3. Convert `.cer` (DER format) to PEM, then bundle with the private key into a `.p12`:

```sh
# 4. Convert the downloaded .cer (DER) to PEM
openssl x509 -inform DER -in distribution.cer -out distribution.pem

# 5. Bundle into a password-protected .p12 (remember the password!)
openssl pkcs12 -export -legacy \
  -inkey distribution.key \
  -in distribution.pem \
  -out distribution.p12 \
  -name "Apple Distribution: Your Name (TEAMID)"

# 6. Base64-encode for the GitHub secret (single line, no newlines)
openssl base64 -A -in distribution.p12 -out distribution.p12.base64.txt
```

Paste the contents of `distribution.p12.base64.txt` into the
`IOS_DIST_CERT_BASE64` secret. Use the password from step 5 as
`IOS_DIST_CERT_PASSWORD`.

> Note the `-legacy` flag on the OpenSSL 3.x `pkcs12 -export` command —
> Xcode's `security import` only accepts the legacy 3DES-based PKCS#12
> format, not the AES-based default in newer OpenSSL releases.

#### 2. Provisioning profile

1. https://developer.apple.com → Profiles → "+" → **App Store Connect** distribution.
2. Pick App ID `com.collinz.school`.
3. Pick the Distribution certificate you just created.
4. Name it (e.g. `Collinz School App Store`), download the `.mobileprovision`.
5. Base64-encode:

```sh
openssl base64 -A -in Collinz_School_App_Store.mobileprovision \
  -out provisioning.base64.txt
```

Paste contents into `IOS_PROVISIONING_PROFILE_BASE64`.

#### 3. App Store Connect API Key

1. https://appstoreconnect.apple.com → Users & Access → Integrations → Keys.
2. Click "+", give it a name (e.g. `Collinz CI`), grant role **App Manager**
   (or **Admin** for full access).
3. Download the `.p8` file (**you can only download it once — save it!**).
4. Note the **Key ID** (10-char) and **Issuer ID** (UUID) shown on that page.
5. Base64-encode the `.p8`:

```sh
openssl base64 -A -in AuthKey_XXXXXXXXXX.p8 -out apikey.base64.txt
```

Add as secrets:
- `APP_STORE_CONNECT_API_KEY_ID` = Key ID
- `APP_STORE_CONNECT_API_ISSUER_ID` = Issuer ID
- `APP_STORE_CONNECT_API_KEY_P8` = contents of `apikey.base64.txt`

#### 4. Team ID

Apple Developer → Membership → "Team ID" (10 characters, e.g. `A1B2C3D4E5`).
Add as `APPLE_TEAM_ID`.

#### 5. Keychain password

Any random string. Generate with:

```sh
openssl rand -base64 24
```

Add as `IOS_KEYCHAIN_PASSWORD`.

### Triggering an iOS build

After all 8 secrets are configured:

- **GitHub → Actions → "Build iOS & Deploy to TestFlight" → Run workflow**
- Pick build mode (`production` or `staging`)
- Toggle `upload_to_testflight` on/off (off = just produce an IPA artifact for inspection)
- Click **Run workflow**

The first run takes ~15-25 minutes (macOS runner + Xcode + CocoaPods are slower
than Linux). After upload, the build appears in App Store Connect → TestFlight →
iOS Builds in 5-15 minutes (Apple processing).

### Build number management

Each run sets the iOS build number to the GitHub Actions run number
(`agvtool new-version -all $GITHUB_RUN_NUMBER`) so every upload to TestFlight
gets a unique, monotonically-increasing build number without manual bumping.

### Common iOS build failures

| Symptom | Fix |
|---|---|
| `No signing certificate "iOS Distribution" found` | `IOS_DIST_CERT_BASE64` or password wrong; re-export `.p12` with `-legacy`. |
| `Provisioning profile doesn't include signing certificate` | Profile and cert mismatch — regenerate profile after creating new cert. |
| `Invalid Bundle. Apps that include 'arm64' must also include 'armv7'` | Outdated profile/template. Re-run `npx cap add ios` to regenerate iOS project. |
| `ITMS-90283: Invalid Provisioning Profile Signature` | Profile is for wrong env (Development vs App Store). Use **App Store** distribution profile. |
| `ITMS-90189: Redundant Binary Upload` | Build number already used. Push a new commit (run number auto-increments) or manually bump. |
| TestFlight upload hangs at "Authenticating with the App Store" | API key role too low — needs **App Manager** or **Admin**. |

### Re-enabling automatic builds on push

Once a manual run succeeds end-to-end, uncomment the `push:` trigger block at
the top of `.github/workflows/build-ios-testflight.yml` to auto-build on every
push to `main`.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
