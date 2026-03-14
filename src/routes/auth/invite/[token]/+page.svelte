<script lang="ts">
import { enhance } from '$app/forms'
import { PasswordStrengthIndicator } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as m from '$lib/paraglide/messages'
import { Building2, LogIn, UserPlus } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let password = $state('')
</script>

<svelte:head>
  <title>{m.invitation_landing_title()}</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-muted/50 p-4">
  <Card.Root class="w-full max-w-md">
    <Card.Header class="text-center">
      {#if data.logoUrl}
        <div class="mx-auto mb-4 flex h-16 items-center justify-center">
          <img
            src={data.logoUrl}
            alt={data.organizationName}
            class="max-h-16 max-w-48 object-contain"
          />
        </div>
      {:else}
        <div
          class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
        >
          <Building2 class="h-8 w-8 text-primary" />
        </div>
      {/if}
      <Card.Title class="text-2xl">{m.invitation_landing_heading()}</Card.Title>
      <Card.Description>
        {m.invitation_landing_description({
          organization: data.organizationName,
          role: data.role
        })}
      </Card.Description>
    </Card.Header>
    <Card.Content class="space-y-4">
      <div class="rounded-lg border bg-muted/50 p-4 text-center">
        <p class="text-sm text-muted-foreground">{m.invitation_landing_invited_as()}</p>
        <p class="mt-1 text-lg font-semibold capitalize">{data.role}</p>
        <p class="text-sm text-muted-foreground">
          {m.invitation_landing_at_org({ organization: data.organizationName })}
        </p>
      </div>

      {#if form?.error}
        <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {form.error}
        </div>
      {/if}

      {#if data.userExists}
        <!-- User exists: just login to accept -->
        <form method="POST" use:enhance class="space-y-4">
          <input type="hidden" name="mode" value="login" />
          <input type="hidden" name="email" value={data.email} />

          <div class="space-y-2">
            <Label for="email">{m.auth_email()}</Label>
            <Input id="email" type="email" value={data.email} disabled class="bg-muted" />
          </div>

          <div class="space-y-2">
            <Label for="password">{m.auth_password()}</Label>
            <Input id="password" name="password" type="password" required autocomplete="current-password" />
          </div>

          <Button type="submit" class="w-full" size="lg">
            <LogIn class="mr-2 h-5 w-5" />
            {m.invitation_landing_accept()}
          </Button>
        </form>
      {:else}
        <!-- New user: create account to accept -->
        <form method="POST" use:enhance class="space-y-4">
          <input type="hidden" name="mode" value="register" />
          <input type="hidden" name="email" value={data.email} />

          <div class="space-y-2">
            <Label for="email">{m.auth_email()}</Label>
            <Input id="email" type="email" value={data.email} disabled class="bg-muted" />
          </div>

          <div class="space-y-2">
            <Label for="name">{m.profile_name()}</Label>
            <Input id="name" name="name" type="text" required placeholder="John Doe" />
          </div>

          <div class="space-y-2">
            <Label for="password">{m.auth_password()}</Label>
            <Input id="password" name="password" type="password" required autocomplete="new-password" bind:value={password} />
            <PasswordStrengthIndicator {password} />
          </div>

          <div class="space-y-2">
            <Label for="passwordConfirm">{m.auth_reset_password_confirm_password()}</Label>
            <Input id="passwordConfirm" name="passwordConfirm" type="password" required autocomplete="new-password" />
          </div>

          <Button type="submit" class="w-full" size="lg">
            <UserPlus class="mr-2 h-5 w-5" />
            {m.invitation_landing_accept()}
          </Button>
        </form>
      {/if}
    </Card.Content>
    <Card.Footer class="flex flex-col space-y-2">
      <p class="text-center text-sm text-muted-foreground">
        {#if data.userExists}
          <a href="/auth/forgot-password" class="text-primary hover:underline">{m.auth_forgot_password_link()}</a>
        {:else}
          {m.auth_login_no_account()}
          <a href="/auth/login?redirect=/auth/invite/{data.token}" class="text-primary hover:underline">{m.auth_login_sign_in()}</a>
        {/if}
      </p>
    </Card.Footer>
  </Card.Root>
</div>
