# 20. SHORTREEL — AI STUDIO & ORCHESTRATION ARCHITECTURE

> **Document ID:** SR-ARCH-20  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Architectural Philosophy: Assistive & Multi-Provider

AI in ShortReel powers the **Creator AI Story Studio** and enriches **Story Lab Intelligence**. It functions as an interactive creative partner for creators, not an autonomous agent.

> [!IMPORTANT]
> **Cardinal AI Safety & Quality Rules**:
> 1. **Zero Autonomous Publishing**: AI output is strictly **ASSISTIVE**. It cannot directly publish, approve, or commit changes to canonical live stories.
> 2. **Provider Agnostic**: The application core never imports provider-specific SDKs directly. All requests pass through an abstracted `AiOrchestratorService` interface.
> 3. **Audited Token & Cost Accounting**: Every LLM invocation records user context, prompt tokens, completion tokens, latency, and estimated cost.

```text
 ┌─────────────────────────────────────────────────────────────┐
 │       CREATOR STUDIO UI  /  ADMIN LAB INTERFACE             │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                     AI STUDIO MODULE                        │
 │        (/api/v1/ai-studio/* Controller & DTOs)              │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                 AI ORCHESTRATOR SERVICE                     │
 │  - Prompt Template Registry & System Directives             │
 │  - Zod Structured Output Validation                         │
 │  - Fallback & Circuit Breaker Logic                         │
 │  - Token Accounting & Rate Limiting                         │
 └──────────────┬───────────────────────────────┬──────────────┘
                │                               │
                ▼                               ▼
 ┌──────────────────────────────┐ ┌────────────────────────────┐
 │ Anthropic Claude Provider    │ │ OpenAI / Gemini Provider   │
 │ (Default Creative LLM)       │ │ (Secondary Fallback LLM)   │
 └──────────────────────────────┘ └────────────────────────────┘
```

---

## 2. Creative Capabilities & Use Cases

| Capability | Purpose | Input Context | Structured Output Contract |
| :--- | :--- | :--- | :--- |
| **Story Concept Expander** | Turn a brief premise into an interactive short series concept. | Logline, Genre, Target Audience, Target Episode Count. | `Title`, `Premise`, `Themes`, `CoreDilemma`, `CharacterProfiles[]` |
| **Character Forge** | Generate nuanced character bios, flaws, motivations, and secrets. | Story Theme, Role, Archetype, Dynamics. | `Name`, `Bio`, `CoreDesire`, `FatalFlaw`, `Secret`, `DialogueTone` |
| **Branch Dilemma Generator**| Suggest high-stakes, balanced 2-way narrative decision points. | Current Node Plot, Character Dilemma, Stakes. | `ChoicePrompt`, `OptionA { label, impact }`, `OptionB { label, impact }` |
| **Cliffhanger Architect** | Craft psychological episode end hooks for vertical retention. | Preceding Scenes, Episode Number, Target Arc. | `SceneBeats`, `CliffhangerPunchline`, `NextEpisodeBridgeHook` |
| **Production Pack Creator** | Generate production-ready shot lists, director notes, and visual cues. | Story Node Screenplay Beats, Setting. | `ShotList[] { shotType, angle, action, dialogue, audioCue }` |
| **Insight Summarizer** | Translate complex engagement signals into creative narrative notes for Story Lab. | Drop-off metrics, Choice distribution %, Viewer notes. | `ExecutiveSummary`, `RootCauseHypothesis`, `CreativeRemedies[]` |

---

## 3. Orchestration Layer Design

### 3.1 Interface Abstraction (`AiProvider` interface)

```typescript
export interface AiCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  schema?: z.ZodSchema<any>;
  temperature?: number;
  maxTokens?: number;
  modelTier?: 'CREATIVE_PREMIUM' | 'FAST_STRUCTURED';
  userId: string;
  storyId?: string;
}

export interface AiCompletionResponse<T = any> {
  data: T;
  rawText: string;
  provider: 'ANTHROPIC' | 'OPENAI' | 'GEMINI';
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  costEstimateUsd: number;
}

export interface AiProvider {
  readonly providerName: string;
  generateStructured<T>(request: AiCompletionRequest): Promise<AiCompletionResponse<T>>;
}
```

### 3.2 Provider Selection & Dynamic Routing
- **Primary Creative Tier (Claude 3.5 Sonnet)**: Leveraged for high-nuance narrative crafting, character voice differentiation, and script beat generation.
- **Fast / Structured Fallback Tier (GPT-4o-mini / Claude 3.5 Haiku)**: Used for metadata tagging, summary generation, and rapid schema parsing.
- **Failover Circuit Breaker**: If the primary provider experiences timeout (> 15s) or returns 5xx errors for 3 consecutive calls, the orchestrator automatically routes traffic to the fallback provider without consumer interruption.

---

## 4. Structured Output Validation & Prompt Engineering

1. **Strict Zod Schemas**: Every generative tool defines a strict TypeScript Zod schema. If the model output fails schema validation, the orchestrator triggers an automatic internal single-turn self-correction prompt:
   ```text
   The previous response failed schema validation with errors: {errors}.
   Return ONLY the corrected valid JSON object conforming to the schema.
   ```
2. **Deterministic Fallback**: If two consecutive validation attempts fail, the API returns a structured `AI_GENERATION_FAILED` error rather than hallucinated or malformed JSON payloads.
3. **Prompt Injection & Moderation Filtering**:
   - Inputs are scanned for prompt-injection markers (`Ignore all previous instructions...`).
   - Outputs are evaluated against safety and copyright guidelines to prevent generation of explicit harmful content or infringement of trademarked IP.

---

## 5. Asynchronous Job Processing for Long Tasks

For operations requiring substantial generation time (e.g. *Generate 10-Episode Production Script Pack*):
1. Client calls `POST /api/v1/ai-studio/production-pack`.
2. Controller immediately responds with `202 Accepted` and `{ jobId: "job_01J8...", status: "QUEUED" }`.
3. Background worker (`ai-studio-queue`) executes generation asynchronously.
4. When complete, worker updates the status in Redis and emits a real-time event to the Creator Studio frontend via WebSocket or polling.
