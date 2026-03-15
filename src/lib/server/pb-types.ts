/**
 * Typed interfaces for PocketBase collection records.
 * These mirror the PocketBase schema and eliminate `as string` casts
 * when used as generic parameters on PB CRUD methods.
 *
 * Usage:
 *   const org = await pb.collection('organizations').getOne<PBOrganizationRecord>(id)
 *   org.name // string, no cast needed
 */
import type { RecordModel } from 'pocketbase'

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface PBUserRecord extends RecordModel {
  email: string
  name: string
  avatar: string
  role: string
  verified: boolean
  notificationPreferences: Record<string, boolean> | null
  created: string
  updated: string
}

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------

export interface PBOrganizationRecord extends RecordModel {
  name: string
  slug: string
  description: string
  logo: string
  website: string
  contactEmail: string
  vatRate: number
  legalName: string
  legalForm: string
  rcsNumber: string
  shareCapital: string
  siret: string
  vatNumber: string
  address: string
  city: string
  postalCode: string
  country: string
  primaryColor: string
  secondaryColor: string
  twitter: string
  linkedin: string
  github: string
  youtube: string
  timezone: string
  defaultLocale: string
  ownerId: string
  created: string
  updated: string
  expand?: {
    ownerId?: PBUserRecord
  }
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export interface PBEventRecord extends RecordModel {
  organizationId: string
  name: string
  slug: string
  description: string
  logo: string
  website: string
  currency: string
  banner: string
  primaryColor: string
  secondaryColor: string
  twitter: string
  linkedin: string
  hashtag: string
  contactEmail: string
  codeOfConductUrl: string
  privacyPolicyUrl: string
  timezone: string
  defaultVenue: string
  defaultCity: string
  defaultCountry: string
  created: string
  updated: string
  expand?: {
    organizationId?: PBOrganizationRecord
  }
}

// ---------------------------------------------------------------------------
// Editions
// ---------------------------------------------------------------------------

export interface PBEditionRecord extends RecordModel {
  eventId: string
  name: string
  slug: string
  year: number
  status: string
  startDate: string
  endDate: string
  venue: string
  city: string
  country: string
  termsOfSale: string
  codeOfConduct: string
  privacyPolicy: string
  created: string
  updated: string
  expand?: {
    eventId?: PBEventRecord
  }
}

// ---------------------------------------------------------------------------
// Organization Members
// ---------------------------------------------------------------------------

export interface PBOrganizationMemberRecord extends RecordModel {
  organizationId: string
  userId: string
  role: string
  created: string
  updated: string
  expand?: {
    userId?: PBUserRecord
  }
}

// ---------------------------------------------------------------------------
// Organization Invitations
// ---------------------------------------------------------------------------

export interface PBOrganizationInvitationRecord extends RecordModel {
  organizationId: string
  email: string
  role: string
  status: string
  token: string
  invitedBy: string
  expiresAt: string
  lastSentAt: string
  created: string
  updated: string
  expand?: {
    organizationId?: PBOrganizationRecord
  }
}

// ---------------------------------------------------------------------------
// App Settings
// ---------------------------------------------------------------------------

export interface PBAppSettingsRecord extends RecordModel {
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPass: string
  smtpFrom: string
  smtpEnabled: boolean
  oauth2Enabled: boolean
  googleOAuthClientId: string
  googleOAuthClientSecret: string
  githubOAuthClientId: string
  githubOAuthClientSecret: string
  stripeSecretKey: string
  stripePublishableKey: string
  stripeWebhookSecret: string
  stripeEnabled: boolean
  stripeApiBase: string
  slackWebhookUrl: string
  slackEnabled: boolean
  slackDefaultChannel: string
  discordWebhookUrl: string
  discordEnabled: boolean
  discordUsername: string
  helloassoClientId: string
  helloassoClientSecret: string
  helloassoOrgSlug: string
  helloassoEnabled: boolean
  helloassoSandbox: boolean
  appName: string
  appUrl: string
  s3Enabled: boolean
  s3Bucket: string
  s3Region: string
  s3Endpoint: string
  s3AccessKey: string
  s3SecretKey: string
  s3ForcePathStyle: boolean
  backupsEnabled: boolean
  backupsCron: string
  backupsMaxKeep: number
  backupsUseS3: boolean
  auditLogRetentionDays: number
  apiLogRetentionDays: number
  created: string
  updated: string
}

// ---------------------------------------------------------------------------
// Audit Logs
// ---------------------------------------------------------------------------

export interface PBAuditLogRecord extends RecordModel {
  organizationId: string
  userId: string
  userName: string
  action: string
  entityType: string
  entityId: string
  entityName: string
  details: Record<string, unknown>
  ipAddress: string
  userAgent: string
  created: string
  updated: string
}
