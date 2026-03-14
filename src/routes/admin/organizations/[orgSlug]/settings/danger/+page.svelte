<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { AlertTriangle } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showDeleteConfirm = $state(false)
</script>

{#if form?.error}
  <div class="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
    {form.error}
  </div>
{/if}

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
