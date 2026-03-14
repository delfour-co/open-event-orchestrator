<script lang="ts">
import { AdminSubNav } from '$lib/components/shared'
import { getAdminSettingsNavItems } from '$lib/config'
import * as m from '$lib/paraglide/messages'
import type { LayoutData } from './$types'

interface Props {
  data: LayoutData
  children: import('svelte').Snippet
}

const { data, children }: Props = $props()
</script>

<svelte:head>
  <title>{m.admin_settings_title()}</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h2 class="text-3xl font-bold tracking-tight">{m.nav_settings()}</h2>
    <p class="text-muted-foreground">{m.admin_settings_description()}</p>
  </div>

  <AdminSubNav
    basePath="/admin/settings"
    items={getAdminSettingsNavItems()}
  />

  {@render children()}
</div>
