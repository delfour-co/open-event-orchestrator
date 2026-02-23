<script lang="ts">
import { Checkbox } from '$lib/components/ui/checkbox'
import * as m from '$lib/paraglide/messages'
import LegalDocumentModal from './legal-document-modal.svelte'

interface LegalDocument {
  key: string
  title: string
  content: string
}

interface Props {
  documents: LegalDocument[]
  allAccepted?: boolean
}

let { documents, allAccepted = $bindable(false) }: Props = $props()

const activeDocuments = $derived(documents.filter((d) => d.content.trim().length > 0))

let acceptedState: Record<string, boolean> = $state({})
let openModal: string | null = $state(null)

$effect(() => {
  allAccepted =
    activeDocuments.length > 0 ? activeDocuments.every((d) => acceptedState[d.key]) : true
})

function toggleAccepted(key: string, checked: boolean): void {
  acceptedState[key] = checked
}
</script>

{#if activeDocuments.length > 0}
  <div class="space-y-3">
    {#each activeDocuments as doc}
      <div class="flex items-start gap-3">
        <Checkbox
          checked={acceptedState[doc.key] ?? false}
          onCheckedChange={(checked) => toggleAccepted(doc.key, checked)}
        />
        <div class="text-sm">
          <span>{m.legal_accept_prefix()} {doc.title}</span>
          <button
            type="button"
            class="ml-1 text-primary underline underline-offset-2 hover:text-primary/80"
            onclick={() => (openModal = doc.key)}
          >
            {m.legal_view_document()}
          </button>
        </div>
        <input type="hidden" name="{doc.key}Accepted" value={acceptedState[doc.key] ? 'on' : ''} />
      </div>

      <LegalDocumentModal
        title={doc.title}
        content={doc.content}
        open={openModal === doc.key}
        onClose={() => (openModal = null)}
      />
    {/each}
  </div>
{/if}
