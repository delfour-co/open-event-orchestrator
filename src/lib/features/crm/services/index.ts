export { createEmailTrackingService } from './email-tracking-service'
export type { EmailTrackingService, TrackingConfig, TrackedEmail } from './email-tracking-service'

export { createSegmentSyncService } from './segment-sync-service'
export type { SegmentSyncService, SegmentSyncResult } from './segment-sync-service'

export { createSuppressionListService } from './suppression-list-service'
export type { SuppressionListService } from './suppression-list-service'

export { createContactActivityService } from './contact-activity-service'
export type { ContactActivityService } from './contact-activity-service'

export { createCampaignAnalyticsService } from './campaign-analytics-service'
export type {
  CampaignAnalyticsService,
  CampaignAnalytics,
  CampaignComparisonStats,
  ContactEngagement,
  TimeSeriesDataPoint
} from './campaign-analytics-service'
