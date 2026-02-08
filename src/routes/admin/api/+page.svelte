<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Activity, ArrowRight, Book, Code2, Key, Plus, Webhook } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

const formatDate = (date: Date | null) => {
  if (!date) return 'Never'
  return new Intl.DateTimeFormat('en-US', {
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

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

const getStatusColor = (statusCode: number) => {
  if (statusCode >= 200 && statusCode < 300) return 'text-green-600'
  if (statusCode >= 400 && statusCode < 500) return 'text-yellow-600'
  return 'text-red-600'
}
</script>

<svelte:head>
  <title>API - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">API</h2>
      <p class="text-muted-foreground">
        Manage API keys, webhooks, and access the API documentation.
      </p>
    </div>
    <div class="flex gap-2">
      <a href="/admin/api/keys/new">
        <Button>
          <Plus class="mr-2 h-4 w-4" />
          New API Key
        </Button>
      </a>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="grid gap-4 md:grid-cols-4">
    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">API Keys</Card.Title>
        <Key class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.stats.activeApiKeys}</div>
        <p class="text-xs text-muted-foreground">
          {data.stats.totalApiKeys} total ({data.stats.totalApiKeys - data.stats.activeApiKeys} inactive)
        </p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Webhooks</Card.Title>
        <Webhook class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.stats.activeWebhooks}</div>
        <p class="text-xs text-muted-foreground">
          {data.stats.totalWebhooks} total ({data.stats.totalWebhooks - data.stats.activeWebhooks} inactive)
        </p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Requests (24h)</Card.Title>
        <Activity class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.stats.requestsLast24h}</div>
        <p class="text-xs text-muted-foreground">API calls in the last 24 hours</p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Documentation</Card.Title>
        <Book class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <a href="/api/docs" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" class="w-full gap-2">
            <Code2 class="h-4 w-4" />
            Open API Docs
          </Button>
        </a>
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
            API Keys
          </Card.Title>
          <a href="/admin/api/keys">
            <Button variant="ghost" size="sm" class="gap-2">
              View All
              <ArrowRight class="h-4 w-4" />
            </Button>
          </a>
        </div>
        <Card.Description>
          Manage authentication tokens for API access
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {#if data.recentApiKeys.length === 0}
          <div class="flex flex-col items-center justify-center py-8 text-center">
            <Key class="mb-3 h-10 w-10 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">No API keys created yet</p>
            <a href="/admin/api/keys/new" class="mt-3">
              <Button size="sm">Create First Key</Button>
            </a>
          </div>
        {:else}
          <div class="space-y-3">
            {#each data.recentApiKeys as key}
              <div class="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p class="font-medium">{key.name}</p>
                  <p class="text-xs text-muted-foreground">
                    <code>{key.keyPrefix}...</code> - Last used: {formatDate(key.lastUsedAt)}
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
            Webhooks
          </Card.Title>
          <a href="/admin/api/webhooks">
            <Button variant="ghost" size="sm" class="gap-2">
              View All
              <ArrowRight class="h-4 w-4" />
            </Button>
          </a>
        </div>
        <Card.Description>
          Configure event notifications to external services
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {#if data.recentWebhooks.length === 0}
          <div class="flex flex-col items-center justify-center py-8 text-center">
            <Webhook class="mb-3 h-10 w-10 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">No webhooks configured yet</p>
            <a href="/admin/api/webhooks/new" class="mt-3">
              <Button size="sm">Create First Webhook</Button>
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
                  {webhook.events.length} events
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
        Recent API Activity
      </Card.Title>
      <Card.Description>
        Latest API requests
      </Card.Description>
    </Card.Header>
    <Card.Content>
      {#if data.recentLogs.length === 0}
        <div class="flex flex-col items-center justify-center py-8 text-center">
          <Activity class="mb-3 h-10 w-10 text-muted-foreground" />
          <p class="text-sm text-muted-foreground">No API requests yet</p>
          <p class="text-xs text-muted-foreground mt-1">
            Create an API key and start making requests
          </p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left">
                <th class="pb-2 font-medium">Method</th>
                <th class="pb-2 font-medium">Path</th>
                <th class="pb-2 font-medium">Status</th>
                <th class="pb-2 font-medium">Time</th>
                <th class="pb-2 font-medium text-right">When</th>
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
