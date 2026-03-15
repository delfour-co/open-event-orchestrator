<script lang="ts">
import { enhance } from '$app/forms'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import * as m from '$lib/paraglide/messages'
import { generateSlug } from '$lib/utils'
import { ArrowRight, Building2, Plus } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showNewOrg = $state(false)

const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}
</script>

<svelte:head>
  <title>{m.admin_organizations_title()}</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h2 class="text-3xl font-bold tracking-tight">{m.admin_organizations_heading()}</h2>
    <p class="text-muted-foreground">
      {m.admin_organizations_description()}
    </p>
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

  <!-- Organizations Grid -->
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {#each data.organizations as org}
      <Card.Root class="transition-shadow hover:shadow-md">
        <Card.Header>
          <div class="flex items-center gap-3">
            {#if org.logoUrl}
              <img
                src={org.logoUrl}
                alt={org.name}
                class="h-10 w-10 rounded-lg object-cover"
              />
            {:else}
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
              >
                <Building2 class="h-5 w-5" />
              </div>
            {/if}
            <div>
              <Card.Title>{org.name}</Card.Title>
              <Card.Description>/{org.slug}</Card.Description>
            </div>
          </div>
        </Card.Header>
        <Card.Content class="space-y-3">
          {#if org.description}
            <p class="text-sm text-muted-foreground">{truncate(org.description, 120)}</p>
          {/if}
          <div>
            <Badge variant="secondary">
              {m.admin_organizations_events_count({ count: org.eventsCount })}
            </Badge>
          </div>
          <a href="/admin/organizations/{org.slug}/settings">
            <Button class="w-full" variant="outline">
              {m.admin_org_manage_button()}
              <ArrowRight class="ml-2 h-4 w-4" />
            </Button>
          </a>
        </Card.Content>
      </Card.Root>
    {/each}

    <!-- Add Organization Card -->
    <Card.Root class="border-dashed">
      <Card.Content class="flex h-full min-h-[200px] flex-col items-center justify-center py-6">
        <Plus class="mb-2 h-8 w-8 text-muted-foreground" />
        <p class="mb-4 text-sm text-muted-foreground">{m.admin_organizations_new()}</p>
        <Button variant="outline" onclick={() => (showNewOrg = true)}>
          <Plus class="mr-2 h-4 w-4" />
          {m.admin_organizations_create_button()}
        </Button>
      </Card.Content>
    </Card.Root>
  </div>
</div>
