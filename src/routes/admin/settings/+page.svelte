<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as m from '$lib/paraglide/messages'
import { ArrowRight, Check, Eye, EyeOff, Mail, Plug, Send, Server } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showPassword = $state(false)
let testEmailAddress = $state('')
let smtpEnabled = $state(data.smtp.smtpEnabled)
</script>

<svelte:head>
  <title>{m.admin_settings_title()}</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">{m.admin_settings_heading()}</h2>
      <p class="text-muted-foreground">{m.admin_settings_description()}</p>
    </div>
<a href="/admin/settings/integrations">
      <Button variant="outline">
        <Plug class="mr-2 h-4 w-4" />
        {m.admin_settings_view_integrations()}
        <ArrowRight class="ml-2 h-4 w-4" />
      </Button>
    </a>
  </div>

  {#if form?.success && form?.action === 'saveSmtp'}
    <div
      class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
    >
      {m.admin_settings_smtp_saved()}
    </div>
  {/if}

  {#if form?.success && form?.action === 'testEmail'}
    <div
      class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
    >
      {m.admin_settings_test_email_sent()}
    </div>
  {/if}

  {#if form?.error}
    <div
      class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
    >
      {form.error}
    </div>
  {/if}

  <!-- SMTP Configuration -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <Mail class="h-5 w-5" />
        {m.admin_settings_smtp_title()}
      </Card.Title>
      <Card.Description>
        {m.admin_settings_smtp_description()}
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <form method="POST" action="?/saveSmtp" use:enhance class="space-y-4">
        <!-- Enabled toggle -->
        <div class="flex items-center justify-between rounded-lg border p-4">
          <div>
            <div class="font-medium">{m.admin_settings_enable_smtp()}</div>
            <p class="text-sm text-muted-foreground">
              {m.admin_settings_smtp_disabled_hint()}
            </p>
          </div>
          <label class="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              bind:checked={smtpEnabled}
              class="peer sr-only"
            />
            <input type="hidden" name="smtpEnabled" value={smtpEnabled ? 'true' : 'false'} />
            <div
              class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700"
            ></div>
          </label>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <!-- Host -->
          <div class="space-y-2">
            <Label for="smtpHost">{m.admin_settings_smtp_host()}</Label>
            <div class="relative">
              <Server class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="smtpHost"
                name="smtpHost"
                placeholder="smtp.example.com"
                value={data.smtp.smtpHost}
                class="pl-10"
              />
            </div>
          </div>

          <!-- Port -->
          <div class="space-y-2">
            <Label for="smtpPort">{m.admin_settings_smtp_port()}</Label>
            <Input
              id="smtpPort"
              name="smtpPort"
              type="number"
              placeholder="587"
              value={String(data.smtp.smtpPort)}
              min="1"
              max="65535"
            />
            <p class="text-xs text-muted-foreground">
              {m.admin_settings_smtp_port_hint()}
            </p>
          </div>

          <!-- Username -->
          <div class="space-y-2">
            <Label for="smtpUser">{m.admin_settings_smtp_username()}</Label>
            <Input
              id="smtpUser"
              name="smtpUser"
              placeholder="optional"
              value={data.smtp.smtpUser}
              autocomplete="off"
            />
          </div>

          <!-- Password -->
          <div class="space-y-2">
            <Label for="smtpPass">{m.admin_settings_smtp_password()}</Label>
            <div class="relative">
              <Input
                id="smtpPass"
                name="smtpPass"
                type={showPassword ? 'text' : 'password'}
                placeholder={data.smtp.hasPassword ? m.admin_settings_smtp_password_unchanged() : 'optional'}
                autocomplete="new-password"
                class="pr-10"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onclick={() => (showPassword = !showPassword)}
              >
                {#if showPassword}
                  <EyeOff class="h-4 w-4" />
                {:else}
                  <Eye class="h-4 w-4" />
                {/if}
              </button>
            </div>
            {#if data.smtp.hasPassword}
              <p class="text-xs text-muted-foreground">{m.admin_settings_smtp_password_keep()}</p>
            {/if}
          </div>
        </div>

        <!-- From Address -->
        <div class="space-y-2">
          <Label for="smtpFrom">{m.admin_settings_smtp_from()}</Label>
          <div class="relative">
            <Mail class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="smtpFrom"
              name="smtpFrom"
              type="email"
              placeholder="noreply@example.com"
              value={data.smtp.smtpFrom}
              class="pl-10"
            />
          </div>
          <p class="text-xs text-muted-foreground">
            {m.admin_settings_smtp_from_hint()}
          </p>
        </div>

        <div class="flex justify-end">
          <Button type="submit">
            <Check class="mr-2 h-4 w-4" />
            {m.admin_settings_save_smtp()}
          </Button>
        </div>
      </form>
    </Card.Content>
  </Card.Root>

  <!-- Test Email -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <Send class="h-5 w-5" />
        {m.admin_settings_test_email_title()}
      </Card.Title>
      <Card.Description>
        {m.admin_settings_test_email_description()}
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <form method="POST" action="?/testEmail" use:enhance class="flex items-end gap-3">
        <div class="flex-1 space-y-2">
          <Label for="testTo">{m.admin_settings_recipient_email()}</Label>
          <Input
            id="testTo"
            name="testTo"
            type="email"
            placeholder="your@email.com"
            bind:value={testEmailAddress}
          />
        </div>
        <Button type="submit" variant="outline" disabled={!testEmailAddress}>
          <Send class="mr-2 h-4 w-4" />
          {m.admin_settings_send_test()}
        </Button>
      </form>
    </Card.Content>
  </Card.Root>
</div>
