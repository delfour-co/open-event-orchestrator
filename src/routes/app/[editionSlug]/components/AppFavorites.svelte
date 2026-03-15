<script lang="ts">
import { browser } from '$app/environment'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import { Card } from '$lib/components/ui/card'
import { AddToCalendarMenu, ReminderButton, SessionShareButton } from '$lib/features/app/ui'
import type { IcalEventInfo, IcalSession } from '$lib/features/planning/domain/ical-export'
import * as m from '$lib/paraglide/messages'
import { Clock, Heart, MapPin } from 'lucide-svelte'

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
  favoriteSessions: SessionEntry[]
  userFeedback: Map<
    string,
    { id: string; sessionId: string; numericValue: number; comment?: string }
  >
  showSessionFeedback: boolean
  calendarEventInfo: IcalEventInfo
  editionSlug: string
  formatDate: (date: string) => string
  formatTime: (time: string) => string
  getTypeColor: (type: string) => string
  formatSpeakers: (speakers: Array<{ firstName: string; lastName: string }>) => string
  toIcalSession: (
    session: unknown,
    slot: unknown,
    room: unknown,
    track: unknown,
    talk: unknown
  ) => IcalSession
  buildSessionStartTime: (slot: { date: string; startTime: string } | undefined) => string
  onToggleFavorite: (sessionId: string) => void
  onOpenSessionRating: (sessionId: string, sessionTitle: string) => void
  onSyncReminders: () => void
}

const {
  favoriteSessions,
  userFeedback,
  showSessionFeedback,
  calendarEventInfo,
  editionSlug,
  formatDate,
  formatTime,
  getTypeColor,
  formatSpeakers,
  toIcalSession,
  buildSessionStartTime,
  onToggleFavorite,
  onOpenSessionRating,
  onSyncReminders
}: Props = $props()
</script>

<div class="mx-auto max-w-4xl p-4">
	<h2 class="sr-only">{m.app_favorites_heading()}</h2>
	{#if favoriteSessions.length === 0}
		<Card class="p-12 text-center">
			<Heart class="mx-auto h-12 w-12 text-muted-foreground" />
			<h3 class="mt-4 text-lg font-semibold">{m.app_favorites_empty_title()}</h3>
			<p class="mt-2 text-sm text-muted-foreground">
				{m.app_favorites_empty_description()}
			</p>
		</Card>
	{:else}
		<div class="mb-4 flex justify-end">
			<AddToCalendarMenu
				sessions={favoriteSessions.map(({ session, slot, room, track, talk }) => toIcalSession(session, slot, room, track, talk))}
				eventInfo={calendarEventInfo}
				mode="bulk"
			/>
		</div>
		{@const sessionsByDate = favoriteSessions.reduce<
			Record<string, typeof favoriteSessions>
		>((acc, item) => {
			if (!item.slot) return acc
			const date = item.slot.date.split('T')[0]
			if (!acc[date]) acc[date] = []
			acc[date].push(item)
			return acc
		}, {})}

		<div class="space-y-6">
			{#each Object.entries(sessionsByDate).sort(([a], [b]) => a.localeCompare(b)) as [date, sessions]}
				<div>
					<h2 class="mb-3 text-sm font-semibold text-muted-foreground">
						{formatDate(date)}
					</h2>
					<div class="space-y-2">
						{#each sessions as { session, slot, room, track, talk }}
							<Card class="p-4">
								<!-- Time, Room & Favorite -->
								<div class="mb-2 flex items-center justify-between">
									<div class="flex items-center gap-3 text-xs text-muted-foreground">
										{#if slot}
											<span class="flex items-center gap-1 font-mono">
												<Clock class="h-3 w-3" />
												{formatTime(slot.startTime)}
											</span>
										{/if}
										{#if room}
											<span class="flex items-center gap-1">
												<MapPin class="h-3 w-3" />
												{room.name}
											</span>
										{/if}
									</div>
									<div class="flex items-center gap-0.5">
										<AddToCalendarMenu
											sessions={[toIcalSession(session, slot, room, track, talk)]}
											eventInfo={calendarEventInfo}
											mode="single"
										/>
										<SessionShareButton
											sessionTitle={session.title}
											sessionUrl={browser ? `${window.location.origin}/app/${editionSlug}?session=${session.id}` : ''}
										/>
										<button
											type="button"
											class="rounded-full p-1.5 transition-colors hover:bg-muted"
											onclick={() => onToggleFavorite(session.id)}
											aria-label={m.app_favorite_remove_agenda()}
										>
											<Heart class="h-4 w-4 fill-red-500 text-red-500" aria-hidden="true" />
										</button>
										<ReminderButton
											sessionId={session.id}
											sessionTitle={session.title}
											roomName={room?.name ?? ''}
											startTime={buildSessionStartTime(slot)}
											{editionSlug}
											onReminderChange={onSyncReminders}
										/>
									</div>
								</div>
								<!-- Title & Type -->
								<div class="flex items-start justify-between gap-2">
									<h3 class="font-semibold">{session.title}</h3>
									<Badge variant="outline" class="shrink-0 {getTypeColor(session.type)}">
										{session.type}
									</Badge>
								</div>
								{#if talk?.speakers && talk.speakers.length > 0}
									<p class="mt-1 text-sm text-muted-foreground">
										{formatSpeakers(talk.speakers)}
									</p>
								{/if}
								{#if showSessionFeedback}
									<div class="mt-3 flex justify-end">
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
									</div>
								{/if}
							</Card>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
