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
      s3Enabled: record?.s3Enabled === true,
      s3Bucket: (record?.s3Bucket as string) || '',
      s3Region: (record?.s3Region as string) || '',
      s3Endpoint: (record?.s3Endpoint as string) || '',
      s3AccessKey: (record?.s3AccessKey as string) || '',
      hasSecretKey: !!(record?.s3SecretKey as string),
      s3ForcePathStyle: record?.s3ForcePathStyle === true
    }
  } catch {
    return {
      s3Enabled: false,
      s3Bucket: '',
      s3Region: '',
      s3Endpoint: '',
      s3AccessKey: '',
      hasSecretKey: false,
      s3ForcePathStyle: false
    }
  }
}

export const actions: Actions = {
  save: async ({ request, locals }) => {
    if (!canAccessSettings(locals.user?.role)) {
      throw error(403, 'Access denied')
    }

    const formData = await request.formData()
    const s3Enabled = formData.get('s3Enabled') === 'true'
    const s3Bucket = (formData.get('s3Bucket') as string)?.trim() || ''
    const s3Region = (formData.get('s3Region') as string)?.trim() || ''
    const s3Endpoint = (formData.get('s3Endpoint') as string)?.trim() || ''
    const s3AccessKey = (formData.get('s3AccessKey') as string)?.trim() || ''
    const s3SecretKey = (formData.get('s3SecretKey') as string) || ''
    const s3ForcePathStyle = formData.get('s3ForcePathStyle') === 'true'
    const pbAdminEmail = (formData.get('pbAdminEmail') as string)?.trim() || ''
    const pbAdminPassword = (formData.get('pbAdminPassword') as string) || ''

    try {
      // Save to app_settings
      const records = await locals.pb.collection('app_settings').getList(1, 1)
      const data: Record<string, unknown> = {
        s3Enabled,
        s3Bucket,
        s3Region,
        s3Endpoint,
        s3AccessKey,
        s3ForcePathStyle
      }
      if (s3SecretKey) {
        data.s3SecretKey = s3SecretKey
      }

      if (records.items.length > 0) {
        await locals.pb.collection('app_settings').update(records.items[0].id, data)
      } else {
        if (!s3SecretKey) data.s3SecretKey = ''
        await locals.pb.collection('app_settings').create(data)
      }

      // Sync to PocketBase internal settings (requires PB superuser auth)
      if (pbAdminEmail && pbAdminPassword) {
        try {
          const adminPb = new PocketBaseClient(
            publicEnv.PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
          )

          await adminPb.collection('_superusers').authWithPassword(pbAdminEmail, pbAdminPassword)

          // Read back the record to get the stored secret key
          const updatedRecords = await locals.pb.collection('app_settings').getList(1, 1)
          const updatedRecord = updatedRecords.items[0]

          await adminPb.settings.update({
            s3: {
              enabled: s3Enabled,
              bucket: s3Bucket,
              region: s3Region,
              endpoint: s3Endpoint,
              accessKey: s3AccessKey,
              secret: s3SecretKey || (updatedRecord?.s3SecretKey as string) || '',
              forcePathStyle: s3ForcePathStyle
            }
          })
        } catch (err) {
          console.error('Failed to sync S3 settings to PocketBase:', err)
          return fail(400, {
            error:
              'Settings saved but PocketBase sync failed. Check your PB superuser credentials.',
            success: false
          })
        }
      }

      return { success: true }
    } catch (err) {
      console.error('Failed to save S3 settings:', err)
      return fail(500, { error: 'Failed to save S3 settings' })
    }
  }
}
