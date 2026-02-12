<script lang="ts">
import { enhance } from '$app/forms'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Key,
  Loader2,
  TestTube,
  Webhook
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let stripeEnabled = $state(data.stripe.stripeEnabled)
let showSecretKey = $state(false)
let showPublishableKey = $state(false)
let showWebhookSecret = $state(false)
let testing = $state(false)
</script>

<svelte:head>
  <title>Stripe Settings - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center gap-4">
    <a href="/admin/settings/integrations">
      <Button variant="ghost" size="sm">
        <ArrowLeft class="mr-2 h-4 w-4" />
        Back to Integrations
      </Button>
    </a>
  </div>

  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">Stripe Configuration</h2>
      <p class="text-muted-foreground">
        Configure Stripe for payment processing and ticket sales.
      </p>
    </div>
    <div class="flex items-center gap-2">
      {#if data.stripe.isConfigured}
        <Badge variant="default">
          <CheckCircle2 class="mr-1 h-3 w-3" />
          Configured
        </Badge>
      {:else}
        <Badge variant="secondary">
          <AlertCircle class="mr-1 h-3 w-3" />
          Not configured
        </Badge>
      {/if}
      <Badge variant={data.stripe.mode === 'live' ? 'destructive' : 'outline'}>
        {data.stripe.mode === 'live' ? 'LIVE' : 'TEST'} mode
      </Badge>
    </div>
  </div>

  {#if form?.success && form?.action === 'save'}
    <div
      class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
    >
      <CheckCircle2 class="mr-2 inline h-4 w-4" />
      Stripe settings saved successfully.
    </div>
  {/if}

  {#if form?.success && form?.action === 'test'}
    <div
      class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
    >
      <CheckCircle2 class="mr-2 inline h-4 w-4" />
      {form.message}
      {#if form.accountId}
        <span class="text-xs opacity-75">(Account: {form.accountId})</span>
      {/if}
    </div>
  {/if}

  {#if form?.error}
    <div
      class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
    >
      <AlertCircle class="mr-2 inline h-4 w-4" />
      {form.error}
    </div>
  {/if}

  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <CreditCard class="h-5 w-5" />
        API Keys
      </Card.Title>
      <Card.Description>
        Enter your Stripe API keys. You can find them in the
        <a
          href="https://dashboard.stripe.com/apikeys"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline hover:no-underline"
        >
          Stripe Dashboard
        </a>.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <form method="POST" action="?/save" use:enhance class="space-y-4">
        <!-- Enabled toggle -->
        <div class="flex items-center justify-between rounded-lg border p-4">
          <div>
            <div class="font-medium">Enable Stripe</div>
            <p class="text-sm text-muted-foreground">
              When disabled, ticket purchases and payment processing will be unavailable.
            </p>
          </div>
          <label class="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" bind:checked={stripeEnabled} class="peer sr-only" />
            <input type="hidden" name="stripeEnabled" value={stripeEnabled ? 'true' : 'false'} />
            <div
              class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700"
            ></div>
          </label>
        </div>

        <div class="space-y-4">
          <!-- Secret Key -->
          <div class="space-y-2">
            <Label for="stripeSecretKey">Secret Key</Label>
            <div class="relative">
              <Key
                class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="stripeSecretKey"
                name="stripeSecretKey"
                type={showSecretKey ? 'text' : 'password'}
                placeholder={data.stripe.hasSecretKey
                  ? data.stripe.secretKeyMasked
                  : 'sk_test_...'}
                class="pl-10 pr-10 font-mono text-sm"
                autocomplete="off"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onclick={() => (showSecretKey = !showSecretKey)}
              >
                {#if showSecretKey}
                  <EyeOff class="h-4 w-4" />
                {:else}
                  <Eye class="h-4 w-4" />
                {/if}
              </button>
            </div>
            <p class="text-xs text-muted-foreground">
              Starts with <code class="rounded bg-muted px-1">sk_test_</code> or
              <code class="rounded bg-muted px-1">sk_live_</code>
            </p>
          </div>

          <!-- Publishable Key -->
          <div class="space-y-2">
            <Label for="stripePublishableKey">Publishable Key</Label>
            <div class="relative">
              <Key
                class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="stripePublishableKey"
                name="stripePublishableKey"
                type={showPublishableKey ? 'text' : 'password'}
                placeholder={data.stripe.hasPublishableKey
                  ? data.stripe.publishableKeyMasked
                  : 'pk_test_...'}
                class="pl-10 pr-10 font-mono text-sm"
                autocomplete="off"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onclick={() => (showPublishableKey = !showPublishableKey)}
              >
                {#if showPublishableKey}
                  <EyeOff class="h-4 w-4" />
                {:else}
                  <Eye class="h-4 w-4" />
                {/if}
              </button>
            </div>
            <p class="text-xs text-muted-foreground">
              Starts with <code class="rounded bg-muted px-1">pk_test_</code> or
              <code class="rounded bg-muted px-1">pk_live_</code>
            </p>
          </div>

          <!-- Webhook Secret -->
          <div class="space-y-2">
            <Label for="stripeWebhookSecret">Webhook Secret</Label>
            <div class="relative">
              <Webhook
                class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="stripeWebhookSecret"
                name="stripeWebhookSecret"
                type={showWebhookSecret ? 'text' : 'password'}
                placeholder={data.stripe.hasWebhookSecret
                  ? data.stripe.webhookSecretMasked
                  : 'whsec_...'}
                class="pl-10 pr-10 font-mono text-sm"
                autocomplete="off"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onclick={() => (showWebhookSecret = !showWebhookSecret)}
              >
                {#if showWebhookSecret}
                  <EyeOff class="h-4 w-4" />
                {:else}
                  <Eye class="h-4 w-4" />
                {/if}
              </button>
            </div>
            <p class="text-xs text-muted-foreground">
              Found in your webhook endpoint settings. Starts with
              <code class="rounded bg-muted px-1">whsec_</code>
            </p>
          </div>
        </div>

        {#if data.stripe.hasSecretKey || data.stripe.hasPublishableKey || data.stripe.hasWebhookSecret}
          <p class="text-xs text-muted-foreground">
            Leave fields empty to keep current values.
          </p>
        {/if}

        <div class="flex justify-end">
          <Button type="submit">
            <Check class="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </form>
    </Card.Content>
  </Card.Root>

  <!-- Test Connection -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <TestTube class="h-5 w-5" />
        Test Connection
      </Card.Title>
      <Card.Description>
        Verify your Stripe API credentials by testing the connection.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <form
        method="POST"
        action="?/test"
        use:enhance={() => {
          testing = true
          return async ({ update }) => {
            testing = false
            await update()
          }
        }}
      >
        <input type="hidden" name="stripeSecretKey" value="" />
        <Button type="submit" variant="outline" disabled={!data.stripe.hasSecretKey || testing}>
          {#if testing}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            Testing...
          {:else}
            <TestTube class="mr-2 h-4 w-4" />
            Test Connection
          {/if}
        </Button>
        {#if !data.stripe.hasSecretKey}
          <p class="mt-2 text-xs text-muted-foreground">
            Save a secret key first to test the connection.
          </p>
        {/if}
      </form>
    </Card.Content>
  </Card.Root>

  <!-- Webhook URL Info -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <Webhook class="h-5 w-5" />
        Webhook Endpoint
      </Card.Title>
      <Card.Description>
        Configure this URL in your Stripe dashboard to receive payment events.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="rounded-md bg-muted p-3">
        <code class="text-sm">{`${typeof window !== 'undefined' ? window.location.origin : ''}/api/billing/webhook`}</code>
      </div>
      <div class="mt-3 space-y-2 text-sm text-muted-foreground">
        <p>Required events to listen for:</p>
        <ul class="list-inside list-disc space-y-1">
          <li><code class="rounded bg-muted px-1">checkout.session.completed</code></li>
          <li><code class="rounded bg-muted px-1">checkout.session.expired</code></li>
          <li><code class="rounded bg-muted px-1">charge.refunded</code></li>
        </ul>
      </div>
    </Card.Content>
  </Card.Root>
</div>
