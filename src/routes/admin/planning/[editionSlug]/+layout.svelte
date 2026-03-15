<script lang="ts">
import { AdminSubNav } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import { getPlanningNavItems } from '$lib/config'
import * as m from '$lib/paraglide/messages'
import { ArrowLeft, Check, Copy, ExternalLink } from 'lucide-svelte'
import type { LayoutData } from './$types'

interface Props {
  data: LayoutData
  children: import('svelte').Snippet
}

const { data, children }: Props = $props()

let copiedUrl = $state(false)

const publicScheduleUrl = $derived(
  `${typeof window !== 'undefined' ? window.location.origin : ''}/schedule/${data.edition.slug}`
)

async function copyScheduleUrl() {
  try {
    await navigator.clipboard.writeText(publicScheduleUrl)
    copiedUrl = true
    setTimeout(() => {
      copiedUrl = false
    }, 2000)
  } catch {
    const input = document.createElement('input')
    input.value = publicScheduleUrl
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    copiedUrl = true
    setTimeout(() => {
      copiedUrl = false
    }, 2000)
  }
}
</script>

<svelte:head>
  <title>{m.planning_edition_page_title({ name: data.edition.name })}</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/admin/planning">
        <Button variant="ghost" size="icon" title={m.action_back()}>
          <ArrowLeft class="h-5 w-5" />
        </Button>
      </a>
      <div>
        <h2 class="text-3xl font-bold tracking-tight">{data.edition.name}</h2>
      </div>
    </div>
    <!-- URLs -->
    <div class="flex flex-wrap items-center gap-2">
      <!-- Public Schedule URL -->
      <div class="flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1">
        <span class="text-xs text-muted-foreground">Schedule:</span>
        <code class="text-xs">/schedule/{data.edition.slug}</code>
        <Button variant="ghost" size="icon" class="h-6 w-6" onclick={copyScheduleUrl} title={m.action_copy()}>
          {#if copiedUrl}
            <Check class="h-3 w-3 text-green-500" />
          {:else}
            <Copy class="h-3 w-3" />
          {/if}
        </Button>
        <a href="/schedule/{data.edition.slug}" target="_blank">
          <Button variant="ghost" size="icon" class="h-6 w-6" title={m.planning_schedule_open_public()}>
            <ExternalLink class="h-3 w-3" />
          </Button>
        </a>
      </div>
    </div>
  </div>

  <AdminSubNav
    basePath="/admin/planning/{data.edition.slug}"
    items={getPlanningNavItems(data.edition.slug)}
  />

  {@render children()}
</div>
