# Budget Module

The Budget module provides edition-level budget tracking with categories, transactions, and financial overview.

## Overview

The Budget module enables:

- **Organizers** to create and manage budgets per edition
- **Categories** to organize expenses by type (Venue, Catering, Speakers, etc.)
- **Transactions** to track individual expenses and income with status tracking
- **Dashboard** to visualize budget usage, balance, and category breakdowns
- **Settings** to configure budget status (draft, approved, closed), currency, and notes

## Architecture

```
src/lib/features/budget/
├── domain/                        # Business entities and rules
│   ├── budget.ts                  # EditionBudget entity, status helpers
│   ├── category.ts                # BudgetCategory entity, DEFAULT_CATEGORIES
│   ├── transaction.ts             # BudgetTransaction entity, formatAmount
│   └── index.ts                   # Barrel exports
├── infra/                         # PocketBase repositories
│   ├── budget-repository.ts       # CRUD for edition_budgets
│   ├── category-repository.ts     # CRUD for budget_categories
│   ├── transaction-repository.ts  # CRUD + aggregates for budget_transactions
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

## Database Collections

| Collection | Description |
|------------|-------------|
| `edition_budgets` | Budget configuration per edition |
| `budget_categories` | Budget categories with planned amounts |
| `budget_transactions` | Individual expense/income transactions |

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

### Unit Tests (71 tests)

Tests located in `src/lib/features/budget/domain/*.test.ts`:

- **budget.test.ts** (29 tests) — EditionBudget schema validation, create/update schemas, currency validation, status helpers (label, color, canEdit), amount formatting
- **category.test.ts** (14 tests) — BudgetCategory schema validation, create/update schemas, DEFAULT_CATEGORIES constant
- **transaction.test.ts** (28 tests) — BudgetTransaction schema validation, create/update schemas, type/status enums, formatAmount, isExpense, status helpers

### E2E Tests (23 tests)

Tests located in `tests/e2e/budget.spec.ts`:

- **Budget Edition Selector** (4 tests) — display, navigation, status badge, settings icon
- **Budget Dashboard** (6 tests) — display, stats cards, status badge, settings link, categories table, transactions table
- **Budget Settings** (4 tests) — display, status buttons, update details, navigation
- **Category CRUD** (3 tests) — create, edit, delete
- **Transaction CRUD** (4 tests) — create expense, create income, edit, delete
- **Access Control** (2 tests) — authentication required, speaker 403

## Related Documentation

- [Database Seeding](../development/database-seeding.md) — Test data setup including budget seed data
- [CRM Module](crm-module.md) — Contact management
- [CFP Module](cfp-module.md) — Speaker management
