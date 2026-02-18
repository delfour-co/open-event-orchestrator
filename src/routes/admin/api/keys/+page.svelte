<script lang="ts">
import { enhance } from '$app/forms'
import { page } from '$app/stores'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import * as m from '$lib/paraglide/messages'
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Key,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let confirmingRevoke = $state<string | null>(null)
let confirmingDelete = $state<string | null>(null)
let isSubmitting = $state(false)
let copiedUrl = $state(false)

const getDocsUrl = () => {
  const origin = $page.url.origin
  return `${origin}/api/docs`
}

const copyDocsUrl = async () => {
  await navigator.clipboard.writeText(getDocsUrl())
  copiedUrl = true
  setTimeout(() => {
    copiedUrl = false
  }, 2000)
}

const formatDate = (date: Date | null) => {
  if (!date) return m.api_keys_never()
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const isExpired = (expiresAt: Date | null): boolean => {
  if (!expiresAt) return false
  return new Date() > expiresAt
}

const getStatusBadge = (key: (typeof data.apiKeys)[0]) => {
  if (!key.isActive) {
    return {
      label: m.api_keys_status_revoked(),
      class: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }
  if (isExpired(key.expiresAt)) {
    return {
      label: m.api_keys_status_expired(),
      class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
  }
  return {
    label: m.api_keys_status_active(),
    class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }
}

const getScopeBadge = (key: (typeof data.apiKeys)[0]) => {
  if (key.edition) return m.api_keys_scope_edition({ name: key.edition.name })
  if (key.event) return m.api_keys_scope_event({ name: key.event.name })
  if (key.organization) return m.api_keys_scope_organization({ name: key.organization.name })
  return m.api_keys_scope_global()
}

$effect(() => {
  if (form?.success) {
    confirmingRevoke = null
    confirmingDelete = null
  }
})
</script>

<svelte:head>
  <title>{m.api_keys_title()}</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/admin/api">
        <Button variant="ghost" size="icon">
          <ArrowLeft class="h-5 w-5" />
        </Button>
      </a>
      <div>
        <h2 class="text-3xl font-bold tracking-tight">{m.api_keys_heading()}</h2>
        <p class="text-muted-foreground">
          {m.api_keys_description()}
        </p>
      </div>
    </div>
    <div class="flex items-center gap-4">
      <!-- Public API Docs URL -->
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5">
          <span class="text-sm text-muted-foreground">{m.api_keys_public_url()}</span>
          <code class="text-sm">/api/docs</code>
        </div>
        <Button variant="outline" size="sm" onclick={copyDocsUrl} class="gap-2">
          {#if copiedUrl}
            <Check class="h-4 w-4 text-green-500" />
            {m.api_keys_copied()}
          {:else}
            <Copy class="h-4 w-4" />
            {m.action_copy()}
          {/if}
        </Button>
        <a href="/api/docs" target="_blank">
          <Button variant="outline" size="sm" class="gap-2">
            <ExternalLink class="h-4 w-4" />
            {m.api_keys_open()}
          </Button>
        </a>
      </div>
      <a href="/admin/api/keys/new">
        <Button>
          <Plus class="mr-2 h-4 w-4" />
          {m.api_keys_new()}
        </Button>
      </a>
    </div>
  </div>

  {#if data.apiKeys.length === 0}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <Key class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">{m.api_keys_no_keys_title()}</h3>
        <p class="text-sm text-muted-foreground mb-4">
          {m.api_keys_no_keys_description()}
        </p>
        <a href="/admin/api/keys/new">
          <Button>
            <Plus class="mr-2 h-4 w-4" />
            {m.api_keys_create()}
          </Button>
        </a>
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="space-y-4">
      {#each data.apiKeys as key}
        {@const status = getStatusBadge(key)}
        <Card.Root class={!key.isActive || isExpired(key.expiresAt) ? 'opacity-60' : ''}>
          <Card.Content class="p-4">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <Key class="h-5 w-5 text-muted-foreground" />
                  <span class="font-semibold text-lg">{key.name}</span>
                  <span class="rounded-full px-2 py-0.5 text-xs font-medium {status.class}">
                    {status.label}
                  </span>
                </div>

                <div class="grid gap-2 text-sm text-muted-foreground md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <span class="font-medium">{m.api_keys_field_key()}</span>
                    <code class="ml-1 rounded bg-muted px-1">{key.keyPrefix}...</code>
                  </div>
                  <div>
                    <span class="font-medium">{m.api_keys_field_scope()}</span>
                    <span class="ml-1">{getScopeBadge(key)}</span>
                  </div>
                  <div>
                    <span class="font-medium">{m.api_keys_field_rate_limit()}</span>
                    <span class="ml-1">{m.api_keys_rate_limit_format({ limit: key.rateLimit })}</span>
                  </div>
                  <div>
                    <span class="font-medium">{m.api_keys_field_last_used()}</span>
                    <span class="ml-1">{formatDate(key.lastUsedAt)}</span>
                  </div>
                </div>

                <div class="mt-2 flex flex-wrap gap-1">
                  {#each key.permissions.slice(0, 5) as perm}
                    <span class="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      {perm}
                    </span>
                  {/each}
                  {#if key.permissions.length > 5}
                    <span class="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {m.api_keys_more_permissions({ count: key.permissions.length - 5 })}
                    </span>
                  {/if}
                </div>

                <div class="mt-2 text-xs text-muted-foreground">
                  {m.api_keys_created_at({ date: formatDate(key.createdAt) })}
                  {#if key.createdBy}
                    {m.api_keys_created_by({ name: key.createdBy.name })}
                  {/if}
                  {#if key.expiresAt}
                    {' '}{m.api_keys_expires_at({ date: formatDate(key.expiresAt) })}
                  {/if}
                </div>
              </div>

              <div class="flex gap-2">
                {#if key.isActive && !isExpired(key.expiresAt)}
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={() => confirmingRevoke = key.id}
                  >
                    <X class="mr-1 h-4 w-4" />
                    {m.api_keys_revoke()}
                  </Button>
                {:else if !key.isActive}
                  <form method="POST" action="?/reactivateKey" use:enhance>
                    <input type="hidden" name="id" value={key.id} />
                    <Button variant="outline" size="sm" type="submit">
                      <RefreshCw class="mr-1 h-4 w-4" />
                      {m.api_keys_reactivate()}
                    </Button>
                  </form>
                {/if}
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-destructive hover:text-destructive"
                  onclick={() => confirmingDelete = key.id}
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>

<!-- Revoke Confirmation Dialog -->
{#if confirmingRevoke}
  <Dialog.Content onClose={() => confirmingRevoke = null}>
    <Dialog.Header>
      <Dialog.Title>{m.api_keys_revoke_dialog_title()}</Dialog.Title>
      <Dialog.Description>
        {m.api_keys_revoke_dialog_description()}
      </Dialog.Description>
    </Dialog.Header>
    <form
      method="POST"
      action="?/revokeKey"
      use:enhance={() => {
        isSubmitting = true
        return async ({ update }) => {
          isSubmitting = false
          await update()
        }
      }}
    >
      <input type="hidden" name="id" value={confirmingRevoke} />
      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => confirmingRevoke = null}>
          {m.action_cancel()}
        </Button>
        <Button type="submit" variant="destructive" disabled={isSubmitting}>
          {#if isSubmitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {/if}
          {m.api_keys_revoke_confirm()}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
{/if}

<!-- Delete Confirmation Dialog -->
{#if confirmingDelete}
  <Dialog.Content onClose={() => confirmingDelete = null}>
    <Dialog.Header>
      <Dialog.Title>{m.api_keys_delete_dialog_title()}</Dialog.Title>
      <Dialog.Description>
        {m.api_keys_delete_dialog_description()}
      </Dialog.Description>
    </Dialog.Header>
    <form
      method="POST"
      action="?/deleteKey"
      use:enhance={() => {
        isSubmitting = true
        return async ({ update }) => {
          isSubmitting = false
          await update()
        }
      }}
    >
      <input type="hidden" name="id" value={confirmingDelete} />
      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => confirmingDelete = null}>
          {m.action_cancel()}
        </Button>
        <Button type="submit" variant="destructive" disabled={isSubmitting}>
          {#if isSubmitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {/if}
          {m.api_keys_delete_confirm()}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
{/if}

{#if form?.error}
  <div
    class="fixed bottom-4 right-4 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive shadow-lg"
  >
    {form.error}
  </div>
{/if}
