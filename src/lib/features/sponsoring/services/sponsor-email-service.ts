import type { EmailAttachment, EmailService } from '$lib/features/cfp/services/email-service'
import type { EditionSponsorExpanded } from '../domain'
import { formatPackagePrice } from '../domain'

export interface SponsorEmailTemplateData {
  sponsorName: string
  contactName?: string
  editionName: string
  eventName: string
  packageName?: string
  packagePrice?: string
  status?: string
  portalUrl?: string
  amount?: string
}

export type SponsorEmailType =
  | 'portal_invitation'
  | 'status_confirmed'
  | 'status_declined'
  | 'payment_received'
  | 'welcome'
  | 'invoice'
  | 'refund'

export const createSponsorEmailService = (emailService: EmailService) => ({
  async sendPortalInvitation(
    editionSponsor: EditionSponsorExpanded,
    portalUrl: string,
    eventName: string
  ): Promise<{ success: boolean; error?: string }> {
    const contactEmail = editionSponsor.sponsor?.contactEmail
    if (!contactEmail) {
      return { success: false, error: 'No contact email for sponsor' }
    }

    const data: SponsorEmailTemplateData = {
      sponsorName: editionSponsor.sponsor?.name || 'Sponsor',
      contactName: editionSponsor.sponsor?.contactName,
      editionName: '',
      eventName,
      packageName: editionSponsor.package?.name,
      portalUrl
    }

    return emailService.send({
      to: contactEmail,
      subject: `${eventName} - Sponsor Portal Access`,
      html: generateSponsorEmailHtml('portal_invitation', data),
      text: generateSponsorEmailText('portal_invitation', data)
    })
  },

  async sendConfirmationEmail(
    editionSponsor: EditionSponsorExpanded,
    eventName: string,
    portalUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    const contactEmail = editionSponsor.sponsor?.contactEmail
    if (!contactEmail) {
      return { success: false, error: 'No contact email for sponsor' }
    }

    const data: SponsorEmailTemplateData = {
      sponsorName: editionSponsor.sponsor?.name || 'Sponsor',
      contactName: editionSponsor.sponsor?.contactName,
      editionName: '',
      eventName,
      packageName: editionSponsor.package?.name,
      packagePrice: editionSponsor.package
        ? formatPackagePrice(editionSponsor.package.price, editionSponsor.package.currency)
        : undefined,
      amount: editionSponsor.amount
        ? formatPackagePrice(editionSponsor.amount, editionSponsor.package?.currency || 'EUR')
        : undefined,
      portalUrl
    }

    return emailService.send({
      to: contactEmail,
      subject: `${eventName} - Sponsorship Confirmed!`,
      html: generateSponsorEmailHtml('status_confirmed', data),
      text: generateSponsorEmailText('status_confirmed', data)
    })
  },

  async sendPaymentReceivedEmail(
    editionSponsor: EditionSponsorExpanded,
    eventName: string
  ): Promise<{ success: boolean; error?: string }> {
    const contactEmail = editionSponsor.sponsor?.contactEmail
    if (!contactEmail) {
      return { success: false, error: 'No contact email for sponsor' }
    }

    const data: SponsorEmailTemplateData = {
      sponsorName: editionSponsor.sponsor?.name || 'Sponsor',
      contactName: editionSponsor.sponsor?.contactName,
      editionName: '',
      eventName,
      amount: editionSponsor.amount
        ? formatPackagePrice(editionSponsor.amount, editionSponsor.package?.currency || 'EUR')
        : undefined
    }

    return emailService.send({
      to: contactEmail,
      subject: `${eventName} - Payment Received`,
      html: generateSponsorEmailHtml('payment_received', data),
      text: generateSponsorEmailText('payment_received', data)
    })
  },

  async sendWelcomeEmail(
    editionSponsor: EditionSponsorExpanded,
    eventName: string,
    portalUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    const contactEmail = editionSponsor.sponsor?.contactEmail
    if (!contactEmail) {
      return { success: false, error: 'No contact email for sponsor' }
    }

    const data: SponsorEmailTemplateData = {
      sponsorName: editionSponsor.sponsor?.name || 'Sponsor',
      contactName: editionSponsor.sponsor?.contactName,
      editionName: '',
      eventName,
      packageName: editionSponsor.package?.name,
      portalUrl
    }

    return emailService.send({
      to: contactEmail,
      subject: `Welcome to ${eventName} as a Sponsor!`,
      html: generateSponsorEmailHtml('welcome', data),
      text: generateSponsorEmailText('welcome', data)
    })
  },

  async sendInvoiceEmail(
    editionSponsor: EditionSponsorExpanded,
    eventName: string,
    pdfBytes: Uint8Array,
    portalUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    const contactEmail = editionSponsor.sponsor?.contactEmail
    if (!contactEmail) {
      return { success: false, error: 'No contact email for sponsor' }
    }

    const data: SponsorEmailTemplateData = {
      sponsorName: editionSponsor.sponsor?.name || 'Sponsor',
      contactName: editionSponsor.sponsor?.contactName,
      editionName: '',
      eventName,
      packageName: editionSponsor.package?.name,
      packagePrice: editionSponsor.package
        ? formatPackagePrice(editionSponsor.package.price, editionSponsor.package.currency)
        : undefined,
      amount: editionSponsor.amount
        ? formatPackagePrice(editionSponsor.amount, editionSponsor.package?.currency || 'EUR')
        : undefined,
      portalUrl
    }

    const attachment: EmailAttachment = {
      filename: `invoice-${editionSponsor.sponsor?.name?.replace(/\s+/g, '-').toLowerCase() || 'sponsor'}.pdf`,
      content: pdfBytes,
      contentType: 'application/pdf'
    }

    return emailService.send({
      to: contactEmail,
      subject: `${eventName} - Sponsorship Invoice`,
      html: generateSponsorEmailHtml('invoice', data),
      text: generateSponsorEmailText('invoice', data),
      attachments: [attachment]
    })
  },

  async sendRefundEmail(
    editionSponsor: EditionSponsorExpanded,
    eventName: string,
    pdfBytes: Uint8Array
  ): Promise<{ success: boolean; error?: string }> {
    const contactEmail = editionSponsor.sponsor?.contactEmail
    if (!contactEmail) {
      return { success: false, error: 'No contact email for sponsor' }
    }

    const data: SponsorEmailTemplateData = {
      sponsorName: editionSponsor.sponsor?.name || 'Sponsor',
      contactName: editionSponsor.sponsor?.contactName,
      editionName: '',
      eventName,
      packageName: editionSponsor.package?.name,
      amount: editionSponsor.amount
        ? formatPackagePrice(editionSponsor.amount, editionSponsor.package?.currency || 'EUR')
        : undefined
    }

    const attachment: EmailAttachment = {
      filename: `credit-note-${editionSponsor.sponsor?.name?.replace(/\s+/g, '-').toLowerCase() || 'sponsor'}.pdf`,
      content: pdfBytes,
      contentType: 'application/pdf'
    }

    return emailService.send({
      to: contactEmail,
      subject: `${eventName} - Sponsorship Refund & Credit Note`,
      html: generateSponsorEmailHtml('refund', data),
      text: generateSponsorEmailText('refund', data),
      attachments: [attachment]
    })
  }
})

export type SponsorEmailService = ReturnType<typeof createSponsorEmailService>

const generateSponsorEmailHtml = (
  type: SponsorEmailType,
  data: SponsorEmailTemplateData
): string => {
  const greeting = data.contactName ? `Dear ${data.contactName}` : `Dear ${data.sponsorName} team`

  const templates: Record<SponsorEmailType, string> = {
    portal_invitation: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sponsor Portal Access</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2563eb;">Sponsor Portal Access</h1>
  <p>${greeting},</p>
  <p>You have been granted access to the ${data.eventName} Sponsor Portal.</p>
  ${data.packageName ? `<p>Your sponsorship package: <strong>${data.packageName}</strong></p>` : ''}
  <p>Click the button below to access your sponsor portal where you can:</p>
  <ul>
    <li>Update your company profile</li>
    <li>Upload your logo</li>
    <li>View your benefits</li>
  </ul>
  <p><a href="${data.portalUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Access Sponsor Portal</a></p>
  <p style="color: #666; font-size: 0.9em;">This link is unique to your organization. Please do not share it.</p>
  <p>Best regards,<br>The ${data.eventName} Team</p>
</body>
</html>`,

    status_confirmed: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sponsorship Confirmed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #16a34a;">Sponsorship Confirmed!</h1>
  <p>${greeting},</p>
  <p>We are thrilled to confirm your sponsorship of <strong>${data.eventName}</strong>!</p>
  ${data.packageName ? `<p>Package: <strong>${data.packageName}</strong></p>` : ''}
  ${data.amount ? `<p>Amount: <strong>${data.amount}</strong></p>` : ''}
  <p>Thank you for your support! We look forward to showcasing your brand at our event.</p>
  ${data.portalUrl ? `<p><a href="${data.portalUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Access Sponsor Portal</a></p>` : ''}
  <p>Best regards,<br>The ${data.eventName} Team</p>
</body>
</html>`,

    status_declined: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sponsorship Update</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #64748b;">Sponsorship Update</h1>
  <p>${greeting},</p>
  <p>Thank you for considering sponsorship of ${data.eventName}.</p>
  <p>We understand that this may not be the right time for your organization. Please don't hesitate to reach out if you'd like to discuss sponsorship opportunities for future events.</p>
  <p>Best regards,<br>The ${data.eventName} Team</p>
</body>
</html>`,

    payment_received: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Received</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #16a34a;">Payment Received</h1>
  <p>${greeting},</p>
  <p>We have received your payment for ${data.eventName} sponsorship.</p>
  ${data.amount ? `<p>Amount received: <strong>${data.amount}</strong></p>` : ''}
  <p>Thank you for your support!</p>
  <p>Best regards,<br>The ${data.eventName} Team</p>
</body>
</html>`,

    welcome: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome Sponsor</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #8b5cf6;">Welcome to ${data.eventName}!</h1>
  <p>${greeting},</p>
  <p>Welcome aboard as a sponsor of <strong>${data.eventName}</strong>!</p>
  ${data.packageName ? `<p>Your package: <strong>${data.packageName}</strong></p>` : ''}
  <p>We're excited to have you as part of our event. Here's what happens next:</p>
  <ol>
    <li>Access your sponsor portal to complete your profile</li>
    <li>Upload your logo and company information</li>
    <li>Review your benefits and deliverables</li>
  </ol>
  <p><a href="${data.portalUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Get Started</a></p>
  <p>Best regards,<br>The ${data.eventName} Team</p>
</body>
</html>`,

    invoice: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sponsorship Invoice</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2563eb;">Sponsorship Invoice</h1>
  <p>${greeting},</p>
  <p>Thank you for your sponsorship of <strong>${data.eventName}</strong>!</p>
  ${data.packageName ? `<p>Package: <strong>${data.packageName}</strong></p>` : ''}
  ${data.amount ? `<p>Amount: <strong>${data.amount}</strong></p>` : ''}
  <p>Please find your invoice attached to this email.</p>
  ${data.portalUrl ? `<p>You can also download your invoice at any time from your sponsor portal:</p><p><a href="${data.portalUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Access Sponsor Portal</a></p>` : ''}
  <p>Best regards,<br>The ${data.eventName} Team</p>
</body>
</html>`,

    refund: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sponsorship Refund</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #dc2626;">Sponsorship Refund</h1>
  <p>${greeting},</p>
  <p>We are writing to inform you that your sponsorship of <strong>${data.eventName}</strong> has been refunded.</p>
  ${data.packageName ? `<p>Package: <strong>${data.packageName}</strong></p>` : ''}
  ${data.amount ? `<p>Refunded amount: <strong>${data.amount}</strong></p>` : ''}
  <p>Please find the credit note attached to this email. The refund will be processed to your original payment method.</p>
  <p>If you have any questions, please don't hesitate to reach out.</p>
  <p>Best regards,<br>The ${data.eventName} Team</p>
</body>
</html>`
  }

  return templates[type]
}

const generateSponsorEmailText = (
  type: SponsorEmailType,
  data: SponsorEmailTemplateData
): string => {
  const greeting = data.contactName ? `Dear ${data.contactName}` : `Dear ${data.sponsorName} team`

  const templates: Record<SponsorEmailType, string> = {
    portal_invitation: `
Sponsor Portal Access

${greeting},

You have been granted access to the ${data.eventName} Sponsor Portal.
${data.packageName ? `Your sponsorship package: ${data.packageName}` : ''}

Access your portal here: ${data.portalUrl}

This link is unique to your organization. Please do not share it.

Best regards,
The ${data.eventName} Team`,

    status_confirmed: `
Sponsorship Confirmed!

${greeting},

We are thrilled to confirm your sponsorship of ${data.eventName}!
${data.packageName ? `Package: ${data.packageName}` : ''}
${data.amount ? `Amount: ${data.amount}` : ''}

Thank you for your support!
${data.portalUrl ? `Access your portal: ${data.portalUrl}` : ''}

Best regards,
The ${data.eventName} Team`,

    status_declined: `
Sponsorship Update

${greeting},

Thank you for considering sponsorship of ${data.eventName}.

We understand that this may not be the right time for your organization. Please don't hesitate to reach out for future events.

Best regards,
The ${data.eventName} Team`,

    payment_received: `
Payment Received

${greeting},

We have received your payment for ${data.eventName} sponsorship.
${data.amount ? `Amount received: ${data.amount}` : ''}

Thank you for your support!

Best regards,
The ${data.eventName} Team`,

    welcome: `
Welcome to ${data.eventName}!

${greeting},

Welcome aboard as a sponsor of ${data.eventName}!
${data.packageName ? `Your package: ${data.packageName}` : ''}

Get started here: ${data.portalUrl}

Best regards,
The ${data.eventName} Team`,

    invoice: `
Sponsorship Invoice

${greeting},

Thank you for your sponsorship of ${data.eventName}!
${data.packageName ? `Package: ${data.packageName}` : ''}
${data.amount ? `Amount: ${data.amount}` : ''}

Please find your invoice attached to this email.
${data.portalUrl ? `You can also download your invoice from your sponsor portal: ${data.portalUrl}` : ''}

Best regards,
The ${data.eventName} Team`,

    refund: `
Sponsorship Refund

${greeting},

We are writing to inform you that your sponsorship of ${data.eventName} has been refunded.
${data.packageName ? `Package: ${data.packageName}` : ''}
${data.amount ? `Refunded amount: ${data.amount}` : ''}

Please find the credit note attached to this email. The refund will be processed to your original payment method.

If you have any questions, please don't hesitate to reach out.

Best regards,
The ${data.eventName} Team`
  }

  return templates[type].trim()
}
