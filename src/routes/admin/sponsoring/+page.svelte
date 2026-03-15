<script lang="ts">
import { EditionSelectorPage } from '$lib/components/shared'
import * as m from '$lib/paraglide/messages'
import { Handshake } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()
</script>

<svelte:head>
	<title>{m.sponsoring_page_title()}</title>
</svelte:head>

<EditionSelectorPage
	editions={data.editions}
	basePath="/admin/sponsoring"
	title={m.sponsoring_title()}
	description={m.sponsoring_select_edition()}
	manageLabel={m.sponsoring_manage_sponsors()}
	emptyIcon={Handshake}
	emptyTitle={m.sponsoring_no_editions()}
	emptyDescription={m.sponsoring_create_edition()}
	allArchivedText={m.sponsoring_all_archived()}
	showArchivedLinkText={m.sponsoring_show_archived_editions()}
	hideArchivedText={(count) => `${m.sponsoring_hide_archived()} (${count})`}
	showArchivedText={(count) => `${m.sponsoring_show_archived()} (${count})`}
	showSettingsIcon={true}
	settingsPath="packages"
	settingsTitle={m.sponsoring_packages()}
/>
