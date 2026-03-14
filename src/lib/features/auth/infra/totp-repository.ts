import type PocketBase from 'pocketbase'

export interface TotpRepository {
  findByUserId(userId: string): Promise<{
    id: string
    secret: string
    enabled: boolean
    backupCodes: string[]
  } | null>
  create(data: {
    userId: string
    secret: string
    enabled: boolean
    backupCodes: string[]
    enabledAt?: string
  }): Promise<string>
  enable(id: string, backupCodes: string[]): Promise<void>
  disable(id: string): Promise<void>
  updateBackupCodes(id: string, codes: string[]): Promise<void>
  delete(id: string): Promise<void>
}

export function createTotpRepository(pb: PocketBase): TotpRepository {
  return {
    async findByUserId(userId) {
      try {
        const record = await pb
          .collection('user_totp_secrets')
          .getFirstListItem(`userId="${userId}"`)
        return {
          id: record.id,
          secret: record.secret as string,
          enabled: record.enabled as boolean,
          backupCodes: (record.backupCodes as string[]) || []
        }
      } catch {
        return null
      }
    },

    async create(data) {
      const record = await pb.collection('user_totp_secrets').create(data)
      return record.id
    },

    async enable(id, backupCodes) {
      await pb.collection('user_totp_secrets').update(id, {
        enabled: true,
        backupCodes,
        enabledAt: new Date().toISOString()
      })
    },

    async disable(id) {
      await pb.collection('user_totp_secrets').update(id, {
        enabled: false,
        backupCodes: []
      })
    },

    async updateBackupCodes(id, codes) {
      await pb.collection('user_totp_secrets').update(id, { backupCodes: codes })
    },

    async delete(id) {
      await pb.collection('user_totp_secrets').delete(id)
    }
  }
}

export interface TrustedDeviceRepository {
  isTrusted(userId: string, deviceHash: string): Promise<boolean>
  trust(userId: string, deviceHash: string, expiresAt: Date): Promise<void>
  removeExpired(): Promise<void>
}

export function createTrustedDeviceRepository(pb: PocketBase): TrustedDeviceRepository {
  return {
    async isTrusted(userId, deviceHash) {
      try {
        await pb
          .collection('trusted_devices')
          .getFirstListItem(
            `userId="${userId}" && deviceHash="${deviceHash}" && expiresAt > "${new Date().toISOString()}"`
          )
        return true
      } catch {
        return false
      }
    },

    async trust(userId, deviceHash, expiresAt) {
      // Remove existing trust for this device
      try {
        const existing = await pb
          .collection('trusted_devices')
          .getFirstListItem(`userId="${userId}" && deviceHash="${deviceHash}"`)
        await pb.collection('trusted_devices').delete(existing.id)
      } catch {
        /* No existing trust */
      }

      await pb.collection('trusted_devices').create({
        userId,
        deviceHash,
        expiresAt: expiresAt.toISOString()
      })
    },

    async removeExpired() {
      try {
        const expired = await pb.collection('trusted_devices').getFullList({
          filter: `expiresAt < "${new Date().toISOString()}"`
        })
        for (const record of expired) {
          await pb.collection('trusted_devices').delete(record.id)
        }
      } catch {
        /* Collection might not exist */
      }
    }
  }
}
