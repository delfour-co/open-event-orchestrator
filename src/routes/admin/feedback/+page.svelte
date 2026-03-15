<script lang="ts">
import { EditionSelectorPage } from '$lib/components/shared'
import * as m from '$lib/paraglide/messages'
import { MessageSquare } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()
</script>

<svelte:head>
  <title>{m.feedback_page_title()}</title>
</svelte:head>

<EditionSelectorPage
  editions={data.editions}
  basePath="/admin/feedback"
  title={m.feedback_admin_title()}
  description={m.feedback_admin_subtitle()}
  manageLabel={m.feedback_view_dashboard()}
  manageIcon={MessageSquare}
  emptyIcon={MessageSquare}
  emptyTitle={m.reporting_no_editions()}
  emptyDescription={m.reporting_create_hint()}
  allArchivedText={m.reporting_all_archived()}
  showArchivedLinkText={m.reporting_show_archived_link()}
  hideArchivedText={(count) => m.reporting_hide_archived({ count })}
  showArchivedText={(count) => m.reporting_show_archived({ count })}
  linkStatusBadge={false}
/>
