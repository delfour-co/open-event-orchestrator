<script lang="ts">
import { enhance } from '$app/forms'
import { page } from '$app/stores'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import * as m from '$lib/paraglide/messages'

type Props = {
  form: { error?: string } | null
}

const { form }: Props = $props()

// Get redirect URL from query params
const redirectUrl = $derived($page.url.searchParams.get('redirect'))
</script>

<svelte:head>
  <title>{m.auth_login_page_title()}</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-muted/50 p-4">
  <Card.Root class="w-full max-w-md">
    <Card.Header class="space-y-1">
      <Card.Title class="text-2xl font-bold">{m.auth_login_welcome()}</Card.Title>
      <Card.Description>{m.auth_login_description()}</Card.Description>
    </Card.Header>
    <Card.Content>
      <form method="POST" use:enhance class="space-y-4">
        {#if redirectUrl}
          <input type="hidden" name="redirect" value={redirectUrl} />
        {/if}
        {#if form?.error}
          <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {form.error}
          </div>
        {/if}

        <div class="space-y-2">
          <label for="email" class="text-sm font-medium">{m.auth_email()}</label>
          <Input id="email" name="email" type="email" placeholder={m.auth_login_email_placeholder()} required />
        </div>

        <div class="space-y-2">
          <label for="password" class="text-sm font-medium">{m.auth_password()}</label>
          <Input id="password" name="password" type="password" required />
        </div>

        <Button type="submit" class="w-full">{m.auth_login_sign_in()}</Button>
      </form>
    </Card.Content>
    <Card.Footer class="flex flex-col space-y-2">
      <p class="text-center text-sm text-muted-foreground">
        {m.auth_login_no_account()}
        <a href="/auth/register" class="text-primary hover:underline">{m.auth_login_sign_up()}</a>
      </p>
    </Card.Footer>
  </Card.Root>
</div>
