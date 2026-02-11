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

export {
  emailStatusSchema,
  consentAuditActionSchema,
  communicationTypeSchema,
  communicationFrequencySchema,
  auditSourceSchema,
  consentAuditLogSchema,
  communicationPreferencesSchema,
  dataRetentionPolicySchema,
  type EmailStatus,
  type ConsentAuditAction,
  type CommunicationType,
  type CommunicationFrequency,
  type AuditSource,
  type ConsentAuditLog,
  type CreateConsentAuditLog,
  type CommunicationPreferences,
  type UpdateCommunicationPreferences,
  type DataRetentionPolicy,
  type CreateDataRetentionPolicy,
  type ConfirmationToken,
  type GdprDataExport,
  GDPR_CONFIG,
  COMMUNICATION_TYPE_LABELS,
  COMMUNICATION_TYPE_DESCRIPTIONS,
  FREQUENCY_LABELS,
  EMAIL_STATUS_LABELS,
  generateConfirmationToken,
  isTokenExpired,
  shouldSendReminder,
  calculateExpirationDate,
  isApproachingExpiration,
  isExpired,
  generatePreferenceToken,
  buildListUnsubscribeHeader,
  buildListUnsubscribePostHeader
} from './gdpr-compliance'

export {
  customFieldTypeSchema,
  customFieldOptionsSchema,
  customFieldSchema,
  contactCustomValueSchema,
  type CustomFieldType,
  type CustomFieldOptions,
  type CustomField,
  type CreateCustomField,
  type UpdateCustomField,
  type ContactCustomValue,
  FIELD_TYPE_LABELS,
  FIELD_TYPE_ICONS,
  generateFieldKey,
  validateFieldValue,
  formatFieldValue,
  parseFieldValue,
  buildTemplateVariable
} from './custom-field'

export {
  scoringActionSchema,
  leadScoreLevelSchema,
  leadScoringRuleSchema,
  leadScoreHistorySchema,
  type ScoringAction,
  type LeadScoreLevel,
  type LeadScoringRule,
  type CreateLeadScoringRule,
  type UpdateLeadScoringRule,
  type LeadScoreHistory,
  SCORING_ACTION_LABELS,
  LEAD_LEVEL_LABELS,
  LEAD_LEVEL_COLORS,
  DEFAULT_SCORE_THRESHOLDS,
  DEFAULT_SCORING_RULES,
  calculateLeadLevel,
  findApplicableRule,
  applyScoreChange,
  formatScoreChange,
  calculateInactivityDays,
  shouldApplyInactivityPenalty,
  buildScoreHistoryEntry
} from './lead-scoring'

export {
  duplicateMatchTypeSchema,
  duplicateStatusSchema,
  mergeFieldSourceSchema,
  duplicatePairSchema,
  type DuplicateMatchType,
  type DuplicateStatus,
  type MergeFieldSource,
  type DuplicatePair,
  type MergeDecision,
  type MergeResult,
  type ContactComparison,
  type ContactFieldComparison,
  MATCH_TYPE_LABELS,
  DUPLICATE_STATUS_LABELS,
  CONFIDENCE_THRESHOLDS,
  normalizeString,
  levenshteinDistance,
  calculateStringSimilarity,
  calculateNameSimilarity,
  calculateDuplicateConfidence,
  isPotentialDuplicate,
  getConfidenceLevel,
  suggestFieldSource,
  mergeArrays,
  buildContactComparison,
  CONTACT_COMPARE_FIELDS
} from './contact-deduplication'

export {
  eventParticipationTypeSchema,
  contactEventParticipationSchema,
  type EventParticipationType,
  type ContactEventParticipation,
  type ContactTimelineEntry,
  type ContactCrossEventSummary,
  PARTICIPATION_TYPE_LABELS,
  PARTICIPATION_TYPE_ICONS,
  PARTICIPATION_WEIGHTS,
  calculateLoyaltyScore,
  getParticipationTypes,
  buildParticipationDescription,
  groupParticipationsByEdition,
  sortParticipationsByDate,
  buildCrossEventSummary,
  getLoyaltyLevel,
  LOYALTY_LEVEL_LABELS,
  LOYALTY_LEVEL_COLORS
} from './contact-history'

export {
  templateCategorySchema,
  templateVariableSchema,
  libraryTemplateSchema,
  type TemplateCategory,
  type TemplateVariable,
  type LibraryTemplate,
  type CreateLibraryTemplate,
  type UpdateLibraryTemplate,
  type TemplateSearchOptions,
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_CATEGORY_ICONS,
  LIBRARY_TEMPLATE_VARIABLES,
  getVariablesByCategory,
  getVariableCategories,
  extractUsedVariables,
  validateTemplateVariables,
  interpolateWithExamples,
  buildVariableInsert,
  generateCloneName,
  matchesSearchCriteria,
  sortTemplates
} from './template-library'
