<script lang="ts">
import { page } from '$app/stores'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as m from '$lib/paraglide/messages'
import { Activity, ArrowRight, Check, Copy, ExternalLink, Key, Plus, Webhook } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

let copiedUrl = $state(false)

const getDocsUrl = () => {
  const origin = $page.url.origin
  return `${origin}/api/docs`
}

const copyDocsUrl = async () => {
  await navigator.clipboard.writeText(getDocsUrl())
  copiedUrl = true
  setTimeout(() => {
    copiedUrl = false
  }, 2000)
}

const formatDate = (date: Date | null) => {
  if (!date) return m.api_never()
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatRelativeTime = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return m.api_time_just_now()
  if (diffMins < 60) return m.api_time_minutes_ago({ count: diffMins })
  if (diffHours < 24) return m.api_time_hours_ago({ count: diffHours })
  return m.api_time_days_ago({ count: diffDays })
}

const getStatusColor = (statusCode: number) => {
  if (statusCode >= 200 && statusCode < 300) return 'text-green-600'
  if (statusCode >= 400 && statusCode < 500) return 'text-yellow-600'
  return 'text-red-600'
}
</script>

<svelte:head>
  <title>{m.api_title()}</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">{m.api_heading()}</h2>
      <p class="text-muted-foreground">
        {m.api_description()}
      </p>
    </div>
    <div class="flex items-center gap-4">
      <!-- Public API Docs URL -->
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5">
          <span class="text-sm text-muted-foreground">{m.api_keys_public_url()}:</span>
          <code class="text-sm">/api/docs</code>
        </div>
        <Button variant="outline" size="sm" onclick={copyDocsUrl} class="gap-2">
          {#if copiedUrl}
            <Check class="h-4 w-4 text-green-500" />
            {m.api_keys_copied()}
          {:else}
            <Copy class="h-4 w-4" />
            {m.action_copy()}
          {/if}
        </Button>
        <a href="/api/docs" target="_blank">
          <Button variant="outline" size="sm" class="gap-2">
            <ExternalLink class="h-4 w-4" />
            {m.api_keys_open()}
          </Button>
        </a>
      </div>
      <a href="/admin/api/keys/new">
        <Button>
          <Plus class="mr-2 h-4 w-4" />
          {m.api_keys_new()}
        </Button>
      </a>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="grid gap-4 md:grid-cols-3">
    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">{m.api_stats_api_keys()}</Card.Title>
        <Key class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.stats.activeApiKeys}</div>
        <p class="text-xs text-muted-foreground">
          {m.api_stats_total({ total: data.stats.totalApiKeys, inactive: data.stats.totalApiKeys - data.stats.activeApiKeys })}
        </p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">{m.api_stats_webhooks()}</Card.Title>
        <Webhook class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.stats.activeWebhooks}</div>
        <p class="text-xs text-muted-foreground">
          {m.api_stats_total({ total: data.stats.totalWebhooks, inactive: data.stats.totalWebhooks - data.stats.activeWebhooks })}
        </p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">{m.api_stats_requests_24h()}</Card.Title>
        <Activity class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.stats.requestsLast24h}</div>
        <p class="text-xs text-muted-foreground">{m.api_stats_requests_description()}</p>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Quick Links -->
  <div class="grid gap-4 md:grid-cols-2">
    <!-- API Keys Section -->
    <Card.Root>
      <Card.Header>
        <div class="flex items-center justify-between">
          <Card.Title class="flex items-center gap-2">
            <Key class="h-5 w-5" />
            {m.api_keys_section_title()}
          </Card.Title>
          <a href="/admin/api/keys">
            <Button variant="ghost" size="sm" class="gap-2">
              {m.api_view_all()}
              <ArrowRight class="h-4 w-4" />
            </Button>
          </a>
        </div>
        <Card.Description>
          {m.api_keys_section_description()}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {#if data.recentApiKeys.length === 0}
          <div class="flex flex-col items-center justify-center py-8 text-center">
            <Key class="mb-3 h-10 w-10 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">{m.api_no_keys_title()}</p>
            <a href="/admin/api/keys/new" class="mt-3">
              <Button size="sm">{m.api_create_first_key()}</Button>
            </a>
          </div>
        {:else}
          <div class="space-y-3">
            {#each data.recentApiKeys as key}
              <div class="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p class="font-medium">{key.name}</p>
                  <p class="text-xs text-muted-foreground">
                    <code>{key.keyPrefix}...</code> - {m.api_key_last_used()} {formatDate(key.lastUsedAt)}
                  </p>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- Webhooks Section -->
    <Card.Root>
      <Card.Header>
        <div class="flex items-center justify-between">
          <Card.Title class="flex items-center gap-2">
            <Webhook class="h-5 w-5" />
            {m.api_webhooks_section_title()}
          </Card.Title>
          <a href="/admin/api/webhooks">
            <Button variant="ghost" size="sm" class="gap-2">
              {m.api_view_all()}
              <ArrowRight class="h-4 w-4" />
            </Button>
          </a>
        </div>
        <Card.Description>
          {m.api_webhooks_section_description()}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {#if data.recentWebhooks.length === 0}
          <div class="flex flex-col items-center justify-center py-8 text-center">
            <Webhook class="mb-3 h-10 w-10 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">{m.api_no_webhooks_title()}</p>
            <a href="/admin/api/webhooks/new" class="mt-3">
              <Button size="sm">{m.api_create_first_webhook()}</Button>
            </a>
          </div>
        {:else}
          <div class="space-y-3">
            {#each data.recentWebhooks as webhook}
              <div class="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p class="font-medium">{webhook.name}</p>
                  <p class="text-xs text-muted-foreground truncate max-w-[250px]">
                    {webhook.url}
                  </p>
                </div>
                <span class="rounded-full bg-muted px-2 py-0.5 text-xs">
                  {m.api_events_count({ count: webhook.events.length })}
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Recent Activity -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <Activity class="h-5 w-5" />
        {m.api_recent_activity_title()}
      </Card.Title>
      <Card.Description>
        {m.api_recent_activity_description()}
      </Card.Description>
    </Card.Header>
    <Card.Content>
      {#if data.recentLogs.length === 0}
        <div class="flex flex-col items-center justify-center py-8 text-center">
          <Activity class="mb-3 h-10 w-10 text-muted-foreground" />
          <p class="text-sm text-muted-foreground">{m.api_no_requests_title()}</p>
          <p class="text-xs text-muted-foreground mt-1">
            {m.api_no_requests_description()}
          </p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left">
                <th class="pb-2 font-medium">{m.api_table_method()}</th>
                <th class="pb-2 font-medium">{m.api_table_path()}</th>
                <th class="pb-2 font-medium">{m.api_table_status()}</th>
                <th class="pb-2 font-medium">{m.api_table_time()}</th>
                <th class="pb-2 font-medium text-right">{m.api_table_when()}</th>
              </tr>
            </thead>
            <tbody>
              {#each data.recentLogs as log}
                <tr class="border-b last:border-0">
                  <td class="py-2">
                    <span class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {log.method}
                    </span>
                  </td>
                  <td class="py-2 font-mono text-xs">{log.path}</td>
                  <td class="py-2">
                    <span class={getStatusColor(log.statusCode)}>
                      {log.statusCode}
                    </span>
                  </td>
                  <td class="py-2 text-muted-foreground">{log.responseTimeMs}ms</td>
                  <td class="py-2 text-right text-muted-foreground">
                    {formatRelativeTime(log.createdAt)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
</div>
