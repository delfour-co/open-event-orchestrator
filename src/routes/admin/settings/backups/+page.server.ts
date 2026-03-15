import { env as publicEnv } from '$env/dynamic/public'
import { canAccessSettings } from '$lib/server/permissions'
import { error, fail } from '@sveltejs/kit'
import PocketBaseClient from 'pocketbase'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  if (!canAccessSettings(locals.user?.role)) {
    throw error(403, 'Access denied')
  }

  try {
    const records = await locals.pb.collection('app_settings').getList(1, 1)
    const record = records.items[0]

    return {
      backupsEnabled: record?.backupsEnabled === true,
      backupsCron: (record?.backupsCron as string) || '0 0 * * *',
      backupsMaxKeep: (record?.backupsMaxKeep as number) || 7,
      backupsUseS3: record?.backupsUseS3 === true
    }
  } catch {
    return {
      backupsEnabled: false,
      backupsCron: '0 0 * * *',
      backupsMaxKeep: 7,
      backupsUseS3: false
    }
  }
}

export const actions: Actions = {
  save: async ({ request, locals }) => {
    if (!canAccessSettings(locals.user?.role)) {
      throw error(403, 'Access denied')
    }

    const formData = await request.formData()
    const backupsEnabled = formData.get('backupsEnabled') === 'true'
    const backupsCron = (formData.get('backupsCron') as string)?.trim() || '0 0 * * *'
    const backupsMaxKeep = Number.parseInt((formData.get('backupsMaxKeep') as string) || '7', 10)
    const backupsUseS3 = formData.get('backupsUseS3') === 'true'
    const pbAdminEmail = (formData.get('pbAdminEmail') as string)?.trim() || ''
    const pbAdminPassword = (formData.get('pbAdminPassword') as string) || ''

    if (backupsMaxKeep < 1) {
      return fail(400, { error: 'Max backups must be at least 1' })
    }

    try {
      // Save to app_settings
      const records = await locals.pb.collection('app_settings').getList(1, 1)
      const data: Record<string, unknown> = {
        backupsEnabled,
        backupsCron,
        backupsMaxKeep,
        backupsUseS3
      }

      if (records.items.length > 0) {
        await locals.pb.collection('app_settings').update(records.items[0].id, data)
      } else {
        await locals.pb.collection('app_settings').create(data)
      }

      // Sync to PocketBase internal settings (requires PB superuser auth)
      if (pbAdminEmail && pbAdminPassword) {
        try {
          const adminPb = new PocketBaseClient(
            publicEnv.PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
          )

          await adminPb.collection('_superusers').authWithPassword(pbAdminEmail, pbAdminPassword)

          await adminPb.settings.update({
            backups: {
              cron: backupsEnabled ? backupsCron : '',
              cronMaxKeep: backupsMaxKeep,
              s3: { enabled: backupsUseS3 }
            }
          })
        } catch (err) {
          console.error('Failed to sync backup settings to PocketBase:', err)
          return fail(400, {
            error:
              'Settings saved but PocketBase sync failed. Check your PB superuser credentials.',
            success: false
          })
        }
      }

      return { success: true }
    } catch (err) {
      console.error('Failed to save backup settings:', err)
      return fail(500, { error: 'Failed to save backup settings' })
    }
  }
}
