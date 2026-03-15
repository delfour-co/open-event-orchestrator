<script lang="ts">
import { Card } from '$lib/components/ui/card'
import * as m from '$lib/paraglide/messages'
import { Clock, MapPin, Users } from 'lucide-svelte'

interface SpeakerInfo {
  id: string
  firstName: string
  lastName: string
  company?: string
  bio?: string
  photoUrl?: string
  talks: Array<{
    id: string
    title: string
    date?: string
    startTime?: string
    endTime?: string
    roomName?: string
  }>
}

interface Props {
  speakers: SpeakerInfo[]
  formatDate: (date: string) => string
  formatTime: (time: string) => string
}

const { speakers, formatDate, formatTime }: Props = $props()
</script>

<div class="mx-auto max-w-4xl p-4">
	<h2 class="sr-only">{m.app_speakers_heading()}</h2>
	{#if speakers.length === 0}
		<Card class="p-12 text-center">
			<Users class="mx-auto h-12 w-12 text-muted-foreground" />
			<h3 class="mt-4 text-lg font-semibold">{m.app_speakers_empty_title()}</h3>
			<p class="mt-2 text-sm text-muted-foreground">
				{m.app_speakers_empty_description()}
			</p>
		</Card>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each speakers as speaker}
				<Card class="p-4">
					<div class="flex gap-3">
						{#if speaker.photoUrl}
							<img
								src={speaker.photoUrl}
								alt="{speaker.firstName} {speaker.lastName}"
								class="h-14 w-14 shrink-0 rounded-full object-cover"
							/>
						{:else}
							<div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted">
								<Users class="h-7 w-7 text-muted-foreground" />
							</div>
						{/if}
						<div class="flex-1 min-w-0">
							<h3 class="font-semibold">{speaker.firstName} {speaker.lastName}</h3>
							{#if speaker.company}
								<p class="text-sm text-muted-foreground">{speaker.company}</p>
							{/if}
						</div>
					</div>
					{#if speaker.talks.length > 0}
						<div class="mt-3 space-y-2 border-t pt-3">
							{#each speaker.talks as talk}
								<div class="rounded-md bg-muted/50 p-2">
									<p class="text-sm font-medium leading-snug">{talk.title}</p>
									{#if talk.startTime || talk.roomName}
										<div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
											{#if talk.date && talk.startTime}
												<span class="flex items-center gap-1">
													<Clock class="h-3 w-3" />
													{formatDate(talk.date)} · {formatTime(talk.startTime)}{#if talk.endTime}-{formatTime(talk.endTime)}{/if}
												</span>
											{/if}
											{#if talk.roomName}
												<span class="flex items-center gap-1">
													<MapPin class="h-3 w-3" />
													{talk.roomName}
												</span>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</Card>
			{/each}
		</div>
	{/if}
</div>
