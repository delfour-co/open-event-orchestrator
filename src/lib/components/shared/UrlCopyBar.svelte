<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { Check, Copy, ExternalLink } from 'lucide-svelte'

interface Props {
  label: string
  path: string
  fullUrl?: string
}

const { label, path, fullUrl }: Props = $props()

let copied = $state(false)

async function copyUrl() {
  const url = fullUrl || `${window.location.origin}${path}`
  await navigator.clipboard.writeText(url)
  copied = true
  setTimeout(() => {
    copied = false
  }, 2000)
}
</script>

<div class="flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1">
  <span class="text-xs text-muted-foreground">{label}:</span>
  <code class="text-xs">{path}</code>
  <Button variant="ghost" size="icon" class="h-6 w-6" onclick={copyUrl} title="Copy URL">
    {#if copied}
      <Check class="h-3 w-3 text-green-500" />
    {:else}
      <Copy class="h-3 w-3" />
    {/if}
  </Button>
  <a href={path} target="_blank" rel="noopener noreferrer" title="Open in new tab">
    <Button variant="ghost" size="icon" class="h-6 w-6">
      <ExternalLink class="h-3 w-3" />
    </Button>
  </a>
</div>
