<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Check, Eye, EyeOff, Mail, Send, Server } from 'lucide-svelte'
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
  <title>Settings - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h2 class="text-3xl font-bold tracking-tight">Settings</h2>
    <p class="text-muted-foreground">Global application configuration</p>
  </div>

  {#if form?.success && form?.action === 'saveSmtp'}
    <div
      class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
    >
      SMTP settings saved successfully.
    </div>
  {/if}

  {#if form?.success && form?.action === 'testEmail'}
    <div
      class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
    >
      Test email sent successfully.
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
        Email (SMTP)
      </Card.Title>
      <Card.Description>
        Configure the SMTP server used to send emails (invitations, order confirmations, notifications).
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <form method="POST" action="?/saveSmtp" use:enhance class="space-y-4">
        <!-- Enabled toggle -->
        <div class="flex items-center justify-between rounded-lg border p-4">
          <div>
            <div class="font-medium">Enable SMTP</div>
            <p class="text-sm text-muted-foreground">
              When disabled, emails will be logged to the console instead of being sent.
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
            <Label for="smtpHost">SMTP Host</Label>
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
            <Label for="smtpPort">Port</Label>
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
              Common ports: 25, 465 (SSL), 587 (TLS), 1025 (Mailpit)
            </p>
          </div>

          <!-- Username -->
          <div class="space-y-2">
            <Label for="smtpUser">Username</Label>
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
            <Label for="smtpPass">Password</Label>
            <div class="relative">
              <Input
                id="smtpPass"
                name="smtpPass"
                type={showPassword ? 'text' : 'password'}
                placeholder={data.smtp.hasPassword ? '(unchanged)' : 'optional'}
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
              <p class="text-xs text-muted-foreground">Leave empty to keep current password.</p>
            {/if}
          </div>
        </div>

        <!-- From Address -->
        <div class="space-y-2">
          <Label for="smtpFrom">From Address</Label>
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
            The sender address displayed in outgoing emails.
          </p>
        </div>

        <div class="flex justify-end">
          <Button type="submit">
            <Check class="mr-2 h-4 w-4" />
            Save SMTP Settings
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
        Send Test Email
      </Card.Title>
      <Card.Description>
        Verify your SMTP configuration by sending a test email.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <form method="POST" action="?/testEmail" use:enhance class="flex items-end gap-3">
        <div class="flex-1 space-y-2">
          <Label for="testTo">Recipient Email</Label>
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
          Send Test
        </Button>
      </form>
    </Card.Content>
  </Card.Root>
</div>
