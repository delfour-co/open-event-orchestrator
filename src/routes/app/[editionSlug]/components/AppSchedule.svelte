<script lang="ts">
import { browser } from '$app/environment'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import { Card } from '$lib/components/ui/card'
import {
  AddToCalendarMenu,
  AppFilterPanel,
  ReminderButton,
  SessionNoteEditor,
  SessionShareButton
} from '$lib/features/app/ui'
import type { IcalEventInfo, IcalSession } from '$lib/features/planning/domain/ical-export'
import * as m from '$lib/paraglide/messages'
import { Calendar, Clock, Filter, Heart, Map as MapIcon, MapPin, StickyNote } from 'lucide-svelte'

interface SessionEntry {
  session: {
    id: string
    title: string
    description?: string
    type: string
    talkId?: string
    trackId?: string
    slotId: string
  }
  slot: { id: string; date: string; startTime: string; endTime: string; roomId: string } | undefined
  room: { id: string; name: string; floor?: string } | undefined
  track: { id: string; name: string; color?: string } | undefined
  talk:
    | {
        id: string
        title: string
        speakers: Array<{ id: string; firstName: string; lastName: string }>
      }
    | undefined
}

interface Props {
  uniqueDates: string[]
  selectedDay: string
  sessionsForDay: SessionEntry[]
  favorites: Set<string>
  showFavorites: boolean
  showSessionFeedback: boolean
  showFilterPanel: boolean
  activeFilterCount: number
  tracks: Array<{ id: string; name: string; color: string }>
  rooms: Array<{ id: string; name: string; floor?: string }>
  sessionTypes: string[]
  selectedTrackIds: Set<string>
  selectedTypes: Set<string>
  selectedRoomIds: Set<string>
  expandedSessionId: string | null
  highlightedSessionId: string | null
  expandedNoteSessionId: string | null
  userFeedback: Map<
    string,
    { id: string; sessionId: string; numericValue: number; comment?: string }
  >
  calendarEventInfo: IcalEventInfo
  editionSlug: string
  formatDate: (date: string) => string
  formatTime: (time: string) => string
  getTypeColor: (type: string) => string
  formatSpeakers: (speakers: Array<{ firstName: string; lastName: string }>) => string
  toIcalSession: (
    session: { id: string; title: string; description?: string },
    slot: { date: string; startTime: string; endTime: string } | undefined,
    room: { name: string; floor?: string } | undefined,
    track: { name: string; color?: string } | undefined,
    talk: { speakers: Array<{ firstName: string; lastName: string }> } | undefined
  ) => IcalSession
  buildSessionStartTime: (slot: { date: string; startTime: string } | undefined) => string
  sessionHasNote: (sessionId: string) => boolean
  onSelectDay: (day: string) => void
  onToggleFavorite: (sessionId: string) => void
  onToggleSessionExpanded: (sessionId: string) => void
  onHandleSessionKeydown: (event: KeyboardEvent, sessionId: string) => void
  onOpenVenueMap: (roomId?: string) => void
  onOpenFilterPanel: () => void
  onCloseFilterPanel: () => void
  onApplyFilters: (filters: {
    trackIds: Set<string>
    types: Set<string>
    roomIds: Set<string>
  }) => void
  onOpenSessionRating: (sessionId: string, sessionTitle: string) => void
  onToggleNoteEditor: (sessionId: string) => void
  onNoteSaved: () => void
  onSyncReminders: () => void
}

const {
  uniqueDates,
  selectedDay,
  sessionsForDay,
  favorites,
  showFavorites,
  showSessionFeedback,
  showFilterPanel,
  activeFilterCount,
  tracks,
  rooms,
  sessionTypes,
  selectedTrackIds,
  selectedTypes,
  selectedRoomIds,
  expandedSessionId,
  highlightedSessionId,
  expandedNoteSessionId,
  userFeedback,
  calendarEventInfo,
  editionSlug,
  formatDate,
  formatTime,
  getTypeColor,
  formatSpeakers,
  toIcalSession,
  buildSessionStartTime,
  sessionHasNote,
  onSelectDay,
  onToggleFavorite,
  onToggleSessionExpanded,
  onHandleSessionKeydown,
  onOpenVenueMap,
  onOpenFilterPanel,
  onCloseFilterPanel,
  onApplyFilters,
  onOpenSessionRating,
  onToggleNoteEditor,
  onNoteSaved,
  onSyncReminders
}: Props = $props()
</script>

<div class="mx-auto max-w-4xl">
	<h2 class="sr-only">{m.app_schedule_heading()}</h2>
	<!-- Day Selector -->
	{#if uniqueDates.length > 0}
		<div class="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
			<div class="flex gap-2 overflow-x-auto px-4 py-3">
				{#each uniqueDates as dateStr}
					<button
						type="button"
						data-testid="day-selector-{dateStr}"
						class="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors {selectedDay === dateStr ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}"
						onclick={() => onSelectDay(dateStr)}
					>
						{formatDate(dateStr)}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Advanced Filters Button -->
	<div class="border-b bg-muted/30 px-4 py-2" role="group" aria-label={m.app_filter_sessions()}>
		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				class="h-8 gap-1.5 text-xs"
				onclick={onOpenFilterPanel}
				data-testid="open-filters-button"
			>
				<Filter class="h-3.5 w-3.5" />
				{m.app_filter_title()}
				{#if activeFilterCount > 0}
					<span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
						{activeFilterCount}
					</span>
				{/if}
			</Button>
			{#if activeFilterCount > 0}
				<Button
					variant="ghost"
					size="sm"
					class="h-8 text-xs text-muted-foreground"
					onclick={() => onApplyFilters({ trackIds: new Set(), types: new Set(), roomIds: new Set() })}
				>
					{m.app_filter_clear_all()}
				</Button>
			{/if}
			{#if rooms.length > 0}
				<Button
					variant="outline"
					size="sm"
					class="h-8 gap-1.5 text-xs ml-auto"
					onclick={() => onOpenVenueMap()}
					data-testid="open-map-button"
				>
					<MapIcon class="h-3.5 w-3.5" />
					{m.app_map_button()}
				</Button>
			{/if}
		</div>
	</div>

	<!-- Session List -->
	<div class="space-y-2 p-4" aria-live="polite">
		{#if sessionsForDay.length === 0}
			<Card class="p-12 text-center">
				<Calendar class="mx-auto h-12 w-12 text-muted-foreground" />
				<h3 class="mt-4 text-lg font-semibold">{m.app_schedule_empty_title()}</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					{m.app_schedule_empty_description()}
				</p>
			</Card>
		{:else}
			{#each sessionsForDay as { session, slot, room, track, talk }}
				{@const isExpanded = expandedSessionId === session.id}
				<Card
					data-testid="session-card-{session.id}"
					class="group relative overflow-hidden transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-primary/50 {highlightedSessionId === session.id ? 'ring-2 ring-primary ring-offset-2' : ''}"
					tabindex={0}
					role="button"
					aria-expanded={isExpanded}
					aria-label="{session.title} — {isExpanded ? m.app_collapse_session() : m.app_expand_session()}"
					onkeydown={(e: KeyboardEvent) => onHandleSessionKeydown(e, session.id)}
					onclick={() => onToggleSessionExpanded(session.id)}
				>
					<div class="p-4">
						<!-- Time, Room & Favorite -->
						<div class="mb-2 flex items-center justify-between">
							<div class="flex items-center gap-3 text-xs text-muted-foreground">
								{#if slot}
									<span class="flex items-center gap-1 font-mono">
										<Clock class="h-3 w-3" />
										{formatTime(slot.startTime)} - {formatTime(slot.endTime)}
									</span>
								{/if}
								{#if room}
									<button
										type="button"
										class="flex items-center gap-1 hover:text-primary hover:underline"
										onclick={(e) => { e.stopPropagation(); onOpenVenueMap(room.id) }}
										aria-label="{room.name} - {m.app_map_title()}"
										data-testid="room-link-{room.id}"
									>
										<MapPin class="h-3 w-3" />
										{room.name}
									</button>
								{/if}
							</div>
							<!-- Stop propagation on interactive children so card click/keydown doesn't fire -->
							<div class="flex items-center gap-0.5" onclick={(e: MouseEvent) => e.stopPropagation()} onkeydown={(e: KeyboardEvent) => e.stopPropagation()} role="presentation">
								<AddToCalendarMenu
									sessions={[toIcalSession(session, slot, room, track, talk)]}
									eventInfo={calendarEventInfo}
									mode="single"
								/>
								<SessionShareButton
									sessionTitle={session.title}
									sessionUrl={browser ? `${window.location.origin}/app/${editionSlug}?session=${session.id}` : ''}
								/>
								{#if showFavorites}
									<button
										type="button"
										data-testid="favorite-button-{session.id}"
										class="rounded-full p-1.5 transition-colors hover:bg-muted"
										onclick={() => onToggleFavorite(session.id)}
										aria-label={favorites.has(session.id) ? m.app_favorite_remove() : m.app_favorite_add()}
										aria-pressed={favorites.has(session.id)}
									>
										<Heart
											class="h-4 w-4 {favorites.has(session.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'}"
											aria-hidden="true"
										/>
									</button>
								{/if}
								<ReminderButton
									sessionId={session.id}
									sessionTitle={session.title}
									roomName={room?.name ?? ''}
									startTime={buildSessionStartTime(slot)}
									{editionSlug}
									onReminderChange={onSyncReminders}
								/>
								<button
									type="button"
									data-testid="note-button-{session.id}"
									class="rounded-full p-1.5 transition-colors hover:bg-muted"
									onclick={() => onToggleNoteEditor(session.id)}
									aria-label={m.app_notes_indicator()}
									aria-pressed={expandedNoteSessionId === session.id}
								>
									<StickyNote
										class="h-4 w-4 {sessionHasNote(session.id) ? 'fill-amber-200 text-amber-600 dark:fill-amber-800 dark:text-amber-400' : 'text-muted-foreground hover:text-amber-500'}"
										aria-hidden="true"
									/>
								</button>
							</div>
						</div>

						<!-- Title & Type -->
						<div class="flex items-start justify-between gap-2">
							<div class="flex-1 space-y-1">
								<h3 class="font-semibold leading-snug">{session.title}</h3>
								{#if talk?.speakers && talk.speakers.length > 0}
									<p class="text-sm text-muted-foreground">
										{formatSpeakers(talk.speakers)}
									</p>
								{/if}
							</div>
							<Badge variant="outline" class="shrink-0 {getTypeColor(session.type)}">
								{session.type}
							</Badge>
						</div>

						<!-- Track & Feedback Row -->
						<div class="mt-3 flex items-center justify-between gap-2">
							{#if track}
								<div class="flex items-center gap-1.5 text-xs">
									<span
										class="h-2 w-2 rounded-full"
										style="background-color: {track.color}"
									></span>
									<span class="text-muted-foreground">{track.name}</span>
								</div>
							{:else}
								<div></div>
							{/if}
							<!-- Stop propagation on feedback button -->
							<div onclick={(e: MouseEvent) => e.stopPropagation()} onkeydown={(e: KeyboardEvent) => e.stopPropagation()} role="presentation">
								{#if showSessionFeedback}
									<Button
										variant="outline"
										size="sm"
										class="h-7 text-xs"
										onclick={() => onOpenSessionRating(session.id, session.title)}
									>
										{#if userFeedback.has(session.id)}
											{m.app_feedback_modify()}
										{:else}
											{m.app_feedback_give()}
										{/if}
									</Button>
								{/if}
							</div>
						</div>

									{#if expandedNoteSessionId === session.id}
										<SessionNoteEditor
											sessionId={session.id}
											sessionTitle={session.title}
											onSaved={onNoteSaved}
										/>
									{/if}
					</div>
				</Card>
			{/each}
		{/if}
	</div>
</div>

<!-- Advanced Filter Panel -->
<AppFilterPanel
  open={showFilterPanel}
  {tracks}
  {rooms}
  {sessionTypes}
  {selectedTrackIds}
  {selectedTypes}
  {selectedRoomIds}
  onApply={onApplyFilters}
  onClose={onCloseFilterPanel}
/>
