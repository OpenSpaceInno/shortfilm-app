import { Injectable, Logger, Optional } from '@nestjs/common';
import { StoryLabRepository } from '../repositories/story-lab.repository';
import { STORY_LAB_THRESHOLDS } from '../constants/story-lab.constants';
import {
  type StorySignal,
  type StoryInsight,
  type ContentOpportunity,
  type InsightStatus,
  type OpportunityStatus,
} from '../../../database/schema/story-lab.schema';

@Injectable()
export class NarrativeInsightService {
  private readonly logger = new Logger(NarrativeInsightService.name);

  constructor(
    private readonly repository: StoryLabRepository,
  ) {}

  /**
   * Evaluate raw engagement and choice telemetry to detect behavioral anomaly signals
   */
  async detectSignalsForStory(storyId: string): Promise<StorySignal[]> {
    const graph = await this.repository.getStoryGraphDetails(storyId);
    const watchStats = await this.repository.getEpisodeWatchStats(storyId);
    const generatedSignals: StorySignal[] = [];

    // 1. Detect EPISODE_BRIDGE_DROPOFF (> 30% drop from Ep N to Ep N+1)
    if (watchStats.length >= 2) {
      for (let i = 0; i < watchStats.length - 1; i++) {
        const curr = Number(watchStats[i].completedViewers || 100);
        const next = Number(watchStats[i + 1].totalViewers || 0);
        const dropRate = 1.0 - next / Math.max(curr, 1);

        if (dropRate >= STORY_LAB_THRESHOLDS.EPISODE_BRIDGE_DROPOFF) {
          const sig = await this.repository.createSignal({
            storyId,
            signalType: 'EPISODE_BRIDGE_DROPOFF',
            strength: dropRate > 0.45 ? 'STRONG' : 'MODERATE',
            strengthScore: (Math.min(dropRate * 100, 100)).toFixed(2),
            confidenceScore: '0.880',
            title: `Elevated cliffhanger drag between Episode ${watchStats[i].episodeNumber} and ${watchStats[i + 1].episodeNumber}`,
            observation: `${Math.round(dropRate * 100)}% of viewers who completed Episode ${
              watchStats[i].episodeNumber
            } did not initiate Episode ${watchStats[i + 1].episodeNumber} within 48 hours.`,
            possibleInterpretation: 'Episode cliffhanger failed to provide immediate compelling continuation incentive.',
            suggestedInvestigation: 'Tighten closing dialogue or test alternate end-card teaser placement.',
            metricsJson: { dropRate, fromEp: watchStats[i].episodeNumber, toEp: watchStats[i + 1].episodeNumber },
            detectedAt: new Date(),
          });
          generatedSignals.push(sig);
          break;
        }
      }
    }

    // 2. Detect BRANCH_MONOPOLY_BIAS (> 85% votes for one option)
    if (graph.choices.length > 0) {
      for (const choice of graph.choices) {
        const opts = graph.options.filter((o) => o.choiceId === choice.id);
        const totalVotes = opts.reduce((s, o) => s + (o.voteCount || 0), 0);

        if (totalVotes >= 10 && opts.length >= 2) {
          const maxOpt = opts.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))[0];
          const dominanceRatio = (maxOpt.voteCount || 0) / totalVotes;

          if (dominanceRatio >= STORY_LAB_THRESHOLDS.BRANCH_MONOPOLY_BIAS) {
            const sig = await this.repository.createSignal({
              storyId,
              signalType: 'BRANCH_MONOPOLY_BIAS',
              strength: 'STRONG',
              strengthScore: (dominanceRatio * 100).toFixed(2),
              confidenceScore: '0.940',
              title: `Branch monopoly detected on "${choice.prompt.slice(0, 40)}..."`,
              observation: `Option "${maxOpt.label}" captures ${Math.round(
                dominanceRatio * 100,
              )}% of all viewer choices, rendering secondary branches virtually unvisited.`,
              possibleInterpretation: 'Dilemma lacks credible moral ambiguity or consequential stakes.',
              suggestedInvestigation: 'Rebalance choice incentives or raise dramatic consequences of the minority path.',
              metricsJson: { dominanceRatio, optionId: maxOpt.id, totalVotes },
              detectedAt: new Date(),
            });
            generatedSignals.push(sig);
          }
        }
      }
    }

    this.logger.log(`Detected ${generatedSignals.length} behavioral signals for story '${storyId}'`);
    return generatedSignals;
  }

  /**
   * Synthesize narrative commentary and formulate story_insights
   * High-confidence signals (>= 0.80) are enriched algorithmically / via AI
   */
  async generateInsights(storyId?: string, minConfidence: number = 0.80): Promise<StoryInsight[]> {
    const signals = await this.repository.findSignals({
      storyId,
      limit: 10,
    });

    const highConfidenceSignals = signals.filter(
      (s) => Number(s.confidenceScore) >= minConfidence,
    );

    const generatedInsights: StoryInsight[] = [];

    for (const sig of highConfidenceSignals) {
      const commentary = `Narrative Synthesis: Observed ${sig.signalType} with confidence ${sig.confidenceScore}. ` +
        `Data indicates: ${sig.observation} Recommendation: ${sig.suggestedInvestigation || 'Editorial review recommended.'}`;

      const insight = await this.repository.createInsight({
        storyId: sig.storyId,
        signalId: sig.id,
        title: `Editorial Insight: ${sig.title}`,
        summary: sig.observation,
        narrativeCommentary: commentary,
        confidenceScore: sig.confidenceScore,
        status: 'UNRESOLVED',
        actionPlan: sig.suggestedInvestigation || null,
      });

      generatedInsights.push(insight);

      // High-impact insights formulate strategic content opportunities
      if (Number(sig.strengthScore) >= 60) {
        await this.formulateOpportunityFromInsight(insight, sig);
      }
    }

    return generatedInsights;
  }

  /**
   * Formulate content_opportunity from insight
   */
  private async formulateOpportunityFromInsight(
    insight: StoryInsight,
    sig: StorySignal,
  ): Promise<ContentOpportunity> {
    let oppType: 'BRANCH_REBALANCING' | 'PACING_RE_EDIT' | 'SPINOFF_CANDIDATE' | 'ENDING_EXPANSION' =
      'PACING_RE_EDIT';

    if (sig.signalType === 'BRANCH_MONOPOLY_BIAS' || sig.signalType === 'CHOICE_FRICTION_ANOMALY') {
      oppType = 'BRANCH_REBALANCING';
    } else if (sig.signalType === 'CHARACTER_BREAKOUT_SCORE') {
      oppType = 'SPINOFF_CANDIDATE';
    }

    return await this.repository.createOpportunity({
      storyId: insight.storyId,
      insightId: insight.id,
      title: `Strategic Opportunity: ${oppType.replace(/_/g, ' ')} for ${sig.title.slice(0, 50)}`,
      opportunityType: oppType,
      status: 'PROPOSED',
      priority: 'HIGH',
      priorityScore: '85.00',
      observation: insight.summary,
      possibleOpportunity:
        `Commission creative review to implement ${oppType.toLowerCase().replace(/_/g, ' ')}. ` +
        `Editorial approval required before drafting new branch version.`,
      evidenceJson: {
        signalId: sig.id,
        confidence: sig.confidenceScore,
        strength: sig.strengthScore,
      },
    });
  }

  /**
   * Human editorial status update for insights
   */
  async updateInsightStatus(
    id: string,
    status: InsightStatus,
    actionPlan?: string,
  ): Promise<StoryInsight | null> {
    return await this.repository.updateInsightStatus(id, status, actionPlan);
  }

  /**
   * Human editorial status update for opportunities
   */
  async updateOpportunityStatus(
    id: string,
    status: OpportunityStatus,
    reviewerNotes?: string,
  ): Promise<ContentOpportunity | null> {
    return await this.repository.updateOpportunityStatus(id, status, reviewerNotes);
  }
}
