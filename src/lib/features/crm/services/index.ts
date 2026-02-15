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

export { createGdprComplianceService } from './gdpr-compliance-service'
export type {
  GdprComplianceService,
  DoubleOptInResult,
  ConfirmationResult,
  DataDeletionResult
} from './gdpr-compliance-service'

export { createCustomFieldService } from './custom-field-service'
export type { CustomFieldService } from './custom-field-service'

export { createLeadScoringService } from './lead-scoring-service'
export type { LeadScoringService, ScoreUpdateResult } from './lead-scoring-service'

export { createContactDeduplicationService } from './contact-deduplication-service'
export type {
  ContactDeduplicationService,
  DuplicateScanResult
} from './contact-deduplication-service'

export { createContactHistoryService } from './contact-history-service'
export type {
  ContactHistoryService,
  RecordParticipationInput
} from './contact-history-service'

export { createTemplateLibraryService } from './template-library-service'
export type { TemplateLibraryService } from './template-library-service'

export { createAbTestingService } from './ab-testing-service'
export type { AbTestingService } from './ab-testing-service'

export { createAutomationService } from './automation-service'
export type { AutomationService } from './automation-service'

export { createEngagementMetricsService } from './engagement-metrics-service'
export type { EngagementMetricsService } from './engagement-metrics-service'

export { createEmailPreviewService } from './email-preview-service'
export type { EmailPreviewService } from './email-preview-service'

export { createCrmStatsService } from './crm-stats-service'
export type {
  CrmStatsService,
  ContactStats,
  CampaignStats,
  RecentCampaign,
  EngagementStats
} from './crm-stats-service'
