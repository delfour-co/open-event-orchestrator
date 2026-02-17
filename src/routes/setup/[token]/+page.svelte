<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Building2, CheckCircle2, Lock, Mail } from 'lucide-svelte'

type Props = {
  form: {
    error?: string
    errors?: Record<string, string>
    values?: { email?: string; organizationName?: string }
  } | null
}

const { form }: Props = $props()

let isSubmitting = $state(false)
</script>

<svelte:head>
  <title>Initial Setup - Open Event Orchestrator</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
  <div class="w-full max-w-lg space-y-6">
    <div class="text-center space-y-2">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
        <CheckCircle2 class="w-8 h-8 text-primary" />
      </div>
      <h1 class="text-3xl font-bold tracking-tight">Welcome to Open Event Orchestrator</h1>
      <p class="text-muted-foreground">
        Complete the initial setup to create your admin account and organization
      </p>
    </div>

    <Card.Root class="shadow-lg">
      <Card.Header class="space-y-1 pb-4">
        <Card.Title class="text-xl">Initial Setup</Card.Title>
        <Card.Description>
          This setup wizard will only appear once. Make sure to save your credentials.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form
          method="POST"
          use:enhance={() => {
            isSubmitting = true
            return async ({ update }) => {
              await update()
              isSubmitting = false
            }
          }}
          class="space-y-6"
        >
          {#if form?.error}
            <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {form.error}
            </div>
          {/if}

          <div class="space-y-4">
            <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Building2 class="w-4 h-4" />
              <span>Organization</span>
            </div>

            <div class="space-y-2">
              <label for="organizationName" class="text-sm font-medium">Organization Name</label>
              <Input
                id="organizationName"
                name="organizationName"
                type="text"
                placeholder="My Conference Organization"
                value={form?.values?.organizationName ?? ''}
                required
                disabled={isSubmitting}
              />
              {#if form?.errors?.organizationName}
                <p class="text-sm text-destructive">{form.errors.organizationName}</p>
              {/if}
              <p class="text-xs text-muted-foreground">
                This will be the name of your main organization managing events
              </p>
            </div>
          </div>

          <div class="border-t pt-6 space-y-4">
            <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Mail class="w-4 h-4" />
              <span>Admin Account</span>
            </div>

            <div class="space-y-2">
              <label for="email" class="text-sm font-medium">Email</label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                value={form?.values?.email ?? ''}
                required
                disabled={isSubmitting}
              />
              {#if form?.errors?.email}
                <p class="text-sm text-destructive">{form.errors.email}</p>
              {/if}
            </div>

            <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Lock class="w-4 h-4" />
              <span>Password</span>
            </div>

            <div class="space-y-2">
              <label for="password" class="text-sm font-medium">Password</label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={isSubmitting}
              />
              {#if form?.errors?.password}
                <p class="text-sm text-destructive">{form.errors.password}</p>
              {/if}
              <p class="text-xs text-muted-foreground">
                Minimum 8 characters
              </p>
            </div>

            <div class="space-y-2">
              <label for="passwordConfirm" class="text-sm font-medium">Confirm Password</label>
              <Input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                required
                disabled={isSubmitting}
              />
              {#if form?.errors?.passwordConfirm}
                <p class="text-sm text-destructive">{form.errors.passwordConfirm}</p>
              {/if}
            </div>
          </div>

          <Button type="submit" class="w-full" disabled={isSubmitting}>
            {#if isSubmitting}
              Setting up...
            {:else}
              Complete Setup
            {/if}
          </Button>
        </form>
      </Card.Content>
    </Card.Root>

    <p class="text-center text-sm text-muted-foreground">
      This link will expire in 24 hours. If expired, restart the server to generate a new link.
    </p>
  </div>
</div>
