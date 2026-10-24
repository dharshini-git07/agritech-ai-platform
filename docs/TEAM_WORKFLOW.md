# TEAM_WORKFLOW.md — Eco Terrace AI Platform
> Development collaboration, branching, and safe secret management.

---

## 1. Git Branching Strategy

```
main
  └── develop          ← integration branch (always deployable)
        ├── feature/crop-analysis-error-handling
        ├── feature/agentic-ai-prototype
        ├── fix/crop-uploader-json-parse
        └── fix/anonymous-firestore-write
```

| Branch | Purpose | Who merges |
|---|---|---|
| `main` | Production-ready code only | Tech Lead — after full review |
| `develop` | Latest integrated work | Any member — after PR review |
| `feature/*` | New features | Author — opens PR to `develop` |
| `fix/*` | Bug fixes | Author — opens PR to `develop` |
| `docs/*` | Documentation updates | Author — can self-merge to `develop` |

### Branch Rules
- Never commit directly to `main`.
- Never commit directly to `develop` except for trivial doc-only changes.
- Each PR must reference the relevant bug number from `PROJECT_AUDIT.md` if applicable.
- Keep feature branches short-lived (< 1 week).

---

## 2. Module Ownership

| Module | Primary Owner | Secondary |
|---|---|---|
| Firebase / Auth / Firestore rules | Tech Lead | Backend dev |
| Gemini API routes (`/api/analyze`, `/api/terrace-analysis`) | AI dev | Backend dev |
| IoT telemetry pipeline | IoT dev | Backend dev |
| Digital Twin + Agent system | AI dev | Full-stack dev |
| Marketplace + Payments | Full-stack dev | Backend dev |
| Dashboard UI + Components | Frontend dev | Full-stack dev |
| Hydroponics monitoring | IoT dev | Frontend dev |
| Notification system | Full-stack dev | Backend dev |
| Admin dashboard | Full-stack dev | Tech Lead |
| Tests (`/tests/`) | All (each dev writes tests for their module) | Tech Lead reviews |
| Documentation (`/docs/`) | All | Tech Lead reviews |

---

## 3. Pull Request Process

### Opening a PR
1. Ensure `npm test` passes locally (all 33 tests must pass).
2. Ensure `npm run lint` passes with zero errors.
3. Run `npx tsc --noEmit` to confirm no TypeScript errors.
4. Fill in the PR template:
   - What does this change?
   - Which bugs does it fix? (reference B1–B10 from PROJECT_AUDIT.md)
   - Does it touch Firestore collections, security rules, or API routes?
   - Screenshots if UI changed.

### Review Checklist
- [ ] No `.env.local` contents in the diff
- [ ] No new hardcoded API keys, passwords, or credentials
- [ ] New API routes are authenticated (or explicitly documented as public)
- [ ] Gemini response parsing is wrapped in try-catch
- [ ] Firestore writes check for authenticated user before proceeding
- [ ] New Firestore collections/queries noted in PROJECT_AUDIT.md
- [ ] Tests added for new service-layer logic

### Merging
- Require at least **1 approval** before merging to `develop`.
- Require **Tech Lead approval** before merging to `main`.
- Use **Squash and merge** to keep history clean.

---

## 4. Safe Environment Variable Management

### Rules
1. **`.env.local` is gitignored and must NEVER be committed.**
2. Share secrets only through a secure password manager (e.g. Bitwarden, 1Password) or a dedicated secrets manager (Google Secret Manager).
3. Use descriptive, namespaced names: `IOT_SIMULATOR_API_KEY`, `GEMINI_API_KEY`, etc.
4. Variables visible to the browser must be prefixed `NEXT_PUBLIC_` — all others are server-only.
5. Never log secret values. Log only masked indicators: `[key configured: true]`.

### Sharing a New Variable with the Team
1. Add the variable name (not value) to `.env.local.example` at the repo root.
2. Add a row to the "Variable Descriptions" table in `docs/LOCAL_SETUP.md`.
3. Announce in the team channel with the variable name and where to obtain its value.

### Current Required Variables

| Variable | Required For |
|---|---|
| `GEMINI_API_KEY` | All Gemini AI routes |
| `GOOGLE_APPLICATION_CREDENTIALS` | Firebase Admin SDK (IoT, Admin routes) |
| `IOT_SIMULATOR_API_KEY` | IoT telemetry endpoint |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Payment UI (browser-side) |
| `RAZORPAY_KEY_SECRET` | Payment verification (server-side) |

---

## 5. Testing Before Merging

```powershell
# From d:\AgriTech-AI-Platform\website

# 1. Run all automated tests
npm test

# 2. TypeScript check (no build output)
npx tsc --noEmit

# 3. Lint check
npm run lint

# 4. Build check (catches Next.js bundling errors)
npm run build
```

**All four commands must complete without errors before opening a PR.**

### Test Coverage Goals

| Area | Current Tests | Target |
|---|---|---|
| IoT telemetry API | 15 tests (32 assertions) — PASS | Maintain |
| Recovery kit payload | 1 test — PASS | Maintain |
| Gemini response parsing | 0 tests | Add: test JSON.parse try-catch |
| analysisService | 0 tests | Add: test unauthenticated write guard |
| iotService | 0 tests | Add: test in-memory fallback |

---

## 6. Commit Message Convention

```
type(scope): short description

Types: feat | fix | docs | refactor | test | chore
Scope: iot | gemini | twin | marketplace | auth | dashboard | payments

Examples:
  feat(gemini): distinguish 503 from other errors in /api/analyze
  fix(iot): wrap JSON.parse in CropUploader with try-catch
  docs(setup): update LOCAL_SETUP with Windows gcloud instructions
  test(telemetry): add edge-case tests for oversized payload
```
