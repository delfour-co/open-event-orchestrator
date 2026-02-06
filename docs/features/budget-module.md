# Budget Module

The Budget module provides comprehensive financial management for events including budget tracking, quotes, invoices, and speaker reimbursements.

## Overview

The Budget module enables:

- **Organizers** to create and manage budgets per edition
- **Categories** to organize expenses by type (Venue, Catering, Speakers, etc.)
- **Transactions** to track individual expenses and income with status tracking
- **Quotes** to create and manage vendor quotes with line items
- **Invoices** to attach and track invoices linked to transactions
- **Speaker Reimbursements** to manage expense claims from speakers
- **Dashboard** to visualize budget usage, balance, and category breakdowns
- **Settings** to configure budget status (draft, approved, closed), currency, and notes

## Architecture

```
src/lib/features/budget/
├── domain/                        # Business entities and rules
│   ├── budget.ts                  # EditionBudget entity, status helpers
│   ├── category.ts                # BudgetCategory entity, DEFAULT_CATEGORIES
│   ├── transaction.ts             # BudgetTransaction entity, formatAmount
│   ├── quote.ts                   # BudgetQuote entity, line items, status workflow
│   ├── invoice.ts                 # BudgetInvoice entity, file attachment
│   ├── reimbursement.ts           # ReimbursementRequest/Item entities
│   ├── audit-log.ts               # FinancialAuditLog entity, action/entity helpers
│   └── index.ts                   # Barrel exports
├── infra/                         # PocketBase repositories
│   ├── budget-repository.ts       # CRUD for edition_budgets
│   ├── category-repository.ts     # CRUD for budget_categories
│   ├── transaction-repository.ts  # CRUD + aggregates for budget_transactions
│   ├── quote-repository.ts        # CRUD for budget_quotes
│   ├── invoice-repository.ts      # CRUD for budget_invoices
│   ├── reimbursement-repository.ts      # CRUD for reimbursement_requests
│   ├── reimbursement-item-repository.ts # CRUD for reimbursement_items
│   ├── audit-log-repository.ts    # CRUD for financial_audit_log
│   └── index.ts                   # Barrel exports
├── services/                      # External services
│   └── financial-audit-service.ts # Fire-and-forget audit logging
├── usecases/                      # Application logic
│   ├── convert-quote-to-transaction.ts  # Quote → Transaction conversion
│   ├── approve-reimbursement.ts         # Reimbursement approval workflow
│   ├── export-reimbursements.ts         # CSV export for accounting
│   └── index.ts                   # Barrel exports
└── index.ts                       # Feature barrel exports
```

## Routes Structure

### Admin Routes

| Route | Description |
|-------|-------------|
| `/admin/budget` | Edition selector — choose which edition's budget to manage |
| `/admin/budget/[editionSlug]` | Budget dashboard with categories table, transactions table, stats |
| `/admin/budget/[editionSlug]/settings` | Budget settings (status, currency, total budget, notes) |
| `/admin/budget/[editionSlug]/quotes` | Quotes management (create, edit, send, accept, convert to transaction) |
| `/admin/budget/[editionSlug]/invoices` | Invoices management (upload, link to transactions) |
| `/admin/budget/[editionSlug]/reimbursements` | Speaker reimbursement review (approve, reject, mark paid, CSV export) |
| `/admin/budget/[editionSlug]/journal` | Financial audit journal with filters, search, and export |
| `/admin/budget/[editionSlug]/journal/export` | Export journal as CSV or PDF |

### Speaker Routes

| Route | Description |
|-------|-------------|
| `/speaker/[editionSlug]/reimbursements` | Speaker portal for submitting expense reimbursements (token-based auth) |

### Dashboard Integration

The main admin dashboard (`/admin`) includes a Budget Stats section with 4 cards:
- **Total Budget** — planned amount with usage progress bar
- **Expenses** — total paid expenses
- **Income** — total paid income
- **Balance** — budget - expenses + income (color-coded)

## Data Model

### EditionBudget

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `editionId` | string | Relation to editions collection |
| `totalBudget` | number | Total planned budget amount |
| `currency` | enum | `EUR`, `USD`, `GBP` (default: EUR) |
| `status` | enum | `draft`, `approved`, `closed` |
| `notes` | string | Free-text notes (max 5000 chars) |
| `createdAt` | date | Creation timestamp |
| `updatedAt` | date | Last update timestamp |

### BudgetCategory

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `budgetId` | string | Relation to edition_budgets |
| `name` | string | Category name (1-200 chars) |
| `plannedAmount` | number | Planned amount for this category |
| `notes` | string | Free-text notes (max 2000 chars) |
| `createdAt` | date | Creation timestamp |
| `updatedAt` | date | Last update timestamp |

**Default Categories:** Venue, Catering, Speakers, Marketing, Equipment, Staff, Other

### BudgetTransaction

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `categoryId` | string | Relation to budget_categories |
| `type` | enum | `expense`, `income` |
| `amount` | number | Transaction amount (>= 0) |
| `description` | string | Description (1-500 chars) |
| `vendor` | string | Vendor name (max 200 chars, optional) |
| `invoiceNumber` | string | Invoice reference (max 100 chars, optional) |
| `date` | date | Transaction date |
| `status` | enum | `pending`, `paid`, `cancelled` |
| `createdAt` | date | Creation timestamp |
| `updatedAt` | date | Last update timestamp |

### BudgetQuote

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `editionId` | string | Relation to editions collection |
| `quoteNumber` | string | Auto-generated quote number (QT-EDITION-0001) |
| `vendor` | string | Vendor/supplier name |
| `vendorEmail` | string | Vendor email address |
| `vendorAddress` | string | Vendor postal address |
| `description` | string | Quote description |
| `items` | json | Array of line items `{description, quantity, unitPrice}` |
| `totalAmount` | number | Calculated total from line items |
| `currency` | enum | `EUR`, `USD`, `GBP` |
| `status` | enum | `draft`, `sent`, `accepted`, `rejected`, `expired` |
| `validUntil` | date | Quote expiration date |
| `notes` | string | Internal notes |
| `transactionId` | string | Linked transaction (after conversion) |
| `sentAt` | date | Date quote was sent to vendor |

### BudgetInvoice

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `transactionId` | string | Relation to budget_transactions |
| `invoiceNumber` | string | Invoice reference number |
| `file` | file | Invoice file (PDF, image) - max 10MB |
| `issueDate` | date | Invoice issue date |
| `dueDate` | date | Payment due date |
| `amount` | number | Invoice amount |
| `notes` | string | Notes about the invoice |

### ReimbursementRequest

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `editionId` | string | Relation to editions collection |
| `speakerId` | string | Relation to speakers collection |
| `requestNumber` | string | Auto-generated number (RB-EDITION-0001) |
| `status` | enum | `draft`, `submitted`, `under_review`, `approved`, `rejected`, `paid` |
| `totalAmount` | number | Sum of all item amounts |
| `currency` | enum | `EUR`, `USD`, `GBP` |
| `notes` | string | Speaker notes |
| `adminNotes` | string | Admin review notes (visible to speaker) |
| `reviewedBy` | string | Relation to users who reviewed |
| `reviewedAt` | date | Review timestamp |
| `transactionId` | string | Linked expense transaction (after approval) |
| `submittedAt` | date | Submission timestamp |

### ReimbursementItem

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `requestId` | string | Relation to reimbursement_requests (cascade delete) |
| `expenseType` | enum | `transport`, `accommodation`, `meals`, `other` |
| `description` | string | Expense description |
| `amount` | number | Expense amount |
| `date` | date | Expense date |
| `receipt` | file | Receipt file (image, PDF) - max 10MB |
| `notes` | string | Additional notes |

### FinancialAuditLog

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `editionId` | string | Relation to editions collection |
| `userId` | string | Relation to users (who performed the action) |
| `action` | enum | `create`, `update`, `delete`, `status_change`, `send`, `accept`, `reject`, `convert`, `submit`, `approve`, `mark_paid` |
| `entityType` | enum | `transaction`, `quote`, `invoice`, `reimbursement`, `category`, `budget` |
| `entityId` | string | ID of the affected entity |
| `entityReference` | string | Human-readable reference (QT-2025-001, RB-2025-001, etc.) |
| `oldValue` | json | Previous state (for updates/changes) |
| `newValue` | json | New state (for creates/updates) |
| `metadata` | json | Additional context (source, notes, etc.) |
| `created` | date | Timestamp (auto-set, immutable) |

**Note:** Audit log records are immutable (no update/delete allowed).

## Budget Status Flow

```
draft → approved → closed
```

| Status | Description | Can Edit |
|--------|-------------|----------|
| `draft` | New budget being prepared | Yes |
| `approved` | Budget validated and active | Yes |
| `closed` | Budget finalized, no changes | No |

## Features

### 1. Budget Initialization

When an organizer visits an edition's budget page for the first time, they can initialize the budget with:
- A total budget amount and currency
- 7 default categories automatically created (Venue, Catering, Speakers, Marketing, Equipment, Staff, Other)

### 2. Category Management

Categories organize budget lines. Each category tracks:
- **Planned amount** — how much was budgeted
- **Spent** — sum of paid expense transactions
- **Remaining** — planned minus spent (color-coded green/red)
- **Progress bar** — visual indicator of spending vs plan
- **Transaction count** — number of linked transactions

Categories can be created, edited, and deleted (only if no transactions are linked).

### 3. Transaction Tracking

Transactions record individual financial events:
- **Expense** transactions reduce the budget
- **Income** transactions add to the budget
- Statuses: `pending` (not yet confirmed), `paid` (confirmed), `cancelled`
- Only `paid` transactions count toward budget calculations

### 4. Budget Dashboard

The dashboard provides a complete financial overview:

**Stats Cards (4):**
- Total Budget with usage progress bar
- Expenses (sum of paid expenses)
- Income (sum of paid income)
- Balance (budget - expenses + income)

**Categories Table:**
Columns: Category, Planned, Spent, Remaining, Progress, Transactions, Actions

**Transactions Table:**
Columns: Date, Description, Category, Vendor, Amount, Type (badge), Status (badge), Actions

### 5. Budget Settings

Dedicated settings page (following the same pattern as CFP and Billing settings):
- **Status buttons** — switch between draft, approved, closed
- **Budget details form** — total budget, currency, notes
- **Overview section** — read-only stats (categories count, transactions count, expenses, income)
- **Quick links** — navigate to budget dashboard

### 6. Quotes Management

Manage vendor quotes with line items:
- **Create quotes** with dynamic line items (description, quantity, unit price)
- **Auto-calculate totals** from line items
- **Status workflow**: draft → sent → accepted/rejected/expired
- **Send to vendor** (updates status and records sent date)
- **Convert to transaction** when accepted (creates expense transaction in selected category)
- **Print view** for PDF generation via browser print dialog

### 7. Invoices Management

Attach and track invoices:
- **Upload invoice files** (PDF, images up to 10MB)
- **Link to transactions** for audit trail
- **Track due dates** with overdue highlighting
- **View/download** attached files directly

### 8. Speaker Reimbursements

Complete reimbursement workflow for speakers:

**Speaker Portal (`/speaker/[editionSlug]/reimbursements`):**
- Token-based authentication (link sent via email)
- Create reimbursement requests with notes
- Add expense items with receipt uploads (transport, accommodation, meals, other)
- Submit request for review
- Track request status

**Admin Review (`/admin/budget/[editionSlug]/reimbursements`):**
- View all reimbursement requests with speaker details
- Expandable rows showing expense items with receipt previews
- Review workflow: submitted → under_review → approved/rejected → paid
- Approval creates expense transaction in selected budget category
- CSV export for accounting integration
- Public URL display with copy button for sharing

### 9. Financial Audit Journal

Complete audit trail for all financial operations:

**Automatic Logging:**
- All budget actions (create, update, delete) are automatically logged
- Transaction changes including status transitions
- Quote lifecycle (create, send, accept, reject, convert to transaction)
- Invoice uploads and deletions
- Reimbursement workflow (submit, approve, reject, mark paid)
- Category changes

**Journal Viewer (`/admin/budget/[editionSlug]/journal`):**
- Paginated table with all audit entries
- Filter by action type (create, update, delete, status_change, etc.)
- Filter by entity type (transaction, quote, invoice, reimbursement, etc.)
- Filter by date range
- Search by reference (QT-2025-001, RB-2025-001, etc.)
- Detail dialog showing old/new values for changes
- Color-coded action badges

**Export:**
- CSV export with all filters applied
- PDF export (HTML for browser print)
- Includes: Date, User, Action, Entity Type, Reference, Description, Amount

**Fire-and-Forget Pattern:**
Audit logging is implemented as fire-and-forget to not block main operations. Logs are created asynchronously after the main action completes.

## Database Collections

| Collection | Description |
|------------|-------------|
| `edition_budgets` | Budget configuration per edition |
| `budget_categories` | Budget categories with planned amounts |
| `budget_transactions` | Individual expense/income transactions |
| `budget_quotes` | Vendor quotes with line items |
| `budget_invoices` | Invoice files linked to transactions |
| `reimbursement_requests` | Speaker reimbursement requests |
| `reimbursement_items` | Individual expense items with receipts |
| `financial_audit_log` | Immutable audit trail for all financial operations |

## PocketBase Migrations

6 migration files handle collection creation and relations:

| Migration | Description |
|-----------|-------------|
| `1770318999_created_edition_budgets.js` | Create edition_budgets collection |
| `1770318999_created_budget_categories.js` | Create budget_categories collection |
| `1770318999_created_budget_transactions.js` | Create budget_transactions collection |
| `1770318999_updated_edition_budgets.js` | Add relation to editions |
| `1770318999_updated_budget_categories.js` | Add relation to edition_budgets |
| `1770318999_updated_budget_transactions.js` | Add relation to budget_categories |

## Testing

### Unit Tests (234 tests)

Tests located in `src/lib/features/budget/domain/*.test.ts` and `src/lib/features/budget/usecases/*.test.ts`:

- **budget.test.ts** (29 tests) — EditionBudget schema validation, create/update schemas, currency validation, status helpers
- **category.test.ts** (14 tests) — BudgetCategory schema validation, create/update schemas, DEFAULT_CATEGORIES
- **transaction.test.ts** (28 tests) — BudgetTransaction schema validation, type/status enums, formatAmount
- **quote.test.ts** (54 tests) — BudgetQuote schema, line items, status workflow, number generation, total calculation
- **invoice.test.ts** (11 tests) — BudgetInvoice schema, file validation, due date helpers
- **reimbursement.test.ts** (59 tests) — Request/Item schemas, expense types, status workflow, permission helpers
- **audit-log.test.ts** (25 tests) — FinancialAuditLog schema, action/entity enums, helper functions
- **convert-quote-to-transaction.test.ts** (4 tests) — Quote to transaction conversion usecase
- **approve-reimbursement.test.ts** (5 tests) — Reimbursement approval workflow
- **export-reimbursements.test.ts** (5 tests) — CSV export functionality

### E2E Tests (23 + 60 + 23 tests)

Tests located in `tests/e2e/budget*.spec.ts` and `tests/e2e/speaker-reimbursements.spec.ts`:

**budget.spec.ts (23 tests):**
- Budget Edition Selector, Dashboard, Settings
- Category CRUD, Transaction CRUD
- Access Control

**budget-quotes.spec.ts:**
- Quote CRUD, status workflow
- Line items management
- Convert to transaction

**budget-invoices.spec.ts:**
- Invoice upload and listing
- File preview and download
- Transaction linking

**budget-reimbursements.spec.ts:**
- Admin review workflow
- Approve/reject actions
- CSV export

**budget-journal.spec.ts (23 tests):**
- Journal page display with filters
- Filtering by action, entity type, date range, search
- Detail dialog with old/new values
- Export links (CSV/PDF)
- Table display and navigation
- Access control and empty state

**speaker-reimbursements.spec.ts:**
- Token-based authentication
- Request creation and submission
- Item management with file uploads

## Related Documentation

- [Database Seeding](../development/database-seeding.md) — Test data setup including budget seed data
- [CRM Module](crm-module.md) — Contact management
- [CFP Module](cfp-module.md) — Speaker management
