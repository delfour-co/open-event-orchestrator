<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { Building2, CalendarDays, Edit2, Plus, Trash2, Users } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showNewOrg = $state(false)
let editingOrg = $state<string | null>(null)

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}
</script>

<svelte:head>
  <title>Organizations - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">Organizations</h2>
      <p class="text-muted-foreground">
        Manage your organizations. Each organization can have multiple events.
      </p>
    </div>
    <Button onclick={() => (showNewOrg = !showNewOrg)}>
      <Plus class="mr-2 h-4 w-4" />
      New Organization
    </Button>
  </div>

  {#if form?.error}
    <div class="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
      {form.error}
    </div>
  {/if}

  <!-- New Organization Form -->
  {#if showNewOrg}
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <Building2 class="h-5 w-5" />
          Create Organization
        </Card.Title>
        <Card.Description>
          Organizations group related events together. You can add team members and manage
          permissions per organization.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form
          method="POST"
          action="?/create"
          use:enhance={() => {
            return async ({ update }) => {
              await update()
              showNewOrg = false
            }
          }}
          class="space-y-4"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label for="org-name">Name</Label>
              <Input
                id="org-name"
                name="name"
                placeholder="My Conference Org"
                required
                oninput={(e) => {
                  const slugInput = document.getElementById('org-slug') as HTMLInputElement
                  if (slugInput)
                    slugInput.value = generateSlug((e.target as HTMLInputElement).value)
                }}
              />
            </div>
            <div class="space-y-2">
              <Label for="org-slug">Slug</Label>
              <Input id="org-slug" name="slug" placeholder="my-conference-org" required />
            </div>
          </div>
          <div class="space-y-2">
            <Label for="org-description">Description</Label>
            <Textarea
              id="org-description"
              name="description"
              placeholder="A brief description of the organization..."
            />
          </div>
          <div class="flex gap-2">
            <Button type="submit">Create Organization</Button>
            <Button type="button" variant="ghost" onclick={() => (showNewOrg = false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  {/if}

  <!-- Organizations List -->
  {#if data.organizations.length === 0}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <Building2 class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">No organizations yet</h3>
        <p class="mb-4 text-sm text-muted-foreground">
          Create your first organization to start managing events.
        </p>
        <Button onclick={() => (showNewOrg = true)}>
          <Plus class="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="space-y-4">
      {#each data.organizations as org}
        <Card.Root>
          {#if editingOrg === org.id}
            <!-- Edit Form -->
            <Card.Header>
              <Card.Title class="text-lg">Edit Organization</Card.Title>
            </Card.Header>
            <Card.Content>
              <form
                method="POST"
                action="?/update"
                use:enhance={() => {
                  return async ({ update }) => {
                    await update()
                    editingOrg = null
                  }
                }}
                class="space-y-4"
              >
                <input type="hidden" name="id" value={org.id} />
                <div class="grid gap-4 md:grid-cols-2">
                  <div class="space-y-2">
                    <Label for="edit-name-{org.id}">Name</Label>
                    <Input id="edit-name-{org.id}" name="name" value={org.name} required />
                  </div>
                  <div class="space-y-2">
                    <Label for="edit-slug-{org.id}">Slug</Label>
                    <Input id="edit-slug-{org.id}" name="slug" value={org.slug} required />
                  </div>
                </div>
                <div class="space-y-2">
                  <Label for="edit-description-{org.id}">Description</Label>
                  <Textarea
                    id="edit-description-{org.id}"
                    name="description"
                    value={org.description}
                  />
                </div>
                <div class="flex gap-2">
                  <Button type="submit" size="sm">Save</Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onclick={() => (editingOrg = null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card.Content>
          {:else}
            <!-- View Mode -->
            <Card.Header class="pb-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
                  >
                    <Building2 class="h-5 w-5" />
                  </div>
                  <div>
                    <Card.Title>{org.name}</Card.Title>
                    <Card.Description>
                      /{org.slug} - {org.eventsCount} event(s)
                    </Card.Description>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <a href="/admin/events?org={org.id}">
                    <Button variant="outline" size="sm">
                      <CalendarDays class="mr-2 h-4 w-4" />
                      View Events
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    onclick={() => (editingOrg = org.id)}
                  >
                    <Edit2 class="h-4 w-4" />
                  </Button>
                  <form method="POST" action="?/delete" use:enhance>
                    <input type="hidden" name="id" value={org.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8 text-destructive hover:text-destructive"
                      disabled={org.eventsCount > 0}
                      title={org.eventsCount > 0 ? 'Delete events first' : 'Delete organization'}
                      onclick={(e) => {
                        if (!confirm('Delete this organization?')) {
                          e.preventDefault()
                        }
                      }}
                    >
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </Card.Header>
            {#if org.description}
              <Card.Content class="pt-0">
                <p class="text-sm text-muted-foreground">{org.description}</p>
              </Card.Content>
            {/if}
          {/if}
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>
