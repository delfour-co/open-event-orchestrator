import { z } from 'zod'

export const invitationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'organizer', 'reviewer']),
  status: z.enum(['pending', 'accepted', 'cancelled', 'expired']),
  token: z.string().optional(),
  invitedBy: z.string().optional(),
  lastSentAt: z.date().optional(),
  expiresAt: z.date(),
  createdAt: z.date()
})

export type Invitation = z.infer<typeof invitationSchema>

export const csvInvitationRowSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'organizer', 'reviewer'], {
    errorMap: () => ({ message: 'Role must be admin, organizer, or reviewer' })
  })
})

export type CsvInvitationRow = z.infer<typeof csvInvitationRowSchema>

export function parseInvitationCsv(content: string): {
  rows: CsvInvitationRow[]
  errors: Array<{ line: number; message: string }>
} {
  const lines = content
    .trim()
    .split('\n')
    .filter((line) => line.trim())
  const rows: CsvInvitationRow[] = []
  const errors: Array<{ line: number; message: string }> = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip header line if present
    if (
      i === 0 &&
      (line.toLowerCase().startsWith('email') || line.toLowerCase().startsWith('"email'))
    ) {
      continue
    }

    const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''))

    if (parts.length < 2) {
      errors.push({ line: i + 1, message: 'Each line must have email,role' })
      continue
    }

    const result = csvInvitationRowSchema.safeParse({
      email: parts[0],
      role: parts[1]
    })

    if (result.success) {
      rows.push(result.data)
    } else {
      errors.push({ line: i + 1, message: result.error.issues.map((e) => e.message).join(', ') })
    }
  }

  return { rows, errors }
}

export function generateInvitationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 48; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
