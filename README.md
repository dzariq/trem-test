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

- **Manual:** GitHub → Actions → "Build Android APK" → "Run workflow" →
  pick `production`, `staging`, or `development`.
- **Automatic:** any push to `main` that touches `src/`, `public/`,
  `resources/`, `capacitor.config.ts`, or related config files.

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

### Installing the unsigned APK on a device

Android blocks installs of unsigned APKs by default. Either:

- Enable **Developer options → Install unknown apps** on the target phone, or
- Sign the APK before distributing (see the Play Store signing guide).

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
