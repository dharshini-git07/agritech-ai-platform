# PROJECT_AUDIT.md — Eco Terrace AI Platform
> Authored by code inspection on 2026-10-24. Facts are taken directly from source files;
> inferences are clearly labelled.

---

## 1. Architecture Summary

Eco Terrace is a **Next.js 16 (App Router)** full-stack web application running on a single
repository at `d:\AgriTech-AI-Platform\website`.

```
Browser (React 19 / TailwindCSS v4)
      │
      ▼
Next.js App Router (both RSC and Client Components)
      │
      ├─► /api/analyze              → Gemini 2.5 Flash   (crop image → JSON diagnosis)
      ├─► /api/terrace-analysis     → Gemini 2.5 Flash   (terrace image/manual → JSON plan)
      ├─► /api/iot/telemetry        → Firebase Admin SDK (ESP32 → Firestore write)
      ├─► /api/payments/*           → Razorpay (order create / verify)
      ├─► /api/shopping-assistant   → Gemini              (AI chat)
      └─► /api/test-agent           → Multi-agent smoke test (GET, no auth)
            │
            ▼
    Firebase Auth  ──►  Cloud Firestore  ──►  Firebase Admin SDK
                                                 (server-only, applicationDefault)
```

**IoT path (ESP32 → cloud):**
```
ESP32 firmware → POST /api/iot/telemetry
  Origin must == "https://hardware-stimulator.lovable.app"
  Bearer token == IOT_SIMULATOR_API_KEY (>=32 chars)
  Validated → Firebase Admin SDK → Firestore iot_telemetry/{deviceId}
  Client subscriptions (onSnapshot) pick up changes in real time
```

---

## 2. Confirmed Technology Stack

| Layer | Package | Pinned Version |
|---|---|---|
| Framework | next | 16.2.9 |
| UI | react / react-dom | 19.2.4 |
| Styling | tailwindcss | ^4 |
| UI primitives | shadcn / radix-ui | shadcn ^4.12, radix-ui ^1.6 |
| Icons | lucide-react | ^1.21.0 |
| Gemini AI | @google/genai | ^2.10.0 |
| Firebase Client | firebase | ^12.15.0 |
| Firebase Admin | firebase-admin | ^14.5.0 |
| CSS utils | clsx / tailwind-merge / tw-animate-css | latest |
| TypeScript | typescript | ^5 |
| Test runner | node:test (built-in) | Node >= 22 |
| Package manager | npm (package-lock.json present) | — |

**External APIs consumed (no SDK)**
- Open-Meteo (free, no key required) — weather data
- Open-Meteo Geocoding — city → lat/lon
- Razorpay — payment gateway (keys env-gated)
- OpenStreetMap / Leaflet — delivery maps

**Hardware-Simulator origin** (allowed CORS): `https://hardware-stimulator.lovable.app`

---

## 3. Folder Structure

```
website/
├── next.config.ts          # devIndicators: false only
├── tsconfig.json           # strict: true, moduleResolution: bundler
├── package.json            # scripts: dev | build | start | lint | test
├── .env.local              # gitignored — must be created manually
├── tests/
│   ├── telemetryApi.test.mjs       # 15 tests, 32 sub-assertions — ALL PASS
│   └── recoveryKitPayload.test.mjs # 1 test — PASSES
└── src/
    ├── app/
    │   ├── layout.tsx              # Root: LanguageProvider + MarketplaceProvider + NotificationProvider
    │   ├── page.tsx                # Public landing page
    │   ├── login/page.tsx          # Login page
    │   ├── register/page.tsx       # Register page
    │   ├── role-selection/page.tsx # Role picker (farmer / customer / admin)
    │   ├── admin/page.tsx          # 712-line monolithic admin dashboard
    │   ├── customer/               # Customer portal
    │   ├── marketplace/            # Public marketplace pages
    │   ├── user/                   # User profile pages
    │   ├── dashboard/
    │   │   ├── layout.tsx          # ProtectedRoute + Sidebar + DashboardNavbar
    │   │   ├── page.tsx            # Farmer dashboard (IoT live stats + weather)
    │   │   ├── crop-analysis/      # Crop image upload + Gemini analysis
    │   │   ├── digital-twin/       # Digital twin layout + agent runner
    │   │   ├── history/            # Past analyses
    │   │   ├── hydroponics/        # Hydroponic telemetry view
    │   │   ├── marketplace/        # Farmer-side marketplace
    │   │   └── terrace-planner/    # Terrace analysis upload form
    │   └── api/
    │       ├── analyze/route.ts           # POST — crop analysis (Gemini)
    │       ├── terrace-analysis/route.ts  # POST — terrace analysis (Gemini)
    │       ├── iot/telemetry/route.ts     # GET/POST/OPTIONS — ESP32 telemetry
    │       ├── payments/create-order/     # POST — Razorpay order
    │       ├── payments/verify-payment/   # POST — Razorpay signature verification
    │       ├── shopping-assistant/        # POST — AI shopping chat
    │       ├── admin/clear-crop-analysis/ # DELETE-all (Admin SDK)
    │       └── test-agent/route.ts        # GET — agent smoke test (no auth — RISK)
    ├── components/
    │   ├── admin/       # AdminDashboard, UserManager, AnalyticsTab, ReportsTab
    │   ├── auth/        # LoginForm, RegisterForm, ProtectedRoute, RoleCard
    │   ├── common/      # LanguageContext, NotificationContext
    │   ├── crop/        # CropUploader, WebcamScanner, CropAnalysisCard, AiCropRecoveryKit
    │   ├── dashboard/   # StatCard, WeatherCard, HardwareTelemetryPanel, DashboardNavbar, Sidebar
    │   ├── landing/     # Hero, Features, HowItWorks, AISection, FarmingSection, Marketplace
    │   ├── layout/      # Navbar, Footer
    │   ├── marketplace/ # MarketplaceContext, AiShoppingAssistant, CartDrawer, OrderCard
    │   ├── notification/# NotificationBell
    │   ├── terrace/     # TerraceUploader, TerraceAnalysisCard
    │   ├── twin/        # TwinRenderer, TwinSidebar, TwinLegend, TwinZoneCard,
    │   │                #  TwinStateManager, TwinAgentManager,
    │   │                #  TwinIntelligenceDashboard, TwinPredictiveDashboard,
    │   │                #  TwinLifecycleDashboard
    │   └── ui/          # shadcn primitives (button, etc.)
    ├── lib/
    │   ├── firebase.ts        # Client SDK init (apiKey hardcoded — see Bug B7)
    │   ├── firebaseAdmin.ts   # Admin SDK (applicationDefault credential)
    │   ├── firebaseProject.ts # Shared project-ID constant + assertion
    │   ├── gemini.ts          # GoogleGenAI singleton, throws if GEMINI_API_KEY missing
    │   └── translations.ts    # 91 KB multilingual string table (en/ta/hi)
    ├── services/
    │   ├── agents/            # CropHealthAgent, FarmManagerAgent, TerracePlanningAgent,
    │   │                      #  WeatherAgent, MarketplaceAgent, SchedulerAgent
    │   ├── iotService.ts      # Firestore onSnapshot subscriptions + in-memory fallback
    │   ├── adminTelemetryService.ts # Admin SDK telemetry writes (server-only)
    │   ├── telemetryApi.ts    # Shared handler factory (validation + CORS)
    │   ├── telemetryPersistence.ts  # Adapter pattern for write/read
    │   ├── analysisService.ts # saveAnalysis / getUserCropAnalyses (Firestore)
    │   ├── digitalTwinService.ts    # generateAndSaveTwin / getUserTwins
    │   ├── notificationService.ts   # Firestore notifications CRUD
    │   ├── marketplaceService.ts    # Products / sellers / approvals
    │   ├── orderService.ts          # Full order lifecycle
    │   ├── paymentService.ts        # Razorpay integration
    │   ├── recommendationEngine.ts  # Starter-kit + recovery-kit generation (564 lines)
    │   ├── weatherService.ts        # Open-Meteo fetch + 15-min cache
    │   ├── cropService.ts           # EMPTY FILE (0 bytes) — Bug B1
    │   └── ... (40+ other service files)
    └── types/
        ├── iot.ts          # IotTelemetryData + derive helpers
        ├── digitalTwin.ts  # TwinModel, TwinZone, AgentRunLog, MasterFarmingPlan
        └── crop.ts, terrace.ts, marketplace.ts, order.ts, etc.
```

---

## 4. Firestore Collections (observed from code)

| Collection | Written by | Read by |
|---|---|---|
| `users` | Register flow | Dashboard, Admin, Login |
| `iot_telemetry` | Admin SDK (IoT endpoint) | iotService (onSnapshot) |
| `crop_analysis` | analysisService.saveAnalysis | analysisService.getUserCropAnalyses |
| `terrace_analysis` | terraceService.saveTerraceAnalysis | terraceService.getUserTerraceAnalyses |
| `digital_twins` | digitalTwinService.generateAndSaveTwin | DigitalTwinService.getUserTwins |
| `digital_twins/{id}/agent_runs` | FarmManagerAgent.orchestratePlan | FarmManagerAgent.getAgentRuns |
| `notifications` | NotificationService | NotificationBell component |
| `products` | Admin marketplace | RecommendationEngine, marketplace pages |
| `sellers` | Seller registration | Admin, marketplace |
| `orders` | orderService | Customer, Admin |
| `carts` | cartService | create-order API |
| `recovery_kits` | RecoveryKitService | AiCropRecoveryKit component |

---

## 5. Module Status

| Module | Status | Evidence |
|---|---|---|
| Landing page | Implemented, not verified | Page renders landing components |
| Login / Register / Role selection | Implemented, not verified | Firebase Auth email/password; ProtectedRoute guards |
| Dashboard (main) | Implemented, not verified | Reads Firestore users + subscribes to IoT telemetry |
| Crop image upload + Gemini analysis | Implemented, not verified | /api/analyze → gemini-2.5-flash → JSON |
| Terrace analysis (image/manual/hybrid) | Implemented, not verified | /api/terrace-analysis supports 3 modes |
| Save analysis to Firestore | Implemented, not verified | saveAnalysis + saveTerraceAnalysis with sanitizer |
| IoT telemetry ingestion (POST) | **IMPLEMENTED AND VERIFIED** | 15 unit tests, 32 assertions — all pass |
| IoT Firestore subscription + dashboard | Implemented, not verified | onSnapshot in iotService |
| HardwareTelemetryPanel (UI) | Implemented, not verified | Soil + hydroponics mode tabs, derive helpers |
| Hydroponics page | Implemented, not verified | Subscribes to hydro_zone_01 |
| Digital Twin (layout) | Implemented, not verified | Auto-generates zones from terrace analysis |
| Digital Twin (intelligence/predictive) | Partially implemented | TwinIntelligenceService exists; many `any` types |
| Digital Twin Agent orchestration | Partially implemented | FarmManagerAgent orchestrates rule-based sub-agents; not LLM-driven |
| Notifications | Implemented, not verified | Firestore-backed; triggered by crop analysis completion |
| Marketplace | Implemented, not verified | Full CRUD; seller approval; cart; orders |
| Payments (Razorpay) | Partially implemented | API routes exist; key env-gated; not verified |
| Admin dashboard | Implemented, not verified | 712-line page; tabs for sellers, products, orders, analytics |
| Weather (Open-Meteo) | Implemented, not verified | fetchWeather + 15-min cache; hardcoded Chennai coords |
| Recommendation engine | Implemented, not verified | 564-line starter-kit + recovery-kit generation |
| Multi-language (en/ta/hi) | Implemented, not verified | 91 KB translation file; cookie-based |
| AI Shopping Assistant | Implemented, not verified | /api/shopping-assistant → Gemini chat |
| `cropService.ts` | **BROKEN** | File is 0 bytes — Bug B1 |
| `DashboardHeader.tsx` | **EMPTY** | File is 0 bytes — Bug B2 |
| `/api/test-agent` (smoke test) | Simulated / Mock | Uses mock TwinModel; unauthenticated |
| ESP32 physical hardware | Not connected | hardware/ directory is empty |
| Pump control | Not implemented | No pump-activation endpoint exists |
| Real-time camera | Simulated | LiveCameraMonitoring component exists; actual feed not confirmed |

---

## 6. Security Observations

| # | Location | Observation |
|---|---|---|
| 1 | `src/lib/firebase.ts` line 8 | Firebase `apiKey` hardcoded in source. Should move to `NEXT_PUBLIC_FIREBASE_API_KEY` env var. |
| 2 | `src/app/api/test-agent/route.ts` | No authentication. Writes to Firestore when Admin credentials present. Remove or auth-gate before production. |
| 3 | `src/services/analysisService.ts` line 32 | Falls back to `uid = "anonymous_farmer"` — allows unauthenticated Firestore writes. |
| 4 | `src/app/api/payments/create-order/route.ts` | Uses client Firebase SDK server-side to fetch prices. Depends on Firestore rules allowing this read. |
| 5 | `README.md` | Unresolved Git merge conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) present. |
| 6 | `src/services/weatherService.ts` | Default coordinates hardcoded to Chennai. No user-configurable location. |
| 7 | `src/services/agents/*` | Sub-agents are pure rule-based functions, not LLM calls. Architecture docs must reflect this accurately. |

---

## 7. Identified Bugs

| # | Severity | File | Description |
|---|---|---|---|
| B1 | HIGH | `src/services/cropService.ts` | File is 0 bytes. Any import will fail. |
| B2 | HIGH | `src/components/dashboard/DashboardHeader.tsx` | File is 0 bytes. Not currently imported, but any future use will crash. |
| B3 | MEDIUM | `src/components/crop/CropUploader.tsx` line 84 | `JSON.parse(data.result)` not wrapped in try-catch. Gemini 503 or partial response throws unguarded. |
| B4 | MEDIUM | `src/app/api/analyze/route.ts` line 160 | Catch block does not distinguish Gemini 503 overload from other errors. Client sees generic alert. |
| B5 | MEDIUM | `src/services/analysisService.ts` line 32 | Unauthenticated writes allowed to `crop_analysis` collection. |
| B6 | LOW | `website/README.md` | Unresolved Git merge conflict markers in file. |
| B7 | LOW | `src/lib/firebase.ts` | `apiKey` hardcoded in source file. |
| B8 | LOW | `package.json` | Missing `"type": "module"` causes Node to reparse TypeScript test files with a performance warning. |
| B9 | INFO | `src/app/api/test-agent/route.ts` | Unauthenticated route that triggers real Firestore writes when Admin credentials are configured. |
| B10 | INFO | `src/services/agents/CropHealthAgent.ts` | Agent is rule-based (keyword matching), not LLM-driven. Not a bug, but must be documented accurately. |
