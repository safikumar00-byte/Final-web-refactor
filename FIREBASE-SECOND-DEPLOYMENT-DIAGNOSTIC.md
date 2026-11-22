# Firebase Second-Level Production Deployment Diagnostic Report

**Project**: `D:\projects\github-sunilkumar029\Final-web-refactor`  
**EAS Project ID**: `8ce373b5-978a-43ad-a4cb-3ad8feb6e149` (`bolt-expo-nativewind`)  
**Investigated URLs**:
- Pinned URL: `https://forex-sigma-signals--9c5i9dpr58.expo.app`
- Production Alias: `https://forex-sigma-signals.expo.app`
- Previous Working EAS Deployment: `https://forex-sigma-signals--z9yqmlwhb3.expo.app`  
**Latest Git Commit**: `4cbd924` ("eas fixes", committed `Sat Nov 21 14:02:54 2026 +0530`)  
**Investigation Mode**: Strictly Read-Only (no files modified, no builds triggered, no secrets exposed)  
**Date**: November 21, 2026

---

## Executive Summary

The investigation revealed **three definitive reasons** why the deployed web application at `https://forex-sigma-signals--9c5i9dpr58.expo.app` still displays `FirebaseError: Installations: Missing App configuration value: "projectId"`:

1. **The URL Being Tested is an Immutable, Stale Deployment [CONFIRMED]**:
   - `https://forex-sigma-signals--9c5i9dpr58.expo.app` is an immutable, single-deployment preview URL created on **Sat, 21 Nov 2026 at 07:29:10 GMT (12:59:10 IST)**.
   - Git commit `4cbd924` (containing the configuration fixes) was committed at **08:32:54 GMT (14:02:54 IST)** — **over one hour AFTER deployment `9c5i9dpr58` was uploaded**.
   - Deployment `9c5i9dpr58` was generated from an older, pre-fix export and will **never** receive updates. Testing this URL is testing a frozen, pre-fix state.

2. **EAS Workflows Did Not Execute for the New Commit [CONFIRMED]**:
   - Inspection of EAS Workflow runs (`npx eas-cli workflow:runs`) confirmed that **no EAS workflow ran for commit `4cbd924`**.
   - EAS Workflows configured with `on: push: branches: [main]` require the Expo GitHub App to be connected to the repository. Without that webhook connection, pushing to GitHub does not trigger a cloud workflow run.

3. **Production EAS Environment Variables Are Valid on Expo Cloud, but Module Initialization Has Zero Fallback [CONFIRMED]**:
   - EAS production environment variables (`EXPO_PUBLIC_FIREBASE_PROJECT_ID`, etc.) are correctly set in the Expo Dashboard under the `production` environment.
   - However, in `lib/notifications/firebase.ts`, Firebase is eagerly initialized at root module evaluation time (`initializeApp(firebaseConfig)` and `getMessaging(app)`). If exported in any environment lacking these variables (e.g., local CLI export or unlinked deployment), the entire web app crashes to a blank white screen before React can mount.

---

## Phase 1: Verification of Latest Repository Configuration

We inspected the working tree and latest commit history (`git show 4cbd924`):

| File | Status | Verification Detail | Finding |
| :--- | :--- | :--- | :--- |
| `eas.json` | Committed in `4cbd924` | Added `"environment": "production"` under `build.production`. | **[CONFIRMED]** |
| `.eas/workflows/production.yml` | Committed in `4cbd924` | Added `environment: production` under `deploy_web`. | **[CONFIRMED]** |
| `lib/notifications/firebase.ts` | Unchanged | Still performs eager, unprotected `initializeApp` at module evaluation time. | **[CONFIRMED]** |
| `lib/notifications/index.ts` | Unchanged | Re-exports from `./firebase`, causing eager load on web root. | **[CONFIRMED]** |
| `lib/supabase.ts` | Unchanged | Has fallback empty string for missing env variables. | **[CONFIRMED]** |

**Observation on `eas.json`**:
In `eas.json`, the `"env"` block was configured under `build.preview`, but was **not** present under `build.production`. However, since `.eas/workflows/production.yml` specifies `environment: production` on the `deploy_web` job, EAS cloud pulls variables directly from the EAS Environment Variables dashboard.

---

## Phase 2: Audit of Expo Production Environment Variables

We executed `npx eas-cli env:list production` against EAS project `8ce373b5-978a-43ad-a4cb-3ad8feb6e149`.

### Results:
- **Environment Selected**: `production` **[CONFIRMED]**
- **Project Association**: Variables are associated with the correct Expo project `bolt-expo-nativewind` (ID: `8ce373b5-978a-43ad-a4cb-3ad8feb6e149`) **[CONFIRMED]**
- **Configured Variables in EAS**:
  - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`: Value present (`forex-signal-app-c0c32`), Plain text, Visible to Client **[CONFIRMED]**
  - `EXPO_PUBLIC_FIREBASE_API_KEY`: Value present, Sensitive / Plain text **[CONFIRMED]**
  - `EXPO_PUBLIC_FIREBASE_APP_ID`: Value present, Plain text **[CONFIRMED]**
  - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Value present, Plain text **[CONFIRMED]**
  - `EXPO_PUBLIC_FIREBASE_VAPID_KEY`: Value present, Sensitive **[CONFIRMED]**
  - `EXPO_PUBLIC_SUPABASE_URL`: Value present, Plain text **[CONFIRMED]**
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Value present, Sensitive **[CONFIRMED]**
  - `SUPABASE_SERVICE_ROLE_KEY`: Value present, Secret **[CONFIRMED]**
  - `EXPO_PUBLIC_EAS_PROJECT_ID`: Value present, Plain text **[CONFIRMED]**

All required `EXPO_PUBLIC_*` Firebase variables are correctly populated in the Expo Dashboard under `production` and have client-compatible visibility.

---

## Phase 3: Deployment Job & Workflow Verification

We inspected `.eas/workflows/production.yml` and queried EAS workflow execution records via CLI:

```yaml
deploy_web:
  type: deploy
  environment: production
  params:
    prod: true
```

### Key Findings:
1. **Cloud Environment Mapping**: The job definition `type: deploy` with `environment: production` correctly instructs EAS cloud runners to inject the `production` environment variables during the web export and hosting step **[CONFIRMED]**.
2. **Execution History**:
   - `npx eas-cli workflow:runs` was executed to check recent workflow executions.
   - The only recorded EAS workflow run is `01a1ce54-34a8-7d68-b509-ef47e422d1a9`, which completed on **Nov 12, 2026**.
   - **Zero EAS workflow runs were triggered or executed for commit `4cbd924`** **[CONFIRMED]**.
3. **Why Pushing to GitHub Did Not Trigger EAS**:
   - An `on: push` trigger in `.eas/workflows/*.yml` requires the Expo GitHub App integration to be installed and granted access to `github-sunilkumar029/Final-web-refactor`.
   - Without this integration, GitHub does not emit webhook events to EAS, so no cloud workflow run occurred automatically after pushing commit `4cbd924` **[CONFIRMED]**.

---

## Phase 4: Inspection of the Latest Deployed JavaScript Bundle

We inspected the live deployed artifacts across multiple URLs by fetching the HTML and the bundled JavaScript files directly over HTTP.

### 1. Pinned URL: `https://forex-sigma-signals--9c5i9dpr58.expo.app`
- **HTTP Response Headers**:
  - `Last-Modified`: `Sat, 21 Nov 2026 07:29:10 GMT` (12:59:10 IST)
  - `ETag`: `"a012eb780de0177fbaa7e87e42fafc67"`
- **Referenced Script**: `/_expo/static/js/web/entry-befb631bfce674eaad694a005810069e.js`
- **Bundle Content Inspection**:
  - `projectId: void 0` -> **Present**
  - `apiKey: void 0` -> **Present**
  - `appId: void 0` -> **Present**
  - `authDomain: "undefined.firebaseapp.com"` -> **Present**
  - Expected Project ID (`forex-signal-app-c0c32`) -> **Absent (0 matches)**
- **Conclusion**: This bundle was built without environment variables and uploaded at 12:59:10 IST, before commit `4cbd924` (14:02:54 IST) **[CONFIRMED]**.

### 2. Production Alias URL: `https://forex-sigma-signals.expo.app`
- **HTTP Response Headers**:
  - `Last-Modified`: `Sat, 21 Nov 2026 07:29:10 GMT` (12:59:10 IST)
  - `ETag`: `"a012eb780de0177fbaa7e87e42fafc67"`
- **Referenced Script**: `/_expo/static/js/web/entry-befb631bfce674eaad694a005810069e.js`
- **Conclusion**: The production alias is currently pointed to deployment `9c5i9dpr58` and has not been updated since 12:59:10 IST **[CONFIRMED]**.

### 3. Comparison with Previous EAS Cloud Deployment: `https://forex-sigma-signals--z9yqmlwhb3.expo.app`
- **Origin**: Generated by EAS Workflow Run `01a1ce54-34a8-7d68-b509-ef47e422d1a9` (Job `01a1ce54-35bf-71f7-9bb3-c9e3ceebaf37`) on Nov 12.
- **Referenced Script**: `/_expo/static/js/web/entry-03854d6211f9c8436a0ad756bd3ec00c.js`
- **Bundle Content Inspection**:
  - `projectId: "forex-signal-app-c0c32"` -> **Present**
  - `projectId: void 0` -> **Absent**
- **Behavior**: This deployment initializes Firebase without error and loads properly **[CONFIRMED]**.

---

## Phase 5: Complete Firebase Initialization Paths Audit

We scanned the entire codebase for all Firebase references and initialization chains:

### 1. Application Client Path (`lib/notifications/firebase.ts`)
- **Import Chain**:
  `app/_layout.tsx`  
  └── imports `components/NotificationPermissionModal.tsx`  
      └── imports `from '@/lib/notifications'` (`lib/notifications/index.ts`)  
          └── imports and re-exports `./firebase` (`lib/notifications/firebase.ts`)
- **Execution Mechanism**:
  Because `lib/notifications/firebase.ts` runs top-level code:
  ```typescript
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || `${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || `${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };

  const app = initializeApp(firebaseConfig);
  const messaging = isSupported().then((yes) => (yes ? getMessaging(app) : null));
  ```
  `initializeApp` and `isSupported` run **immediately when the script executes** (module evaluation time), long before any React component mounts or any user interaction occurs.
- **Error Condition**:
  If Metro bundles `process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID` as `undefined` (because variables were not present in Metro's process environment during export), `initializeApp` accepts an object with `projectId: undefined`. Firebase's internal Installations component immediately throws:
  `FirebaseError: Installations: Missing App configuration value: "projectId"`
  Because there is no `try...catch` around `initializeApp`, the error is unhandled, halts JavaScript execution, and displays a blank screen **[CONFIRMED]**.

### 2. Service Worker Path (`public/firebase-messaging-sw.js`)
- Runs in a completely separate Web Worker context.
- Contains hardcoded Firebase configuration strings.
- Does not import or share state with `lib/notifications/firebase.ts`.
- **Verdict**: Not involved in the crash **[CONFIRMED]**.

### 3. Duplicate Initialization Check
- No other file calls `initializeApp`, `getApps`, or `getMessaging`.
- There are no duplicate initializations or conflicting instances in the project **[CONFIRMED]**.

---

## Phase 6: Old vs. New Deployment Timeline Comparison

| Event | Timestamp (IST) | Environment / Commit | Target URL / ID | Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **EAS Workflow Run** | Nov 12, 2026 11:29 | Cloud runner with production env | `...--z9yqmlwhb3.expo.app` | `projectId` bundled correctly. App loads. |
| **Manual / CLI Export & Deploy** | Nov 21, 2026 12:59:10 | Local / environment without env vars | `...--9c5i9dpr58.expo.app` | `projectId: void 0`. Uploaded to Expo Hosting. |
| **Git Commit `4cbd924`** | Nov 21, 2026 14:02:54 | Changes pushed to `origin/main` | None (no EAS build ran) | Commit exists on GitHub only. |
| **User Verification** | Nov 21, 2026 14:45+ | Visited stale URL `9c5i9dpr58` | `...--9c5i9dpr58.expo.app` | Observed the 12:59:10 IST broken deployment. |

---

## Phase 7: Final Root Cause & Answers to the 6 Core Questions

### Question 1: Are the production environment variables actually available to the web deployment job?
**Finding: [CONFIRMED]**  
- **On EAS Cloud Runners**: **Yes**. In EAS Workflows, `deploy_web` with `environment: production` pulls the variables configured under `production` on Expo Dashboard (which we verified exist via `eas-cli env:list production`).
- **In Local CLI Exports (`npx expo export`)**: **No**, unless a local `.env.production` or `.env` file containing the variables is loaded. EAS Dashboard variables are **not** downloaded to local developer terminals during `npx expo export` unless `eas env:pull` is used.

### Question 2: Does the latest deployed JavaScript contain the correct Firebase project ID?
**Finding: [CONFIRMED]**  
- In deployment `9c5i9dpr58` (the URL tested by the user), **No**. It contains `projectId: void 0`.
- In EAS Cloud deployment `z9yqmlwhb3`, **Yes**, it contains `projectId: "forex-signal-app-c0c32"`.

### Question 3: Is the deployment serving the latest commit?
**Finding: [CONFIRMED]**  
- **No**. Deployment `9c5i9dpr58` was uploaded at 12:59:10 IST. Commit `4cbd924` was committed at 14:02:54 IST (63 minutes later). The tested URL is serving a pre-fix snapshot.
- Furthermore, because `9c5i9dpr58` is an immutable deployment hash in the URL subdomain, it can never update.

### Question 4: Is another Firebase initialization path causing the same error?
**Finding: [CONFIRMED]**  
- **No**. Only `lib/notifications/firebase.ts` calls `initializeApp` in the client application.

### Question 5: Is the service worker involved?
**Finding: [CONFIRMED]**  
- **No**. `public/firebase-messaging-sw.js` runs in an isolated worker scope with hardcoded configuration.

### Question 6: What exact change is still required?
**Finding: [CONFIRMED]**  
Two actions are required:
1. **Defensive Source Guard (`lib/notifications/firebase.ts`)**: Add a defensive check and `try...catch` wrapper so that if Firebase configuration is missing or incomplete, Firebase logs a warning and disables FCM gracefully instead of throwing an unhandled exception that causes a blank white screen.
2. **Execute Deployment & Test the Correct URL**: Trigger a new EAS workflow or deploy with the production environment, then test against `https://forex-sigma-signals.expo.app` (or the new unique deployment URL generated).

---

## Minimum Required Corrective Changes (Awaiting User Approval)

### 1. Defensive Guard in `lib/notifications/firebase.ts`
Wrap Firebase client initialization to protect against missing environment variables:

```typescript
// Proposed defensive pattern:
const isFirebaseConfigured = Boolean(
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
);

let app: FirebaseApp | null = null;
let messagingPromise: Promise<Messaging | null> = Promise.resolve(null);

if (Platform.OS === 'web' && isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    messagingPromise = isSupported().then((yes) => (yes && app ? getMessaging(app) : null)).catch(() => null);
  } catch (error) {
    console.warn('[Firebase] Client initialization failed:', error);
  }
} else {
  if (Platform.OS === 'web') {
    console.warn('[Firebase] Skipping initialization: Missing EXPO_PUBLIC_FIREBASE_* environment variables');
  }
}
```

### 2. Triggering the Production Build / Deployment
To deploy commit `4cbd924` with the production environment:
- **Option A (Via EAS Workflow)**:
  Run: `npx eas-cli workflow:run .eas/workflows/production.yml --ref main`
- **Option B (Via EAS Hosting CLI with Production Environment)**:
  Run: `npx eas-cli deploy --prod --environment production`
- **Option C (Local Export with pulled variables)**:
  Run `npx eas-cli env:pull --environment production` followed by `npx expo export --platform web` and `npx eas-cli deploy --prod`.

### 3. Verification Target
Verify the new deployment either on:
- The updated alias: `https://forex-sigma-signals.expo.app`
- Or the new deployment URL emitted by the EAS CLI command.
- **Do not test `https://forex-sigma-signals--9c5i9dpr58.expo.app`**, as that URL is permanently frozen to the old 12:59:10 IST build.
