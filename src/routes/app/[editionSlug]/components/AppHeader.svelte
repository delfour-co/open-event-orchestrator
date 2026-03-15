<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as m from '$lib/paraglide/messages'
import { isMotionReduced } from '$lib/stores/reduced-motion'
import {
  Calendar,
  FileDown,
  MapPin,
  Moon,
  RefreshCw,
  Search,
  Sun,
  Wifi,
  WifiOff,
  Zap,
  ZapOff
} from 'lucide-svelte'

interface Props {
  editionName: string
  appTitle?: string
  appSubtitle?: string
  logoUrl?: string
  headerImageUrl?: string
  startDate: string
  venue?: string
  online: boolean
  isSyncing: boolean
  lastSyncTime: number | null
  currentTheme: 'light' | 'dark' | 'system'
  currentReducedMotion: 'system' | 'on' | 'off'
  formatLastSync: (timestamp: number) => string
  onSearch: () => void
  onExportNotes: () => void
  onToggleReducedMotion: () => void
  onToggleTheme: () => void
  onSyncData: () => void
  formatDate: (date: string) => string
}

const {
  editionName,
  appTitle,
  appSubtitle,
  logoUrl,
  headerImageUrl,
  startDate,
  venue,
  online,
  isSyncing,
  lastSyncTime,
  currentTheme,
  currentReducedMotion,
  formatLastSync,
  onSearch,
  onExportNotes,
  onToggleReducedMotion,
  onToggleTheme,
  onSyncData,
  formatDate
}: Props = $props()

const displayTitle = $derived(appTitle || editionName)
</script>

<header class="relative border-b bg-card overflow-hidden">
	{#if headerImageUrl}
		<div class="absolute inset-0">
			<img
				src={headerImageUrl}
				alt=""
				aria-hidden="true"
				class="h-full w-full object-cover opacity-20"
			/>
			<div class="absolute inset-0 bg-gradient-to-b from-transparent to-card"></div>
		</div>
	{/if}
	<div class="relative mx-auto max-w-4xl px-4 py-6">
		<div class="flex items-start justify-between">
			<div class="flex items-center gap-4">
				{#if logoUrl}
					<img
						src={logoUrl}
						alt="{displayTitle} logo"
						class="h-12 w-12 rounded-lg object-contain"
					/>
				{/if}
				<div>
					<h1 data-testid="edition-name" class="text-2xl font-bold tracking-tight">{displayTitle}</h1>
					{#if appSubtitle}
						<p class="text-sm text-muted-foreground">{appSubtitle}</p>
					{/if}
				</div>
			</div>
			<div class="flex items-center gap-1">
				<!-- Search Button -->
				<Button onclick={onSearch} variant="ghost" size="icon" class="shrink-0" title={m.app_search_button()} data-testid="search-button">
					<Search class="h-5 w-5" />
					<span class="sr-only">{m.app_search_button()}</span>
				</Button>
				<!-- Export Notes Button -->
				<Button onclick={onExportNotes} variant="ghost" size="icon" class="shrink-0" title={m.app_notes_export()} data-testid="export-notes-button">
					<FileDown class="h-5 w-5" />
					<span class="sr-only">{m.app_notes_export()}</span>
				</Button>
				<!-- Reduced Motion Toggle -->
				<Button onclick={onToggleReducedMotion} variant="ghost" size="icon" class="shrink-0" title={m.app_toggle_reduced_motion()}>
					{#if isMotionReduced(currentReducedMotion)}
						<ZapOff class="h-5 w-5" />
					{:else}
						<Zap class="h-5 w-5" />
					{/if}
					<span class="sr-only">{m.app_toggle_reduced_motion()}</span>
				</Button>
				<!-- Theme Toggle -->
				<Button onclick={onToggleTheme} variant="ghost" size="icon" class="shrink-0" title={m.app_toggle_theme()}>
					{#if currentTheme === 'dark'}
						<Sun class="h-5 w-5" />
					{:else}
						<Moon class="h-5 w-5" />
					{/if}
					<span class="sr-only">{m.app_toggle_theme()}</span>
				</Button>
			</div>
		</div>
		<div class="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
			<div class="flex items-center gap-1.5">
				<Calendar class="h-4 w-4" />
				<span>{formatDate(startDate)}</span>
			</div>
			{#if venue}
				<div class="flex items-center gap-1.5">
					<MapPin class="h-4 w-4" />
					<span>{venue}</span>
				</div>
			{/if}
		</div>
		<!-- Sync status -->
		<div class="mt-3 flex flex-wrap items-center gap-3 text-xs">
			{#if online}
				<div class="flex items-center gap-1.5 text-green-600 dark:text-green-400">
					<Wifi class="h-3.5 w-3.5" />
					<span>{m.app_online()}</span>
				</div>
			{:else}
				<div class="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
					<WifiOff class="h-3.5 w-3.5" />
					<span class="font-medium">{m.app_cached()}</span>
				</div>
			{/if}
			{#if lastSyncTime}
				<span class="text-muted-foreground">
					{m.app_last_sync({ time: formatLastSync(lastSyncTime) })}
				</span>
			{/if}
			{#if online}
				<button
					type="button"
					class="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
					onclick={onSyncData}
					disabled={isSyncing}
				>
					<RefreshCw class="h-3 w-3 {isSyncing ? 'animate-spin' : ''}" />
					<span>{m.app_sync_now()}</span>
				</button>
			{/if}
		</div>
	</div>
</header>
