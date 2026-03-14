<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as m from '$lib/paraglide/messages'
import { ShieldCheck } from 'lucide-svelte'
import type { ActionData } from './$types'

interface Props {
  form: ActionData
}

const { form }: Props = $props()
</script>

<svelte:head>
  <title>{m.auth_2fa_verify_title()}</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-muted/50 p-4">
  <Card.Root class="w-full max-w-md">
    <Card.Header class="text-center">
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <ShieldCheck class="h-8 w-8 text-primary" />
      </div>
      <Card.Title class="text-2xl">{m.auth_2fa_verify_heading()}</Card.Title>
      <Card.Description>{m.auth_2fa_verify_description()}</Card.Description>
    </Card.Header>
    <Card.Content>
      <form method="POST" use:enhance class="space-y-4">
        {#if form?.error}
          <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {form.error}
          </div>
        {/if}

        <div class="space-y-2">
          <Label for="code">{m.auth_2fa_code_label()}</Label>
          <Input
            id="code"
            name="code"
            type="text"
            inputmode="numeric"
            pattern="[0-9A-Za-z\-]*"
            maxlength={10}
            placeholder="000000"
            autocomplete="one-time-code"
            required
            class="text-center text-2xl tracking-widest"
          />
          <p class="text-xs text-muted-foreground">{m.auth_2fa_code_hint()}</p>
        </div>

        <div class="flex items-center gap-2">
          <input type="checkbox" id="rememberDevice" name="rememberDevice" class="rounded border" />
          <Label for="rememberDevice" class="text-sm font-normal">{m.auth_2fa_remember_device()}</Label>
        </div>

        <Button type="submit" class="w-full">{m.auth_2fa_verify_button()}</Button>
      </form>
    </Card.Content>
    <Card.Footer class="flex flex-col space-y-2">
      <p class="text-center text-sm text-muted-foreground">
        {m.auth_2fa_backup_code_hint()}
      </p>
    </Card.Footer>
  </Card.Root>
</div>
