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
  Loader2,
  MessageCircle,
  TestTube,
  User,
  Webhook
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let discordEnabled = $state(data.discord.discordEnabled)
let showWebhookUrl = $state(false)
let testing = $state(false)
</script>

<svelte:head>
  <title>Discord Settings - Open Event Orchestrator</title>
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
        <h2 class="text-3xl font-bold tracking-tight">Discord Configuration</h2>
        <p class="text-muted-foreground">
          Configure Discord webhook notifications for your events.
        </p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      {#if data.discord.isConfigured}
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
    </div>
  </div>

  {#if form?.success && form?.action === 'save'}
    <div
      class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
    >
      <CheckCircle2 class="mr-2 inline h-4 w-4" />
      Discord settings saved successfully.
    </div>
  {/if}

  {#if form?.success && form?.action === 'test'}
    <div
      class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
    >
      <CheckCircle2 class="mr-2 inline h-4 w-4" />
      {form.message}
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
        <MessageCircle class="h-5 w-5" />
        Webhook Settings
      </Card.Title>
      <Card.Description>
        Enter your Discord webhook URL. You can create a webhook in your Discord server settings
        under Integrations &gt; Webhooks.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <form method="POST" action="?/save" use:enhance class="space-y-4">
        <!-- Enabled toggle -->
        <div class="flex items-center justify-between rounded-lg border p-4">
          <div>
            <div class="font-medium">Enable Discord</div>
            <p class="text-sm text-muted-foreground">
              When disabled, Discord notifications will not be sent.
            </p>
          </div>
          <label class="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" bind:checked={discordEnabled} class="peer sr-only" />
            <input type="hidden" name="discordEnabled" value={discordEnabled ? 'true' : 'false'} />
            <div
              class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700"
            ></div>
          </label>
        </div>

        <div class="space-y-4">
          <!-- Webhook URL -->
          <div class="space-y-2">
            <Label for="discordWebhookUrl">Webhook URL</Label>
            <div class="relative">
              <Webhook
                class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="discordWebhookUrl"
                name="discordWebhookUrl"
                type={showWebhookUrl ? 'text' : 'password'}
                placeholder={data.discord.hasWebhookUrl
                  ? data.discord.webhookUrlMasked
                  : 'https://discord.com/api/webhooks/...'}
                class="pl-10 pr-10 font-mono text-sm"
                autocomplete="off"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onclick={() => (showWebhookUrl = !showWebhookUrl)}
              >
                {#if showWebhookUrl}
                  <EyeOff class="h-4 w-4" />
                {:else}
                  <Eye class="h-4 w-4" />
                {/if}
              </button>
            </div>
            <p class="text-xs text-muted-foreground">
              Format: <code class="rounded bg-muted px-1"
                >https://discord.com/api/webhooks/ID/TOKEN</code
              >
            </p>
          </div>

          <!-- Bot Username -->
          <div class="space-y-2">
            <Label for="discordUsername">Bot Username (optional)</Label>
            <div class="relative">
              <User
                class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="discordUsername"
                name="discordUsername"
                type="text"
                value={data.discord.discordUsername}
                placeholder="Open Event Orchestrator"
                class="pl-10"
              />
            </div>
            <p class="text-xs text-muted-foreground">
              The display name for notifications in Discord. Leave empty for default.
            </p>
          </div>
        </div>

        {#if data.discord.hasWebhookUrl}
          <p class="text-xs text-muted-foreground">
            Leave webhook URL field empty to keep the current value.
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
        Send a test message to verify your Discord webhook is working correctly.
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
        <Button type="submit" variant="outline" disabled={!data.discord.hasWebhookUrl || testing}>
          {#if testing}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            Testing...
          {:else}
            <TestTube class="mr-2 h-4 w-4" />
            Send Test Message
          {/if}
        </Button>
        {#if !data.discord.hasWebhookUrl}
          <p class="mt-2 text-xs text-muted-foreground">
            Save a webhook URL first to test the connection.
          </p>
        {/if}
      </form>
    </Card.Content>
  </Card.Root>

  <!-- Setup Instructions -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <MessageCircle class="h-5 w-5" />
        How to Create a Discord Webhook
      </Card.Title>
    </Card.Header>
    <Card.Content>
      <ol class="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
        <li>Open your Discord server and go to <strong>Server Settings</strong></li>
        <li>Navigate to <strong>Integrations</strong> &gt; <strong>Webhooks</strong></li>
        <li>Click <strong>New Webhook</strong> or select an existing one</li>
        <li>Choose the channel where you want notifications to appear</li>
        <li>Click <strong>Copy Webhook URL</strong> and paste it above</li>
      </ol>
      <div class="mt-4 rounded-md bg-muted p-3 text-sm">
        <strong>Note:</strong> Discord webhooks are specific to a channel. Create separate webhooks
        for different notification channels if needed.
      </div>
    </Card.Content>
  </Card.Root>
</div>
