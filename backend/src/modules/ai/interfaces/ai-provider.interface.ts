export interface AiCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  jsonSchema?: Record<string, any>;
}

export interface AiCompletionResponse<T = any> {
  data: T;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  provider: string;
  model: string;
  latencyMs: number;
  rawText?: string;
}

export interface AiProvider {
  readonly providerName: string;
  readonly defaultModel: string;
  generateStructured<T>(request: AiCompletionRequest): Promise<AiCompletionResponse<T>>;
  isHealthy(): Promise<boolean>;
}
