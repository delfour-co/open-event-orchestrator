<script lang="ts">
import { enhance } from '$app/forms'
import { PasswordStrengthIndicator } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import * as m from '$lib/paraglide/messages'

import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let password = $state('')
</script>

<svelte:head>
  <title>{m.auth_reset_password_page_title()}</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-muted/50 p-4">
  <Card.Root class="w-full max-w-md">
    <Card.Header class="space-y-1">
      <Card.Title class="text-2xl font-bold">{m.auth_reset_password_title()}</Card.Title>
      <Card.Description>{m.auth_reset_password_description()}</Card.Description>
    </Card.Header>
    <Card.Content>
      {#if data.error}
        <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {m.auth_reset_password_error_invalid_token()}
        </div>
        <div class="mt-4 text-center">
          <a href="/auth/forgot-password" class="text-primary hover:underline">{m.auth_forgot_password_title()}</a>
        </div>
      {:else}
      <form method="POST" use:enhance class="space-y-4">
        {#if form?.error === 'invalid_token'}
          <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {m.auth_reset_password_error_invalid_token()}
          </div>
        {/if}

        <div class="space-y-2">
          <label for="password" class="text-sm font-medium">{m.auth_reset_password_new_password()}</label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            bind:value={password}
          />
          <PasswordStrengthIndicator {password} />
          {#if form?.errors?.password}
            <p class="text-sm text-destructive">{form.errors.password}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <label for="passwordConfirm" class="text-sm font-medium">{m.auth_reset_password_confirm_password()}</label>
          <Input id="passwordConfirm" name="passwordConfirm" type="password" required />
          {#if form?.errors?.passwordConfirm}
            <p class="text-sm text-destructive">{form.errors.passwordConfirm}</p>
          {/if}
        </div>

        <Button type="submit" class="w-full">{m.auth_reset_password_submit()}</Button>
      </form>
      {/if}
    </Card.Content>
    <Card.Footer class="flex flex-col space-y-2">
      <p class="text-center text-sm text-muted-foreground">
        <a href="/auth/login" class="text-primary hover:underline">{m.auth_forgot_password_back_to_login()}</a>
      </p>
    </Card.Footer>
  </Card.Root>
</div>
