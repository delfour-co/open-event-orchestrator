<script lang="ts">
import { browser } from '$app/environment'
import { Button } from '$lib/components/ui/button'
import {
  type IcalEventInfo,
  type IcalSession,
  exportFullSchedule,
  exportSingleSession
} from '$lib/features/planning/domain/ical-export'
import * as m from '$lib/paraglide/messages'
import { CalendarPlus, Download, ExternalLink } from 'lucide-svelte'

interface Props {
  sessions: IcalSession[]
  eventInfo: IcalEventInfo
  mode: 'single' | 'bulk'
  /** CSS class to apply to the trigger button */
  class?: string
}

const { sessions, eventInfo, mode, class: className = '' }: Props = $props()

let isOpen = $state(false)
let triggerEl = $state<HTMLButtonElement | null>(null)
let menuStyle = $state('')

function toggle(): void {
  isOpen = !isOpen
  if (isOpen && triggerEl) {
    const rect = triggerEl.getBoundingClientRect()
    menuStyle = `position:fixed;top:${rect.top}px;right:${window.innerWidth - rect.right}px;transform:translateY(-100%);`
  }
}

function close(): void {
  isOpen = false
}

function downloadIcs(): void {
  if (!browser) return

  const result =
    mode === 'single' && sessions.length === 1
      ? exportSingleSession(sessions[0], eventInfo, 'full')
      : exportFullSchedule(sessions, eventInfo, 'full')

  const blob = new Blob([result.content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = result.filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  close()
}

function buildGoogleCalendarUrlFromSession(session: IcalSession): string {
  const startDate = session.date
  const year = startDate.getFullYear()
  const month = String(startDate.getMonth() + 1).padStart(2, '0')
  const day = String(startDate.getDate()).padStart(2, '0')
  const [startH, startM] = session.startTime.split(':')
  const [endH, endM] = session.endTime.split(':')
  const dtStart = `${year}${month}${day}T${startH}${startM}00`
  const dtEnd = `${year}${month}${day}T${endH}${endM}00`

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: session.title,
    dates: `${dtStart}/${dtEnd}`,
    ctz: eventInfo.timezone
  })

  if (session.roomName) {
    const location = session.roomFloor
      ? `${session.roomName} (${session.roomFloor})`
      : session.roomName
    params.set('location', eventInfo.location ? `${location}, ${eventInfo.location}` : location)
  } else if (eventInfo.location) {
    params.set('location', eventInfo.location)
  }

  const descParts: string[] = []
  if (session.speakerNames && session.speakerNames.length > 0) {
    descParts.push(`Speakers: ${session.speakerNames.join(', ')}`)
  }
  if (session.trackName) {
    descParts.push(`Track: ${session.trackName}`)
  }
  if (session.description) {
    descParts.push('', session.description)
  }
  if (descParts.length > 0) {
    params.set('details', descParts.join('\n'))
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function openGoogleCalendar(): void {
  if (!browser || sessions.length === 0) return

  if (mode === 'single' && sessions.length === 1) {
    window.open(buildGoogleCalendarUrlFromSession(sessions[0]), '_blank')
  } else {
    // For bulk, use the API endpoint with webcal subscription
    const icalUrl = `${eventInfo.baseUrl}/api/schedule/${eventInfo.editionSlug}/ical`
    window.open(
      `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(icalUrl)}`,
      '_blank'
    )
  }
  close()
}

function openOutlookCalendar(): void {
  if (!browser || sessions.length === 0) return

  if (mode === 'single' && sessions.length === 1) {
    // Generate ICS and create a blob URL, then use Outlook web with it
    // Outlook web doesn't support direct event creation like Google, so download ICS
    downloadIcs()
  } else {
    const icalUrl = `${eventInfo.baseUrl}/api/schedule/${eventInfo.editionSlug}/ical`
    window.open(
      `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(icalUrl)}`,
      '_blank'
    )
  }
  close()
}

function openAppleCalendar(): void {
  if (!browser || sessions.length === 0) return

  if (mode === 'single' && sessions.length === 1) {
    // For a single session, download the ICS file which will open in Apple Calendar
    downloadIcs()
  } else {
    // For bulk, use webcal:// protocol for calendar subscription
    const icalUrl = `${eventInfo.baseUrl}/api/schedule/${eventInfo.editionSlug}/ical`
    const webcalUrl = icalUrl.replace(/^https?:\/\//, 'webcal://')
    window.location.href = webcalUrl
  }
  close()
}

function handleClickOutside(event: MouseEvent): void {
  const target = event.target as HTMLElement
  if (!target.closest('[data-calendar-menu]')) {
    close()
  }
}

$effect(() => {
  if (!browser || !isOpen) return
  document.addEventListener('click', handleClickOutside, true)
  return () => {
    document.removeEventListener('click', handleClickOutside, true)
  }
})
</script>

<div class="relative inline-block {className}" data-calendar-menu>
  {#if mode === 'single'}
    <button
      bind:this={triggerEl}
      type="button"
      class="rounded-full p-1.5 transition-colors hover:bg-muted"
      onclick={toggle}
      aria-label={m.app_calendar_add()}
      aria-expanded={isOpen}
      aria-haspopup="menu"
      data-testid="add-to-calendar-button"
    >
      <CalendarPlus class="h-4 w-4 text-muted-foreground hover:text-primary" aria-hidden="true" />
    </button>
  {:else}
    <Button
      variant="outline"
      size="sm"
      class="gap-2"
      onclick={toggle}
      data-testid="export-favorites-calendar-button"
    >
      <CalendarPlus class="h-4 w-4" />
      {m.app_calendar_export_favorites()}
    </Button>
  {/if}

  {#if isOpen}
    <div
      class="z-50 w-52 rounded-md border bg-popover p-1 shadow-md"
      style={menuStyle}
      role="menu"
      data-testid="calendar-menu"
    >
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
        onclick={downloadIcs}
        role="menuitem"
        data-testid="calendar-menu-ics"
      >
        <Download class="h-4 w-4" />
        {m.app_calendar_download_ics()}
      </button>
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
        onclick={openGoogleCalendar}
        role="menuitem"
        data-testid="calendar-menu-google"
      >
        <ExternalLink class="h-4 w-4" />
        {m.app_calendar_google()}
      </button>
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
        onclick={openOutlookCalendar}
        role="menuitem"
        data-testid="calendar-menu-outlook"
      >
        <ExternalLink class="h-4 w-4" />
        {m.app_calendar_outlook()}
      </button>
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
        onclick={openAppleCalendar}
        role="menuitem"
        data-testid="calendar-menu-apple"
      >
        <ExternalLink class="h-4 w-4" />
        {m.app_calendar_apple()}
      </button>
    </div>
  {/if}
</div>
