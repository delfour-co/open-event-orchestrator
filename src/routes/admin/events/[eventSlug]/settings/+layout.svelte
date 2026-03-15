<script lang="ts">
import { AdminSubNav } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import { getEventSettingsNavItems } from '$lib/config'
import * as m from '$lib/paraglide/messages'
import { ArrowLeft } from 'lucide-svelte'
import type { LayoutData } from './$types'

interface Props {
  data: LayoutData
  children: import('svelte').Snippet
}

const { data, children }: Props = $props()
</script>

<svelte:head>
  <title>Event Settings - {data.event.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center gap-4">
    <a href="/admin/events">
      <Button variant="ghost" size="icon" title={m.action_back()}>
        <ArrowLeft class="h-5 w-5" />
      </Button>
    </a>
    <div>
      <h2 class="text-3xl font-bold tracking-tight">{data.event.name}</h2>
      <p class="text-muted-foreground">
        Event settings - {data.event.organizationName}
      </p>
    </div>
  </div>

  <AdminSubNav
    basePath="/admin/events/{data.event.slug}/settings"
    items={getEventSettingsNavItems(data.event.slug)}
  />

  {@render children()}
</div>
