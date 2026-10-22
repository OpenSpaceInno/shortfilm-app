import { Module } from '@nestjs/common';
import { AiStudioController } from './controllers/ai-studio.controller';
import { AiOrchestratorService } from './services/ai-orchestrator.service';
import { AiStudioService } from './services/ai-studio.service';
import { ClaudeAiProvider } from './providers/claude-ai.provider';
import { OpenAiProvider } from './providers/openai-ai.provider';
import { MockAiProvider } from './providers/mock-ai.provider';
import { AiUsageLogsRepository } from './repositories/ai-usage-logs.repository';
import { AiJobsRepository } from './repositories/ai-jobs.repository';

@Module({
  controllers: [AiStudioController],
  providers: [
    MockAiProvider,
    ClaudeAiProvider,
    OpenAiProvider,
    AiOrchestratorService,
    AiStudioService,
    AiUsageLogsRepository,
    AiJobsRepository,
  ],
  exports: [
    AiOrchestratorService,
    AiStudioService,
    AiUsageLogsRepository,
    AiJobsRepository,
  ],
})
export class AiModule {}
