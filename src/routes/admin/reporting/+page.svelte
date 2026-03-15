<script lang="ts">
import { EditionSelectorPage } from '$lib/components/shared'
import * as m from '$lib/paraglide/messages'
import { BarChart3 } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()
</script>

<svelte:head>
  <title>{m.reporting_page_title()}</title>
</svelte:head>

<EditionSelectorPage
  editions={data.editions}
  basePath="/admin/reporting"
  title={m.reporting_title()}
  description={m.reporting_subtitle()}
  manageLabel={m.reporting_view_dashboard()}
  manageIcon={BarChart3}
  emptyIcon={BarChart3}
  emptyTitle={m.reporting_no_editions()}
  emptyDescription={m.reporting_create_hint()}
  allArchivedText={m.reporting_all_archived()}
  showArchivedLinkText={m.reporting_show_archived_link()}
  hideArchivedText={(count) => m.reporting_hide_archived({ count })}
  showArchivedText={(count) => m.reporting_show_archived({ count })}
/>
