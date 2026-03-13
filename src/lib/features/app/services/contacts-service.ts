/**
 * IndexedDB-based contact storage for badge scanning / networking feature.
 * Reuses the same `oeo-attendee` database as the schedule-cache-service.
 */

const DB_NAME = 'oeo-attendee'
const DB_VERSION = 2
const CONTACTS_STORE = 'contacts'

export interface ScannedContact {
  id: string
  firstName: string
  lastName: string
  email: string
  company?: string
  title?: string
  phone?: string
  scannedAt: number
  editionSlug: string
}

type NewContact = Omit<ScannedContact, 'id' | 'scannedAt'>

let dbPromise: Promise<IDBDatabase> | null = null

const openDb = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      dbPromise = null
      reject(request.error)
    }
    request.onsuccess = () => resolve(request.result)

    request.onblocked = () => {
      // Another connection is open with an older version — close it
      dbPromise = null
      reject(new Error('IndexedDB upgrade blocked by another connection'))
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Preserve existing stores from version 1
      if (!db.objectStoreNames.contains('schedule')) {
        db.createObjectStore('schedule', { keyPath: 'editionSlug' })
      }
      if (!db.objectStoreNames.contains('favorites')) {
        const favoritesStore = db.createObjectStore('favorites', { keyPath: 'sessionId' })
        favoritesStore.createIndex('editionSlug', 'editionSlug', { unique: false })
      }

      // New store for contacts (version 2)
      if (!db.objectStoreNames.contains(CONTACTS_STORE)) {
        const contactsStore = db.createObjectStore(CONTACTS_STORE, { keyPath: 'id' })
        contactsStore.createIndex('editionSlug', 'editionSlug', { unique: false })
        contactsStore.createIndex('email', 'email', { unique: false })
      }
    }
  })

  return dbPromise
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function escapeVCardValue(value: string): string {
  return value.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
}

function formatSingleVCard(contact: ScannedContact): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCardValue(contact.lastName)};${escapeVCardValue(contact.firstName)};;;`,
    `FN:${escapeVCardValue(contact.firstName)} ${escapeVCardValue(contact.lastName)}`,
    `EMAIL:${contact.email}`
  ]

  if (contact.company) {
    lines.push(`ORG:${escapeVCardValue(contact.company)}`)
  }
  if (contact.title) {
    lines.push(`TITLE:${escapeVCardValue(contact.title)}`)
  }
  if (contact.phone) {
    lines.push(`TEL:${contact.phone}`)
  }

  lines.push('END:VCARD')
  return lines.join('\r\n')
}

/**
 * Parse a vCard string into contact fields.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: vCard parsing requires handling many field variants
function parseVCard(vcardStr: string): NewContact | null {
  const lines = vcardStr.split(/\r?\n/)
  let firstName = ''
  let lastName = ''
  let email = ''
  let company: string | undefined
  let title: string | undefined
  let phone: string | undefined

  for (const line of lines) {
    if (line.startsWith('N:')) {
      const parts = line.slice(2).split(';')
      lastName = parts[0]?.replace(/\\\\/g, '\\').replace(/\\;/g, ';').replace(/\\,/g, ',') || ''
      firstName = parts[1]?.replace(/\\\\/g, '\\').replace(/\\;/g, ';').replace(/\\,/g, ',') || ''
    } else if (line.startsWith('FN:') && !firstName && !lastName) {
      const fn = line.slice(3)
      const parts = fn.split(' ')
      firstName = parts[0] || ''
      lastName = parts.slice(1).join(' ') || ''
    } else if (line.startsWith('EMAIL')) {
      // Handle EMAIL;TYPE=...:value or EMAIL:value
      const colonIdx = line.indexOf(':')
      if (colonIdx >= 0) {
        email = line.slice(colonIdx + 1).trim()
      }
    } else if (line.startsWith('ORG:')) {
      company = line.slice(4).replace(/\\\\/g, '\\').replace(/\\;/g, ';').replace(/\\,/g, ',')
    } else if (line.startsWith('TITLE:')) {
      title = line.slice(6).replace(/\\\\/g, '\\').replace(/\\;/g, ';').replace(/\\,/g, ',')
    } else if (line.startsWith('TEL')) {
      const colonIdx = line.indexOf(':')
      if (colonIdx >= 0) {
        phone = line.slice(colonIdx + 1).trim()
      }
    }
  }

  if (!firstName && !lastName && !email) return null

  return { firstName, lastName, email, company, title, phone, editionSlug: '' }
}

export interface QrParseResult {
  type: 'contact'
  contact: NewContact
}

export interface QrTicketResult {
  type: 'ticket'
  ticketNumber: string
}

export type QrResult = QrParseResult | QrTicketResult | null

/**
 * Parse QR code data which can be JSON contact, vCard, or a ticket QR code.
 */
export function parseQrCodeData(raw: string, editionSlug: string): QrResult {
  // Try JSON first
  try {
    const data = JSON.parse(raw) as Record<string, unknown>

    // Check if it's a ticket QR code
    if (data.ticketNumber || data.ticketId) {
      return {
        type: 'ticket',
        ticketNumber: String(data.ticketNumber || data.ticketId)
      }
    }

    // Check if it's a contact JSON
    if (data.firstName || data.lastName || data.email) {
      return {
        type: 'contact',
        contact: {
          firstName: String(data.firstName || ''),
          lastName: String(data.lastName || ''),
          email: String(data.email || ''),
          company: data.company ? String(data.company) : undefined,
          title: data.title ? String(data.title) : undefined,
          phone: data.phone ? String(data.phone) : undefined,
          editionSlug
        }
      }
    }
  } catch {
    // Not JSON, try vCard
  }

  // Try vCard
  if (raw.includes('BEGIN:VCARD')) {
    const contact = parseVCard(raw)
    if (contact) {
      return { type: 'contact', contact: { ...contact, editionSlug } }
    }
  }

  return null
}

export const contactsService = {
  async addContact(contact: NewContact): Promise<ScannedContact> {
    const db = await openDb()
    const tx = db.transaction(CONTACTS_STORE, 'readwrite')
    const store = tx.objectStore(CONTACTS_STORE)

    const fullContact: ScannedContact = {
      ...contact,
      id: generateId(),
      scannedAt: Date.now()
    }

    return new Promise((resolve, reject) => {
      const request = store.put(fullContact)
      request.onerror = () => reject(request.error)
      tx.oncomplete = () => resolve(fullContact)
      tx.onerror = () => reject(tx.error)
    })
  },

  async getContacts(editionSlug: string): Promise<ScannedContact[]> {
    const db = await openDb()
    const tx = db.transaction(CONTACTS_STORE, 'readonly')
    const store = tx.objectStore(CONTACTS_STORE)
    const index = store.index('editionSlug')

    return new Promise((resolve, reject) => {
      const request = index.getAll(editionSlug)
      request.onsuccess = () => {
        const contacts = (request.result || []) as ScannedContact[]
        // Sort by most recent first
        contacts.sort((a, b) => b.scannedAt - a.scannedAt)
        resolve(contacts)
      }
      request.onerror = () => reject(request.error)
    })
  },

  async deleteContact(id: string): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(CONTACTS_STORE, 'readwrite')
    const store = tx.objectStore(CONTACTS_STORE)

    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onerror = () => reject(request.error)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },

  async clearContacts(editionSlug: string): Promise<void> {
    const contacts = await this.getContacts(editionSlug)
    const db = await openDb()
    const tx = db.transaction(CONTACTS_STORE, 'readwrite')
    const store = tx.objectStore(CONTACTS_STORE)

    return new Promise((resolve, reject) => {
      for (const contact of contacts) {
        const request = store.delete(contact.id)
        request.onerror = () => reject(request.error)
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },

  exportToVCard(contacts: ScannedContact[]): string {
    return contacts.map(formatSingleVCard).join('\r\n')
  },

  exportToVCardFile(contacts: ScannedContact[]): void {
    const vcardContent = contactsService.exportToVCard(contacts)
    const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'contacts.vcf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
