<script lang="ts">
import { EditionSelectorPage } from '$lib/components/shared'
import * as m from '$lib/paraglide/messages'
import { Ticket } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()
</script>

<svelte:head>
	<title>{m.billing_title()} - Open Event Orchestrator</title>
</svelte:head>

<EditionSelectorPage
	editions={data.editions}
	basePath="/admin/billing"
	title={m.billing_title()}
	description={m.billing_select_edition()}
	manageLabel={m.billing_manage_tickets()}
	emptyIcon={Ticket}
	emptyTitle={m.billing_no_editions()}
	emptyDescription={m.billing_create_edition()}
	allArchivedText={m.billing_all_archived()}
	showArchivedLinkText={m.billing_show_archived_link()}
	hideArchivedText={(count) => `${m.billing_hide_archived()} (${count})`}
	showArchivedText={(count) => `${m.billing_show_archived()} (${count})`}
	showSettingsIcon={true}
	settingsTitle={m.billing_nav_settings()}
/>
