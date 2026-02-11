export {
  contactSchema,
  contactSourceSchema,
  type Contact,
  type ContactSource,
  type CreateContact,
  contactFullName,
  contactInitials,
  contactHasSocialProfiles,
  contactMatchesSearch
} from './contact'

export {
  contactEditionLinkSchema,
  editionRoleSchema,
  type ContactEditionLink,
  type EditionRole,
  type CreateContactEditionLink,
  linkHasRole,
  linkIsSpeaker,
  linkIsAttendee
} from './contact-edition-link'

export {
  consentSchema,
  consentTypeSchema,
  consentStatusSchema,
  consentSourceSchema,
  type Consent,
  type ConsentType,
  type ConsentStatus,
  type ConsentSource,
  type CreateConsent,
  isConsentActive,
  canSendMarketingEmail,
  canShareData,
  CONSENT_TYPE_LABELS
} from './consent'

export {
  segmentSchema,
  segmentRuleSchema,
  segmentCriteriaSchema,
  segmentRuleOperatorSchema,
  segmentRuleFieldSchema,
  type Segment,
  type SegmentRule,
  type SegmentCriteria,
  type SegmentRuleOperator,
  type SegmentRuleField,
  type CreateSegment,
  isSegmentDynamic,
  segmentHasRules,
  RULE_FIELD_LABELS,
  RULE_OPERATOR_LABELS
} from './segment'

export {
  emailTemplateSchema,
  type EmailTemplate,
  type CreateEmailTemplate,
  TEMPLATE_VARIABLES,
  interpolateTemplate,
  extractVariables
} from './email-template'

export {
  emailCampaignSchema,
  campaignStatusSchema,
  type EmailCampaign,
  type CampaignStatus,
  type CreateEmailCampaign,
  canEditCampaign,
  canSendCampaign,
  canScheduleCampaign,
  canCancelCampaign,
  isCampaignComplete,
  campaignSuccessRate
} from './email-campaign'

export {
  type EmailEvent,
  type EmailEventType,
  type BounceType,
  type CreateEmailEvent,
  type EmailEventStats,
  type LinkClickStats,
  generateTrackingId,
  parseTrackingId,
  calculateEventStats,
  calculateLinkStats,
  isHardBounce,
  shouldSuppressContact
} from './email-event'

export {
  segmentMembershipSchema,
  type SegmentMembership,
  type CreateSegmentMembership,
  type MembershipChange,
  type MembershipChangeType,
  type SegmentMembershipStats,
  calculateMembershipChanges,
  calculateMembershipStats
} from './segment-membership'

export {
  suppressionReasonSchema,
  suppressionEntrySchema,
  type SuppressionReason,
  type SuppressionEntry,
  type CreateSuppressionEntry,
  type BounceStats,
  type SuppressionCheckResult,
  type SuppressionImportResult,
  SUPPRESSION_CONFIG,
  SUPPRESSION_REASON_LABELS,
  shouldSuppress,
  isValidSuppressionEmail,
  normalizeEmail,
  parseSuppressionCsv,
  formatSuppressionCsv
} from './suppression-list'

export {
  activityTypeSchema,
  contactActivitySchema,
  type ActivityType,
  type ContactActivity,
  type CreateContactActivity,
  type ActivityFilterOptions,
  type EngagementScore,
  type ActivityCategory,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_ICONS,
  ACTIVITY_CATEGORIES,
  ACTIVITY_CATEGORY_LABELS,
  ENGAGEMENT_CONFIG,
  calculateEngagementScore,
  filterActivitiesByCategory,
  groupActivitiesByDate
} from './contact-activity'
