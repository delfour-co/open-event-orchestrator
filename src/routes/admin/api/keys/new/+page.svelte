<script lang="ts">
import { enhance } from '$app/forms'
import { goto } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { getPermissionLabel } from '$lib/features/api/domain/api-key'
import * as m from '$lib/paraglide/messages'
import { AlertTriangle, ArrowLeft, Check, Copy, Key, Loader2, Shield } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isSubmitting = $state(false)
let copied = $state(false)
let scopeType = $state<'global' | 'organization' | 'event' | 'edition'>('global')
let selectedPermissions = $state<string[]>([])

const togglePermission = (perm: string) => {
  if (selectedPermissions.includes(perm)) {
    selectedPermissions = selectedPermissions.filter((p) => p !== perm)
  } else {
    selectedPermissions = [...selectedPermissions, perm]
  }
}

const selectAllPermissions = () => {
  selectedPermissions = [...data.permissions]
}

const selectReadOnly = () => {
  selectedPermissions = data.permissions.filter((p) => p.startsWith('read:'))
}

const clearPermissions = () => {
  selectedPermissions = []
}

const copyApiKey = () => {
  if (form?.apiKey) {
    navigator.clipboard.writeText(form.apiKey)
    copied = true
    setTimeout(() => {
      copied = false
    }, 2000)
  }
}

const goToKeys = () => {
  goto('/admin/api/keys')
}
</script>

<svelte:head>
  <title>{m.api_keys_new_title()}</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
  <div class="flex items-center gap-4">
    <a href="/admin/api/keys">
      <Button variant="ghost" size="icon">
        <ArrowLeft class="h-5 w-5" />
      </Button>
    </a>
    <div>
      <h2 class="text-3xl font-bold tracking-tight">{m.api_keys_new_heading()}</h2>
      <p class="text-muted-foreground">
        {m.api_keys_new_description()}
      </p>
    </div>
  </div>

  {#if form?.success && form?.apiKey}
    <!-- Success State - Show the key -->
    <Card.Root class="border-green-500">
      <Card.Header>
        <Card.Title class="flex items-center gap-2 text-green-600">
          <Check class="h-5 w-5" />
          {m.api_keys_new_success_title()}
        </Card.Title>
        <Card.Description>
          {m.api_keys_new_success_description()}
        </Card.Description>
      </Card.Header>
      <Card.Content class="space-y-4">
        <div class="rounded-md border bg-muted p-4">
          <div class="flex items-center justify-between gap-4">
            <code class="flex-1 break-all text-sm">{form.apiKey}</code>
            <Button variant="outline" size="sm" onclick={copyApiKey} class="shrink-0">
              {#if copied}
                <Check class="mr-1 h-4 w-4 text-green-500" />
                {m.api_keys_copied()}
              {:else}
                <Copy class="mr-1 h-4 w-4" />
                {m.action_copy()}
              {/if}
            </Button>
          </div>
        </div>

        <div class="flex items-start gap-2 rounded-md border border-yellow-500 bg-yellow-50 p-3 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
          <AlertTriangle class="mt-0.5 h-5 w-5 shrink-0" />
          <div class="text-sm">
            <p class="font-medium">{m.api_keys_new_store_securely_title()}</p>
            <p>{m.api_keys_new_store_securely_description()}</p>
          </div>
        </div>

        <Button onclick={goToKeys} class="w-full">
          {m.api_keys_new_done()}
        </Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Form State -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <Key class="h-5 w-5" />
          {m.api_keys_new_card_title()}
        </Card.Title>
      </Card.Header>
      <Card.Content>
        {#if form?.error}
          <div class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {form.error}
          </div>
        {/if}

        <form
          method="POST"
          use:enhance={() => {
            isSubmitting = true
            return async ({ update }) => {
              isSubmitting = false
              await update()
            }
          }}
          class="space-y-6"
        >
          <!-- Name -->
          <div class="space-y-2">
            <Label for="name">{m.api_keys_new_name_label()}</Label>
            <Input
              id="name"
              name="name"
              placeholder={m.api_keys_new_name_placeholder()}
              required
            />
            <p class="text-xs text-muted-foreground">
              {m.api_keys_new_name_hint()}
            </p>
          </div>

          <!-- Scope -->
          <div class="space-y-3">
            <Label>{m.api_keys_new_scope_label()}</Label>
            <div class="grid gap-2 md:grid-cols-2">
              <label class="flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-muted {scopeType === 'global' ? 'border-primary bg-primary/5' : ''}">
                <input
                  type="radio"
                  name="scopeType"
                  value="global"
                  checked={scopeType === 'global'}
                  onchange={() => scopeType = 'global'}
                  class="h-4 w-4"
                />
                <div>
                  <div class="font-medium">{m.api_keys_new_scope_global()}</div>
                  <div class="text-xs text-muted-foreground">{m.api_keys_new_scope_global_hint()}</div>
                </div>
              </label>
              <label class="flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-muted {scopeType === 'organization' ? 'border-primary bg-primary/5' : ''}">
                <input
                  type="radio"
                  name="scopeType"
                  value="organization"
                  checked={scopeType === 'organization'}
                  onchange={() => scopeType = 'organization'}
                  class="h-4 w-4"
                />
                <div>
                  <div class="font-medium">{m.api_keys_new_scope_organization()}</div>
                  <div class="text-xs text-muted-foreground">{m.api_keys_new_scope_organization_hint()}</div>
                </div>
              </label>
              <label class="flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-muted {scopeType === 'event' ? 'border-primary bg-primary/5' : ''}">
                <input
                  type="radio"
                  name="scopeType"
                  value="event"
                  checked={scopeType === 'event'}
                  onchange={() => scopeType = 'event'}
                  class="h-4 w-4"
                />
                <div>
                  <div class="font-medium">{m.api_keys_new_scope_event()}</div>
                  <div class="text-xs text-muted-foreground">{m.api_keys_new_scope_event_hint()}</div>
                </div>
              </label>
              <label class="flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-muted {scopeType === 'edition' ? 'border-primary bg-primary/5' : ''}">
                <input
                  type="radio"
                  name="scopeType"
                  value="edition"
                  checked={scopeType === 'edition'}
                  onchange={() => scopeType = 'edition'}
                  class="h-4 w-4"
                />
                <div>
                  <div class="font-medium">{m.api_keys_new_scope_edition()}</div>
                  <div class="text-xs text-muted-foreground">{m.api_keys_new_scope_edition_hint()}</div>
                </div>
              </label>
            </div>

            {#if scopeType === 'organization'}
              <div class="space-y-2">
                <Label for="organizationId">{m.api_keys_new_scope_organization()} *</Label>
                <select
                  id="organizationId"
                  name="organizationId"
                  required
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">{m.api_keys_new_select_organization()}</option>
                  {#each data.organizations as org}
                    <option value={org.id}>{org.name}</option>
                  {/each}
                </select>
              </div>
            {:else if scopeType === 'event'}
              <div class="space-y-2">
                <Label for="eventId">{m.api_keys_new_scope_event()} *</Label>
                <select
                  id="eventId"
                  name="eventId"
                  required
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">{m.api_keys_new_select_event()}</option>
                  {#each data.events as event}
                    <option value={event.id}>{event.name}</option>
                  {/each}
                </select>
              </div>
            {:else if scopeType === 'edition'}
              <div class="space-y-2">
                <Label for="editionId">{m.api_keys_new_scope_edition()} *</Label>
                <select
                  id="editionId"
                  name="editionId"
                  required
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">{m.api_keys_new_select_edition()}</option>
                  {#each data.editions as edition}
                    <option value={edition.id}>{edition.name} ({edition.year})</option>
                  {/each}
                </select>
              </div>
            {/if}
          </div>

          <!-- Permissions -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <Label>{m.api_keys_new_permissions_label()}</Label>
              <div class="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onclick={selectAllPermissions}>
                  {m.api_keys_new_permissions_all()}
                </Button>
                <Button type="button" variant="ghost" size="sm" onclick={selectReadOnly}>
                  {m.api_keys_new_permissions_read_only()}
                </Button>
                <Button type="button" variant="ghost" size="sm" onclick={clearPermissions}>
                  {m.api_keys_new_permissions_clear()}
                </Button>
              </div>
            </div>
            <div class="grid gap-2 md:grid-cols-2">
              {#each data.permissions as perm}
                <label class="flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-muted {selectedPermissions.includes(perm) ? 'border-primary bg-primary/5' : ''}">
                  <input
                    type="checkbox"
                    name="permissions"
                    value={perm}
                    checked={selectedPermissions.includes(perm)}
                    onchange={() => togglePermission(perm)}
                    class="h-4 w-4 rounded border-gray-300"
                  />
                  <div class="flex-1">
                    <div class="text-sm font-medium">{getPermissionLabel(perm)}</div>
                    <code class="text-xs text-muted-foreground">{perm}</code>
                  </div>
                  {#if perm.startsWith('write:')}
                    <span title="Write permission">
                      <Shield class="h-4 w-4 text-yellow-500" />
                    </span>
                  {/if}
                </label>
              {/each}
            </div>
          </div>

          <!-- Rate Limit -->
          <div class="space-y-2">
            <Label for="rateLimit">{m.api_keys_new_rate_limit_label()}</Label>
            <Input
              id="rateLimit"
              name="rateLimit"
              type="number"
              min="1"
              max="1000"
              value="60"
            />
            <p class="text-xs text-muted-foreground">
              {m.api_keys_new_rate_limit_hint()}
            </p>
          </div>

          <!-- Expiration -->
          <div class="space-y-2">
            <Label for="expiresIn">{m.api_keys_new_expiration_label()}</Label>
            <select
              id="expiresIn"
              name="expiresIn"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="30">{m.api_keys_new_expiration_30_days()}</option>
              <option value="90">{m.api_keys_new_expiration_90_days()}</option>
              <option value="180">{m.api_keys_new_expiration_6_months()}</option>
              <option value="365" selected>{m.api_keys_new_expiration_1_year()}</option>
              <option value="never">{m.api_keys_new_expiration_never()}</option>
            </select>
          </div>

          <!-- Submit -->
          <div class="flex gap-3">
            <a href="/admin/api/keys" class="flex-1">
              <Button type="button" variant="outline" class="w-full">
                {m.action_cancel()}
              </Button>
            </a>
            <Button
              type="submit"
              class="flex-1"
              disabled={isSubmitting || selectedPermissions.length === 0}
            >
              {#if isSubmitting}
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              {:else}
                <Key class="mr-2 h-4 w-4" />
              {/if}
              {m.api_keys_new_submit()}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  {/if}
</div>
