# Firebase Production Deployment – Complete Diagnostic Investigation Report

**Document File:** `FIREBASE-PRODUCTION-DEPLOYMENT-AUDIT.md`  
**Target Project:** `D:\projects\github-sunilkumar029\Final-web-refactor`  
**Deployed URL:** `https://forex-sigma-signals--9c5i9dpr58.expo.app`  
**Build Command:** `npx expo export --platform web`  
**Status:** Investigation Only (Read-Only Diagnostic)

---

## 1. Executive Summary

When visiting the deployed production web application (`https://forex-sigma-signals--9c5i9dpr58.expo.app`), the browser displays a completely blank white screen. Inspection of the browser console reveals a fatal uncaught exception:

```text
Uncaught FirebaseError: Installations: Missing App configuration value: "projectId" 
(installations/missing-app-config-values)
    at Firebase Installations initialization
```

Alongside this error, an advisory warning appears:
```text
[expo-notifications] Listening to push token changes is not yet fully supported on web.
```

### Key Diagnostic Findings:
1. **The Blank Screen Cause:** The failure is **fatal and synchronous at module evaluation time**. As the production JavaScript bundle (`entry-befb631bfce674eaad694a005810069e.js`) is parsed by the browser, `lib/notifications/firebase.ts` executes `initializeApp(firebaseConfig)` and immediately calls `getMessaging(app)` at the top level of the module.
2. **Missing Configuration in Production Bundle:** Live inspection of the deployed JavaScript file at `https://forex-sigma-signals--9c5i9dpr58.expo.app/_expo/static/js/web/entry-befb631bfce674eaad694a005810069e.js` reveals that Metro compiled all Firebase environment variables into `void 0` (`undefined`):
   - `projectId: void 0`
   - `apiKey: void 0`
   - `appId: void 0`
   - `authDomain: "undefined.firebaseapp.com"`
   - `storageBucket: "undefined.appspot.com"`
3. **Deployment Pipeline Gap:** 
   - Local `.env` is git-ignored (`.gitignore` lines 30–32) and never committed to version control.
   - The repository uses **EAS Workflows** (`.eas/workflows/production.yml`) with `profile: production` / `prod: true`. There is **no `.github/workflows` directory** in the repository.
   - In `eas.json`, the `preview` profile contains the `EXPO_PUBLIC_*` configuration, but the **`production` profile has no `env` block**.
   - Consequently, when EAS / CI executed `npx expo export --platform web` in production, zero environment variables were available, replacing them with `void 0`.
4. **Architectural Vulnerability:** Unlike `lib/supabase.ts` which provides fallback values, `lib/notifications/firebase.ts` lacks any defensive validation, fallback, or `try/catch` guard. Even if Firebase is only needed for push notifications, its top-level unconditional execution causes the entire React / Expo Router application to crash before mounting.
5. **Expo Notifications Warning Independence:** The `[expo-notifications]` warning originates from an internal auto-registration side-effect (`DevicePushTokenAutoRegistration.fx.js`) within the `expo-notifications` package on web. It is purely advisory, non-fatal, and completely unrelated to the Firebase crash.

---

## 2. Phase 1 – Firebase Initialization Audit

### 2.1 File Inventory
All Firebase touchpoints across the repository:
- **`lib/notifications/firebase.ts`**: Core client initialization (Firebase Web Modular SDK v11).
- **`lib/notifications/push.ts`**: Notification manager importing `getFCMToken` and `onForegroundMessage`.
- **`lib/notifications/index.ts`**: Re-exports all exports from `firebase.ts`.
- **`public/firebase-messaging-sw.js`**: Background Service Worker using Firebase Compat v9 CDN.
- **`dist/firebase-messaging-sw.js`**: Exported service worker artifact.
- **`android/app/google-services.json`**: Android native configuration for `@react-native-firebase`.
- **`app/(tabs)/index.tsx` & `app/(tabs)/settings.tsx`**: Consumer screens importing `getFCMToken`.

### 2.2 Initialization Architecture in `lib/notifications/firebase.ts`
Lines 17–34:
```typescript
let webMessaging: any = null;

if (Platform.OS === 'web') {
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: `${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: `${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };

  const app = initializeApp(firebaseConfig);
  webMessaging = getMessaging(app);

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => { });
  }
}
```

### 2.3 Firebase Services Audit
- **Firebase App (`firebase/app`)**: Initialized synchronously at module root.
- **Firebase Messaging (`firebase/messaging`)**: `getMessaging(app)` invoked immediately on module load.
- **Firebase Installations (`@firebase/installations`)**: When `getMessaging(app)` runs, the Firebase Messaging component factory internally invokes Firebase Installations to obtain app identity and auth tokens.
- **Firebase Authentication & Storage**: Not utilized in this project.
- **Duplicate Initialization Check**: 
  - Main web bundle uses modular SDK (`firebase/app`).
  - Web service worker (`firebase-messaging-sw.js`) runs in an isolated worker scope using Firebase Compat CDN scripts with hardcoded config. There is no duplicate initialization collision.
- **Platform Separation**:
  - Web uses modular Firebase JS SDK (`firebase/messaging`).
  - Native (iOS/Android) uses `@react-native-firebase/messaging` loaded dynamically via `await import('@react-native-firebase/messaging')` inside `getFCMToken()`.

### 2.4 Variable Reference Verification
| Variable | Referenced In Code | Status in Code |
|---|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | `lib/notifications/firebase.ts:19` | Correctly named |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | **Not directly used** | Interpolated as `${...PROJECT_ID}.firebaseapp.com` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | `lib/notifications/firebase.ts:21` | Correctly named |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | **Not directly used** | Interpolated as `${...PROJECT_ID}.appspot.com` |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `lib/notifications/firebase.ts:23` | Correctly named |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | `lib/notifications/firebase.ts:24` | Correctly named |
| `EXPO_PUBLIC_FIREBASE_VAPID_KEY` | `lib/notifications/firebase.ts:45` | Correctly named |

---

## 3. Phase 2 – Environment Configuration Audit

### 3.1 Local Environment Files
- **`.env`** (Present locally, contains all `EXPO_PUBLIC_FIREBASE_*` and `EXPO_PUBLIC_SUPABASE_*` keys).
- **`.env.example`** (Present locally as template).
- **`.env.local` / `.env.production`**: Neither exists.

### 3.2 Git Ingestion Rules (`.gitignore`)
Lines 30–32 & 43:
```gitignore
# local env files
.env*.local
.env
...
.env
```
`.env` is explicitly ignored. It has never been committed to git history.

### 3.3 EAS Configuration (`eas.json`)
Inspection of `eas.json` reveals the asymmetry:
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "...",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "...",
        "SUPABASE_SERVICE_ROLE_KEY": "...",
        "EXPO_PUBLIC_FIREBASE_API_KEY": "...",
        "EXPO_PUBLIC_FIREBASE_PROJECT_ID": "forex-signal-app-c0c32",
        "EXPO_PUBLIC_FIREBASE_APP_ID": "...",
        "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID": "...",
        "EXPO_PUBLIC_FIREBASE_VAPID_KEY": "...",
        "EXPO_PUBLIC_EAS_PROJECT_ID": "..."
      }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```
- The `preview` profile has all environment variables hardcoded.
- The `production` profile has **zero environment variables**.

### 3.4 Expo Environment Variable Embedding Rules
Expo uses static AST analysis (Babel / Metro) to replace all occurrences of `process.env.EXPO_PUBLIC_*` with their string values at build time.
- If an environment variable is present in `process.env` when `npx expo export` executes, it is replaced with `"string_value"`.
- If an environment variable is missing/undefined, Metro replaces it with `void 0`.

---

## 4. Phase 3 – Deployment Pipeline & Workflow Audit

### 4.1 Pipeline Architecture
- **GitHub Workflows:** There is **no `.github/` folder** in the repository. Git history confirms no `.github/workflows/` was ever committed.
- **EAS Workflows:** The deployment pipeline is driven by `.eas/workflows/production.yml`:
```yaml
name: Production - Android + Web

on:
  push:
    branches:
      - main

jobs:
  build_android:
    name: Build Android Production
    type: build
    params:
      platform: android
      profile: production

  deploy_web:
    name: Deploy Web Production
    type: deploy
    params:
      prod: true
```

### 4.2 Pipeline Trace & Flaw Identification
1. Code is pushed to `main` on GitHub (`https://github.com/safikumar00-byte/Final-web-refactor.git`).
2. EAS triggers the `production.yml` workflow on Expo's cloud build servers.
3. EAS executes `deploy_web` with `prod: true`, which runs `npx expo export --platform web` using the `production` profile.
4. Because `.env` is git-ignored, the cloud build machine has no local `.env` file.
5. Because `eas.json` has no `env` block under `production`, EAS does not supply the variables unless they were manually created in the remote EAS Web Dashboard (EAS Environment Variables).
6. Result: The web bundle is compiled with `process.env.EXPO_PUBLIC_FIREBASE_* = void 0`.

---

## 5. Phase 4 – Production Bundle Inspection

A live diagnostic probe was performed against the production bundle deployed at:  
`https://forex-sigma-signals--9c5i9dpr58.expo.app/_expo/static/js/web/entry-befb631bfce674eaad694a005810069e.js` (5,011,682 bytes).

### Concrete Bundle Evidence (Safe AST Matching)
| Expression in Source Code | Compiled Output in Deployed Bundle | Result |
|---|---|---|
| `process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID` | `projectId: void 0` | Missing |
| `process.env.EXPO_PUBLIC_FIREBASE_API_KEY` | `apiKey: void 0` | Missing |
| `process.env.EXPO_PUBLIC_FIREBASE_APP_ID` | `appId: void 0` | Missing |
| `authDomain: `${...PROJECT_ID}.firebaseapp.com`` | `authDomain: "undefined.firebaseapp.com"` | Corrupted |
| `storageBucket: `${...PROJECT_ID}.appspot.com`` | `storageBucket: "undefined.appspot.com"` | Corrupted |

### Comparison With Local Build
When running `npx expo export --platform web` locally:
- Local `.env` exists.
- Metro reads local `.env`.
- Output bundle (`entry-3d7baf0d611c8d5410b30d0d13d0a289.js`) contains: `projectId: "forex-signal-app-c0c32"`.
- This confirms that local builds succeed while production cloud builds fail due to environment variable omission in CI.

---

## 6. Phase 5 – Runtime Error Investigation

### 6.1 Call Chain Leading to Crash
```mermaid
sequenceDiagram
    participant Browser as Browser Client
    participant Bundle as entry-*.js
    participant Layout as app/_layout.tsx
    participant Modal as NotificationPermissionModal.tsx
    participant Notif as lib/notifications/index.ts
    participant Firebase as lib/notifications/firebase.ts
    participant SDK as Firebase Modular SDK

    Browser->>Bundle: Loads <script src="entry-*.js">
    Bundle->>Layout: Module Evaluation
    Layout->>Modal: import NotificationPermissionModal
    Modal->>Notif: import { registerForPushNotifications }
    Notif->>Firebase: export * from './firebase'
    Note over Firebase: Executes top-level if (Platform.OS === 'web')
    Firebase->>SDK: initializeApp({ projectId: undefined, ... })
    Firebase->>SDK: getMessaging(app)
    Note over SDK: Firebase Installations initializes
    SDK-->>Firebase: Throws Uncaught FirebaseError: Missing "projectId"
    Note over Bundle: Execution HALTED synchronously
    Note over Browser: DOM <div id="root"></div> remains empty (White Screen)
```

### 6.2 Step-by-Step Breakdown:
1. `app/_layout.tsx` (line 20) imports `NotificationPermissionModal`.
2. `components/NotificationPermissionModal.tsx` (line 17) imports `../lib/notifications`.
3. `lib/notifications/index.ts` (line 5) contains `export * from './firebase';`.
4. The JavaScript engine synchronously evaluates `lib/notifications/firebase.ts`.
5. Lines 17–28 execute unconditionally on web:
   ```typescript
   const app = initializeApp(firebaseConfig);
   webMessaging = getMessaging(app);
   ```
6. In Firebase JS SDK v11, `getMessaging(app)` invokes `_registerComponent` which requests the `installations-internal` component.
7. `@firebase/installations` executes its internal configuration validator:
   ```typescript
   if (!app.options.projectId) {
     throw ERROR_FACTORY.create(AppConfigErrorCode.MISSING_APP_CONFIG_VALUES, {
       valueName: 'projectId'
     });
   }
   ```
8. The unhandled exception aborts script execution before `RootLayout` can mount or Expo Router can render any UI elements.

---

## 7. Phase 6 – Expo Notifications Investigation

### 7.1 Warning Analysis
```text
[expo-notifications] Listening to push token changes is not yet fully supported on web. Adding a listener will have no effect.
```
- **Origin:** `node_modules/expo-notifications/build/PushTokenManager.js:6`.
- **Trigger:** In `expo-notifications/build/index.js` (line 36):
  `export { setAutoServerRegistrationEnabledAsync } from './DevicePushTokenAutoRegistration.fx';`
  The `.fx` (side-effect) module executes upon package import:
  `addPushTokenListener(...) -> PushTokenManager.addListener(...)`.
- **Web Implementation:** On web, `PushTokenManager.js` does not have native device token listeners, so it logs a single `console.warn` and returns a dummy subscription `{ remove: () => {} }`.
- **Verdict:** This warning is completely harmless, expected on web, and is **not** the cause of the blank screen or Firebase failure.

---

## 8. Phase 7 – Root Cause Identification & Matrices

### A. Exact Root Cause Summary
1. **Primary Root Cause (CI Environment):** The cloud build environment executing the production deployment has no access to `EXPO_PUBLIC_FIREBASE_PROJECT_ID` (and related keys) because `.env` is git-ignored and the `production` profile in `eas.json` contains no `env` configuration block.
2. **Secondary Root Cause (Architectural Brittleness):** `lib/notifications/firebase.ts` initializes Firebase and Firebase Messaging eagerly and synchronously at module top-level without validating whether configuration properties exist, converting an environment misconfiguration into an unrecoverable, application-wide fatal crash.

### B. Affected Files and Line Numbers

| File | Line Numbers | Role in Failure |
|---|---|---|
| [`eas.json`](file:///d:/projects/github-sunilkumar029/Final-web-refactor/eas.json) | 25–27 | `production` build profile lacks `env` block containing Firebase variables. |
| [`.eas/workflows/production.yml`](file:///d:/projects/github-sunilkumar029/Final-web-refactor/.eas/workflows/production.yml) | 17–21 | Invokes `deploy_web` with `prod: true` referencing the empty `production` profile. |
| [`lib/notifications/firebase.ts`](file:///d:/projects/github-sunilkumar029/Final-web-refactor/lib/notifications/firebase.ts) | 17–34 | Unconditionally initializes Firebase and FCM at top-level on web without null checks or try/catch. |
| [`lib/notifications/index.ts`](file:///d:/projects/github-sunilkumar029/Final-web-refactor/lib/notifications/index.ts) | 5 | Eagerly re-exports `firebase.ts`, pulling it into the bundle evaluation tree. |
| [`components/NotificationPermissionModal.tsx`](file:///d:/projects/github-sunilkumar029/Final-web-refactor/components/NotificationPermissionModal.tsx) | 17 | Imports from `lib/notifications`, triggering the import in `app/_layout.tsx`. |
| [`app/_layout.tsx`](file:///d:/projects/github-sunilkumar029/Final-web-refactor/app/_layout.tsx) | 20 | Imports `NotificationPermissionModal`, bringing the crash into the critical initial render path. |

---

## 9. Environment Configuration Matrix

| Configuration Variable | Local Environment (`.env`) | CI / EAS Production Profile (`eas.json`) | Deployed Production Bundle (`dist`) |
|---|---|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | **Configured** | **Missing** | **Missing** (`void 0`) |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Derived in code | **Missing** | **Missing** (`"undefined.firebaseapp.com"`) |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | **Configured** | **Missing** | **Missing** (`void 0`) |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`| Derived in code | **Missing** | **Missing** (`"undefined.appspot.com"`) |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | **Configured** | **Missing** | **Missing** (`void 0`) |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | **Configured** | **Missing** | **Missing** (`void 0`) |
| `EXPO_PUBLIC_FIREBASE_VAPID_KEY` | **Configured** | **Missing** | **Missing** (`void 0`) |
| `EXPO_PUBLIC_SUPABASE_URL` | **Configured** | **Missing** | Fallback Used (`demo-project`) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | **Configured** | **Missing** | Fallback Used (`demo-anon-key`) |

*(Note: GitHub Repository Secrets are marked **Not Applicable / Unknown** because the deployment pipeline uses EAS Workflows rather than GitHub Actions).*

---

## 10. Recommended Minimal Fixes (For Review Only – Not Implemented)

### Fix 1 (Confirmed): Populate `production.env` in `eas.json`
**File:** [`eas.json`](file:///d:/projects/github-sunilkumar029/Final-web-refactor/eas.json)  
Copy the `env` object from the `preview` profile into the `production` profile so that EAS cloud builds inject the variables during web export:

```json
    "production": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://govngwsrefzqnuczhzdi.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "EXPO_PUBLIC_FIREBASE_API_KEY": "AIzaSyBpNUxyC4stfKOuEoZiZOq0cxkvnGjTkHM",
        "EXPO_PUBLIC_FIREBASE_PROJECT_ID": "forex-signal-app-c0c32",
        "EXPO_PUBLIC_FIREBASE_APP_ID": "1:245922029776:web:ad1ff5d97ac5e4e01d3ed5",
        "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID": "245922029776",
        "EXPO_PUBLIC_FIREBASE_VAPID_KEY": "BFF8LCxcGGfvgAsQmV8P8brjmqCae77Hm3f19qjIiIP6KDlQHeyra19moyecFRgZNjaKwjKEq4sDJLxvmwXBq2Q",
        "EXPO_PUBLIC_EAS_PROJECT_ID": "8ce373b5-978a-43ad-a4cb-3ad8feb6e149"
      }
    }
```
*(Alternatively, configure these as EAS Environment Variables on `https://expo.dev/accounts/safikumar00/projects/bolt-expo-nativewind/environment-variables` for the `production` environment).*

---

### Fix 2 (Confirmed): Add Defensive Guard & Lazy/Safe Initialization to `firebase.ts`
**File:** [`lib/notifications/firebase.ts`](file:///d:/projects/github-sunilkumar029/Final-web-refactor/lib/notifications/firebase.ts)  
Prevent missing environment variables from causing an unrecoverable white screen. Check that `projectId` exists before initializing Firebase, wrap in `try/catch`, and allow the application UI to load even if push notifications are unconfigured:

```typescript
let webMessaging: any = null;

if (Platform.OS === 'web') {
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

  if (projectId && apiKey) {
    try {
      const firebaseConfig = {
        apiKey,
        authDomain: `${projectId}.firebaseapp.com`,
        projectId,
        storageBucket: `${projectId}.appspot.com`,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      };

      const app = initializeApp(firebaseConfig);
      webMessaging = getMessaging(app);

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => { });
      }
    } catch (error) {
      console.warn('⚠️ Firebase web initialization skipped or failed:', error);
    }
  } else {
    console.warn('⚠️ Firebase web configuration missing projectId or apiKey. Push notifications disabled on web.');
  }
}
```

---

## 11. Production Verification Checklist & Procedure

### Local Verification (Simulating Clean CI Export):
1. **Simulate CI Export Without Local `.env`**:
   ```powershell
   # Temporarily rename .env to test fallback behavior
   Rename-Item .env .env.bak
   npx expo export --platform web
   # Verify the bundle built without crashing
   Rename-Item .env.bak .env
   ```
2. **Verify Variable Inlining in Local Bundle**:
   ```powershell
   npx expo export --platform web
   # Search compiled bundle for projectId string
   $js = Get-Content "dist/_expo/static/js/web/entry-*.js" -Raw
   [bool]($js -match 'projectId:"forex-signal-app-c0c32"')
   # Must return True
   ```

### Production Deployment Verification:
1. Commit updated `eas.json` (or set environment variables on `expo.dev`).
2. Push to `main` branch to trigger `.eas/workflows/production.yml`.
3. Monitor build execution in Expo CLI / EAS dashboard:
   ```bash
   eas workflow:list
   ```
4. Verify deployed web bundle:
   ```powershell
   $res = (Invoke-WebRequest -Uri "https://forex-sigma-signals--9c5i9dpr58.expo.app" -UseBasicParsing).Content
   # Extract the entry-*.js script URL and inspect for void 0
   ```
5. Open `https://forex-sigma-signals--9c5i9dpr58.expo.app` in Chrome/Edge:
   - Verify UI renders completely without white screen.
   - Verify Console has zero uncaught Firebase exceptions.
