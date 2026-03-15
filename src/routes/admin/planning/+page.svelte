<script lang="ts">
import { EditionSelectorPage } from '$lib/components/shared'
import * as m from '$lib/paraglide/messages'
import { LayoutGrid } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()
</script>

<svelte:head>
  <title>{m.planning_page_title()}</title>
</svelte:head>

<EditionSelectorPage
  editions={data.editions}
  basePath="/admin/planning"
  title={m.planning_title()}
  description={m.planning_description()}
  manageLabel={m.planning_manage_schedule()}
  emptyIcon={LayoutGrid}
  emptyTitle={m.planning_no_editions()}
  emptyDescription={m.planning_create_edition_hint()}
  allArchivedText={m.planning_all_archived()}
  showArchivedLinkText={m.planning_show_archived_editions()}
  hideArchivedText={(count) => `${m.planning_hide_archived()} (${count})`}
  showArchivedText={(count) => `${m.planning_show_archived()} (${count})`}
  showSettingsIcon={true}
  settingsTitle={m.planning_tab_settings()}
/>
