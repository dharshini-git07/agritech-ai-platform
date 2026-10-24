# AGENTIC_AI_PLAN.md — Eco Terrace Farming Assistant
> Proposed agentic AI architecture for Eco Terrace.
> Phase 1 is READ-ONLY and recommendation-focused. Pump control is NOT included in Phase 1.

---

## 1. Vision

The Eco Terrace Farming Assistant is an autonomous background process that:
1. Reads real sensor telemetry from Firestore.
2. Detects abnormal conditions (dry soil, low water, pH out of range, etc.).
3. Retrieves relevant crop/terrace context.
4. Uses Gemini to produce a plain-language situation report and recommendation.
5. Logs all observations to Firestore.
6. Surfaces the result in the existing dashboard.
7. Requires explicit human approval before any physical action (pump, valve, etc.).

---

## 2. Phase 1 — Read-Only Recommendation Agent

### 2.1 Architecture Diagram

```
[Trigger: scheduled / user-initiated]
         │
         ▼
┌─────────────────────────────┐
│   EcoTerrace Farming Agent   │  (Next.js API route: /api/agent/run)
│                              │
│  Step 1: readTelemetry()     │──► Firestore iot_telemetry (read-only)
│  Step 2: detectConditions()  │──► Deterministic rule engine
│  Step 3: fetchCropContext()  │──► Firestore crop_analysis (read-only, latest)
│  Step 4: buildPrompt()       │──► Structured Gemini prompt
│  Step 5: callGemini()        │──► Gemini 2.5 Flash (text only, no tools)
│  Step 6: parseResponse()     │──► JSON with try-catch + validation
│  Step 7: applyRules()        │──► Safety filter (MUST-NOT override)
│  Step 8: logRun()            │──► Firestore agent_runs (write)
│  Step 9: returnResult()      │──► JSON response to dashboard
└─────────────────────────────┘
         │
         ▼
[Dashboard: /dashboard/digital-twin or new /dashboard/agent]
```

### 2.2 Tools and Permissions

The agent runs inside a Next.js API route (`/api/agent/run`).

| Tool | Allowed | Denied |
|---|---|---|
| Read Firestore `iot_telemetry` | YES | — |
| Read Firestore `crop_analysis` (latest for user) | YES | — |
| Read Firestore `terrace_analysis` (latest for user) | YES | — |
| Call Gemini (text generation, no tool-use) | YES | — |
| Write Firestore `agent_runs` (log) | YES | — |
| Write Firestore `notifications` | YES (recommendation only) | — |
| Execute arbitrary code | NO | Blocked by design |
| Change Firestore security rules | NO | Blocked by design |
| Call pump/valve hardware | NO | Phase 2 only |
| Access other users' data | NO | uid-scoped queries only |

### 2.3 Data Flow

```
Firestore iot_telemetry/{deviceId}
  temperature: 31°C
  humidity: 45%
  soilMoisture: 18%       ← BELOW dry threshold (< 30%)
  waterTankLevel: 72%
  lightLux: 4200
  timestamp: "2026-10-24T13:30:00Z"
        │
        ▼ readTelemetry()
AgentContext {
  telemetry: { ... },
  conditions: [{ type: "DRY_SOIL", severity: "HIGH", value: 18 }],
  latestCropAnalysis: { crop: "Tomatoes", health: "Good", ... },
  latestTerraceAnalysis: { usableArea: "180 sq ft", ... }
}
        │
        ▼ buildPrompt()
"You are an IoT farming assistant for Eco Terrace.
 Current readings for device esp32_zone_01 (Soil Farming):
 - Soil Moisture: 18% (DRY — below 30% threshold)
 - Water Tank Level: 72% (adequate)
 - Temperature: 31°C | Humidity: 45%
 - Light: 4200 lux
 - Last seen: 13 minutes ago
 Current crop: Tomatoes (health: Good)

 Provide a structured JSON response..."
        │
        ▼ Gemini 2.5 Flash
{
  "situation": "Soil moisture is critically low at 18%, well below the 30% dry threshold...",
  "riskLevel": "HIGH",
  "recommendation": "Irrigate Zone 1 for approximately 15-20 minutes...",
  "proposedAction": { "type": "IRRIGATION", "duration_minutes": 20, "zone": "esp32_zone_01" },
  "requiresApproval": true,
  "confidenceReason": ["sensor reading is clear", "crop is water-demanding"]
}
        │
        ▼ applyRules() — SAFETY FILTER
Rule 1: requiresApproval MUST be true in Phase 1 — enforce if Gemini omits it
Rule 2: If waterTankLevel < 20%, block irrigation proposal and set riskLevel="CRITICAL"
Rule 3: If soilMoisture > 60%, block irrigation proposal entirely
Rule 4: proposedAction.duration_minutes MUST be in [5, 60]
Rule 5: proposedAction.zone MUST be in ALLOWED_TELEMETRY_DEVICES
        │
        ▼ logRun() → Firestore agent_runs
{
  agentVersion: "1.0.0",
  runId: "<uuid>",
  userId: "<uid>",
  deviceId: "esp32_zone_01",
  triggeredBy: "user" | "schedule",
  telemetrySnapshot: { ... },
  detectedConditions: [ ... ],
  geminiResponse: { ... },
  safetyRulesApplied: [ "REQUIRE_APPROVAL" ],
  finalRecommendation: { ... },
  timestamp: serverTimestamp()
}
        │
        ▼ Dashboard shows:
"⚠️ Soil Moisture Alert — Zone 1 needs irrigation.
 AI Recommendation: Irrigate for 20 minutes.
 [APPROVE IRRIGATION] [DISMISS]"
```

### 2.4 Decision Rules (Deterministic — applied before and after Gemini)

```typescript
// BEFORE Gemini — condition detection
const CONDITIONS = {
  DRY_SOIL:        (t) => (t.soilMoisture ?? 100) < 30,
  WET_SOIL:        (t) => (t.soilMoisture ?? 0) > 75,
  LOW_WATER_TANK:  (t) => (t.waterTankLevel ?? 100) < 20,
  LOW_HYDRO_LEVEL: (t) => (t.waterLevel ?? 100) < 35,
  HIGH_TEMP:       (t) => t.temperature > 38,
  LOW_PH:          (t) => (t.ph ?? 7) < 5.5,
  HIGH_PH:         (t) => (t.ph ?? 7) > 6.8,
  LOW_EC:          (t) => (t.ec ?? 1.5) < 1.0,
  HIGH_EC:         (t) => (t.ec ?? 1.5) > 2.2,
  STALE_DATA:      (t) => (Date.now() - new Date(t.timestamp).getTime()) > 45000,
};

// AFTER Gemini — safety overrides (CANNOT be bypassed by Gemini output)
const SAFETY_RULES = [
  { name: "REQUIRE_APPROVAL", fn: (r) => { r.requiresApproval = true; } },
  { name: "NO_IRRIGATION_LOW_TANK", fn: (r, ctx) => {
      if (ctx.telemetry.waterTankLevel < 20 && r.proposedAction?.type === "IRRIGATION") {
        r.proposedAction = null;
        r.recommendation += " WARNING: Water tank critically low — irrigation blocked.";
      }
    }
  },
  { name: "NO_IRRIGATION_WET_SOIL", fn: (r, ctx) => {
      if ((ctx.telemetry.soilMoisture ?? 0) > 60 && r.proposedAction?.type === "IRRIGATION") {
        r.proposedAction = null;
      }
    }
  },
  { name: "CLAMP_DURATION", fn: (r) => {
      if (r.proposedAction?.duration_minutes !== undefined) {
        r.proposedAction.duration_minutes = Math.min(60, Math.max(5, r.proposedAction.duration_minutes));
      }
    }
  },
];
```

### 2.5 Gemini Prompt Schema

The prompt instructs Gemini to return **only valid JSON** in this exact shape:

```json
{
  "situation": "Plain-language explanation of the current conditions",
  "riskLevel": "LOW | MEDIUM | HIGH | CRITICAL",
  "recommendation": "Specific recommended action for the farmer",
  "proposedAction": {
    "type": "IRRIGATION | NUTRIENT_ADJUSTMENT | VENTILATION | MONITORING",
    "zone": "esp32_zone_01 | esp32_zone_02 | hydro_zone_01",
    "duration_minutes": 15,
    "notes": "Optional extra notes for hardware execution"
  },
  "requiresApproval": true,
  "confidenceReason": ["reason 1", "reason 2"]
}
```

### 2.6 Safety Constraints

1. Gemini is called with **text-only** generation (no tool-use, no function calling).
2. The agent cannot modify Gemini prompts to include instructions that bypass safety rules.
3. Every Gemini response is validated against a strict schema before any action is taken.
4. All responses that include `proposedAction` MUST have `requiresApproval: true`.
5. The agent never writes to `iot_telemetry` — it is strictly a reader of that collection.
6. All agent runs are logged with full telemetry snapshot for auditability.
7. If Gemini returns a 503 or unparseable JSON, the run is logged as FAILED with no action taken.

---

## 3. New Files Required for Phase 1

```
src/
├── app/api/agent/run/route.ts           # POST endpoint — triggers agent run
├── services/
│   ├── farmingAssistantAgent.ts         # Main agent orchestrator
│   ├── conditionDetector.ts             # Deterministic condition detection
│   ├── agentPromptBuilder.ts            # Prompt construction with telemetry + crop context
│   └── agentSafetyRules.ts              # Post-Gemini safety filter
└── types/
    └── agentRun.ts                      # AgentRun, DetectedCondition, AgentProposal types
```

New Firestore collection: **`agent_runs`**
```
agent_runs/{runId}
  agentVersion: string
  userId: string
  deviceId: string
  triggeredBy: "user" | "schedule" | "threshold"
  telemetrySnapshot: IotTelemetryData
  detectedConditions: DetectedCondition[]
  geminiResponse: object
  safetyRulesApplied: string[]
  finalRecommendation: AgentProposal
  status: "success" | "failed" | "no_action"
  timestamp: Timestamp
```

---

## 4. Implementation Stages

### Stage 1 — Read-Only Core (no Gemini, no hardware)
**Goal**: Prove the data pipeline works end-to-end.
- [ ] Create `src/types/agentRun.ts`
- [ ] Create `src/services/conditionDetector.ts`
- [ ] Create `src/app/api/agent/run/route.ts` (read telemetry, detect conditions, log to Firestore)
- [ ] Add `agent_runs` collection to Firestore
- [ ] Add a manual trigger button to `/dashboard/digital-twin`

Acceptance criteria:
- Clicking the button creates a document in `agent_runs`
- Detected conditions match the actual telemetry values
- No errors when no telemetry exists (graceful empty-state)

### Stage 2 — Gemini Integration
**Goal**: Add LLM-generated recommendations.
- [ ] Create `src/services/agentPromptBuilder.ts`
- [ ] Create `src/services/agentSafetyRules.ts`
- [ ] Update `/api/agent/run` to call Gemini and apply safety rules
- [ ] Add schema validation for Gemini JSON response
- [ ] Handle Gemini 503 / partial responses without crashing

Acceptance criteria:
- Dry soil scenario produces a recommendation to irrigate
- Wet soil scenario does NOT produce an irrigation proposal
- Low tank scenario blocks irrigation proposal regardless of Gemini output
- All runs logged to `agent_runs` with full snapshots

### Stage 3 — Dashboard Integration
**Goal**: Surface recommendations to the farmer.
- [ ] Create `src/components/dashboard/AgentRecommendationCard.tsx`
- [ ] Load latest `agent_run` document for the current user
- [ ] Display situation, risk level, recommendation, and proposed action
- [ ] Add "Approve" / "Dismiss" buttons (Approve shows confirmation modal; no hardware yet)
- [ ] Auto-refresh every 60 seconds or via onSnapshot on `agent_runs`

Acceptance criteria:
- Farmer sees the recommendation card within 2 seconds of a run completing
- Approve button opens a modal with the full proposal details
- Dismiss marks the run as dismissed in Firestore

### Stage 4 — Pump Control (Phase 2, separate approval required)
> Do NOT start this stage until Stages 1–3 have been tested in production for at least 2 weeks.

- Define hardware command schema
- Implement `/api/agent/execute` with double confirmation
- Add valve/pump status feedback loop

---

## 5. Acceptance Criteria for Phase 1 Completion

| Criterion | Verification Method |
|---|---|
| Agent runs without errors when telemetry exists | Trigger from dashboard, check agent_runs |
| Agent runs without errors when no telemetry exists | Clear iot_telemetry, trigger, check graceful empty state |
| Dry soil (< 30%) always produces irrigation recommendation | Push test document to iot_telemetry with soilMoisture: 15 |
| Low tank (< 20%) blocks irrigation proposal | Push test document with waterTankLevel: 10 |
| Wet soil (> 60%) blocks irrigation proposal | Push test document with soilMoisture: 80 |
| requiresApproval is always true | Inspect all agent_run documents in Firestore |
| Gemini 503 does not crash the app | Mock Gemini to return 503, verify FAILED log entry |
| All runs are logged with full telemetry snapshot | Check Firestore agent_runs collection after each run |

---

## 6. What the Agent MUST NOT Do (Invariants)

These rules are enforced in code, not by Gemini:

1. MUST NOT execute pump, valve, or any hardware command in Phase 1.
2. MUST NOT call Gemini with tool-use or function-calling modes.
3. MUST NOT write to `iot_telemetry` (read-only).
4. MUST NOT read data belonging to other users.
5. MUST NOT pass raw Firestore documents directly to Gemini (use extracted, sanitized fields only).
6. MUST NOT trust Gemini's `requiresApproval: false` — override it to `true` always.
7. MUST NOT proceed if telemetry is stale (> 45 seconds old) — log as STALE_DATA condition.
