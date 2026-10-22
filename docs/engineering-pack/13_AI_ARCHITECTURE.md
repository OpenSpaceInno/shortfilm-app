# 13. SHORTREEL — AI ARCHITECTURE

> **Document:** 13_AI_ARCHITECTURE.md
> **Reference:** docs/architecture/20_AI_ARCHITECTURE.md

## 1. Cardinal Rule: Assistive Only

AI NEVER autonomously publishes, approves, or modifies content.
Human editorial approval is always required before AI-generated content reaches consumers.

## 2. Provider Abstraction

`	ypescript
interface AiProvider {
  generateStructured<T>(request: AiCompletionRequest): Promise<AiCompletionResponse<T>>;
}

// Primary: Anthropic Claude 3.5 Sonnet (creative, character-voice)
// Fallback: OpenAI GPT-4o (structured, fast)
`

## 3. AI Orchestrator Service

Single entry point for all AI calls:
- Selects provider based on task type and availability
- Validates structured output using Zod schemas
- Auto-retries with self-correction prompt on schema validation failure
- Records token usage and estimated cost in i_usage_logs
- Circuit breaks to fallback provider after 3 consecutive timeouts

## 4. Creative Capabilities

| Feature | Endpoint | Model Tier |
| :--- | :--- | :--- |
| Story concept expansion | POST /ai-studio/concept-expand | CREATIVE_PREMIUM |
| Character forge | POST /ai-studio/character-forge | CREATIVE_PREMIUM |
| Branch dilemma generator | POST /ai-studio/branch-dilemma | CREATIVE_PREMIUM |
| Cliffhanger architect | POST /ai-studio/cliffhanger | CREATIVE_PREMIUM |
| Production pack (async) | POST /ai-studio/production-pack | CREATIVE_PREMIUM |
| Insight summarizer (Story Lab) | Internal service call | FAST_STRUCTURED |

## 5. Async Job Flow

For long-running generation (production packs):
`
POST /ai-studio/production-pack → 202 { jobId, status: 'QUEUED' }
BullMQ ai-studio-queue worker executes generation
GET /ai-studio/jobs/:jobId → { status: 'PROCESSING'|'COMPLETE'|'FAILED', data? }
`

## 6. Prompt Safety

- Inputs scanned for injection markers
- Outputs filtered against explicit content and trademarked IP patterns
- All AI usage logged with user context for audit
