# Reporting Module

The Reporting module provides comprehensive dashboards, analytics, alerts, and automated reports for event editions.

## Overview

The Reporting module enables:

- **Dashboards** with real-time KPIs across all domains (Ticketing, CFP, Planning, Sponsoring, Budget)
- **Distribution Charts** visualizing data breakdowns (tickets by type, talks by category, etc.)
- **Alert System** with configurable thresholds and notifications
- **Automated Reports** scheduled email reports with preset templates
- **Metrics Aggregation** centralized stats collection from all modules

## Architecture

```
src/lib/features/reporting/
├── domain/                           # Business entities and rules
│   ├── metrics.ts                    # MetricValue, MetricTrend types
│   ├── dashboard.ts                  # Dashboard configuration types
│   ├── widget.ts                     # Widget types for dashboard
│   ├── alert-threshold.ts            # AlertThreshold entity, operators, levels
│   ├── alert.ts                      # Alert entity, status workflow
│   ├── report-config.ts              # ReportConfig entity, scheduling
│   └── index.ts                      # Barrel exports
├── infra/                            # PocketBase repositories
│   ├── alert-threshold-repository.ts # CRUD for alert_thresholds
│   ├── alert-repository.ts           # CRUD for alerts
│   ├── report-config-repository.ts   # CRUD for report_configs
│   └── index.ts                      # Barrel exports
├── services/                         # External services
│   ├── dashboard-metrics-service.ts  # Aggregate metrics from all modules
│   ├── dashboard-cache-service.ts    # Cache metrics for performance
│   ├── threshold-evaluation-service.ts # Evaluate thresholds, trigger alerts
│   ├── alert-notification-service.ts # Send alert notifications
│   ├── report-generator-service.ts   # Generate report content
│   ├── report-scheduler-service.ts   # Schedule next report execution
│   └── index.ts                      # Barrel exports
├── ui/                               # Svelte components
│   ├── MetricCard.svelte             # Single metric display
│   ├── ProgressCard.svelte           # Progress bar metric
│   ├── DonutChart.svelte             # Pie/donut chart
│   ├── HorizontalBarChart.svelte     # Bar chart
│   ├── MiniProgressChart.svelte      # Circular progress
│   ├── AlertBadge.svelte             # Alert count badge
│   ├── AlertList.svelte              # Alert display list
│   ├── AlertThresholdConfig.svelte   # Threshold configuration with presets
│   ├── ReportConfigForm.svelte       # Report configuration with presets
│   ├── dashboard-helpers.ts          # Formatting utilities
│   └── index.ts                      # Barrel exports
└── index.ts                          # Feature barrel exports
```

## Routes Structure

### Admin Routes

| Route | Description |
|-------|-------------|
| `/admin/reporting` | Edition selector — choose which edition to view |
| `/admin/reporting/[editionSlug]` | Main dashboard with KPIs and charts |
| `/admin/reporting/[editionSlug]/alerts` | Alert management and threshold configuration |
| `/admin/reporting/[editionSlug]/reports` | Automated report configuration |

## Data Model

### AlertThreshold

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `editionId` | string | Relation to editions collection |
| `name` | string | Threshold name (1-200 chars) |
| `description` | string | Optional description |
| `metricSource` | enum | Metric to monitor (see Metric Sources) |
| `operator` | enum | `lt`, `lte`, `eq`, `gte`, `gt`, `ne` |
| `thresholdValue` | number | Value to compare against |
| `level` | enum | `info`, `warning`, `critical` |
| `enabled` | boolean | Whether threshold is active |
| `notifyByEmail` | boolean | Send email notifications |
| `notifyInApp` | boolean | Show in-app notifications |
| `emailRecipients` | json | Array of email addresses |
| `lastTriggeredAt` | date | Last time alert was triggered |
| `createdAt` | date | Creation timestamp |
| `updatedAt` | date | Last update timestamp |

**Metric Sources:**
- `billing_sales` — Total tickets sold
- `billing_revenue` — Total revenue
- `billing_capacity` — Capacity utilization %
- `cfp_submissions` — Total submissions
- `cfp_pending_reviews` — Talks awaiting review
- `cfp_acceptance_rate` — Acceptance rate %
- `planning_scheduled` — Scheduled sessions count
- `budget_utilization` — Budget utilization %

**Comparison Operators:**
| Operator | Label | Description |
|----------|-------|-------------|
| `lt` | Less than | Value < threshold |
| `lte` | Less than or equal | Value <= threshold |
| `eq` | Equal to | Value == threshold |
| `gte` | Greater than or equal | Value >= threshold |
| `gt` | Greater than | Value > threshold |
| `ne` | Not equal to | Value != threshold |

### Alert

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `thresholdId` | string | Relation to alert_thresholds |
| `editionId` | string | Relation to editions collection |
| `level` | enum | `info`, `warning`, `critical` |
| `status` | enum | `active`, `acknowledged`, `resolved`, `dismissed` |
| `message` | string | Alert message |
| `metricValue` | number | Current metric value when triggered |
| `thresholdValue` | number | Threshold value that was crossed |
| `acknowledgedBy` | string | User who acknowledged |
| `acknowledgedAt` | date | Acknowledgement timestamp |
| `resolvedAt` | date | Resolution timestamp |
| `createdAt` | date | Creation timestamp |

**Alert Status Flow:**
```
active → acknowledged → resolved
       → dismissed
```

### ReportConfig

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `editionId` | string | Relation to editions collection |
| `name` | string | Report name (1-200 chars) |
| `enabled` | boolean | Whether report is active |
| `frequency` | enum | `daily`, `weekly`, `monthly` |
| `dayOfWeek` | enum | Monday-Sunday (for weekly) |
| `dayOfMonth` | number | 1-31 (for monthly) |
| `timeOfDay` | string | HH:MM format |
| `timezone` | string | IANA timezone (e.g., Europe/Paris) |
| `recipientRoles` | json | Array of roles: `owner`, `admin`, `organizer` |
| `recipients` | json | Array of `{email, name}` objects |
| `sections` | json | Array of sections to include |
| `lastSentAt` | date | Last send timestamp |
| `nextScheduledAt` | date | Next scheduled send |
| `createdAt` | date | Creation timestamp |
| `updatedAt` | date | Last update timestamp |

**Report Sections:**
- `cfp` — Call for Papers stats
- `billing` — Ticketing and revenue stats
- `planning` — Schedule and sessions stats
- `crm` — Contact and attendee stats
- `budget` — Budget utilization stats
- `sponsoring` — Sponsor stats

## Features

### 1. Dashboard

The main dashboard displays real-time KPIs organized by domain:

**Ticketing Section:**
- Revenue (formatted with currency)
- Tickets Sold (with capacity progress)
- Check-in Rate (percentage)
- Orders count

**Call for Papers Section:**
- Submissions count
- Pending Reviews (with status indicator)
- Accepted talks count
- Speakers count

**Planning Section:**
- Total Sessions
- Tracks count
- Rooms count
- Unscheduled sessions (warning if > 0)

**Sponsoring Section:**
- Sponsorship Value (total)
- Confirmed sponsors count
- Total sponsors count

**Budget Section:**
- Total Budget
- Spent amount
- Remaining amount (color-coded)

**Distribution Charts:**
- Tickets by Type (donut chart)
- Submission Status (donut chart)
- Talks by Category (horizontal bar)
- Talks by Format (horizontal bar)
- Sessions by Track (horizontal bar)
- Sponsor Status (donut chart)

### 2. Alert System

Configure thresholds to receive notifications when metrics cross defined values.

**Threshold Configuration:**
- Select metric source
- Define comparison operator and value
- Set alert level (info, warning, critical)
- Enable/disable threshold
- Configure notification channels (email, in-app)

**Alert Presets:**
Pre-configured threshold templates for quick setup:

| Preset | Metric | Condition | Level |
|--------|--------|-----------|-------|
| Low Ticket Sales | billing_sales | < 50 | warning |
| Low Revenue | billing_revenue | < 10000 | critical |
| Pending Reviews Backlog | cfp_pending_reviews | > 20 | info |
| Low Acceptance Rate | cfp_acceptance_rate | < 25% | warning |
| Budget Overrun | budget_utilization | > 90% | critical |

**Alert Management:**
- View active alerts with level indicators
- Acknowledge alerts (marks as seen)
- Resolve alerts (marks as fixed)
- Dismiss alerts (ignores)
- View alert history

### 3. Automated Reports

Schedule recurring email reports with customizable content.

**Report Configuration:**
- Name the report
- Set frequency (daily, weekly, monthly)
- Choose day/time for delivery
- Select recipient roles or specific emails
- Choose sections to include

**Report Presets:**
Pre-configured report templates:

| Preset | Frequency | Day/Time | Recipients | Sections |
|--------|-----------|----------|------------|----------|
| Weekly Summary | Weekly | Monday 09:00 | Admin, Organizer | CFP, Billing, Planning |
| Daily Sales | Daily | 08:00 | Admin | Billing |
| Monthly Overview | Monthly | 1st 10:00 | Owner, Admin | All sections |
| CFP Weekly | Weekly | Friday 17:00 | Admin, Organizer | CFP |

**Report Actions:**
- Create/edit/delete report configurations
- Enable/disable reports
- Send test report to specific email
- View last sent and next scheduled dates

### 4. Metrics Aggregation

The `DashboardMetricsService` aggregates data from all modules:

```typescript
interface DashboardMetrics {
  ticketing: {
    revenue: number
    ticketsSold: number
    capacity: number
    checkInRate: number
    orders: number
    ticketsByType: Distribution[]
  }
  cfp: {
    submissions: number
    pendingReviews: number
    accepted: number
    rejected: number
    speakers: number
    submissionStatus: Distribution[]
    talksByCategory: Distribution[]
    talksByFormat: Distribution[]
  }
  planning: {
    totalSessions: number
    scheduledSessions: number
    unscheduledSessions: number
    tracks: number
    rooms: number
    sessionsByTrack: Distribution[]
  }
  sponsoring: {
    totalValue: number
    confirmedCount: number
    totalCount: number
    sponsorStatus: Distribution[]
  }
  budget: {
    totalBudget: number
    spent: number
    remaining: number
    utilization: number
  }
}
```

### 5. Caching

The `DashboardCacheService` caches metrics for performance:
- Cache TTL: 5 minutes (configurable)
- Invalidation on data changes
- Per-edition cache keys

## UI Components

### MetricCard

Displays a single metric value with optional trend indicator.

```svelte
<MetricCard
  title="Revenue"
  value={12500}
  format="currency"
  trend={{ direction: 'up', value: 15 }}
/>
```

### ProgressCard

Displays a metric with progress bar showing completion.

```svelte
<ProgressCard
  title="Tickets Sold"
  current={450}
  total={500}
  format="number"
/>
```

### DonutChart

Displays distribution data as a pie/donut chart.

```svelte
<DonutChart
  title="Tickets by Type"
  data={[
    { label: 'Standard', value: 300, color: '#3b82f6' },
    { label: 'VIP', value: 50, color: '#eab308' }
  ]}
/>
```

### HorizontalBarChart

Displays distribution data as horizontal bars.

```svelte
<HorizontalBarChart
  title="Talks by Category"
  data={[
    { label: 'Web', value: 25 },
    { label: 'Mobile', value: 18 },
    { label: 'DevOps', value: 12 }
  ]}
/>
```

### AlertThresholdConfig

Configuration form for alert thresholds with preset templates.

```svelte
<AlertThresholdConfig
  thresholds={existingThresholds}
  editionId={editionId}
  onAdd={handleAdd}
  onToggle={handleToggle}
  onDelete={handleDelete}
/>
```

### ReportConfigForm

Configuration form for automated reports with preset templates.

```svelte
<ReportConfigForm
  initialData={{ editionId }}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isLoading={false}
/>
```

## Database Collections

| Collection | Description |
|------------|-------------|
| `alert_thresholds` | Threshold configurations |
| `alerts` | Triggered alert instances |
| `report_configs` | Automated report configurations |

## PocketBase Migrations

| Migration | Description |
|-----------|-------------|
| `1770700000_created_alert_thresholds.js` | Create alert_thresholds collection |
| `1770700001_created_alerts.js` | Create alerts collection |
| `1770700002_created_report_configs.js` | Create report_configs collection |
| `1770800001_fix_threshold_value_required.js` | Fix thresholdValue field for 0 values |

## Testing

### Unit Tests (270 tests)

Tests located in `src/lib/features/reporting/**/*.test.ts`:

**Domain Tests:**
- **metrics.test.ts** (10 tests) — MetricValue schema, trend types
- **dashboard.test.ts** (18 tests) — Dashboard configuration validation
- **widget.test.ts** (11 tests) — Widget types validation
- **alert-threshold.test.ts** (17 tests) — Threshold schema, operators, levels
- **alert.test.ts** (17 tests) — Alert schema, status workflow
- **report-config.test.ts** (22 tests) — ReportConfig schema, scheduling

**Service Tests:**
- **dashboard-metrics-service.test.ts** (10 tests) — Metrics aggregation
- **dashboard-cache-service.test.ts** (17 tests) — Cache operations
- **threshold-evaluation-service.test.ts** (17 tests) — Threshold evaluation
- **alert-notification-service.test.ts** (20 tests) — Notification sending
- **report-generator-service.test.ts** (8 tests) — Report content generation
- **report-scheduler-service.test.ts** (9 tests) — Schedule calculation

**UI Tests:**
- **dashboard-helpers.test.ts** (26 tests) — Formatting utilities
- **alert-threshold-presets.test.ts** (22 tests) — Preset validation
- **report-config-presets.test.ts** (31 tests) — Preset validation

**Infrastructure Tests:**
- **report-config-repository.test.ts** (15 tests) — Repository operations

### E2E Tests (45 tests)

Tests located in `tests/e2e/reporting.spec.ts`:

**Edition Selector (4 tests):**
- Display editions list
- Navigate to dashboard
- Show status badges
- Toggle archived editions

**Dashboard (12 tests):**
- Display KPI sections (Ticketing, CFP, Planning, Sponsoring, Budget)
- Show distribution charts
- Refresh button functionality
- Last updated timestamp

**Alerts Page (6 tests):**
- Navigate to alerts
- Display summary cards
- Tab switching (Alerts, Thresholds, History)
- Add Threshold button

**Alert Threshold Presets (3 tests):**
- Display preset buttons
- Fill form from preset
- Create threshold from preset

**Reports Configuration (10 tests):**
- Navigate to reports page
- Display New Report button
- Open creation dialog with presets
- Fill form from preset
- Create report from preset
- Toggle report enabled status
- Delete report configuration
- Send test report

**Access Control (4 tests):**
- Require authentication
- Deny speaker access

**Navigation (2 tests):**
- Sidebar navigation
- Back button navigation

## Seed Data

The seeding script (`scripts/seed.ts`) creates sample data:

**Alert Thresholds (5):**
- Low Ticket Sales Alert
- CFP Deadline Warning
- Budget Threshold
- Speaker Confirmation Rate
- Check-in Rate Monitor

**Alerts (3):**
- Active: Low ticket sales warning
- Acknowledged: Budget threshold exceeded
- Resolved: High pending reviews

**Report Configs (4):**
- Weekly CFP Summary (Monday 09:00)
- Daily Sales Report (08:00)
- Monthly Overview (1st 10:00)
- Weekly Planning Update (Friday 17:00)

## Related Documentation

- [Database Seeding](../development/database-seeding.md) — Test data setup
- [Budget Module](budget-module.md) — Budget metrics source
- [Billing Module](billing-module.md) — Ticketing metrics source
- [CFP Module](cfp-module.md) — Submission metrics source
- [Planning Module](planning-module.md) — Session metrics source
- [Sponsoring Module](sponsoring-module.md) — Sponsor metrics source
