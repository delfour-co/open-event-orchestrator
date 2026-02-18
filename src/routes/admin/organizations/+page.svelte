<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import * as m from '$lib/paraglide/messages'
import { Building2, CalendarDays, Plus, Settings, Trash2 } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showNewOrg = $state(false)

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
</script>

<svelte:head>
  <title>{m.admin_organizations_title()}</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">{m.admin_organizations_heading()}</h2>
      <p class="text-muted-foreground">
        {m.admin_organizations_description()}
      </p>
    </div>
    <Button onclick={() => (showNewOrg = !showNewOrg)}>
      <Plus class="mr-2 h-4 w-4" />
      {m.admin_organizations_new()}
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
          {m.admin_organizations_create_title()}
        </Card.Title>
        <Card.Description>
          {m.admin_organizations_create_description()}
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
              <Label for="org-name">{m.admin_organizations_name()}</Label>
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
              <Label for="org-slug">{m.admin_organizations_slug()}</Label>
              <Input id="org-slug" name="slug" placeholder="my-conference-org" required />
            </div>
          </div>
          <div class="space-y-2">
            <Label for="org-description">{m.admin_organizations_description_label()}</Label>
            <Textarea
              id="org-description"
              name="description"
              placeholder={m.admin_organizations_description_placeholder()}
            />
          </div>
          <div class="flex gap-2">
            <Button type="submit">{m.admin_organizations_create_button()}</Button>
            <Button type="button" variant="ghost" onclick={() => (showNewOrg = false)}>
              {m.action_cancel()}
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
        <h3 class="text-lg font-semibold">{m.admin_organizations_empty_title()}</h3>
        <p class="mb-4 text-sm text-muted-foreground">
          {m.admin_organizations_empty_description()}
        </p>
        <Button onclick={() => (showNewOrg = true)}>
          <Plus class="mr-2 h-4 w-4" />
          {m.admin_organizations_create_button()}
        </Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="space-y-4">
      {#each data.organizations as org}
        <Card.Root>
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
                    /{org.slug} - {m.admin_organizations_events_count({ count: org.eventsCount })}
                  </Card.Description>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <a href="/admin/events?org={org.id}">
                  <Button variant="outline" size="sm">
                    <CalendarDays class="mr-2 h-4 w-4" />
                    {m.admin_organizations_view_events()}
                  </Button>
                </a>
                <a href="/admin/organizations/{org.slug}/settings" title={m.admin_organizations_settings()}>
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <Settings class="h-4 w-4" />
                  </Button>
                </a>
                <form method="POST" action="?/delete" use:enhance>
                  <input type="hidden" name="id" value={org.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-destructive hover:text-destructive"
                    disabled={org.eventsCount > 0}
                    title={org.eventsCount > 0 ? m.admin_organizations_delete_events_first() : m.admin_organizations_delete()}
                    onclick={(e) => {
                      if (!confirm(m.admin_organizations_delete_confirm())) {
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
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>
