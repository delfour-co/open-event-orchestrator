<script lang="ts">
import { enhance } from '$app/forms'
import { page } from '$app/stores'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'

type Props = {
  form: { error?: string } | null
}

const { form }: Props = $props()

// Get redirect URL from query params
const redirectUrl = $derived($page.url.searchParams.get('redirect'))
</script>

<svelte:head>
  <title>Login - Open Event Orchestrator</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-muted/50 p-4">
  <Card.Root class="w-full max-w-md">
    <Card.Header class="space-y-1">
      <Card.Title class="text-2xl font-bold">Welcome back</Card.Title>
      <Card.Description>Enter your credentials to access your account</Card.Description>
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
          <label for="email" class="text-sm font-medium">Email</label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required />
        </div>

        <div class="space-y-2">
          <label for="password" class="text-sm font-medium">Password</label>
          <Input id="password" name="password" type="password" required />
        </div>

        <Button type="submit" class="w-full">Sign in</Button>
      </form>
    </Card.Content>
    <Card.Footer class="flex flex-col space-y-2">
      <p class="text-center text-sm text-muted-foreground">
        Don't have an account?
        <a href="/auth/register" class="text-primary hover:underline">Sign up</a>
      </p>
    </Card.Footer>
  </Card.Root>
</div>
