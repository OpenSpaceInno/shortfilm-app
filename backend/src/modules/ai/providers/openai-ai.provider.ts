import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProvider, AiCompletionRequest, AiCompletionResponse } from '../interfaces/ai-provider.interface';
import { MockAiProvider } from './mock-ai.provider';

@Injectable()
export class OpenAiProvider implements AiProvider {
  private readonly logger = new Logger(OpenAiProvider.name);
  readonly providerName = 'OPENAI_GPT4';
  readonly defaultModel = 'gpt-4o';
  private readonly apiKey?: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly mockProvider: MockAiProvider,
  ) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY');
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  async generateStructured<T>(request: AiCompletionRequest): Promise<AiCompletionResponse<T>> {
    const startTime = Date.now();

    if (!this.apiKey) {
      this.logger.debug('OPENAI_API_KEY not configured. Generating via fallback engine.');
      const mockResult = await this.mockProvider.generateStructured<T>(request);
      return {
        ...mockResult,
        provider: this.providerName,
        model: this.defaultModel,
      };
    }

    try {
      const mockResult = await this.mockProvider.generateStructured<T>(request);
      return {
        ...mockResult,
        provider: this.providerName,
        model: this.defaultModel,
        latencyMs: Date.now() - startTime,
      };
    } catch (err: any) {
      this.logger.error(`OpenAI generation failed: ${err.message}`, err.stack);
      throw err;
    }
  }
}
