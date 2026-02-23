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

let helloassoEnabled = $state(data.helloasso.helloassoEnabled)
let helloassoSandbox = $state(data.helloasso.helloassoSandbox)
let showClientId = $state(false)
let showClientSecret = $state(false)
let testing = $state(false)
</script>

<svelte:head>
  <title>HelloAsso Settings</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/admin/settings/integrations">
        <Button variant="ghost" size="icon">
          <ArrowLeft class="h-5 w-5" />
        </Button>
      </a>
      <div>
        <h2 class="text-3xl font-bold tracking-tight">HelloAsso</h2>
        <p class="text-muted-foreground">
          Accept payments via HelloAsso for associations (0% commission)
        </p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      {#if data.helloasso.hasClientId && data.helloasso.hasClientSecret && data.helloasso.helloassoEnabled}
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
      <Badge variant={data.helloasso.helloassoSandbox ? 'outline' : 'destructive'}>
        {data.helloasso.helloassoSandbox ? 'Sandbox' : 'Production'}
      </Badge>
    </div>
  </div>

  {#if form?.success && form?.action === 'save'}
    <div
      class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
    >
      <CheckCircle2 class="mr-2 inline h-4 w-4" />
      Settings saved successfully.
    </div>
  {/if}

  {#if form?.success && form?.action === 'test'}
    <div
      class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
    >
      <CheckCircle2 class="mr-2 inline h-4 w-4" />
      {form.message || 'Connection successful!'}
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
      <form method="POST" action="?/save" use:enhance class="space-y-4">
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
              class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700"
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
              class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700"
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
        action="?/test"
        use:enhance={() => {
          testing = true
          return async ({ update }) => {
            testing = false
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
          disabled={!(data.helloasso.hasClientId && data.helloasso.hasClientSecret) || testing}
        >
          {#if testing}
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
