import {
  handleSponsorCheckoutCompleted,
  isSponsorCheckoutMetadata
} from '$lib/features/sponsoring/services/sponsor-checkout-handler'
import { getStripeSettings } from '$lib/server/app-settings'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request, locals, url }) => {
  const stripeSettings = await getStripeSettings(locals.pb)

  if (!stripeSettings.isConfigured) {
    return json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  try {
    const Stripe = (await import('stripe')).default
    const stripeOpts: Record<string, unknown> = {}
    if (stripeSettings.stripeApiBase) {
      const apiUrl = new URL(stripeSettings.stripeApiBase)
      stripeOpts.host = apiUrl.hostname
      stripeOpts.port = Number(apiUrl.port) || undefined
      stripeOpts.protocol = apiUrl.protocol.replace(':', '')
    }
    const stripe = new Stripe(stripeSettings.stripeSecretKey, stripeOpts)
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      stripeSettings.stripeWebhookSecret
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const metadata = session.metadata as Record<string, unknown> | undefined

      if (isSponsorCheckoutMetadata(metadata) && metadata) {
        await handleSponsorCheckoutCompleted(locals.pb, metadata, url.origin)
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object
      const metadata = session.metadata as Record<string, unknown> | undefined

      if (isSponsorCheckoutMetadata(metadata)) {
        console.log('Sponsor checkout session expired:', session.id)
      }
    }

    return json({ received: true })
  } catch (err) {
    console.error('Sponsor webhook error:', err)
    return json(
      { error: err instanceof Error ? err.message : 'Webhook processing failed' },
      { status: 400 }
    )
  }
}
