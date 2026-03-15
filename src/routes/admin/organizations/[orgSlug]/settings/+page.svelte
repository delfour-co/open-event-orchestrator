<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import * as m from '$lib/paraglide/messages'
import { generateSlug } from '$lib/utils'
import { AlertTriangle, Loader2 } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isSubmitting = $state(false)
let showDeleteConfirm = $state(false)
</script>

{#if form?.error}
  <div class="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
    {form.error}
  </div>
{/if}

{#if form?.success}
  <div class="rounded-md border border-green-500 bg-green-500/10 p-4 text-green-700 dark:text-green-400">
    {form.message}
  </div>
{/if}

<Card.Root>
  <Card.Header>
    <Card.Title>Organization Details</Card.Title>
    <Card.Description>Basic information about this organization</Card.Description>
  </Card.Header>
  <Card.Content>
    <form
      method="POST"
      action="?/updateOrganization"
      use:enhance={() => {
        isSubmitting = true
        return async ({ update }) => {
          isSubmitting = false
          await update()
          await invalidateAll()
        }
      }}
      class="space-y-4"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <Label for="org-name">Name</Label>
          <Input
            id="org-name"
            name="name"
            value={data.organization.name}
            required
            oninput={(e) => {
              const slugInput = document.getElementById('org-slug') as HTMLInputElement
              if (slugInput && !slugInput.dataset.modified) {
                slugInput.value = generateSlug((e.target as HTMLInputElement).value)
              }
            }}
          />
        </div>
        <div class="space-y-2">
          <Label for="org-slug">Slug</Label>
          <Input
            id="org-slug"
            name="slug"
            value={data.organization.slug}
            required
            pattern="[a-z0-9-]+"
            oninput={(e) => {
              (e.target as HTMLInputElement).dataset.modified = 'true'
            }}
          />
          <p class="text-xs text-muted-foreground">URL: /org/{data.organization.slug}</p>
        </div>
      </div>

      <div class="space-y-2">
        <Label for="org-description">Description</Label>
        <Textarea
          id="org-description"
          name="description"
          value={data.organization.description}
          rows={3}
          placeholder="A brief description of this organization..."
        />
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <Label for="org-website">Website</Label>
          <Input
            id="org-website"
            name="website"
            type="url"
            value={data.organization.website}
            placeholder="https://myorg.com"
          />
        </div>
        <div class="space-y-2">
          <Label for="org-email">Contact Email</Label>
          <Input
            id="org-email"
            name="contactEmail"
            type="email"
            value={data.organization.contactEmail}
            placeholder="contact@myorg.com"
          />
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <Label for="org-vat-rate">{m.admin_org_settings_vat_rate()}</Label>
          <Input
            id="org-vat-rate"
            name="vatRate"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={String(data.organization.vatRate)}
            placeholder="20"
          />
          <p class="text-xs text-muted-foreground">{m.admin_org_settings_vat_rate_hint()}</p>
        </div>
      </div>

      <div class="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {#if isSubmitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            Saving...
          {:else}
            Save Details
          {/if}
        </Button>
      </div>
    </form>
  </Card.Content>
</Card.Root>

<!-- Danger Zone -->
<Card.Root class="border-destructive">
  <Card.Header>
    <Card.Title class="flex items-center gap-2 text-destructive">
      <AlertTriangle class="h-5 w-5" />
      Danger Zone
    </Card.Title>
    <Card.Description>Irreversible actions for this organization</Card.Description>
  </Card.Header>
  <Card.Content>
    <div class="flex items-center justify-between">
      <div>
        <p class="font-medium">Delete this organization</p>
        <p class="text-sm text-muted-foreground">
          {#if data.eventsCount > 0}
            Cannot delete: {data.eventsCount} event(s) exist. Delete events first.
          {:else}
            Permanently delete this organization and remove all team members.
          {/if}
        </p>
      </div>
      {#if showDeleteConfirm}
        <form method="POST" action="?/deleteOrganization" use:enhance class="flex gap-2">
          <Button type="submit" variant="destructive" size="sm">
            Confirm Delete
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onclick={() => (showDeleteConfirm = false)}
          >
            Cancel
          </Button>
        </form>
      {:else}
        <Button
          variant="destructive"
          size="sm"
          disabled={data.eventsCount > 0}
          onclick={() => (showDeleteConfirm = true)}
        >
          Delete Organization
        </Button>
      {/if}
    </div>
  </Card.Content>
</Card.Root>
