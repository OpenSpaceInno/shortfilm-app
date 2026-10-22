export const STORY_LAB_CACHE_TTL_SECONDS = 300;

export const STORY_LAB_THRESHOLDS = {
  /** Choice friction anomaly threshold (> 22% exit within 5s of prompt) */
  CHOICE_FRICTION_ANOMALY: 0.22,
  /** Branch monopoly bias threshold (> 85% votes for one option) */
  BRANCH_MONOPOLY_BIAS: 0.85,
  /** Character breakout score threshold (clicks + shares / views) */
  CHARACTER_BREAKOUT: 0.40,
  /** Episode bridge drop-off threshold (> 30% drop from Ep N to Ep N+1) */
  EPISODE_BRIDGE_DROPOFF: 0.30,
  /** Confidence score threshold required for AI narrative insight generation */
  AI_INSIGHT_CONFIDENCE: 0.80,
  /** Experiment variant candidate failsafe drop threshold (> 15% drop automatically triggers PAUSED) */
  FAILSAFE_DROP_PCT: 0.15,
};

export const STORY_LAB_QUEUE_NAME = 'story-lab-queue';

export const STORY_LAB_CACHE_KEYS = {
  SIGNALS: 'cache:story-lab:signals',
  INSIGHTS: 'cache:story-lab:insights',
  OPPORTUNITIES: 'cache:story-lab:opportunities',
  EXPERIMENTS: 'cache:story-lab:experiments',
  HEATMAP_PREFIX: 'cache:story-lab:heatmap:',
  CLUSTERING_PREFIX: 'cache:story-lab:clusters:',
};
