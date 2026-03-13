<script lang="ts">
import { browser } from '$app/environment'
import { reminderService } from '$lib/features/app/services'
import * as m from '$lib/paraglide/messages'
import { Bell, BellOff, BellRing } from 'lucide-svelte'

interface Props {
  sessionId: string
  sessionTitle: string
  roomName: string
  startTime: string
  editionSlug: string
  onReminderChange?: (sessionId: string, enabled: boolean) => void
}

const { sessionId, sessionTitle, roomName, startTime, editionSlug, onReminderChange }: Props =
  $props()

let isEnabled = $state(false)
let showOptions = $state(false)
let permissionDenied = $state(false)
let reminderMinutes = $state(15)

// Load state on init
$effect(() => {
  if (!browser) return
  isEnabled = reminderService.hasReminder(sessionId)
  reminderMinutes = reminderService.getDefaultReminderMinutes()
})

function isSessionPast(): boolean {
  if (!startTime) return true
  const sessionStart = new Date(startTime)
  return sessionStart.getTime() <= Date.now()
}

async function toggleReminder(): Promise<void> {
  if (!browser) return

  if (isSessionPast()) return

  if (isEnabled) {
    reminderService.removeReminder(sessionId)
    isEnabled = false
    onReminderChange?.(sessionId, false)
    notifyServiceWorker()
    return
  }

  // Need to request permission first
  if (!reminderService.isNotificationSupported()) {
    permissionDenied = true
    setTimeout(() => {
      permissionDenied = false
    }, 3000)
    return
  }

  const permission = await reminderService.requestNotificationPermission()
  if (permission !== 'granted') {
    permissionDenied = true
    setTimeout(() => {
      permissionDenied = false
    }, 3000)
    return
  }

  reminderService.setReminder({
    sessionId,
    sessionTitle,
    roomName,
    startTime,
    reminderMinutes,
    editionSlug,
    enabled: true
  })
  isEnabled = true
  onReminderChange?.(sessionId, true)
  notifyServiceWorker()
}

function selectMinutes(minutes: number): void {
  reminderMinutes = minutes
  reminderService.setDefaultReminderMinutes(minutes)

  // Update the current reminder if enabled
  if (isEnabled) {
    reminderService.setReminder({
      sessionId,
      sessionTitle,
      roomName,
      startTime,
      reminderMinutes: minutes,
      editionSlug,
      enabled: true
    })
    notifyServiceWorker()
  }

  showOptions = false
}

function notifyServiceWorker(): void {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return
  navigator.serviceWorker.controller.postMessage({
    type: 'SYNC_REMINDERS',
    reminders: reminderService.getEnabledReminders()
  })
}

function handleOptionsClick(e: MouseEvent): void {
  e.stopPropagation()
  showOptions = !showOptions
}

function handleMainClick(e: MouseEvent): void {
  e.stopPropagation()
  toggleReminder()
}

// Close dropdown when clicking outside
$effect(() => {
  if (!browser || !showOptions) return
  function handleClickOutside(): void {
    showOptions = false
  }
  // Delay to avoid immediately closing
  const timer = setTimeout(() => {
    document.addEventListener('click', handleClickOutside, { once: true })
  }, 0)
  return () => {
    clearTimeout(timer)
    document.removeEventListener('click', handleClickOutside)
  }
})

const currentReminder = $derived(reminderService.getReminder(sessionId))
</script>

{#if !isSessionPast()}
  <div class="relative inline-flex items-center">
    <button
      type="button"
      class="rounded-full p-1.5 transition-colors hover:bg-muted"
      onclick={handleMainClick}
      aria-label={isEnabled ? m.app_reminder_remove() : m.app_reminder_set()}
      aria-pressed={isEnabled}
      data-testid="reminder-button-{sessionId}"
    >
      {#if isEnabled}
        <BellRing
          class="h-4 w-4 fill-blue-100 text-blue-500 dark:fill-blue-900 dark:text-blue-400"
          aria-hidden="true"
        />
      {:else}
        <Bell
          class="h-4 w-4 text-muted-foreground hover:text-blue-500"
          aria-hidden="true"
        />
      {/if}
    </button>

    {#if isEnabled}
      <button
        type="button"
        class="ml-[-4px] rounded-full px-1 py-0.5 text-[10px] font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
        onclick={handleOptionsClick}
        aria-label={m.app_reminder_settings()}
        data-testid="reminder-options-{sessionId}"
      >
        {currentReminder?.reminderMinutes ?? reminderMinutes}m
      </button>
    {/if}

    {#if showOptions}
      <div
        class="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-md border bg-popover p-1 shadow-md"
        role="menu"
      >
        {#each [15, 30, 60] as minutes}
          <button
            type="button"
            role="menuitem"
            class="flex w-full items-center rounded-sm px-2 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground {(currentReminder?.reminderMinutes ?? reminderMinutes) === minutes ? 'bg-accent/50 font-medium' : ''}"
            onclick={(e: MouseEvent) => { e.stopPropagation(); selectMinutes(minutes) }}
          >
            {m.app_reminder_before({ minutes: String(minutes) })}
          </button>
        {/each}
      </div>
    {/if}

    {#if permissionDenied}
      <div class="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border bg-destructive/10 p-2 text-xs text-destructive shadow-md">
        <BellOff class="mb-1 inline h-3 w-3" />
        {m.app_reminder_permission()}
      </div>
    {/if}
  </div>
{/if}
