<script lang="ts">
import { browser } from '$app/environment'
import { Badge } from '$lib/components/ui/badge'
import * as Dialog from '$lib/components/ui/dialog'
import * as m from '$lib/paraglide/messages'
import { Clock, MapPin, Search, Users, X } from 'lucide-svelte'

const RECENT_SEARCHES_KEY = 'oeo-recent-searches'
const MAX_RECENT_SEARCHES = 5
const DEBOUNCE_MS = 300

interface Session {
  id: string
  slotId: string
  talkId?: string
  trackId?: string
  title: string
  type: string
  description?: string
}

interface Talk {
  id: string
  title: string
  abstract: string
  speakers: Array<{
    id: string
    firstName: string
    lastName: string
    company?: string
    bio?: string
    photoUrl?: string
  }>
}

interface Slot {
  id: string
  roomId: string
  date: string
  startTime: string
  endTime: string
}

interface Room {
  id: string
  name: string
}

interface Track {
  id: string
  name: string
  color: string
}

interface SessionResult {
  type: 'session'
  session: Session
  talk?: Talk
  slot?: Slot
  room?: Room
  track?: Track
}

interface SpeakerResult {
  type: 'speaker'
  id: string
  firstName: string
  lastName: string
  company?: string
  photoUrl?: string
  talkTitles: string[]
}

type SearchResult = SessionResult | SpeakerResult

interface Props {
  open: boolean
  sessions: Session[]
  talks: Talk[]
  slots: Slot[]
  rooms: Room[]
  tracks: Track[]
  onClose: () => void
  onSelectSession: (sessionId: string) => void
  onSelectSpeaker: (speakerId: string) => void
}

const {
  open,
  sessions,
  talks,
  slots,
  rooms,
  tracks,
  onClose,
  onSelectSession,
  onSelectSpeaker
}: Props = $props()

let query = $state('')
let debouncedQuery = $state('')
let debounceTimer: ReturnType<typeof setTimeout> | undefined
let recentSearches = $state<string[]>([])
let inputRef = $state<HTMLInputElement | null>(null)

// Load recent searches from localStorage
$effect(() => {
  if (browser && open) {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        recentSearches = JSON.parse(stored) as string[]
      }
    } catch {
      // Ignore
    }
    // Reset query when opening
    query = ''
    debouncedQuery = ''
    // Focus input after dialog opens
    setTimeout(() => inputRef?.focus(), 100)
  }
})

// Debounce query
$effect(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  const currentQuery = query
  debounceTimer = setTimeout(() => {
    debouncedQuery = currentQuery
  }, DEBOUNCE_MS)
  return () => {
    if (debounceTimer) clearTimeout(debounceTimer)
  }
})

function saveRecentSearch(term: string): void {
  if (!browser || !term.trim()) return
  const trimmed = term.trim()
  const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(
    0,
    MAX_RECENT_SEARCHES
  )
  recentSearches = updated
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  } catch {
    // Ignore
  }
}

function clearRecentSearches(): void {
  recentSearches = []
  if (browser) {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    } catch {
      // Ignore
    }
  }
}

function useRecentSearch(term: string): void {
  query = term
  debouncedQuery = term
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Search across multiple entity types with scoring
const results: SearchResult[] = $derived.by(() => {
  const q = debouncedQuery.trim().toLowerCase()
  if (!q) return []

  const sessionResults: SessionResult[] = []
  const speakerMap = new Map<
    string,
    {
      id: string
      firstName: string
      lastName: string
      company?: string
      photoUrl?: string
      talkTitles: string[]
    }
  >()

  // Search sessions by title, description, and associated talk title/abstract
  for (const session of sessions) {
    const talk = session.talkId ? talks.find((t) => t.id === session.talkId) : undefined
    const titleMatch = session.title.toLowerCase().includes(q)
    const descMatch = session.description?.toLowerCase().includes(q) ?? false
    const talkTitleMatch = talk?.title.toLowerCase().includes(q) ?? false
    const talkAbstractMatch = talk?.abstract.toLowerCase().includes(q) ?? false
    const speakerMatch =
      talk?.speakers.some(
        (s) =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
          (s.company?.toLowerCase().includes(q) ?? false)
      ) ?? false

    if (titleMatch || descMatch || talkTitleMatch || talkAbstractMatch || speakerMatch) {
      const slot = slots.find((s) => s.id === session.slotId)
      const room = slot ? rooms.find((r) => r.id === slot.roomId) : undefined
      const track = session.trackId ? tracks.find((t) => t.id === session.trackId) : undefined
      sessionResults.push({ type: 'session', session, talk, slot, room, track })
    }
  }

  // Search speakers by name, company
  for (const talk of talks) {
    for (const speaker of talk.speakers) {
      const nameMatch = `${speaker.firstName} ${speaker.lastName}`.toLowerCase().includes(q)
      const companyMatch = speaker.company?.toLowerCase().includes(q) ?? false

      if (nameMatch || companyMatch) {
        if (!speakerMap.has(speaker.id)) {
          speakerMap.set(speaker.id, {
            id: speaker.id,
            firstName: speaker.firstName,
            lastName: speaker.lastName,
            company: speaker.company,
            photoUrl: speaker.photoUrl,
            talkTitles: []
          })
        }
        const existing = speakerMap.get(speaker.id)
        if (existing && !existing.talkTitles.includes(talk.title)) {
          existing.talkTitles.push(talk.title)
        }
      }
    }
  }

  const speakerResults: SpeakerResult[] = Array.from(speakerMap.values())
    .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
    .map((s) => ({ type: 'speaker' as const, ...s }))

  return [...sessionResults.slice(0, 10), ...speakerResults.slice(0, 10)]
})

const sessionResults = $derived(results.filter((r): r is SessionResult => r.type === 'session'))
const speakerResultsList = $derived(results.filter((r): r is SpeakerResult => r.type === 'speaker'))
const sessionResultsCount = $derived(sessionResults.length)
const speakerResultsCount = $derived(speakerResultsList.length)

function handleResultClick(result: SearchResult): void {
  saveRecentSearch(debouncedQuery)
  if (result.type === 'session') {
    onSelectSession(result.session.id)
  } else {
    onSelectSpeaker(result.id)
  }
  onClose()
}

function formatTime(time: string): string {
  return time.slice(0, 5)
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date))
}

function highlightMatch(text: string, q: string): Array<{ text: string; highlight: boolean }> {
  if (!q.trim()) return [{ text, highlight: false }]
  const lower = text.toLowerCase()
  const qLower = q.trim().toLowerCase()
  const parts: Array<{ text: string; highlight: boolean }> = []
  let lastIndex = 0

  let idx = lower.indexOf(qLower, lastIndex)
  while (idx !== -1) {
    if (idx > lastIndex) {
      parts.push({ text: text.slice(lastIndex, idx), highlight: false })
    }
    parts.push({ text: text.slice(idx, idx + qLower.length), highlight: true })
    lastIndex = idx + qLower.length
    idx = lower.indexOf(qLower, lastIndex)
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlight: false })
  }

  return parts.length > 0 ? parts : [{ text, highlight: false }]
}
</script>

{#if open}
  <Dialog.Content class="max-w-lg max-h-[80vh] flex flex-col p-0" onClose={onClose}>
    <!-- Search Input -->
    <div class="flex items-center gap-2 border-b px-4 py-3">
      <Search class="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input
        bind:this={inputRef}
        type="text"
        placeholder={m.app_search_placeholder()}
        bind:value={query}
        class="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        data-testid="search-input"
      />
      {#if query}
        <button
          type="button"
          class="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
          onclick={() => { query = ''; debouncedQuery = '' }}
          aria-label={m.app_search_clear()}
        >
          <X class="h-4 w-4" />
        </button>
      {/if}
    </div>

    <!-- Results -->
    <div class="flex-1 overflow-y-auto px-2 py-2" style="max-height: 60vh;">
      {#if debouncedQuery.trim() && results.length === 0}
        <div class="px-4 py-8 text-center text-sm text-muted-foreground">
          {m.app_search_no_results}
        </div>
      {:else if debouncedQuery.trim() && results.length > 0}
        <!-- Session Results -->
        {#if sessionResultsCount > 0}
          <div class="px-2 py-1.5">
            <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {m.app_search_sessions()} ({sessionResultsCount})
            </p>
          </div>
          {#each sessionResults as result}
            {#if result.type === 'session'}
              <button
                type="button"
                class="w-full rounded-md px-2 py-2 text-left transition-colors hover:bg-muted focus:bg-muted focus:outline-none"
                data-testid="search-result-session-{result.session.id}"
                onclick={() => handleResultClick(result)}
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium leading-snug">
                      {#each highlightMatch(result.session.title, debouncedQuery) as part}
                        {#if part.highlight}
                          <mark class="bg-yellow-200 dark:bg-yellow-800 rounded-sm">{part.text}</mark>
                        {:else}
                          {part.text}
                        {/if}
                      {/each}
                    </p>
                    {#if result.talk?.speakers && result.talk.speakers.length > 0}
                      <p class="text-xs text-muted-foreground mt-0.5">
                        {#each highlightMatch(result.talk.speakers.map((s) => `${s.firstName} ${s.lastName}`).join(', '), debouncedQuery) as part}
                          {#if part.highlight}
                            <mark class="bg-yellow-200 dark:bg-yellow-800 rounded-sm">{part.text}</mark>
                          {:else}
                            {part.text}
                          {/if}
                        {/each}
                      </p>
                    {/if}
                  </div>
                  <Badge variant="outline" class="shrink-0 text-[10px]">{result.session.type}</Badge>
                </div>
                <div class="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  {#if result.slot}
                    <span class="flex items-center gap-1">
                      <Clock class="h-3 w-3" />
                      {formatDate(result.slot.date)} {formatTime(result.slot.startTime)}
                    </span>
                  {/if}
                  {#if result.room}
                    <span class="flex items-center gap-1">
                      <MapPin class="h-3 w-3" />
                      {result.room.name}
                    </span>
                  {/if}
                  {#if result.track}
                    <span class="flex items-center gap-1">
                      <span
                        class="h-2 w-2 rounded-full inline-block"
                        style="background-color: {result.track.color}"
                      ></span>
                      {result.track.name}
                    </span>
                  {/if}
                </div>
              </button>
            {/if}
          {/each}
        {/if}

        <!-- Speaker Results -->
        {#if speakerResultsCount > 0}
          <div class="px-2 py-1.5 {sessionResultsCount > 0 ? 'mt-2 border-t pt-3' : ''}">
            <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {m.app_search_speakers()} ({speakerResultsCount})
            </p>
          </div>
          {#each speakerResultsList as result}
            {#if result.type === 'speaker'}
              <button
                type="button"
                class="w-full rounded-md px-2 py-2 text-left transition-colors hover:bg-muted focus:bg-muted focus:outline-none"
                data-testid="search-result-speaker-{result.id}"
                onclick={() => handleResultClick(result)}
              >
                <div class="flex items-center gap-3">
                  {#if result.photoUrl}
                    <img
                      src={result.photoUrl}
                      alt="{result.firstName} {result.lastName}"
                      class="h-8 w-8 shrink-0 rounded-full object-cover"
                    />
                  {:else}
                    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Users class="h-4 w-4 text-muted-foreground" />
                    </div>
                  {/if}
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium">
                      {#each highlightMatch(`${result.firstName} ${result.lastName}`, debouncedQuery) as part}
                        {#if part.highlight}
                          <mark class="bg-yellow-200 dark:bg-yellow-800 rounded-sm">{part.text}</mark>
                        {:else}
                          {part.text}
                        {/if}
                      {/each}
                    </p>
                    {#if result.company}
                      <p class="text-xs text-muted-foreground">
                        {#each highlightMatch(result.company, debouncedQuery) as part}
                          {#if part.highlight}
                            <mark class="bg-yellow-200 dark:bg-yellow-800 rounded-sm">{part.text}</mark>
                          {:else}
                            {part.text}
                          {/if}
                        {/each}
                      </p>
                    {/if}
                    {#if result.talkTitles.length > 0}
                      <p class="text-xs text-muted-foreground mt-0.5 truncate">
                        {result.talkTitles.join(', ')}
                      </p>
                    {/if}
                  </div>
                </div>
              </button>
            {/if}
          {/each}
        {/if}
      {:else if !debouncedQuery.trim() && recentSearches.length > 0}
        <!-- Recent Searches -->
        <div class="px-2 py-1.5 flex items-center justify-between">
          <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {m.app_search_recent()}
          </p>
          <button
            type="button"
            class="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onclick={clearRecentSearches}
          >
            {m.app_search_clear_recent()}
          </button>
        </div>
        {#each recentSearches as term}
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted focus:bg-muted focus:outline-none"
            onclick={() => useRecentSearch(term)}
          >
            <Search class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            {term}
          </button>
        {/each}
      {:else if !debouncedQuery.trim()}
        <div class="px-4 py-8 text-center text-sm text-muted-foreground">
          {m.app_search_placeholder()}
        </div>
      {/if}
    </div>

    <!-- Footer with keyboard shortcut hint -->
    <div class="border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
      <span>{m.app_search_hint()}</span>
      <kbd class="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>
    </div>
  </Dialog.Content>
{/if}
