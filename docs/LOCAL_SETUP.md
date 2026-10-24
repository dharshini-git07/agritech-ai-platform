# LOCAL_SETUP.md — Eco Terrace AI Platform
> Complete Windows onboarding guide for new team members.
> Every command uses **PowerShell**. Last verified: Node v22.22.0, npm 10.9.4.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone the Repository](#2-clone-the-repository)
3. [Install Dependencies](#3-install-dependencies)
4. [Firebase Configuration](#4-firebase-configuration)
5. [Create .env.local](#5-create-envlocal)
6. [Start the Development Server](#6-start-the-development-server)
7. [Verify Your Setup](#7-verify-your-setup)
8. [Testing Individual Features](#8-testing-individual-features)
9. [Available Scripts](#9-available-scripts)
10. [GitHub Workflow](#10-github-workflow)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Prerequisites

Install the following **before** anything else. Open a fresh PowerShell window and verify each one.

| Tool | Required Version | Download | Verify |
|---|---|---|---|
| Node.js | **22 LTS** (22.x) | https://nodejs.org/en/download | `node --version` → `v22.x.x` |
| npm | 10.x (bundled with Node 22) | (included) | `npm --version` → `10.x.x` |
| Git | 2.x | https://git-scm.com/download/win | `git --version` |
| Google Cloud SDK | Any | https://cloud.google.com/sdk/docs/install | `gcloud --version` |

> **Why Node 22?** The test runner uses `node --experimental-strip-types` which requires Node 22.
> Installing an older version will make `npm test` fail.

> **Why Google Cloud SDK?** The Firebase Admin SDK uses Application Default Credentials (ADC).
> You need either `gcloud` configured or a service-account JSON file — see Section 4.

---

## 2. Clone the Repository

```powershell
git clone https://github.com/dharshini-git07/agritech-ai-platform.git
cd agritech-ai-platform\website
```

Verify you are in the right directory:
```powershell
Get-Item package.json   # should exist
```

---

## 3. Install Dependencies

```powershell
npm install
```

This reads `package-lock.json` and installs the exact pinned versions used by everyone on
the team. **Do not run `npm update`** — that would change dependency versions.

Expected output ends with something like:
```
added 847 packages, and audited 848 packages in 45s
```

---

## 4. Firebase Configuration

The project uses Firebase in **two separate ways** — you must understand both.

### 4a. Client-Side Firebase (already configured — nothing to do)

The browser-side Firebase SDK (`src/lib/firebase.ts`) is initialized with a **public config
object** hardcoded in the source file:

```
Project ID:       agritech-ai-platform
Auth Domain:      agritech-ai-platform.firebaseapp.com
Storage Bucket:   agritech-ai-platform.firebasestorage.app
```

These values are **not secrets**. Firebase client API keys are designed to be public and are
protected by Firebase Security Rules, not by keeping the key private. You do not need to
add these to `.env.local`.

Every team member automatically connects to the same Firebase project by cloning the repo.

### 4b. Server-Side Firebase Admin SDK (requires individual setup)

Backend API routes (`/api/iot/telemetry`, `/api/admin/*`) use the **Firebase Admin SDK**,
which requires privileged credentials that are **never stored in source code**.

You have two options. Choose one:

---

**Option A (Recommended for local dev) — Service Account JSON**

1. Ask the **Tech Lead** to add you as a Firebase project member:
   - Go to [Firebase Console](https://console.firebase.google.com) → Project `agritech-ai-platform`
   - Project Settings → Users and Permissions → Add Member → your Google account → Editor role

2. Once added, generate your **own** service account key (do NOT share it):
   - Firebase Console → Project Settings → Service Accounts
   - Click **Generate New Private Key** → download the JSON file
   - Name it something like `eco-terrace-admin.json`
   - Save it **outside the project directory**: `C:\secrets\eco-terrace-admin.json`
   - ⚠️ **Never place it inside `d:\AgriTech-AI-Platform\`**

3. Set the env var in `.env.local` (see Section 5):
   ```
   GOOGLE_APPLICATION_CREDENTIALS=C:\secrets\eco-terrace-admin.json
   ```

---

**Option B — Google Cloud Application Default Credentials**

If you already have access to the Google Cloud project via your corporate account:

```powershell
gcloud auth application-default login
```

A browser window opens. Log in with the Google account that has Firebase Editor access.
Credentials are stored locally in `~\AppData\Roaming\gcloud\application_default_credentials.json`.
Leave `GOOGLE_APPLICATION_CREDENTIALS` out of `.env.local` entirely.

Verify it works:
```powershell
gcloud auth application-default print-access-token
# Should print a long token string, not an error
```

---

### 4c. Firebase Authentication Providers

The app uses **Email/Password authentication**. All sign-up and sign-in flows use this
provider. No additional OAuth providers are configured.

If you are testing the admin dashboard, ask the Tech Lead for a test account with the
`admin` role set in Firestore (`users/{uid}.role = "admin"`).

---

## 5. Create `.env.local`

Copy the template and fill in your values:

```powershell
Copy-Item .env.example .env.local
```

Then open `.env.local` in VS Code:
```powershell
code .env.local
```

Fill in each variable. Rules:
- **No spaces around `=`** — `KEY=value` not `KEY = value`
- **No quotes around values** unless the value itself contains spaces
- Values with spaces: `KEY="my value with spaces"`

```env
# Required — get from https://aistudio.google.com/app/apikey
GEMINI_API_KEY=AIza...your_actual_key_here

# Required — path to your service-account JSON (Option A from Section 4b)
# Skip this line if you used Option B (gcloud ADC)
GOOGLE_APPLICATION_CREDENTIALS=C:\secrets\eco-terrace-admin.json

# Required — must match what the IoT simulator is configured to send
# Ask the Tech Lead for the current value
IOT_SIMULATOR_API_KEY=the_shared_iot_key_minimum_32_chars

# Optional — only needed for marketplace payment testing
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# Optional — only needed if running the Python plant-disease service locally
PLANT_DISEASE_API_URL=http://127.0.0.1:8000
```

**After editing `.env.local`, restart `npm run dev`** — Next.js only reads this file on startup.

### Variable Reference

| Variable | Scope | Required | Where to get it |
|---|---|---|---|
| `GEMINI_API_KEY` | Server-only | **Yes** — app throws on startup | https://aistudio.google.com/app/apikey |
| `GOOGLE_APPLICATION_CREDENTIALS` | Server-only | Yes (unless using gcloud ADC) | Firebase Console → Service Accounts |
| `IOT_SIMULATOR_API_KEY` | Server-only | Yes (IoT routes) | Ask Tech Lead — shared team value |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | **Browser + Server** | No (payments only) | Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | Server-only | No (payments only) | Razorpay dashboard |
| `PLANT_DISEASE_API_URL` | Server-only | No (local ML only) | Defaults to localhost:8000 |

> **`NEXT_PUBLIC_` prefix**: Variables prefixed with `NEXT_PUBLIC_` are embedded into the
> browser bundle and visible to anyone who inspects the page source. Only non-secret values
> (like a publishable Razorpay key) should use this prefix. Never put `GEMINI_API_KEY` or
> `GOOGLE_APPLICATION_CREDENTIALS` as `NEXT_PUBLIC_`.

---

## 6. Start the Development Server

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Expected startup output:
```
   ▲ Next.js 16.2.9
   - Local:        http://localhost:3000
   - Environments: .env.local
   ✓ Starting...
   ✓ Ready in 2.5s
```

If you see `Error: GEMINI_API_KEY is missing in .env.local` — the key is either absent or
has spaces around `=`. Fix `.env.local` and restart.

---

## 7. Verify Your Setup

Run these checks in order. Each one must pass before moving to the next.

### 7a. Automated tests (no Firebase required)
```powershell
npm test
```
Expected: `33 tests pass, 0 fail`

### 7b. TypeScript check
```powershell
npx tsc --noEmit
```
Expected: no output (zero errors)

### 7c. Lint check
```powershell
npm run lint
```
> ⚠️ **Known pre-existing state:** The codebase currently has 189 ESLint errors and 116
> warnings, almost entirely `@typescript-eslint/no-explicit-any` violations across service
> and type files. These were present before your checkout. Running lint will show errors —
> **this does not mean your setup is broken.** Bug B10 in `docs/PROJECT_AUDIT.md` tracks
> this. Do not add new `any` types; existing ones will be cleaned up incrementally.

### 7d. Manual smoke checks

| Page | URL | Expected |
|---|---|---|
| Landing page | http://localhost:3000 | Hero + features sections load |
| Login | http://localhost:3000/login | Email/password form visible |
| Register | http://localhost:3000/register | Registration form visible |
| Dashboard | http://localhost:3000/dashboard | Redirects to login if not signed in |

### 7e. Confirm Firebase is reachable (after login)
1. Register a new account at `/register`
2. Log in at `/login`
3. You should reach the Dashboard — this proves Firebase Auth is working
4. Check the browser console for any Firebase errors

### 7f. Confirm Gemini AI is working
1. Go to `/dashboard/crop-analysis`
2. Upload any plant image
3. Wait up to 30 seconds for the analysis result
4. If you see `Gemini analysis failed` — check `GEMINI_API_KEY` in `.env.local`

### 7g. Confirm Firebase Admin / IoT endpoint is working
```powershell
# Should return { "error": "Origin not allowed" } — that is correct behaviour from localhost
Invoke-WebRequest -Uri http://localhost:3000/api/iot/telemetry -Method OPTIONS | Select-Object StatusCode, Content
```

---

## 8. Testing Individual Features

### 8a. AI Features (Gemini)

| Feature | Route | How to test |
|---|---|---|
| Crop disease analysis | `/dashboard/crop-analysis` | Upload a plant image — result should appear in ~10–30s |
| Terrace planning (image) | `/dashboard/terrace-planner` | Upload a terrace photo — JSON plan renders as cards |
| Terrace planning (manual) | `/dashboard/terrace-planner` | Enter dimensions manually → click Analyze |
| AI Shopping Assistant | Any dashboard page | Click the chat bubble (bottom-right corner) |

If Gemini returns a 503, it means the model is temporarily overloaded — wait 30 seconds and retry. This is not a configuration error.

### 8b. Firestore Operations

Firestore is used automatically when you interact with the app. To observe writes:
1. Open [Firebase Console](https://console.firebase.google.com) → Firestore
2. Watch the following collections as you use the app:

| Action | Collection | Document |
|---|---|---|
| Register | `users` | `{uid}` |
| Crop analysis | `crop_analysis` | `{analysisId}` |
| Terrace analysis | `terrace_analysis` | `{analysisId}` |
| Digital twin generated | `digital_twins` | `{twinId}` |
| Notification created | `notifications` | `{notifId}` |

### 8c. IoT Telemetry (simulated)

The IoT endpoint requires the hardware simulator origin and Bearer token. You cannot test it
from localhost directly (CORS blocks it). Use this PowerShell command to simulate a device:

```powershell
# Replace YOUR_IOT_KEY with the actual value from your .env.local
$iotKey = "YOUR_IOT_KEY_HERE"

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/iot/telemetry" `
  -Method POST `
  -Headers @{
    "Origin"        = "https://hardware-stimulator.lovable.app"
    "Authorization" = "Bearer $iotKey"
    "Content-Type"  = "application/json"
  } `
  -Body '{"deviceId":"esp32_zone_01","farmingMode":"soil","soilMoisture":55,"waterTankLevel":85,"temperature":27,"humidity":62,"lightLux":1400}'
```

Expected response:
```json
{ "success": true, "message": "Telemetry persisted", "data": { ... } }
```

If you get `500 Failed to persist telemetry` — your Firebase Admin credentials are not
configured (see Section 4b).

---

## 9. Available Scripts

All scripts are defined in [`package.json`](../package.json).

| Command | What it does |
|---|---|
| `npm run dev` | Starts the Next.js development server on http://localhost:3000 |
| `npm run build` | Compiles a production build (checks for TS errors and build failures) |
| `npm start` | Starts the production build (run `npm run build` first) |
| `npm test` | Runs all tests in `tests/` using Node's built-in test runner |
| `npm run lint` | Runs ESLint across the whole project |
| `npx tsc --noEmit` | TypeScript type check without emitting files |

> **Before opening a pull request**, the following must pass:
> ```powershell
> npm test          # must: 0 failures
> npx tsc --noEmit  # must: 0 errors
> npm run build     # must: build succeeds
> npm run lint      # goal: do not introduce NEW lint errors
> ```
> Note: `npm run lint` currently reports pre-existing `any` errors. Your PR must not
> increase the error count. New code you write should use proper TypeScript types.

---

## 10. GitHub Workflow

### Branch Structure

```
main              ← production-ready code only (protected)
  └── develop     ← integration branch — always deployable
        ├── feature/your-feature-name
        └── fix/bug-description
```

### Day-to-day workflow

```powershell
# 1. Always start from develop
git checkout develop
git pull origin develop

# 2. Create your branch
git checkout -b feature/my-feature-name

# 3. Write code, then check before committing
npm test                  # all tests must pass
npx tsc --noEmit         # zero TypeScript errors
npm run lint              # zero lint errors

# 4. Commit
git add .
git commit -m "feat(dashboard): add zone status indicator"

# 5. Push and open a pull request against develop
git push origin feature/my-feature-name
```

### Commit message format

```
type(scope): short description

Types:  feat | fix | docs | refactor | test | chore
Scopes: iot | gemini | twin | marketplace | auth | dashboard | payments | admin

Examples:
  feat(gemini): add try-catch around JSON.parse in CropUploader
  fix(iot): restart cloudflare tunnel after server reboot
  docs(setup): update LOCAL_SETUP with Razorpay instructions
  test(telemetry): add edge-case for oversized payload
```

### Pull Request rules

- Target branch: `develop` (never `main` directly)
- At least **1 approval** required before merge
- All CI checks must pass
- No `.env.local` contents, API keys, or service-account JSON in the diff
- Use **Squash and merge**

### Code review checklist

Before approving a PR, verify:
- [ ] No secrets in the diff
- [ ] `npm test` passes
- [ ] `npx tsc --noEmit` passes
- [ ] New API routes are authenticated or explicitly documented as public
- [ ] Gemini response parsing uses try-catch
- [ ] Firestore writes check for authenticated user

---

## 11. Troubleshooting

### `Error: GEMINI_API_KEY is missing in .env.local`
- The variable name has a **trailing space** in your `.env.local` → change `GEMINI_API_KEY =` to `GEMINI_API_KEY=`
- The `.env.local` file doesn't exist → copy from `.env.example`
- The dev server was not restarted after editing `.env.local` → `Ctrl+C` then `npm run dev`

### `Firebase Admin is initialized for an unexpected project`
- Your service-account JSON belongs to a **different Firebase project**
- Open the JSON and check `"project_id"` — it must say `agritech-ai-platform`
- Ask the Tech Lead for a service account from the correct project

### `Error: Could not load the default credentials`
- `GOOGLE_APPLICATION_CREDENTIALS` is not set and `gcloud` ADC is not configured
- Option A: set `GOOGLE_APPLICATION_CREDENTIALS=C:\secrets\your-file.json` in `.env.local`
- Option B: run `gcloud auth application-default login`

### `Gemini analysis failed.` (on crop upload page)
- GEMINI_API_KEY is missing or wrong → check `.env.local`
- Gemini returned a 503 (temporary overload) → wait 30 seconds and retry
- Check the terminal running `npm run dev` for detailed error output

### Dashboard shows `--` for all IoT readings
- No telemetry has been pushed to Firestore yet
- Run the PowerShell test command from Section 8c
- Check Firebase Console → Firestore → `iot_telemetry/esp32_zone_01`

### `500 Failed to persist telemetry` from the IoT endpoint
- Firebase Admin credentials are missing or wrong → see Section 4b
- The service-account JSON file path in `GOOGLE_APPLICATION_CREDENTIALS` doesn't exist → verify with `Test-Path "C:\secrets\your-file.json"`

### Port 3000 is already in use
```powershell
# Find what is using port 3000
netstat -ano | findstr ":3000"
# Kill it by PID
Stop-Process -Id <PID> -Force
# Or start on a different port
npm run dev -- --port 3001
```

### `npm install` fails with permission errors
```powershell
# Run PowerShell as Administrator, then:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
npm install
```

### `npm test` shows `TypeError: ... not a function`
- You are running Node < 22 → `node --version` should show `v22.x.x`
- If it shows an older version, install Node 22 LTS from https://nodejs.org and restart your terminal

### Git merge conflict markers in README.md
The `README.md` file contains unresolved Git merge conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
This is a known issue (Bug B6 in PROJECT_AUDIT.md) and does not affect the application.
Do not edit `README.md` without resolving the conflict first.

---

## Teammate Onboarding Checklist

Print this list and tick each item. Every step marked **Manual** requires human action.

```
ENVIRONMENT SETUP
[ ] Install Node.js 22 LTS                            → Manual: https://nodejs.org
[ ] Verify: node --version → v22.x.x
[ ] Install Git 2.x                                   → Manual: https://git-scm.com
[ ] Install Google Cloud SDK                          → Manual: https://cloud.google.com/sdk
[ ] Run: gcloud --version (verify it works)

REPOSITORY ACCESS
[ ] Accept GitHub repo invitation                     → Manual: ask Tech Lead
[ ] git clone https://github.com/dharshini-git07/agritech-ai-platform.git
[ ] cd agritech-ai-platform\website
[ ] npm install (verify: no errors)

FIREBASE ACCESS
[ ] Ask Tech Lead to add your Google account to the  → Manual: Tech Lead action
    Firebase project agritech-ai-platform with Editor role
[ ] Generate your service-account JSON key            → Manual: Firebase Console
    (Project Settings → Service Accounts → Generate New Private Key)
[ ] Save JSON outside repo: C:\secrets\eco-terrace-admin.json
[ ] Verify project_id in JSON == "agritech-ai-platform"

GEMINI API ACCESS
[ ] Create Google AI Studio account at               → Manual: https://aistudio.google.com
    https://aistudio.google.com
[ ] Generate API key
[ ] Copy key (do not screenshot, do not share in chat)

IOT SIMULATOR KEY
[ ] Ask Tech Lead for the current IOT_SIMULATOR_API_KEY → Manual: ask Tech Lead
    (Must be at least 32 characters)

ENVIRONMENT FILE
[ ] Copy-Item .env.example .env.local
[ ] Fill in GEMINI_API_KEY (no spaces around =)
[ ] Fill in GOOGLE_APPLICATION_CREDENTIALS path
[ ] Fill in IOT_SIMULATOR_API_KEY
[ ] Verify no trailing spaces in key names

VERIFICATION
[ ] npm run dev  (server starts on port 3000, no errors)
[ ] npm test     (33 tests pass, 0 fail)
[ ] npx tsc --noEmit (zero errors)
[ ] Register at /register (Firebase Auth working)
[ ] Upload crop image at /dashboard/crop-analysis (Gemini AI working)
[ ] Run IoT PowerShell test from Section 8c (Firestore write confirmed)

GITHUB WORKFLOW
[ ] git checkout develop && git pull origin develop
[ ] Create feature branch: git checkout -b feature/your-name-init
[ ] Read TEAM_WORKFLOW.md before first PR                → docs/TEAM_WORKFLOW.md
[ ] Read PROJECT_AUDIT.md for known bugs                 → docs/PROJECT_AUDIT.md
```

---

## Manual Configuration Steps Required (Summary)

The following steps **cannot be automated** and require human action from you or the Tech Lead:

| # | Who | Action |
|---|---|---|
| 1 | **Tech Lead** | Add new developer's Google account to Firebase project `agritech-ai-platform` as Editor |
| 2 | **New Developer** | Generate their own service-account private key from Firebase Console |
| 3 | **New Developer** | Store the JSON at `C:\secrets\` (outside the repository) |
| 4 | **New Developer** | Create a Gemini API key at https://aistudio.google.com/app/apikey |
| 5 | **Tech Lead** | Share the current `IOT_SIMULATOR_API_KEY` value securely (password manager, not chat) |
| 6 | **New Developer** | Create `.env.local` from `.env.example` and populate all values |
| 7 | **Tech Lead** | Grant GitHub repository access (collaborator invite) |

---

## Checks Executed During This Setup (Actual Results)

| Check | Command | Result |
|---|---|---|
| Node.js version | `node --version` | ✅ **v22.22.0** |
| npm version | `npm --version` | ✅ **10.9.4** |
| Automated tests | `npm test` | ✅ **33 tests, 0 failures** |
| TypeScript check | `npx tsc --noEmit` | ✅ **Zero errors** |
| Lint check | `npm run lint` | ⚠️ **189 errors, 116 warnings** — all pre-existing `@typescript-eslint/no-explicit-any` in type and service files. No new errors from this session's changes. |
| IoT POST (local) | `Invoke-RestMethod` to localhost | ✅ CORS + Auth pass; **500 on Firestore** (expected — `GOOGLE_APPLICATION_CREDENTIALS` not configured on this machine) |
| `.gitignore` coverage | Manual file review | ✅ `.env.local`, `*.pem`, `node_modules`, `.next` all excluded |
| `.env.example` created | File created | ✅ Safe placeholders only, no real values |
| `.env.local` format | Key name inspection | ⚠️ **Spaces around `=` detected on lines 1–2** — fix before restarting server |
