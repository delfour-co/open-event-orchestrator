export {
  createConsoleEmailService,
  createSmtpEmailService,
  generateEmailHtml,
  generateEmailText,
  type EmailService,
  type EmailOptions,
  type EmailTemplateData,
  type SmtpConfig
} from './email-service'

export {
  createSpeakerFeedbackService,
  type SpeakerFeedbackService,
  type FeedbackTemplate,
  type SpeakerFeedback,
  type FeedbackTemplateType
} from './speaker-feedback-service'

export {
  createCfpStatsService,
  type CfpStatsService,
  type SubmissionStats,
  type ReviewStats,
  type AcceptanceRateStats,
  type CategoryAcceptanceRate
} from './cfp-stats-service'
