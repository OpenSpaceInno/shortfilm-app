import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  AiProvider,
  AiCompletionRequest,
  AiCompletionResponse,
} from '../interfaces/ai-provider.interface';
import { ClaudeAiProvider } from '../providers/claude-ai.provider';
import { OpenAiProvider } from '../providers/openai-ai.provider';
import { MockAiProvider } from '../providers/mock-ai.provider';
import { AiUsageLogsRepository } from '../repositories/ai-usage-logs.repository';
import { AiFeature, AiUsageStatus } from '../../../database/schema';

interface CircuitBreakerState {
  failures: number;
  trippedUntil: number | null;
}

export interface OrchestrationParams {
  request: AiCompletionRequest;
  feature: AiFeature;
  userId: string;
  creatorId?: string | null;
}

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);

  // Injection filter patterns to prevent prompt leakage / jailbreak attempts
  private readonly injectionPatterns: RegExp[] = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
    /system\s+override/i,
    /act\s+as\s+dan\b/i,
    /jailbreak/i,
    /reveal\s+(the\s+)?system\s+prompt/i,
    /print\s+(the\s+)?system\s+prompt/i,
    /bypass\s+all\s+rules/i,
  ];

  // Circuit breaker state for external providers
  private circuitBreakers: Record<string, CircuitBreakerState> = {
    ANTHROPIC_CLAUDE: { failures: 0, trippedUntil: null },
    OPENAI_GPT4: { failures: 0, trippedUntil: null },
  };

  private readonly maxFailuresBeforeTrip = 3;
  private readonly tripCooldownMs = 60 * 1000; // 1 minute cooldown

  constructor(
    private readonly claudeProvider: ClaudeAiProvider,
    private readonly openAiProvider: OpenAiProvider,
    private readonly mockProvider: MockAiProvider,
    private readonly usageLogsRepo: AiUsageLogsRepository,
  ) {}

  /**
   * Validate prompt safety and check for injection attempts
   */
  public validatePromptSafety(prompt: string): void {
    if (!prompt || typeof prompt !== 'string') return;
    for (const pattern of this.injectionPatterns) {
      if (pattern.test(prompt)) {
        this.logger.warn(`Prompt injection pattern detected: ${pattern}`);
        throw new BadRequestException(
          'Potential prompt injection or safety policy violation detected in input prompt.',
        );
      }
    }
  }

  /**
   * Calculate estimated cost in USD based on model and token counts
   */
  public calculateEstimatedCost(
    provider: string,
    promptTokens: number,
    completionTokens: number,
  ): string {
    let cost = 0;
    if (provider === this.claudeProvider.providerName) {
      // Claude 3.5 Sonnet: $3/1M in ($0.000003), $15/1M out ($0.000015)
      cost = promptTokens * 0.000003 + completionTokens * 0.000015;
    } else if (provider === this.openAiProvider.providerName) {
      // GPT-4o: $2.50/1M in ($0.0000025), $10/1M out ($0.00001)
      cost = promptTokens * 0.0000025 + completionTokens * 0.00001;
    }
    return cost.toFixed(6);
  }

  /**
   * Check if circuit breaker allows requests to this provider
   */
  private isCircuitAvailable(providerName: string): boolean {
    const breaker = this.circuitBreakers[providerName];
    if (!breaker) return true;
    if (breaker.trippedUntil && Date.now() < breaker.trippedUntil) {
      return false;
    }
    if (breaker.trippedUntil && Date.now() >= breaker.trippedUntil) {
      // Cooldown expired, half-open
      breaker.failures = 0;
      breaker.trippedUntil = null;
    }
    return true;
  }

  private recordFailure(providerName: string): void {
    const breaker = this.circuitBreakers[providerName];
    if (!breaker) return;
    breaker.failures += 1;
    if (breaker.failures >= this.maxFailuresBeforeTrip) {
      breaker.trippedUntil = Date.now() + this.tripCooldownMs;
      this.logger.warn(
        `Circuit breaker tripped for ${providerName} until ${new Date(breaker.trippedUntil).toISOString()}`,
      );
    }
  }

  private recordSuccess(providerName: string): void {
    const breaker = this.circuitBreakers[providerName];
    if (!breaker) return;
    breaker.failures = 0;
    breaker.trippedUntil = null;
  }

  /**
   * Primary entry point: Runs safety checks, routes through providers with circuit breaker & fallback,
   * logs usage and returns the structured payload.
   */
  async execute<T>(params: OrchestrationParams): Promise<AiCompletionResponse<T>> {
    const { request, feature, userId, creatorId } = params;

    // 1. Safety validation
    this.validatePromptSafety(request.userPrompt);
    if (request.systemPrompt) {
      this.validatePromptSafety(request.systemPrompt);
    }

    let response: AiCompletionResponse<T> | null = null;
    let status: AiUsageStatus = 'SUCCESS';
    let lastError: any = null;

    // 2. Attempt primary: Claude 3.5 Sonnet
    if (this.isCircuitAvailable(this.claudeProvider.providerName)) {
      try {
        response = await this.claudeProvider.generateStructured<T>(request);
        this.recordSuccess(this.claudeProvider.providerName);
      } catch (err: any) {
        this.logger.warn(`Primary Claude provider failed: ${err.message}. Engaging fallback.`);
        this.recordFailure(this.claudeProvider.providerName);
        lastError = err;
      }
    } else {
      this.logger.log(`Circuit open for ${this.claudeProvider.providerName}; skipping to secondary.`);
    }

    // 3. Attempt secondary fallback: OpenAI GPT-4o
    if (!response && this.isCircuitAvailable(this.openAiProvider.providerName)) {
      try {
        status = 'FALLBACK';
        response = await this.openAiProvider.generateStructured<T>(request);
        this.recordSuccess(this.openAiProvider.providerName);
      } catch (err: any) {
        this.logger.warn(`Secondary OpenAI provider failed: ${err.message}. Engaging mock creative engine.`);
        this.recordFailure(this.openAiProvider.providerName);
        lastError = err;
      }
    }

    // 4. Final safety fallback: High-fidelity simulated creative provider
    if (!response) {
      status = 'FALLBACK';
      this.logger.log('Engaging Mock Creative Provider fallback to guarantee zero service interruption.');
      response = await this.mockProvider.generateStructured<T>(request);
    }

    // 5. Audit token usage, latency, and estimated cost
    const estimatedCostUsd = this.calculateEstimatedCost(
      response.provider,
      response.promptTokens,
      response.completionTokens,
    );

    try {
      await this.usageLogsRepo.logUsage({
        userId,
        creatorId: creatorId || null,
        feature,
        provider: response.provider,
        model: response.model,
        promptTokens: response.promptTokens,
        completionTokens: response.completionTokens,
        totalTokens: response.totalTokens,
        estimatedCostUsd,
        status,
        latencyMs: response.latencyMs,
        metadata: {
          feature,
          temperature: request.temperature,
          promptLength: request.userPrompt.length,
        },
      });
    } catch (auditErr: any) {
      this.logger.error(`Failed to record AI usage log: ${auditErr.message}`, auditErr.stack);
      // We don't fail the user's creative generation if the audit logging encounters an issue
    }

    return response;
  }
}
