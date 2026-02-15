<script lang="ts">
import { Star, ThumbsDown, ThumbsUp } from 'lucide-svelte'
import { RATING_MODE_CONFIG, type RatingMode } from '../domain/rating-mode'

interface Props {
  mode: RatingMode
  value: number | null
  onValueChange: (value: number) => void
  disabled?: boolean
}

const { mode, value, onValueChange, disabled = false }: Props = $props()

const config = $derived(RATING_MODE_CONFIG[mode])

function handleSelect(newValue: number): void {
  if (disabled) return
  onValueChange(newValue)
}
</script>

<div class="space-y-2">
	<p class="text-sm font-medium text-center">{config.description}</p>

	{#if mode === 'stars'}
		<div class="flex justify-center gap-1">
			{#each Array.from({ length: 5 }, (_, i) => i + 1) as star}
				<button
					type="button"
					class="rounded p-1 transition-all hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50 {value && star <= value ? 'text-yellow-500' : 'text-gray-300'}"
					onclick={() => handleSelect(star)}
					{disabled}
					aria-label="{config.labels[star - 1]} ({star} stars)"
				>
					<Star
						class="h-8 w-8 {value && star <= value ? 'fill-current' : ''}"
					/>
				</button>
			{/each}
		</div>
		{#if value}
			<p class="text-sm text-muted-foreground text-center">{config.labels[value - 1]}</p>
		{/if}
	{:else if mode === 'scale_10'}
		<div class="flex flex-wrap justify-center gap-2">
			{#each Array.from({ length: 10 }, (_, i) => i + 1) as num}
				<button
					type="button"
					class="flex h-12 w-12 items-center justify-center rounded-lg border-2 font-semibold transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 {value === num ? 'border-primary bg-primary text-primary-foreground' : 'border-muted hover:border-primary/50'}"
					onclick={() => handleSelect(num)}
					{disabled}
					aria-label="Rating {num}"
				>
					{num}
				</button>
			{/each}
		</div>
	{:else if mode === 'thumbs'}
		<div class="flex justify-center gap-4">
			<button
				type="button"
				class="flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 {value === 0 ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950' : 'border-muted hover:border-red-300'}"
				onclick={() => handleSelect(0)}
				{disabled}
				aria-label="Thumbs down"
			>
				<ThumbsDown class="h-8 w-8" />
				<span class="text-sm font-medium">Down</span>
			</button>
			<button
				type="button"
				class="flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 {value === 1 ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950' : 'border-muted hover:border-green-300'}"
				onclick={() => handleSelect(1)}
				{disabled}
				aria-label="Thumbs up"
			>
				<ThumbsUp class="h-8 w-8" />
				<span class="text-sm font-medium">Up</span>
			</button>
		</div>
	{:else if mode === 'yes_no'}
		<div class="flex justify-center gap-4">
			<button
				type="button"
				class="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 p-4 font-medium transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 {value === 0 ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950' : 'border-muted hover:border-red-300'}"
				onclick={() => handleSelect(0)}
				{disabled}
				aria-label="No"
			>
				No
			</button>
			<button
				type="button"
				class="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 p-4 font-medium transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 {value === 1 ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950' : 'border-muted hover:border-green-300'}"
				onclick={() => handleSelect(1)}
				{disabled}
				aria-label="Yes"
			>
				Yes
			</button>
		</div>
	{/if}
</div>
