<script lang="ts">
import { EditionSelectorPage } from '$lib/components/shared'
import * as m from '$lib/paraglide/messages'
import { Wallet } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()
</script>

<svelte:head>
	<title>{m.budget_page_title()}</title>
</svelte:head>

<EditionSelectorPage
	editions={data.editions}
	basePath="/admin/budget"
	title={m.budget_title()}
	description={m.budget_select_edition()}
	manageLabel={m.budget_manage_budget()}
	emptyIcon={Wallet}
	emptyTitle={m.budget_no_editions()}
	emptyDescription={m.budget_create_edition()}
	allArchivedText={m.budget_all_archived()}
	showArchivedLinkText={m.budget_show_archived_link()}
	hideArchivedText={(count) => `${m.budget_hide_archived()} (${count})`}
	showArchivedText={(count) => `${m.budget_show_archived()} (${count})`}
	showSettingsIcon={true}
	settingsTitle="Budget Settings"
/>
