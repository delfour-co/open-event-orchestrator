<script lang="ts">
import * as m from '$lib/paraglide/messages'
import { Calendar, Heart, MessageSquare, ScanLine, Ticket, Users } from 'lucide-svelte'

type ViewType = 'schedule' | 'speakers' | 'favorites' | 'feedback' | 'ticket' | 'networking'

interface Props {
  currentView: ViewType
  showSpeakers: boolean
  showFavorites: boolean
  showTickets: boolean
  showNetworking: boolean
  showFeedback: boolean
  favoritesCount: number
  onSwitchView: (view: ViewType) => void
}

const {
  currentView,
  showSpeakers,
  showFavorites,
  showTickets,
  showNetworking,
  showFeedback,
  favoritesCount,
  onSwitchView
}: Props = $props()

function tabClass(view: ViewType): string {
  return `flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${currentView === view ? 'text-primary border-t-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`
}
</script>

<nav class="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur safe-area-bottom" aria-label={m.app_nav_label()}>
	<div class="mx-auto flex max-w-4xl">
		<button
			type="button"
			data-testid="schedule-tab"
			class={tabClass('schedule')}
			onclick={() => onSwitchView('schedule')}
			aria-current={currentView === 'schedule' ? 'page' : undefined}
		>
			<Calendar class="h-5 w-5" aria-hidden="true" />
			<span>{m.app_nav_schedule()}</span>
		</button>
		{#if showFavorites}
			<button
				type="button"
				data-testid="favorites-tab"
				class="relative {tabClass('favorites')}"
				onclick={() => onSwitchView('favorites')}
				aria-current={currentView === 'favorites' ? 'page' : undefined}
			>
				<Heart class="h-5 w-5" aria-hidden="true" />
				<span>{m.app_nav_favorites()}</span>
				{#if favoritesCount > 0}
					<span class="absolute right-1/4 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground" aria-hidden="true">{favoritesCount}</span>
				{/if}
			</button>
		{/if}
		{#if showSpeakers}
			<button
				type="button"
				data-testid="speakers-tab"
				class={tabClass('speakers')}
				onclick={() => onSwitchView('speakers')}
				aria-current={currentView === 'speakers' ? 'page' : undefined}
			>
				<Users class="h-5 w-5" aria-hidden="true" />
				<span>{m.app_nav_speakers()}</span>
			</button>
		{/if}
		{#if showTickets}
			<button
				type="button"
				data-testid="tickets-tab"
				class={tabClass('ticket')}
				onclick={() => onSwitchView('ticket')}
				aria-current={currentView === 'ticket' ? 'page' : undefined}
			>
				<Ticket class="h-5 w-5" aria-hidden="true" />
				<span>{m.app_nav_my_ticket()}</span>
			</button>
		{/if}
		{#if showNetworking}
			<button
				type="button"
				data-testid="networking-tab"
				class={tabClass('networking')}
				onclick={() => onSwitchView('networking')}
				aria-current={currentView === 'networking' ? 'page' : undefined}
			>
				<ScanLine class="h-5 w-5" aria-hidden="true" />
				<span>{m.app_nav_networking()}</span>
			</button>
		{/if}
		{#if showFeedback}
			<button
				type="button"
				data-testid="feedback-tab"
				class={tabClass('feedback')}
				onclick={() => onSwitchView('feedback')}
				aria-current={currentView === 'feedback' ? 'page' : undefined}
			>
				<MessageSquare class="h-5 w-5" aria-hidden="true" />
				<span>{m.app_nav_feedback()}</span>
			</button>
		{/if}
	</div>
</nav>
