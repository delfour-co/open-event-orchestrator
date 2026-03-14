<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import * as m from '$lib/paraglide/messages'
import { ArrowLeft, Mail } from 'lucide-svelte'

type Props = {
  form: { error?: string; success?: boolean } | null
}

const { form }: Props = $props()
</script>

<svelte:head>
  <title>{m.auth_forgot_password_page_title()}</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-muted/50 p-4">
  <Card.Root class="w-full max-w-md">
    <Card.Header class="space-y-1">
      <Card.Title class="text-2xl font-bold">{m.auth_forgot_password_title()}</Card.Title>
      <Card.Description>{m.auth_forgot_password_description()}</Card.Description>
    </Card.Header>
    <Card.Content>
      {#if form?.success}
        <div class="space-y-4">
          <div class="flex items-start gap-3 rounded-md bg-green-50 p-4 dark:bg-green-950/30">
            <Mail class="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
            <p class="text-sm text-green-800 dark:text-green-200">
              {m.auth_forgot_password_success()}
            </p>
          </div>
          <a href="/auth/login" class="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft class="h-4 w-4" />
            {m.auth_forgot_password_back_to_login()}
          </a>
        </div>
      {:else}
        <form method="POST" use:enhance class="space-y-4">
          {#if form?.error}
            <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {form.error}
            </div>
          {/if}

          <div class="space-y-2">
            <label for="email" class="text-sm font-medium">{m.auth_email()}</label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={m.auth_forgot_password_email_placeholder()}
              required
            />
          </div>

          <Button type="submit" class="w-full">{m.auth_forgot_password_submit()}</Button>
        </form>

        <div class="mt-4">
          <a href="/auth/login" class="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft class="h-4 w-4" />
            {m.auth_forgot_password_back_to_login()}
          </a>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
</div>
