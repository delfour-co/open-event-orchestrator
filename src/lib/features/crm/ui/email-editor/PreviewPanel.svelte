<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import type { EmailDocument } from '$lib/features/crm/domain/email-editor'
import {
  DEFAULT_DEVICE_DIMENSIONS,
  type PreviewDevice
} from '$lib/features/crm/domain/email-preview'
import { exportToHtml } from '$lib/features/crm/services/email-export-service'
import { Monitor, Smartphone, Tablet } from 'lucide-svelte'

interface Props {
  document: EmailDocument
}

const { document }: Props = $props()

let device = $state<PreviewDevice>('desktop')

const dimensions = $derived(DEFAULT_DEVICE_DIMENSIONS[device])
const previewHtml = $derived(exportToHtml(document))

const devices: { id: PreviewDevice; icon: typeof Monitor; label: string }[] = [
  { id: 'desktop', icon: Monitor, label: 'Desktop' },
  { id: 'tablet', icon: Tablet, label: 'Tablet' },
  { id: 'mobile', icon: Smartphone, label: 'Mobile' }
]
</script>

<Card.Root class="flex h-full flex-col">
  <Card.Header class="flex-none pb-3">
    <div class="flex items-center justify-between">
      <Card.Title class="text-sm font-medium">Preview</Card.Title>
      <div class="flex gap-1">
        {#each devices as { id, icon: Icon, label }}
          <Button
            variant={device === id ? 'default' : 'ghost'}
            size="icon"
            class="h-7 w-7"
            onclick={() => (device = id)}
            title={label}
          >
            <Icon class="h-4 w-4" />
          </Button>
        {/each}
      </div>
    </div>
  </Card.Header>
  <Card.Content class="flex-1 overflow-hidden p-0">
    <div class="preview-container">
      <div
        class="preview-frame"
        style="width: {dimensions.width}px; max-width: 100%;"
      >
        <iframe
          title="Email Preview"
          srcdoc={previewHtml}
          class="preview-iframe"
          sandbox="allow-same-origin"
        ></iframe>
      </div>
    </div>
  </Card.Content>
</Card.Root>

<style>
.preview-container {
  display: flex;
  justify-content: center;
  padding: 1rem;
  background-color: hsl(var(--muted));
  height: 100%;
  overflow: auto;
}

.preview-frame {
  background-color: #ffffff;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  transition: width 0.3s ease;
}

.preview-iframe {
  width: 100%;
  height: 600px;
  border: none;
}
</style>
