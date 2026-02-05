import { createConsoleEmailService, createSmtpEmailService } from '$lib/features/cfp/services'
import type { EmailService } from '$lib/features/cfp/services'
import type PocketBase from 'pocketbase'

export interface SmtpSettings {
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPass: string
  smtpFrom: string
  smtpEnabled: boolean
}

const DEFAULT_SMTP: SmtpSettings = {
  smtpHost: 'localhost',
  smtpPort: 1025,
  smtpUser: '',
  smtpPass: '',
  smtpFrom: 'noreply@open-event-orchestrator.local',
  smtpEnabled: true
}

export async function getSmtpSettings(pb: PocketBase): Promise<SmtpSettings> {
  try {
    const records = await pb.collection('app_settings').getList(1, 1)
    if (records.items.length === 0) {
      return DEFAULT_SMTP
    }
    const record = records.items[0]
    return {
      smtpHost: (record.smtpHost as string) || DEFAULT_SMTP.smtpHost,
      smtpPort: (record.smtpPort as number) || DEFAULT_SMTP.smtpPort,
      smtpUser: (record.smtpUser as string) || '',
      smtpPass: (record.smtpPass as string) || '',
      smtpFrom: (record.smtpFrom as string) || DEFAULT_SMTP.smtpFrom,
      smtpEnabled: record.smtpEnabled !== false
    }
  } catch {
    return DEFAULT_SMTP
  }
}

export async function saveSmtpSettings(pb: PocketBase, settings: SmtpSettings): Promise<void> {
  const records = await pb.collection('app_settings').getList(1, 1)
  const data = {
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpUser: settings.smtpUser,
    smtpPass: settings.smtpPass,
    smtpFrom: settings.smtpFrom,
    smtpEnabled: settings.smtpEnabled
  }

  if (records.items.length > 0) {
    await pb.collection('app_settings').update(records.items[0].id, data)
  } else {
    await pb.collection('app_settings').create(data)
  }
}

export async function getEmailService(pb: PocketBase): Promise<EmailService> {
  const settings = await getSmtpSettings(pb)

  if (!settings.smtpEnabled || !settings.smtpHost) {
    return createConsoleEmailService()
  }

  return createSmtpEmailService({
    host: settings.smtpHost,
    port: settings.smtpPort,
    user: settings.smtpUser || undefined,
    pass: settings.smtpPass || undefined,
    from: settings.smtpFrom
  })
}
