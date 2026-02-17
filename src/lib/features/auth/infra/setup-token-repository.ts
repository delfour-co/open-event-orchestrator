import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { SetupToken } from '../domain'

export type SetupTokenRepository = {
  create: (token: string, expiresAt: Date) => Promise<SetupToken>
  findByToken: (token: string) => Promise<SetupToken | null>
  markAsUsed: (id: string) => Promise<SetupToken>
  deleteExpired: () => Promise<number>
  hasValidToken: () => Promise<boolean>
  deleteAll: () => Promise<void>
}

type StoredToken = {
  id: string
  token: string
  expiresAt: string
  used: boolean
  usedAt?: string
  createdAt: string
  updatedAt: string
}

const SETUP_TOKEN_FILE = join(process.cwd(), '.setup-token.json')

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 17)
}

const readTokenFile = (): StoredToken | null => {
  try {
    if (!existsSync(SETUP_TOKEN_FILE)) {
      return null
    }
    const content = readFileSync(SETUP_TOKEN_FILE, 'utf-8')
    return JSON.parse(content) as StoredToken
  } catch {
    return null
  }
}

const writeTokenFile = (data: StoredToken): void => {
  writeFileSync(SETUP_TOKEN_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

const deleteTokenFile = (): void => {
  try {
    if (existsSync(SETUP_TOKEN_FILE)) {
      unlinkSync(SETUP_TOKEN_FILE)
    }
  } catch {
    // Ignore errors when deleting
  }
}

const mapToSetupToken = (stored: StoredToken): SetupToken => ({
  id: stored.id,
  token: stored.token,
  expiresAt: new Date(stored.expiresAt),
  used: stored.used,
  usedAt: stored.usedAt ? new Date(stored.usedAt) : undefined,
  createdAt: new Date(stored.createdAt),
  updatedAt: new Date(stored.updatedAt)
})

export const createSetupTokenRepository = (): SetupTokenRepository => ({
  async create(token, expiresAt) {
    const now = new Date().toISOString()
    const stored: StoredToken = {
      id: generateId(),
      token,
      expiresAt: expiresAt.toISOString(),
      used: false,
      createdAt: now,
      updatedAt: now
    }
    writeTokenFile(stored)
    return mapToSetupToken(stored)
  },

  async findByToken(token) {
    const stored = readTokenFile()
    if (!stored || stored.token !== token) {
      return null
    }
    return mapToSetupToken(stored)
  },

  async markAsUsed(id) {
    const stored = readTokenFile()
    if (!stored || stored.id !== id) {
      throw new Error('Token not found')
    }
    const now = new Date().toISOString()
    stored.used = true
    stored.usedAt = now
    stored.updatedAt = now
    writeTokenFile(stored)
    return mapToSetupToken(stored)
  },

  async deleteExpired() {
    const stored = readTokenFile()
    if (!stored) {
      return 0
    }
    const now = new Date()
    const expiresAt = new Date(stored.expiresAt)
    if (expiresAt < now || stored.used) {
      deleteTokenFile()
      return 1
    }
    return 0
  },

  async hasValidToken() {
    const stored = readTokenFile()
    if (!stored) {
      return false
    }
    const now = new Date()
    const expiresAt = new Date(stored.expiresAt)
    return expiresAt > now && !stored.used
  },

  async deleteAll() {
    deleteTokenFile()
  }
})
