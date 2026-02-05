import type PocketBase from 'pocketbase'

export interface ImportContactRow {
  email: string
  firstName: string
  lastName: string
  company?: string
  jobTitle?: string
  phone?: string
  city?: string
  country?: string
  tags?: string
}

export interface ImportContactsResult {
  total: number
  created: number
  updated: number
  skipped: number
  errors: Array<{ row: number; email: string; error: string }>
}

export type DuplicateStrategy = 'skip' | 'merge' | 'overwrite'

export const createImportContactsUseCase = (pb: PocketBase) => {
  return async (
    organizationId: string,
    rows: ImportContactRow[],
    strategy: DuplicateStrategy = 'merge'
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: import logic with merge/overwrite strategies
  ): Promise<ImportContactsResult> => {
    const result: ImportContactsResult = {
      total: rows.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row.email || !row.firstName || !row.lastName) {
        result.errors.push({
          row: i + 1,
          email: row.email || '',
          error: 'Missing required fields (email, firstName, lastName)'
        })
        continue
      }

      try {
        const existing = await pb.collection('contacts').getList(1, 1, {
          filter: `organizationId = "${organizationId}" && email = "${row.email}"`
        })

        if (existing.items.length > 0) {
          if (strategy === 'skip') {
            result.skipped++
            continue
          }

          const contact = existing.items[0]
          const updates: Record<string, unknown> = {}

          if (strategy === 'overwrite') {
            updates.firstName = row.firstName
            updates.lastName = row.lastName
            if (row.company !== undefined) updates.company = row.company
            if (row.jobTitle !== undefined) updates.jobTitle = row.jobTitle
            if (row.phone !== undefined) updates.phone = row.phone
            if (row.city !== undefined) updates.city = row.city
            if (row.country !== undefined) updates.country = row.country
          } else {
            // merge: only fill empty fields
            if (!contact.firstName) updates.firstName = row.firstName
            if (!contact.lastName) updates.lastName = row.lastName
            if (!contact.company && row.company) updates.company = row.company
            if (!contact.jobTitle && row.jobTitle) updates.jobTitle = row.jobTitle
            if (!contact.phone && row.phone) updates.phone = row.phone
            if (!contact.city && row.city) updates.city = row.city
            if (!contact.country && row.country) updates.country = row.country
          }

          // Merge tags
          if (row.tags) {
            const newTags = row.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
            const existingTags = (contact.tags as string[]) || []
            const merged = [...new Set([...existingTags, ...newTags])]
            updates.tags = JSON.stringify(merged)
          }

          if (Object.keys(updates).length > 0) {
            await pb.collection('contacts').update(contact.id, updates)
            result.updated++
          } else {
            result.skipped++
          }
        } else {
          const tags = row.tags
            ? row.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : []

          await pb.collection('contacts').create({
            organizationId,
            email: row.email,
            firstName: row.firstName,
            lastName: row.lastName,
            company: row.company || '',
            jobTitle: row.jobTitle || '',
            phone: row.phone || '',
            city: row.city || '',
            country: row.country || '',
            source: 'import',
            tags: JSON.stringify(tags),
            notes: ''
          })
          result.created++
        }
      } catch (err) {
        result.errors.push({
          row: i + 1,
          email: row.email,
          error: String(err)
        })
      }
    }

    return result
  }
}

export const parseCsvToRows = (csv: string): ImportContactRow[] => {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const rows: ImportContactRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const row: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j]?.trim() || ''
    }

    rows.push({
      email: row.email || '',
      firstName: row.firstname || row.first_name || row.prenom || '',
      lastName: row.lastname || row.last_name || row.nom || '',
      company: row.company || row.entreprise || '',
      jobTitle: row.jobtitle || row.job_title || row.poste || '',
      phone: row.phone || row.telephone || '',
      city: row.city || row.ville || '',
      country: row.country || row.pays || '',
      tags: row.tags || ''
    })
  }

  return rows
}

const parseCsvLine = (line: string): string[] => {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}
