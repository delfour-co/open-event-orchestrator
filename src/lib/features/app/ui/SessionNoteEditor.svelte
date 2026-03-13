<script lang="ts">
import { browser } from '$app/environment'
import { notesService } from '$lib/features/app/services'
import * as m from '$lib/paraglide/messages'
import { CheckCircle2 } from 'lucide-svelte'

interface Props {
  sessionId: string
  sessionTitle: string
  onSaved?: () => void
}

const { sessionId, sessionTitle, onSaved }: Props = $props()

let content = $state('')
let saved = $state(false)
let debounceTimer = $state<ReturnType<typeof setTimeout> | null>(null)

// Load existing note on mount
$effect(() => {
  if (!browser) return
  const existing = notesService.getNote(sessionId)
  if (existing !== null) {
    content = existing
  }
})

function handleInput(): void {
  saved = false
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    notesService.saveNote(sessionId, content)
    saved = true
    onSaved?.()
    setTimeout(() => {
      saved = false
    }, 2000)
  }, 500)
}

const charCount = $derived(content.length)
</script>

<div class="mt-3 space-y-1.5 border-t pt-3">
	<label for="note-{sessionId}" class="sr-only">
		{m.app_notes_placeholder()} - {sessionTitle}
	</label>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div onkeydown={(e) => e.stopPropagation()} onclick={(e) => e.stopPropagation()}>
		<textarea
			id="note-{sessionId}"
			class="w-full resize-none rounded-md border bg-muted/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
			placeholder={m.app_notes_placeholder()}
			rows={3}
			bind:value={content}
			oninput={handleInput}
		></textarea>
	</div>
	<div class="flex items-center justify-between text-xs text-muted-foreground">
		<span>{charCount} {charCount === 1 ? 'char' : 'chars'}</span>
		{#if saved}
			<span class="flex items-center gap-1 text-green-600 dark:text-green-400">
				<CheckCircle2 class="h-3 w-3" />
				{m.app_notes_saved()}
			</span>
		{/if}
	</div>
</div>
