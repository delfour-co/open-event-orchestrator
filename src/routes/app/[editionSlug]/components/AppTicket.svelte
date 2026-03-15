<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { Card } from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as m from '$lib/paraglide/messages'
import { AlertCircle, CheckCircle2, Loader2, Mail, QrCode, Ticket } from 'lucide-svelte'

interface TicketInfo {
  id: string
  ticketNumber: string
  status: string
  attendeeFirstName: string
  attendeeLastName: string
  attendeeEmail: string
  qrCode?: string
  checkedInAt?: string
  ticketType: { name: string; description?: string } | null
  order: { orderNumber: string; status: string } | null
}

interface Props {
  ticketEmail: string
  ticketResults: TicketInfo[]
  isLoadingTickets: boolean
  ticketError: string | null
  ticketLookupDone: boolean
  expandedQrCode: { qrCode: string; ticketNumber: string } | null
  editionName: string
  startDate: string
  venue?: string
  formatDate: (date: string) => string
  onLookupTickets: () => void
  onResetTicketLookup: () => void
  onExpandQrCode: (qr: { qrCode: string; ticketNumber: string }) => void
  onEmailChange: (email: string) => void
}

const {
  ticketEmail,
  ticketResults,
  isLoadingTickets,
  ticketError,
  ticketLookupDone,
  editionName,
  startDate,
  venue,
  formatDate,
  onLookupTickets,
  onResetTicketLookup,
  onExpandQrCode,
  onEmailChange
}: Props = $props()
</script>

<div class="mx-auto max-w-2xl p-4" aria-live="polite">
	<h2 class="sr-only">{m.app_ticket_heading()}</h2>
	{#if !ticketLookupDone}
		<!-- Ticket Lookup Form -->
		<Card class="p-6">
			<div class="space-y-4">
				<div class="flex items-center gap-3">
					<Ticket class="h-6 w-6 text-primary" />
					<div>
						<h3 class="font-semibold">{m.app_ticket_find_title()}</h3>
						<p class="text-sm text-muted-foreground">
							{m.app_ticket_find_description()}
						</p>
					</div>
				</div>

				<div class="space-y-2">
					<Label for="ticket-email">{m.app_ticket_email_label()}</Label>
					<div class="flex gap-2">
						<Input
							id="ticket-email"
							type="email"
							placeholder={m.app_ticket_email_placeholder()}
							value={ticketEmail}
							oninput={(e) => onEmailChange((e.target as HTMLInputElement).value)}
							class="flex-1"
							onkeydown={(e) => e.key === 'Enter' && onLookupTickets()}
						/>
						<Button onclick={onLookupTickets} disabled={isLoadingTickets || !ticketEmail.trim()} aria-label={m.app_ticket_lookup_button()}>
							{#if isLoadingTickets}
								<Loader2 class="h-4 w-4 animate-spin" aria-hidden="true" />
							{:else}
								<Mail class="h-4 w-4" aria-hidden="true" />
							{/if}
						</Button>
					</div>
				</div>

				{#if ticketError}
					<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive" role="alert">
						<AlertCircle class="mr-2 inline h-4 w-4" />
						{ticketError}
					</div>
				{/if}
			</div>
		</Card>
	{:else if ticketResults.length === 0}
		<!-- No Tickets Found -->
		<Card class="p-12 text-center">
			<Ticket class="mx-auto h-12 w-12 text-muted-foreground" />
			<h3 class="mt-4 text-lg font-semibold">{m.app_ticket_not_found_title()}</h3>
			<p class="mt-2 text-sm text-muted-foreground">
				{m.app_ticket_not_found_description({ email: ticketEmail })}
			</p>
			<Button class="mt-4" variant="outline" onclick={onResetTicketLookup}>
				{m.app_ticket_try_another()}
			</Button>
		</Card>
	{:else}
		<!-- Ticket Results -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<p class="text-sm text-muted-foreground">
					{ticketResults.length === 1
						? m.app_ticket_found_one({ email: ticketEmail })
						: m.app_ticket_found_many({ count: ticketResults.length, email: ticketEmail })}
				</p>
				<Button variant="ghost" size="sm" onclick={onResetTicketLookup}>
					{m.app_ticket_change_email()}
				</Button>
			</div>

			{#each ticketResults as ticket}
				<Card class="overflow-hidden">
					<div class="bg-primary p-4 text-primary-foreground">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-xs opacity-80">{m.app_ticket_number({ number: ticket.ticketNumber })}</p>
								<p class="text-lg font-bold">
									{ticket.attendeeFirstName} {ticket.attendeeLastName}
								</p>
							</div>
							<div class="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
								{ticket.status === 'valid' ? m.app_ticket_status_valid() : ticket.status === 'used' ? m.app_ticket_status_checked_in() : ticket.status}
							</div>
						</div>
					</div>

					<div class="p-4 space-y-4">
						{#if ticket.ticketType}
							<div>
								<p class="text-sm font-medium">{ticket.ticketType.name}</p>
								{#if ticket.ticketType.description}
									<p class="text-xs text-muted-foreground">{ticket.ticketType.description}</p>
								{/if}
							</div>
						{/if}

						<div class="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p class="text-muted-foreground">{m.app_ticket_event()}</p>
								<p class="font-medium">{editionName}</p>
							</div>
							<div>
								<p class="text-muted-foreground">{m.app_ticket_date()}</p>
								<p class="font-medium">{formatDate(startDate)}</p>
							</div>
							{#if venue}
								<div class="col-span-2">
									<p class="text-muted-foreground">{m.app_ticket_venue()}</p>
									<p class="font-medium">{venue}</p>
								</div>
							{/if}
						</div>

						{#if ticket.qrCode && ticket.status === 'valid'}
							<div class="flex flex-col items-center border-t pt-4">
								<QrCode class="h-6 w-6 text-muted-foreground mb-2" />
								<p class="text-xs text-muted-foreground mb-2">{m.app_ticket_qr_tap_enlarge()}</p>
								<button
									type="button"
									class="bg-white p-4 rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
									onclick={() => onExpandQrCode({ qrCode: ticket.qrCode!, ticketNumber: ticket.ticketNumber })}
									aria-label={m.app_qr_code_enlarge({ number: ticket.ticketNumber })}
								>
									<img
										src={ticket.qrCode}
										alt={m.app_qr_code_alt()}
										class="h-48 w-48"
									/>
								</button>
								<p class="mt-2 font-mono text-xs text-muted-foreground">{ticket.ticketNumber}</p>
							</div>
						{/if}

						{#if ticket.checkedInAt}
							<div class="rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm text-green-800 dark:text-green-200">
								<CheckCircle2 class="mr-2 inline h-4 w-4" />
								{m.app_ticket_checked_in_on({ date: new Date(ticket.checkedInAt).toLocaleString() })}
							</div>
						{/if}
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>
