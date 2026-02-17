<script lang="ts">
import { enhance } from '$app/forms'
import { AdminSubNav } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { getBillingNavItems } from '$lib/config'
import * as m from '$lib/paraglide/messages'
import {
  ArrowLeft,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Mail,
  ShieldCheck,
  Ticket,
  X
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let copied = $state(false)

function copyPublicUrl() {
  navigator.clipboard.writeText(data.settings.publicUrl)
  copied = true
  setTimeout(() => {
    copied = false
  }, 2000)
}
</script>

<svelte:head>
  <title>{m.billing_settings_title()} - {m.billing_title()} - {data.edition.name}</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center gap-4">
    <a href="/admin/billing/{data.edition.slug}">
      <Button variant="ghost" size="icon">
        <ArrowLeft class="h-5 w-5" />
      </Button>
    </a>
    <div>
      <h2 class="text-3xl font-bold tracking-tight">{data.edition.name}</h2>
    </div>
  </div>

  <!-- Sub-navigation -->
  <AdminSubNav basePath="/admin/billing/{data.edition.slug}" items={getBillingNavItems(data.edition.slug)} />

  {#if form?.success}
    <div
      class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
    >
      {form.message || m.message_saved_successfully()}
    </div>
  {/if}

  {#if form?.error}
    <div
      class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
    >
      {form.error}
    </div>
  {/if}

  <!-- Public URL -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <ExternalLink class="h-5 w-5" />
        {m.billing_settings_public_page()}
      </Card.Title>
      <Card.Description>
        {m.billing_settings_public_page_desc()}
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="flex items-center gap-2">
        <Input readonly value={data.settings.publicUrl} class="font-mono text-sm" />
        <Button variant="outline" size="icon" onclick={copyPublicUrl}>
          {#if copied}
            <Check class="h-4 w-4 text-green-500" />
          {:else}
            <Copy class="h-4 w-4" />
          {/if}
        </Button>
        <a href={data.settings.publicUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="icon">
            <ExternalLink class="h-4 w-4" />
          </Button>
        </a>
      </div>
      {#if data.edition.status !== 'published'}
        <p class="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
          {m.billing_settings_not_published()}
        </p>
      {/if}
    </Card.Content>
  </Card.Root>

  <!-- Sales Status -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <Ticket class="h-5 w-5" />
        {m.billing_settings_sales_status()}
      </Card.Title>
      <Card.Description>{m.billing_settings_sales_status_desc()}</Card.Description>
    </Card.Header>
    <Card.Content class="space-y-4">
      <div class="grid gap-4 md:grid-cols-3">
        <div class="rounded-lg border p-4">
          <div class="text-sm text-muted-foreground">{m.billing_settings_active_types()}</div>
          <div class="mt-1 text-2xl font-bold">
            {data.settings.activeTicketTypes} / {data.settings.totalTicketTypes}
          </div>
        </div>
        <div class="rounded-lg border p-4">
          <div class="text-sm text-muted-foreground">{m.billing_settings_total_capacity()}</div>
          <div class="mt-1 text-2xl font-bold">{data.settings.totalCapacity}</div>
        </div>
        <div class="rounded-lg border p-4">
          <div class="text-sm text-muted-foreground">{m.billing_settings_tickets_sold()}</div>
          <div class="mt-1 text-2xl font-bold">
            {data.settings.totalSold}
            <span class="text-sm font-normal text-muted-foreground">
              ({data.settings.totalCapacity > 0
                ? Math.round((data.settings.totalSold / data.settings.totalCapacity) * 100)
                : 0}%)
            </span>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between rounded-lg border p-4">
        <div>
          <div class="font-medium">
            {#if data.settings.salesOpen}
              <span class="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Check class="h-4 w-4" />
                {m.billing_settings_sales_open()}
              </span>
            {:else}
              <span class="flex items-center gap-2 text-red-600 dark:text-red-400">
                <X class="h-4 w-4" />
                {m.billing_settings_sales_closed()}
              </span>
            {/if}
          </div>
          <p class="mt-1 text-sm text-muted-foreground">
            {#if data.edition.status !== 'published'}
              {m.billing_settings_publish_required()}
            {:else if data.settings.activeTicketTypes === 0}
              {m.billing_settings_no_active_types()}
            {:else}
              {m.billing_settings_types_active()}
            {/if}
          </p>
        </div>
        <div class="flex gap-2">
          {#if data.settings.activeTicketTypes > 0}
            <form method="POST" action="?/toggleAllSales" use:enhance>
              <input type="hidden" name="editionId" value={data.edition.id} />
              <input type="hidden" name="enable" value="false" />
              <Button type="submit" variant="outline" size="sm">
                {m.billing_settings_disable_all()}
              </Button>
            </form>
          {/if}
          {#if data.settings.activeTicketTypes < data.settings.totalTicketTypes}
            <form method="POST" action="?/toggleAllSales" use:enhance>
              <input type="hidden" name="editionId" value={data.edition.id} />
              <input type="hidden" name="enable" value="true" />
              <Button type="submit" size="sm">{m.billing_settings_enable_all()}</Button>
            </form>
          {/if}
        </div>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Integration Status -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <ShieldCheck class="h-5 w-5" />
        {m.billing_settings_integrations()}
      </Card.Title>
      <Card.Description>
        {m.billing_settings_integrations_desc()}
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="space-y-3">
        <div class="flex items-center justify-between rounded-lg border p-4">
          <div class="flex items-center gap-3">
            <CreditCard class="h-5 w-5 text-muted-foreground" />
            <div>
              <div class="font-medium">{m.billing_settings_stripe()}</div>
              <p class="text-sm text-muted-foreground">
                {m.billing_settings_stripe_desc()}
              </p>
            </div>
          </div>
          {#if data.settings.stripeConfigured}
            <span
              class="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
            >
              <Check class="h-3 w-3" />
              {m.billing_settings_connected()}
            </span>
          {:else}
            <span
              class="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            >
              {m.billing_settings_not_configured()}
            </span>
          {/if}
        </div>

        <div class="flex items-center justify-between rounded-lg border p-4">
          <div class="flex items-center gap-3">
            <ShieldCheck class="h-5 w-5 text-muted-foreground" />
            <div>
              <div class="font-medium">{m.billing_settings_webhook()}</div>
              <p class="text-sm text-muted-foreground">
                {m.billing_settings_webhook_desc()}
              </p>
            </div>
          </div>
          {#if data.settings.stripeWebhookConfigured}
            <span
              class="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
            >
              <Check class="h-3 w-3" />
              {m.billing_settings_connected()}
            </span>
          {:else}
            <span
              class="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            >
              {m.billing_settings_not_configured()}
            </span>
          {/if}
        </div>

        <div class="flex items-center justify-between rounded-lg border p-4">
          <div class="flex items-center gap-3">
            <Mail class="h-5 w-5 text-muted-foreground" />
            <div>
              <div class="font-medium">{m.billing_settings_email()}</div>
              <p class="text-sm text-muted-foreground">
                {m.billing_settings_email_desc()}
              </p>
            </div>
          </div>
          {#if data.settings.emailConfigured}
            <span
              class="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
            >
              <Check class="h-3 w-3" />
              {m.billing_settings_connected_smtp()}
            </span>
          {:else}
            <span
              class="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            >
              {m.billing_settings_console_only()}
            </span>
          {/if}
        </div>
      </div>

      {#if !data.settings.stripeConfigured}
        <div class="mt-4 rounded-lg bg-muted p-4">
          <p class="text-sm font-medium">{m.billing_settings_stripe_info()}</p>
          <p class="mt-1 text-sm text-muted-foreground">
            {m.billing_settings_stripe_info_desc()}
          </p>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
</div>
