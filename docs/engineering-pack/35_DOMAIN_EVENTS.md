# 35. SHORTREEL — DOMAIN EVENTS

## Internal Event Bus

NestJS EventEmitter2 for in-process domain event propagation.
NOT a message broker — events are fire-and-forget, within the same process.
For cross-module communication that needs persistence, use BullMQ job dispatch instead.

## Canonical Events

`	ypescript
export enum DomainEvent {
  USER_REGISTERED          = 'user.registered',
  USER_SUSPENDED           = 'user.suspended',
  STORY_PUBLISHED          = 'story.published',
  STORY_ARCHIVED           = 'story.archived',
  EPISODE_COMPLETED        = 'episode.completed',
  CHOICE_MADE              = 'choice.made',
  BADGE_UNLOCKED           = 'badge.unlocked',
  XP_AWARDED               = 'xp.awarded',
  SUBSCRIPTION_ACTIVATED   = 'subscription.activated',
  SUBSCRIPTION_CANCELLED   = 'subscription.cancelled',
  SUBSCRIPTION_FAILED      = 'subscription.payment_failed',
  VIDEO_READY              = 'video.ready',
  VIDEO_FAILED             = 'video.failed',
  CREATOR_APPROVED         = 'creator.approved',
  CREATOR_VERIFIED         = 'creator.verified',
}
`

## Listeners

- STORY_PUBLISHED → invalidate feed cache, dispatch notifications to followers
- CHOICE_MADE → enqueue badge evaluation job, enqueue analytics event
- BADGE_UNLOCKED → create notification, update streak
- VIDEO_READY → update episode published state, notify creator
- SUBSCRIPTION_ACTIVATED → create entitlement record, send welcome email
