<script lang="ts">
import { enhance } from '$app/forms'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as m from '$lib/paraglide/messages'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  HeartHandshake,
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

// Stripe state
let stripeEnabled = $state(data.stripe.stripeEnabled)
let showSecretKey = $state(false)
let showPublishableKey = $state(false)
let showWebhookSecret = $state(false)
let testingStripe = $state(false)

const isStripeActive = $derived(data.stripe.stripeEnabled && data.stripe.isConfigured)

// HelloAsso state
let helloassoEnabled = $state(data.helloasso.helloassoEnabled)
let helloassoSandbox = $state(data.helloasso.helloassoSandbox)
let showClientId = $state(false)
let showClientSecret = $state(false)
let testingHelloAsso = $state(false)

const isHelloAssoActive = $derived(
  data.helloasso.helloassoEnabled && data.helloasso.hasClientId && data.helloasso.hasClientSecret
)
</script>

<div class="space-y-8">
  <div>
    <h3 class="text-lg font-medium">{m.admin_settings_payments_title()}</h3>
    <p class="text-sm text-muted-foreground">{m.admin_settings_payments_description()}</p>
  </div>

  <!-- ==================== STRIPE SECTION ==================== -->
  <div class="space-y-6">
    <h3 class="flex items-center gap-2 text-lg font-semibold">
      <CreditCard class="h-5 w-5" />
      Stripe
    </h3>

    <!-- Status -->
    <Card.Root>
      <Card.Content class="flex items-center justify-between py-4">
        <div class="flex items-center gap-3">
          <div class="h-3 w-3 rounded-full {isStripeActive ? 'bg-green-500' : 'bg-gray-300'}"></div>
          <span class="text-sm font-medium">
            {isStripeActive ? m.admin_settings_status_active() : m.admin_settings_status_inactive()}
          </span>
        </div>
        <div class="flex items-center gap-2">
          {#if data.stripe.isLocalMock}
            <Badge variant="outline" class="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300">
              Local Mock
            </Badge>
          {/if}
          <Badge variant={data.stripe.mode === 'live' ? 'destructive' : 'outline'}>
            {m.admin_stripe_mode_label({ mode: data.stripe.mode === 'live' ? m.admin_stripe_live_mode() : m.admin_stripe_test_mode() })}
          </Badge>
        </div>
      </Card.Content>
    </Card.Root>

    {#if form?.success && form?.action === 'save' && form?.provider === 'stripe'}
      <div
        class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
      >
        <CheckCircle2 class="mr-2 inline h-4 w-4" />
        {m.admin_stripe_saved()}
      </div>
    {/if}

    {#if form?.success && form?.action === 'test' && form?.provider === 'stripe'}
      <div
        class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
      >
        <CheckCircle2 class="mr-2 inline h-4 w-4" />
        {m.admin_stripe_test_success()}
        {#if form.accountId}
          <span class="text-xs opacity-75">(Account: {form.accountId})</span>
        {/if}
      </div>
    {/if}

    {#if form?.error && form?.provider === 'stripe'}
      <div
        class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
      >
        <AlertCircle class="mr-2 inline h-4 w-4" />
        {form.error}
      </div>
    {/if}

    {#if data.stripe.isLocalMock}
      <div
        class="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
      >
        <AlertCircle class="mr-2 inline h-4 w-4" />
        Stripe is pointing to a local mock server. Checkout Sessions are not supported — paid orders will be auto-completed without payment.
        Refunds and other API calls are supported. To use real Stripe Checkout, replace the keys with real <code class="rounded bg-blue-100 px-1 dark:bg-blue-900">sk_test_</code> / <code class="rounded bg-blue-100 px-1 dark:bg-blue-900">pk_test_</code> keys from your Stripe dashboard.
      </div>
    {/if}

    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <CreditCard class="h-5 w-5" />
          {m.admin_stripe_api_keys_title()}
        </Card.Title>
        <Card.Description>
          {m.admin_stripe_api_keys_description()}
          <a
            href="https://dashboard.stripe.com/apikeys"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary underline hover:no-underline"
          >
            {m.admin_stripe_dashboard_link()}
          </a>.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form method="POST" action="?/saveStripe" use:enhance class="space-y-4">
          <!-- Enabled toggle -->
          <div class="flex items-center justify-between rounded-lg border p-4">
            <div>
              <div class="font-medium">{m.admin_stripe_enable()}</div>
              <p class="text-sm text-muted-foreground">
                {m.admin_stripe_enable_hint()}
              </p>
            </div>
            <label class="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" bind:checked={stripeEnabled} class="peer sr-only" />
              <input type="hidden" name="stripeEnabled" value={stripeEnabled ? 'true' : 'false'} />
              <div
                class="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-400 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-600 dark:after:border-gray-500"
              ></div>
            </label>
          </div>

          <div class="space-y-4">
            <!-- Secret Key -->
            <div class="space-y-2">
              <Label for="stripeSecretKey">{m.admin_stripe_secret_key()}</Label>
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
                {m.admin_stripe_secret_key_hint()}
              </p>
            </div>

            <!-- Publishable Key -->
            <div class="space-y-2">
              <Label for="stripePublishableKey">{m.admin_stripe_publishable_key()}</Label>
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
                {m.admin_stripe_publishable_key_hint()}
              </p>
            </div>

            <!-- Webhook Secret -->
            <div class="space-y-2">
              <Label for="stripeWebhookSecret">{m.admin_stripe_webhook_secret()}</Label>
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
                {m.admin_stripe_webhook_secret_hint()}
              </p>
            </div>
          </div>

          {#if data.stripe.hasSecretKey || data.stripe.hasPublishableKey || data.stripe.hasWebhookSecret}
            <p class="text-xs text-muted-foreground">
              {m.admin_stripe_keep_current()}
            </p>
          {/if}

          <div class="flex justify-end">
            <Button type="submit">
              <Check class="mr-2 h-4 w-4" />
              {m.admin_stripe_save()}
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
          {m.admin_stripe_test_title()}
        </Card.Title>
        <Card.Description>
          {m.admin_stripe_test_description()}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form
          method="POST"
          action="?/testStripe"
          use:enhance={() => {
            testingStripe = true
            return async ({ update }) => {
              testingStripe = false
              await update()
            }
          }}
        >
          <input type="hidden" name="stripeSecretKey" value="" />
          <Button type="submit" variant="outline" disabled={!data.stripe.hasSecretKey || testingStripe}>
            {#if testingStripe}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              {m.admin_stripe_testing()}
            {:else}
              <TestTube class="mr-2 h-4 w-4" />
              {m.admin_stripe_test_button()}
            {/if}
          </Button>
          {#if !data.stripe.hasSecretKey}
            <p class="mt-2 text-xs text-muted-foreground">
              {m.admin_stripe_save_first()}
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
          {m.admin_stripe_webhook_title()}
        </Card.Title>
        <Card.Description>
          {m.admin_stripe_webhook_description()}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="rounded-md bg-muted p-3">
          <code class="text-sm">{`${typeof window !== 'undefined' ? window.location.origin : ''}/api/billing/webhook`}</code>
        </div>
        <div class="mt-3 space-y-2 text-sm text-muted-foreground">
          <p>{m.admin_stripe_required_events()}</p>
          <ul class="list-inside list-disc space-y-1">
            <li><code class="rounded bg-muted px-1">checkout.session.completed</code></li>
            <li><code class="rounded bg-muted px-1">checkout.session.expired</code></li>
            <li><code class="rounded bg-muted px-1">charge.refunded</code></li>
          </ul>
        </div>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Separator -->
  <hr class="border-border" />

  <!-- ==================== HELLOASSO SECTION ==================== -->
  <div class="space-y-6">
    <h3 class="flex items-center gap-2 text-lg font-semibold">
      <HeartHandshake class="h-5 w-5" />
      HelloAsso
    </h3>

    <!-- Status -->
    <Card.Root>
      <Card.Content class="flex items-center justify-between py-4">
        <div class="flex items-center gap-3">
          <div class="h-3 w-3 rounded-full {isHelloAssoActive ? 'bg-green-500' : 'bg-gray-300'}"></div>
          <span class="text-sm font-medium">
            {isHelloAssoActive ? m.admin_settings_status_active() : m.admin_settings_status_inactive()}
          </span>
        </div>
        <Badge variant={data.helloasso.helloassoSandbox ? 'outline' : 'destructive'}>
          {data.helloasso.helloassoSandbox ? 'Sandbox' : 'Production'}
        </Badge>
      </Card.Content>
    </Card.Root>

    {#if form?.success && form?.action === 'save' && form?.provider === 'helloasso'}
      <div
        class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
      >
        <CheckCircle2 class="mr-2 inline h-4 w-4" />
        Settings saved successfully.
      </div>
    {/if}

    {#if form?.success && form?.action === 'test' && form?.provider === 'helloasso'}
      <div
        class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
      >
        <CheckCircle2 class="mr-2 inline h-4 w-4" />
        {form.message || 'Connection successful!'}
      </div>
    {/if}

    {#if form?.error && form?.provider === 'helloasso'}
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
          <HeartHandshake class="h-5 w-5" />
          API Credentials
        </Card.Title>
        <Card.Description>
          Get your API credentials from the
          <a
            href="https://admin.helloasso.com/developpeurs"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary underline hover:no-underline"
          >
            HelloAsso developer portal
          </a>.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form method="POST" action="?/saveHelloAsso" use:enhance class="space-y-4">
          <!-- Enabled toggle -->
          <div class="flex items-center justify-between rounded-lg border p-4">
            <div>
              <div class="font-medium">Enable HelloAsso</div>
              <p class="text-sm text-muted-foreground">
                Enable HelloAsso as a payment provider
              </p>
            </div>
            <label class="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" bind:checked={helloassoEnabled} class="peer sr-only" />
              <input type="hidden" name="helloassoEnabled" value={helloassoEnabled ? 'true' : 'false'} />
              <div
                class="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-400 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-600 dark:after:border-gray-500"
              ></div>
            </label>
          </div>

          <!-- Sandbox toggle -->
          <div class="flex items-center justify-between rounded-lg border p-4">
            <div>
              <div class="font-medium">Sandbox Mode</div>
              <p class="text-sm text-muted-foreground">
                Use the HelloAsso sandbox environment for testing
              </p>
            </div>
            <label class="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" bind:checked={helloassoSandbox} class="peer sr-only" />
              <input type="hidden" name="helloassoSandbox" value={helloassoSandbox ? 'true' : 'false'} />
              <div
                class="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-400 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-600 dark:after:border-gray-500"
              ></div>
            </label>
          </div>

          <div class="space-y-4">
            <!-- Client ID -->
            <div class="space-y-2">
              <Label for="helloassoClientId">Client ID</Label>
              <div class="relative">
                <Key
                  class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="helloassoClientId"
                  name="helloassoClientId"
                  type={showClientId ? 'text' : 'password'}
                  placeholder={data.helloasso.hasClientId
                    ? data.helloasso.clientIdMasked
                    : 'Your HelloAsso Client ID'}
                  class="pl-10 pr-10 font-mono text-sm"
                  autocomplete="off"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onclick={() => (showClientId = !showClientId)}
                >
                  {#if showClientId}
                    <EyeOff class="h-4 w-4" />
                  {:else}
                    <Eye class="h-4 w-4" />
                  {/if}
                </button>
              </div>
            </div>

            <!-- Client Secret -->
            <div class="space-y-2">
              <Label for="helloassoClientSecret">Client Secret</Label>
              <div class="relative">
                <Key
                  class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="helloassoClientSecret"
                  name="helloassoClientSecret"
                  type={showClientSecret ? 'text' : 'password'}
                  placeholder={data.helloasso.hasClientSecret
                    ? data.helloasso.clientSecretMasked
                    : 'Your HelloAsso Client Secret'}
                  class="pl-10 pr-10 font-mono text-sm"
                  autocomplete="off"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onclick={() => (showClientSecret = !showClientSecret)}
                >
                  {#if showClientSecret}
                    <EyeOff class="h-4 w-4" />
                  {:else}
                    <Eye class="h-4 w-4" />
                  {/if}
                </button>
              </div>
            </div>

            <!-- Organization Slug -->
            <div class="space-y-2">
              <Label for="helloassoOrgSlug">Organization Slug</Label>
              <Input
                id="helloassoOrgSlug"
                name="helloassoOrgSlug"
                type="text"
                placeholder={data.helloasso.orgSlug || 'your-organization-slug'}
                value={data.helloasso.orgSlug}
                class="font-mono text-sm"
              />
              <p class="text-xs text-muted-foreground">
                The slug from your HelloAsso organization URL (e.g., "my-association" from helloasso.com/associations/my-association)
              </p>
            </div>
          </div>

          {#if data.helloasso.hasClientId || data.helloasso.hasClientSecret}
            <p class="text-xs text-muted-foreground">
              Leave credential fields empty to keep current values.
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
          Test the connection to HelloAsso API with your credentials.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form
          method="POST"
          action="?/testHelloAsso"
          use:enhance={() => {
            testingHelloAsso = true
            return async ({ update }) => {
              testingHelloAsso = false
              await update()
            }
          }}
        >
          <input type="hidden" name="helloassoClientId" value="" />
          <input type="hidden" name="helloassoClientSecret" value="" />
          <input type="hidden" name="helloassoOrgSlug" value="" />
          <input type="hidden" name="helloassoSandbox" value={data.helloasso.helloassoSandbox ? 'true' : 'false'} />
          <Button
            type="submit"
            variant="outline"
            disabled={!(data.helloasso.hasClientId && data.helloasso.hasClientSecret) || testingHelloAsso}
          >
            {#if testingHelloAsso}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              Testing...
            {:else}
              <TestTube class="mr-2 h-4 w-4" />
              Test Connection
            {/if}
          </Button>
          {#if !(data.helloasso.hasClientId && data.helloasso.hasClientSecret)}
            <p class="mt-2 text-xs text-muted-foreground">
              Save your credentials first to test the connection.
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
          Webhook Configuration
        </Card.Title>
        <Card.Description>
          Configure HelloAsso to send notifications to this URL.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="rounded-md bg-muted p-3">
          <code class="text-sm">{`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/helloasso`}</code>
        </div>
        <div class="mt-3 space-y-2 text-sm text-muted-foreground">
          <p>Configure this URL in your HelloAsso organization settings under "Notifications".</p>
          <p>HelloAsso will send Order and Payment events to this endpoint.</p>
        </div>
      </Card.Content>
    </Card.Root>
  </div>
</div>
