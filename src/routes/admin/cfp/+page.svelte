<script lang="ts">
import { EditionSelectorPage } from '$lib/components/shared'
import * as m from '$lib/paraglide/messages'
import { FileText } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()
</script>

<svelte:head>
  <title>{m.cfp_management_title()} - {m.common_app_name()}</title>
</svelte:head>

<EditionSelectorPage
  editions={data.editions}
  basePath="/admin/cfp"
  title={m.cfp_management_title()}
  description={m.cfp_management_description()}
  manageSuffix="/submissions"
  manageLabel={m.cfp_manage_submissions()}
  emptyIcon={FileText}
  emptyTitle={m.cfp_no_editions()}
  emptyDescription={m.cfp_create_edition_hint()}
  allArchivedText={m.cfp_all_editions_archived()}
  showArchivedLinkText={m.cfp_show_archived_editions()}
  hideArchivedText={(count) => `${m.cfp_hide_archived()} (${count})`}
  showArchivedText={(count) => `${m.cfp_show_archived()} (${count})`}
  showSettingsIcon={data.permissions.canManageSettings}
  settingsTitle={m.cfp_settings()}
/>
