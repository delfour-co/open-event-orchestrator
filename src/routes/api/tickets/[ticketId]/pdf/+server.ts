import { DEFAULT_TICKET_TEMPLATE } from '$lib/features/billing/domain'
import {
  createTicketRepository,
  createTicketTemplateRepository,
  createTicketTypeRepository
} from '$lib/features/billing/infra'
import { type TicketPdfData, generateTicketPdf } from '$lib/features/billing/services'
import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params, locals }) => {
  const { ticketId } = params

  const ticketRepo = createTicketRepository(locals.pb)
  const ticket = await ticketRepo.findById(ticketId)

  if (!ticket) {
    throw error(404, 'Ticket not found')
  }

  const ticketTypeRepo = createTicketTypeRepository(locals.pb)
  const ticketType = await ticketTypeRepo.findById(ticket.ticketTypeId)

  if (!ticketType) {
    throw error(404, 'Ticket type not found')
  }

  let edition: {
    id: string
    name: string
    venue?: string
    startDate?: string
    expand?: { eventId?: { name: string } }
  }

  try {
    edition = await locals.pb.collection('editions').getOne(ticket.editionId, {
      expand: 'eventId'
    })
  } catch {
    throw error(404, 'Edition not found')
  }

  const event = edition.expand?.eventId
  const eventName = event?.name || 'Event'

  const templateRepo = createTicketTemplateRepository(locals.pb)
  let template = await templateRepo.findByEdition(ticket.editionId)

  if (!template) {
    template = {
      id: '',
      editionId: ticket.editionId,
      ...DEFAULT_TICKET_TEMPLATE,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  let logoDataUrl: string | undefined
  if (template.logoFile || template.logoUrl) {
    const logoUrl = templateRepo.getLogoUrl(template)
    if (logoUrl) {
      try {
        const response = await fetch(logoUrl)
        const arrayBuffer = await response.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const contentType = response.headers.get('content-type') || 'image/png'
        logoDataUrl = `data:${contentType};base64,${base64}`
      } catch {
        // Continue without logo if fetch fails
      }
    }
  }

  const pdfData: TicketPdfData = {
    ticket,
    ticketType,
    template,
    eventName,
    editionName: edition.name,
    venue: edition.venue,
    startDate: edition.startDate ? new Date(edition.startDate) : undefined,
    logoDataUrl
  }

  const pdfBytes = await generateTicketPdf(pdfData)

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ticket-${ticket.ticketNumber}.pdf"`,
      'Cache-Control': 'private, max-age=3600'
    }
  })
}
