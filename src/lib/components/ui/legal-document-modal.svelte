<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Dialog from '$lib/components/ui/dialog'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

interface Props {
  title: string
  content: string
  open: boolean
  onClose: () => void
}

const { title, content, open, onClose }: Props = $props()

const htmlContent = $derived(DOMPurify.sanitize(marked.parse(content) as string))
</script>

{#if open}
  <Dialog.Content class="max-h-[80vh] max-w-2xl overflow-hidden flex flex-col" onClose={onClose}>
    <Dialog.Header>
      <Dialog.Title>{title}</Dialog.Title>
    </Dialog.Header>
    <div class="overflow-y-auto flex-1 pr-2">
      <div class="prose prose-sm dark:prose-invert max-w-none">
        {@html htmlContent}
      </div>
    </div>
    <Dialog.Footer>
      <Button onclick={onClose}>Close</Button>
    </Dialog.Footer>
  </Dialog.Content>
{/if}
