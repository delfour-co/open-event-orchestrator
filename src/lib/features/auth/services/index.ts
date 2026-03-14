export {
  createInitialSetupService,
  checkIsFirstRun,
  displaySetupLink
} from './initial-setup-service'
export type { InitialSetupService } from './initial-setup-service'

export {
  sendVerificationEmail,
  requestEmailVerification,
  confirmEmailVerification,
  generateVerificationEmailHtml,
  generateVerificationEmailText
} from './email-verification-service'
export type { SendVerificationEmailParams } from './email-verification-service'

export {
  sendPasswordResetEmail,
  requestPasswordReset,
  confirmPasswordReset,
  generatePasswordResetEmailHtml,
  generatePasswordResetEmailText
} from './password-reset-service'
export type { SendPasswordResetEmailParams } from './password-reset-service'

export {
  generateTotpSecret,
  verifyTotpCode,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  generateDeviceHash
} from './totp-service'

export {
  getAvailableProviders,
  getLinkedAccounts,
  unlinkAccount,
  getProviderLabel
} from './social-auth-service'
export type { SocialProvider, SocialAuthResult, LinkedAccount } from './social-auth-service'
