<script lang="ts">
import * as m from '$lib/paraglide/messages'
import type { TicketTemplate } from '../domain'
import { getContrastColor } from '../domain/ticket-template'

interface Props {
  template: Partial<TicketTemplate>
  eventName: string
  editionName: string
  ticketTypeName?: string
  attendeeName?: string
  attendeeEmail?: string
  ticketNumber?: string
  venue?: string
  startDate?: Date
  logoUrl?: string
}

const {
  template,
  eventName,
  editionName,
  ticketTypeName,
  attendeeName = 'John Doe',
  attendeeEmail = 'john.doe@example.com',
  ticketNumber = 'TKT-ABC123-XYZ',
  venue = 'Convention Center',
  startDate = new Date(),
  logoUrl
}: Props = $props()

const displayTicketTypeName = $derived(
  ticketTypeName || m.billing_ticket_preview_general_admission()
)

const primaryColor = $derived(template.primaryColor || '#3B82F6')
const backgroundColor = $derived(template.backgroundColor || '#FFFFFF')
const textColor = $derived(template.textColor || '#1F2937')
const accentColor = $derived(template.accentColor || '#10B981')
const headerTextColor = $derived(getContrastColor(primaryColor))
const showVenue = $derived(template.showVenue ?? true)
const showDate = $derived(template.showDate ?? true)
const showQrCode = $derived(template.showQrCode ?? true)
const customFooterText = $derived(template.customFooterText)

const formattedDate = $derived(
  startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
)
</script>

<div
  class="relative overflow-hidden rounded-lg shadow-lg"
  style="background-color: {backgroundColor}; width: 100%; max-width: 500px; aspect-ratio: 2.12 / 1;"
>
  <!-- Header with primary color -->
  <div
    class="flex items-center gap-3 px-4 py-3"
    style="background-color: {primaryColor}; color: {headerTextColor};"
  >
    {#if logoUrl}
      <img src={logoUrl} alt="Event logo" class="h-10 w-auto max-w-[80px] object-contain" />
    {/if}
    <div class="min-w-0 flex-1">
      <h3 class="truncate text-lg font-bold">{eventName}</h3>
      <p class="truncate text-sm opacity-90">{editionName}</p>
    </div>
  </div>

  <!-- Content -->
  <div class="flex h-[calc(100%-52px)]">
    <!-- Left side - Ticket info -->
    <div class="flex flex-1 flex-col justify-between p-4" style="color: {textColor};">
      <div>
        <div class="font-bold" style="color: {primaryColor};">{displayTicketTypeName}</div>
        <div class="mt-2">
          <div class="font-semibold">{attendeeName}</div>
          <div class="text-xs opacity-70">{attendeeEmail}</div>
        </div>
        <div class="mt-2 space-y-1 text-xs">
          {#if showDate}
            <div>{m.billing_ticket_preview_date({ date: formattedDate })}</div>
          {/if}
          {#if showVenue && venue}
            <div>{m.billing_ticket_preview_venue({ venue })}</div>
          {/if}
        </div>
      </div>
      <div>
        <div class="text-xs" style="color: {accentColor};">{m.billing_ticket_preview_ticket_number({ number: ticketNumber })}</div>
        {#if customFooterText}
          <div class="mt-1 text-[10px] opacity-60">{customFooterText}</div>
        {/if}
      </div>
    </div>

    <!-- Right side - QR code -->
    {#if showQrCode}
      <div class="flex flex-col items-center justify-center border-l border-dashed p-4" style="border-color: {textColor}20;">
        <div
          class="flex h-24 w-24 items-center justify-center rounded bg-white"
          style="border: 1px solid {textColor}20;"
        >
          <div class="grid h-20 w-20 grid-cols-5 gap-0.5">
            {#each Array(25) as _}
              <div
                class="aspect-square"
                style="background-color: {Math.random() > 0.5 ? '#000' : '#fff'};"
              ></div>
            {/each}
          </div>
        </div>
        <div class="mt-1 text-[8px]" style="color: {textColor}60;">{m.billing_ticket_preview_scan_checkin()}</div>
      </div>
    {/if}
  </div>

  <!-- Decorative perforated edge -->
  <div class="pointer-events-none absolute bottom-0 left-0 right-0 h-2 opacity-30">
    <div class="flex justify-center gap-1">
      {#each Array(30) as _}
        <div class="h-1 w-1 rounded-full" style="background-color: {textColor};"></div>
      {/each}
    </div>
  </div>
</div>
