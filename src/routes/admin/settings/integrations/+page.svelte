<script lang="ts">
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as m from '$lib/paraglide/messages'
import type { IntegrationEntry } from '$lib/server/integration-registry'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Hash,
  Mail,
  MessageSquare,
  Settings2,
  Webhook,
  XCircle
} from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

const iconMap = {
  smtp: Mail,
  stripe: CreditCard,
  slack: Hash,
  discord: MessageSquare,
  webhooks: Webhook
} as const

function getStatusIcon(status: string) {
  switch (status) {
    case 'connected':
      return CheckCircle2
    case 'error':
      return XCircle
    default:
      return AlertCircle
  }
}

function getStatusColor(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'connected':
      return 'default'
    case 'error':
      return 'destructive'
    default:
      return 'secondary'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'connected':
      return m.admin_integrations_status_connected()
    case 'error':
      return m.admin_integrations_status_error()
    default:
      return m.admin_integrations_status_not_configured()
  }
}

function getConfigPath(integration: IntegrationEntry): string | null {
  switch (integration.info.type) {
    case 'smtp':
      return '/admin/settings'
    case 'stripe':
      return '/admin/settings/stripe'
    case 'slack':
      return '/admin/settings/slack'
    case 'discord':
      return '/admin/settings/discord'
    case 'webhooks':
      return '/admin/api/webhooks'
    default:
      return null
  }
}
</script>

<svelte:head>
  <title>{m.admin_integrations_title()}</title>
</svelte:head>

<div class="space-y-6">
<div class="flex items-center gap-4">
    <a href="/admin/settings">
      <Button variant="ghost" size="icon">
        <ArrowLeft class="h-5 w-5" />
      </Button>
    </a>
    <div>
      <h2 class="text-3xl font-bold tracking-tight">{m.admin_integrations_heading()}</h2>
      <p class="text-muted-foreground">
        {m.admin_integrations_description()}
      </p>
    </div>
  </div>

  <!-- Summary stats -->
  <div class="grid gap-4 md:grid-cols-3">
    <Card.Root>
      <Card.Content class="pt-6">
        <div class="flex items-center gap-2">
          <CheckCircle2 class="h-5 w-5 text-green-500" />
          <div>
            <p class="text-2xl font-bold">
              {data.integrations.filter((i) => i.status.status === 'connected').length}
            </p>
            <p class="text-sm text-muted-foreground">{m.admin_integrations_connected()}</p>
          </div>
        </div>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Content class="pt-6">
        <div class="flex items-center gap-2">
          <AlertCircle class="h-5 w-5 text-yellow-500" />
          <div>
            <p class="text-2xl font-bold">
              {data.integrations.filter((i) => i.status.status === 'not_configured').length}
            </p>
            <p class="text-sm text-muted-foreground">{m.admin_integrations_not_configured()}</p>
          </div>
        </div>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Content class="pt-6">
        <div class="flex items-center gap-2">
          <XCircle class="h-5 w-5 text-red-500" />
          <div>
            <p class="text-2xl font-bold">
              {data.integrations.filter((i) => i.status.status === 'error').length}
            </p>
            <p class="text-sm text-muted-foreground">{m.admin_integrations_errors()}</p>
          </div>
        </div>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Integration cards -->
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {#each data.integrations as integration}
      {@const Icon = iconMap[integration.info.type]}
      {@const StatusIcon = getStatusIcon(integration.status.status)}
      {@const configPath = getConfigPath(integration)}
      <Card.Root class="relative">
        <Card.Header class="pb-3">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="rounded-lg bg-muted p-2">
                <Icon class="h-5 w-5" />
              </div>
              <div>
                <Card.Title class="text-base">{integration.info.name}</Card.Title>
                <Card.Description class="text-xs">{integration.info.description}</Card.Description>
              </div>
            </div>
          </div>
        </Card.Header>
        <Card.Content class="space-y-3">
          <div class="flex items-center gap-2">
            <StatusIcon
              class="h-4 w-4 {integration.status.status === 'connected'
                ? 'text-green-500'
                : integration.status.status === 'error'
                  ? 'text-red-500'
                  : 'text-yellow-500'}"
            />
            <Badge variant={getStatusColor(integration.status.status)}>
              {getStatusLabel(integration.status.status)}
            </Badge>
          </div>
          <p class="text-sm text-muted-foreground">
            {integration.status.message}
          </p>
          {#if integration.status.details}
            <div class="rounded-md bg-muted/50 p-2 text-xs">
              {#each Object.entries(integration.status.details) as [key, value]}
                <div class="flex justify-between">
                  <span class="text-muted-foreground">{key}:</span>
                  <span class="font-medium">{value}</span>
                </div>
              {/each}
            </div>
          {/if}
        </Card.Content>
<Card.Footer>
          {#if configPath}
            <a href={configPath} class="w-full">
              <Button variant="outline" size="sm" class="w-full">
                <Settings2 class="mr-2 h-4 w-4" />
                {m.admin_integrations_configure()}
              </Button>
            </a>
          {:else}
            <Button variant="outline" size="sm" class="w-full" disabled>
              <ExternalLink class="mr-2 h-4 w-4" />
              {m.admin_integrations_coming_soon()}
            </Button>
          {/if}
        </Card.Footer>
      </Card.Root>
    {/each}
  </div>
</div>
