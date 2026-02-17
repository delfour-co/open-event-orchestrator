<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import * as m from '$lib/paraglide/messages'

type Props = {
  form: { error?: string; errors?: Record<string, string> } | null
}

const { form }: Props = $props()
</script>

<svelte:head>
  <title>{m.auth_register_page_title()}</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-muted/50 p-4">
  <Card.Root class="w-full max-w-md">
    <Card.Header class="space-y-1">
      <Card.Title class="text-2xl font-bold">{m.auth_register_title()}</Card.Title>
      <Card.Description>{m.auth_register_description()}</Card.Description>
    </Card.Header>
    <Card.Content>
      <form method="POST" use:enhance class="space-y-4">
        {#if form?.error}
          <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {form.error}
          </div>
        {/if}

        <div class="space-y-2">
          <label for="name" class="text-sm font-medium">{m.auth_register_name()}</label>
          <Input id="name" name="name" type="text" placeholder={m.auth_register_name_placeholder()} required />
          {#if form?.errors?.name}
            <p class="text-sm text-destructive">{form.errors.name}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <label for="email" class="text-sm font-medium">{m.auth_email()}</label>
          <Input id="email" name="email" type="email" placeholder={m.auth_login_email_placeholder()} required />
          {#if form?.errors?.email}
            <p class="text-sm text-destructive">{form.errors.email}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <label for="password" class="text-sm font-medium">{m.auth_password()}</label>
          <Input id="password" name="password" type="password" required />
          {#if form?.errors?.password}
            <p class="text-sm text-destructive">{form.errors.password}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <label for="passwordConfirm" class="text-sm font-medium">{m.auth_register_confirm_password()}</label>
          <Input id="passwordConfirm" name="passwordConfirm" type="password" required />
          {#if form?.errors?.passwordConfirm}
            <p class="text-sm text-destructive">{form.errors.passwordConfirm}</p>
          {/if}
        </div>

        <Button type="submit" class="w-full">{m.auth_register_create_account()}</Button>
      </form>
    </Card.Content>
    <Card.Footer class="flex flex-col space-y-2">
      <p class="text-center text-sm text-muted-foreground">
        {m.auth_register_have_account()}
        <a href="/auth/login" class="text-primary hover:underline">{m.auth_register_sign_in()}</a>
      </p>
    </Card.Footer>
  </Card.Root>
</div>
