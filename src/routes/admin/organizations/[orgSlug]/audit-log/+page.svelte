<script lang="ts">
import { goto } from '$app/navigation'
import { page } from '$app/stores'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { getAuditActionColor, getAuditActionLabel } from '$lib/features/core/domain/audit-log'
import * as m from '$lib/paraglide/messages.js'
import { getLocale } from '$lib/paraglide/runtime.js'
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Filter, ScrollText } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

const AUDIT_ACTIONS = [
  'login',
  'logout',
  'password_change',
  'profile_update',
  '2fa_enable',
  '2fa_disable',
  'org_create',
  'org_update',
  'org_delete',
  'member_add',
  'member_remove',
  'member_role_change',
  'event_create',
  'event_update',
  'event_delete',
  'edition_create',
  'edition_update',
  'edition_delete',
  'settings_change',
  'invitation_send',
  'invitation_accept'
] as const

function getActionBadgeClasses(color: string): string {
  switch (color) {
    case 'red':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'green':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'blue':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'purple':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(getLocale(), {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(d)
}

function applyFilters(action?: string, userId?: string): void {
  const url = new URL($page.url)
  url.searchParams.delete('page')
  if (action) {
    url.searchParams.set('action', action)
  } else {
    url.searchParams.delete('action')
  }
  if (userId) {
    url.searchParams.set('userId', userId)
  } else {
    url.searchParams.delete('userId')
  }
  goto(url.toString())
}

function goToPage(pageNum: number): void {
  const url = new URL($page.url)
  url.searchParams.set('page', String(pageNum))
  goto(url.toString())
}

function getExportUrl(): string {
  const url = new URL($page.url)
  const exportUrl = new URL(`${url.origin}${url.pathname}/export`)
  if (data.filters.action) exportUrl.searchParams.set('action', data.filters.action)
  if (data.filters.userId) exportUrl.searchParams.set('userId', data.filters.userId)
  return exportUrl.toString()
}
</script>

<svelte:head>
  <title>{m.audit_log_title()} - {data.organization.name}</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/admin/organizations/{data.organization.slug}/settings">
        <Button variant="ghost" size="icon">
          <ArrowLeft class="h-4 w-4" />
        </Button>
      </a>
      <div>
        <h2 class="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <ScrollText class="h-7 w-7" />
          {m.audit_log_title()}
        </h2>
        <p class="text-muted-foreground">{m.audit_log_description()}</p>
      </div>
    </div>
    <a href={getExportUrl()}>
      <Button variant="outline">
        <Download class="mr-2 h-4 w-4" />
        {m.audit_log_export_csv()}
      </Button>
    </a>
  </div>

  <!-- Filters -->
  <Card.Root>
    <Card.Content class="pt-6">
      <div class="flex items-center gap-4">
        <Filter class="h-4 w-4 text-muted-foreground" />
        <div class="grid flex-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="filter-action" class="mb-1 block text-sm font-medium">
              {m.audit_log_filter_action()}
            </label>
            <select
              id="filter-action"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={data.filters.action || ''}
              onchange={(e) =>
                applyFilters(
                  (e.target as HTMLSelectElement).value || undefined,
                  data.filters.userId || undefined
                )}
            >
              <option value="">{m.audit_log_filter_all_actions()}</option>
              {#each AUDIT_ACTIONS as action}
                <option value={action}>{getAuditActionLabel(action)}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="filter-user" class="mb-1 block text-sm font-medium">
              {m.audit_log_filter_user()}
            </label>
            <select
              id="filter-user"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={data.filters.userId || ''}
              onchange={(e) =>
                applyFilters(
                  data.filters.action || undefined,
                  (e.target as HTMLSelectElement).value || undefined
                )}
            >
              <option value="">{m.audit_log_filter_all_users()}</option>
              {#each data.members as member}
                <option value={member.id}>{member.name}</option>
              {/each}
            </select>
          </div>
        </div>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Retention notice -->
  <p class="text-sm text-muted-foreground">{m.audit_log_retention()}</p>

  <!-- Table -->
  <Card.Root>
    <Card.Content class="p-0">
      {#if data.auditLogs.items.length === 0}
        <div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ScrollText class="mb-3 h-10 w-10" />
          <p>{m.audit_log_no_entries()}</p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b bg-muted/50">
                <th class="px-4 py-3 text-left text-sm font-medium">{m.audit_log_column_date()}</th>
                <th class="px-4 py-3 text-left text-sm font-medium">{m.audit_log_column_user()}</th>
                <th class="px-4 py-3 text-left text-sm font-medium">
                  {m.audit_log_column_action()}
                </th>
                <th class="px-4 py-3 text-left text-sm font-medium">
                  {m.audit_log_column_entity()}
                </th>
                <th class="px-4 py-3 text-left text-sm font-medium">{m.audit_log_column_ip()}</th>
              </tr>
            </thead>
            <tbody>
              {#each data.auditLogs.items as entry}
                <tr class="border-b last:border-0 hover:bg-muted/30">
                  <td class="whitespace-nowrap px-4 py-3 text-sm">
                    {formatDate(entry.created)}
                  </td>
                  <td class="px-4 py-3 text-sm">{entry.userName || '-'}</td>
                  <td class="px-4 py-3 text-sm">
                    <span
                      class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {getActionBadgeClasses(
                        getAuditActionColor(entry.action)
                      )}"
                    >
                      {getAuditActionLabel(entry.action)}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    {#if entry.entityName}
                      <span class="text-muted-foreground">{entry.entityType}:</span>
                      {entry.entityName}
                    {:else if entry.entityType}
                      <span class="text-muted-foreground">{entry.entityType}</span>
                    {:else}
                      -
                    {/if}
                  </td>
                  <td class="px-4 py-3 text-sm text-muted-foreground">
                    {entry.ipAddress || '-'}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>

  <!-- Pagination -->
  {#if data.auditLogs.totalPages > 1}
    <div class="flex items-center justify-between">
      <p class="text-sm text-muted-foreground">
        {data.auditLogs.totalItems} entries
      </p>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          disabled={data.auditLogs.page <= 1}
          onclick={() => goToPage(data.auditLogs.page - 1)}
        >
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <span class="text-sm">
          {data.auditLogs.page} / {data.auditLogs.totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          disabled={data.auditLogs.page >= data.auditLogs.totalPages}
          onclick={() => goToPage(data.auditLogs.page + 1)}
        >
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>
    </div>
  {/if}
</div>
