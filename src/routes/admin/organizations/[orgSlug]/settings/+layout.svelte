<script lang="ts">
import { AdminSubNav } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import { getOrgSettingsNavItems } from '$lib/config'
import * as m from '$lib/paraglide/messages'
import { ArrowLeft, ScrollText } from 'lucide-svelte'
import type { LayoutData } from './$types'

interface Props {
  data: LayoutData
  children: import('svelte').Snippet
}

const { data, children }: Props = $props()
</script>

<svelte:head>
  <title>{m.admin_org_settings_title({ name: data.organization.name })}</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/admin/organizations">
        <Button variant="ghost" size="icon">
          <ArrowLeft class="h-5 w-5" />
        </Button>
      </a>
      <div>
        <h2 class="text-3xl font-bold tracking-tight">{data.organization.name}</h2>
        <p class="text-muted-foreground">{m.admin_org_settings_heading()}</p>
      </div>
    </div>
    <a href="/admin/organizations/{data.organization.slug}/audit-log">
      <Button variant="outline">
        <ScrollText class="mr-2 h-4 w-4" />
        {m.audit_log_title()}
      </Button>
    </a>
  </div>

  <AdminSubNav
    basePath="/admin/organizations/{data.organization.slug}/settings"
    items={getOrgSettingsNavItems(data.organization.slug)}
  />

  {@render children()}
</div>
