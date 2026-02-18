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
  <title>{m.admin_discord_title()}</title>
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
        <h2 class="text-3xl font-bold tracking-tight">{m.admin_discord_heading()}</h2>
        <p class="text-muted-foreground">
          {m.admin_discord_description()}
        </p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      {#if data.discord.isConfigured}
        <Badge variant="default">
          <CheckCircle2 class="mr-1 h-3 w-3" />
          {m.admin_discord_configured()}
        </Badge>
      {:else}
        <Badge variant="secondary">
          <AlertCircle class="mr-1 h-3 w-3" />
          {m.admin_discord_not_configured()}
        </Badge>
      {/if}
    </div>
  </div>

  {#if form?.success && form?.action === 'save'}
    <div
      class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
    >
      <CheckCircle2 class="mr-2 inline h-4 w-4" />
      {m.admin_discord_saved()}
    </div>
  {/if}

  {#if form?.success && form?.action === 'test'}
    <div
      class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
    >
      <CheckCircle2 class="mr-2 inline h-4 w-4" />
      {m.admin_discord_test_success()}
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
        {m.admin_discord_webhook_title()}
      </Card.Title>
      <Card.Description>
        {m.admin_discord_webhook_description()}
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <form method="POST" action="?/save" use:enhance class="space-y-4">
        <!-- Enabled toggle -->
        <div class="flex items-center justify-between rounded-lg border p-4">
          <div>
            <div class="font-medium">{m.admin_discord_enable()}</div>
            <p class="text-sm text-muted-foreground">
              {m.admin_discord_enable_hint()}
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
            <Label for="discordWebhookUrl">{m.admin_discord_webhook_url()}</Label>
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
              {m.admin_discord_webhook_url_hint()}
            </p>
          </div>

          <!-- Bot Username -->
          <div class="space-y-2">
            <Label for="discordUsername">{m.admin_discord_bot_username()}</Label>
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
              {m.admin_discord_bot_username_hint()}
            </p>
          </div>
        </div>

        {#if data.discord.hasWebhookUrl}
          <p class="text-xs text-muted-foreground">
            {m.admin_discord_keep_current()}
          </p>
        {/if}

        <div class="flex justify-end">
          <Button type="submit">
            <Check class="mr-2 h-4 w-4" />
            {m.admin_discord_save()}
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
        {m.admin_discord_test_title()}
      </Card.Title>
      <Card.Description>
        {m.admin_discord_test_description()}
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
            {m.admin_discord_testing()}
          {:else}
            <TestTube class="mr-2 h-4 w-4" />
            {m.admin_discord_test_button()}
          {/if}
        </Button>
        {#if !data.discord.hasWebhookUrl}
          <p class="mt-2 text-xs text-muted-foreground">
            {m.admin_discord_save_first()}
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
        {m.admin_discord_setup_title()}
      </Card.Title>
    </Card.Header>
    <Card.Content>
      <ol class="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
        <li>{m.admin_discord_setup_step1()}</li>
        <li>{m.admin_discord_setup_step2()}</li>
        <li>{m.admin_discord_setup_step3()}</li>
        <li>{m.admin_discord_setup_step4()}</li>
        <li>{m.admin_discord_setup_step5()}</li>
      </ol>
      <div class="mt-4 rounded-md bg-muted p-3 text-sm">
        {m.admin_discord_setup_note()}
      </div>
    </Card.Content>
  </Card.Root>
</div>
