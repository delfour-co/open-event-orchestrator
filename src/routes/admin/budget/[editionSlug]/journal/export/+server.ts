import {
  buildAuditDescription,
  extractAmount,
  getActionLabel,
  getEntityTypeLabel
} from '$lib/features/budget/domain/audit-log'
import type {
  AuditAction,
  AuditLogFilters,
  FinancialAuditLog
} from '$lib/features/budget/domain/audit-log'
import { createAuditLogRepository } from '$lib/features/budget/infra/audit-log-repository'
import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

const escapeCsvField = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}

const formatAmount = (amount: number | null): string => {
  if (amount === null) return ''
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

export const GET: RequestHandler = async ({ params, locals, url }) => {
  const { editionSlug } = params
  const format = url.searchParams.get('format') || 'csv'

  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]
  const editionId = edition.id as string

  // Parse filters from URL
  const action = url.searchParams.get('action') || undefined
  const entityType = url.searchParams.get('entityType') || undefined
  const startDateStr = url.searchParams.get('startDate')
  const endDateStr = url.searchParams.get('endDate')
  const search = url.searchParams.get('search') || undefined

  const filters: AuditLogFilters = {}
  if (action) filters.action = action as AuditLogFilters['action']
  if (entityType) filters.entityType = entityType as AuditLogFilters['entityType']
  if (startDateStr) filters.startDate = new Date(startDateStr)
  if (endDateStr) filters.endDate = new Date(endDateStr)
  if (search) filters.search = search

  const auditRepo = createAuditLogRepository(locals.pb)
  const logs = await auditRepo.findAllByEdition(editionId, filters)

  // Fetch user emails
  const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))] as string[]
  const userEmails = new Map<string, string>()

  for (const userId of userIds) {
    try {
      const user = await locals.pb.collection('users').getOne(userId)
      userEmails.set(userId, (user.email as string) || 'Unknown')
    } catch {
      userEmails.set(userId, 'Unknown')
    }
  }

  if (format === 'pdf') {
    return generatePdfHtml(logs, userEmails, edition.name as string)
  }

  return generateCsv(logs, userEmails, editionSlug)
}

function generateCsv(
  logs: FinancialAuditLog[],
  userEmails: Map<string, string>,
  editionSlug: string
): Response {
  const headers = [
    'Date',
    'User Email',
    'Action',
    'Entity Type',
    'Reference',
    'Description',
    'Amount'
  ]
  const rows: string[] = [headers.join(',')]

  for (const log of logs) {
    const userEmail = log.userId ? userEmails.get(log.userId) || 'Unknown' : 'System'
    const amount = extractAmount(log.newValue) ?? extractAmount(log.oldValue)
    const description = buildAuditDescription(log)

    rows.push(
      [
        escapeCsvField(formatDate(log.created)),
        escapeCsvField(userEmail),
        escapeCsvField(getActionLabel(log.action)),
        escapeCsvField(getEntityTypeLabel(log.entityType)),
        escapeCsvField(log.entityReference || ''),
        escapeCsvField(description),
        escapeCsvField(amount !== null ? amount.toString() : '')
      ].join(',')
    )
  }

  const csv = rows.join('\n')
  const date = new Date().toISOString().split('T')[0]
  const filename = `audit-journal-${editionSlug}-${date}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}

function generatePdfHtml(
  logs: FinancialAuditLog[],
  userEmails: Map<string, string>,
  editionName: string
): Response {
  const date = new Date().toISOString().split('T')[0]

  const tableRows = logs
    .map((log) => {
      const userEmail = log.userId ? userEmails.get(log.userId) || 'Unknown' : 'System'
      const amount = extractAmount(log.newValue) ?? extractAmount(log.oldValue)
      const actionColor = getActionBadgeColor(log.action)

      return `
        <tr>
          <td>${formatDate(log.created)}</td>
          <td>${escapeHtml(userEmail)}</td>
          <td><span class="badge ${actionColor}">${getActionLabel(log.action)}</span></td>
          <td>${getEntityTypeLabel(log.entityType)}</td>
          <td class="mono">${escapeHtml(log.entityReference || '-')}</td>
          <td class="amount">${amount !== null ? formatAmount(amount) : '-'}</td>
        </tr>
      `
    })
    .join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Audit Journal - ${escapeHtml(editionName)}</title>
  <style>
    @page {
      size: landscape;
      margin: 1cm;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10px;
      line-height: 1.4;
      color: #1f2937;
      margin: 0;
      padding: 20px;
    }

    h1 {
      font-size: 18px;
      margin: 0 0 5px 0;
    }

    .subtitle {
      color: #6b7280;
      margin: 0 0 20px 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    th, td {
      padding: 6px 8px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    th {
      background-color: #f9fafb;
      font-weight: 600;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    tr:hover {
      background-color: #f9fafb;
    }

    .mono {
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 9px;
    }

    .amount {
      text-align: right;
      font-family: 'Monaco', 'Consolas', monospace;
    }

    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 9px;
      font-weight: 500;
    }

    .badge-green {
      background-color: #d1fae5;
      color: #065f46;
    }

    .badge-blue {
      background-color: #dbeafe;
      color: #1e40af;
    }

    .badge-red {
      background-color: #fee2e2;
      color: #991b1b;
    }

    .badge-purple {
      background-color: #ede9fe;
      color: #5b21b6;
    }

    .badge-cyan {
      background-color: #cffafe;
      color: #0e7490;
    }

    .badge-orange {
      background-color: #ffedd5;
      color: #9a3412;
    }

    .badge-gray {
      background-color: #f3f4f6;
      color: #374151;
    }

    .footer {
      color: #6b7280;
      font-size: 9px;
      text-align: center;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <h1>Financial Audit Journal</h1>
  <p class="subtitle">${escapeHtml(editionName)} - Generated on ${date}</p>

  <table>
    <thead>
      <tr>
        <th>Date/Time</th>
        <th>User</th>
        <th>Action</th>
        <th>Entity</th>
        <th>Reference</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">
    Total entries: ${logs.length} | Generated by Open Event Orchestrator on ${new Date().toLocaleString()}
  </div>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  })
}

function getActionBadgeColor(action: AuditAction): string {
  const colorMap: Record<string, string> = {
    create: 'badge-green',
    update: 'badge-blue',
    delete: 'badge-red',
    status_change: 'badge-purple',
    send: 'badge-cyan',
    accept: 'badge-green',
    reject: 'badge-red',
    convert: 'badge-orange',
    submit: 'badge-blue',
    approve: 'badge-green',
    mark_paid: 'badge-green'
  }
  return colorMap[action] || 'badge-gray'
}

function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char)
}
