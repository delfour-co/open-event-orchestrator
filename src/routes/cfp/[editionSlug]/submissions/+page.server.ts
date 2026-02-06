import { createSpeakerRepository, createTalkRepository } from '$lib/features/cfp/infra'
import { createGetSpeakerSubmissionsUseCase } from '$lib/features/cfp/usecases'
import { sendCfpNotification } from '$lib/server/cfp-notifications'
import {
  buildSubmissionsUrl,
  generateSpeakerToken,
  validateSpeakerToken
} from '$lib/server/speaker-tokens'
import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

interface CoSpeakerInvitation {
  id: string
  email: string
  status: string
}

interface TalkWithCoSpeakers {
  id: string
  title: string
  abstract: string
  status: string
  submittedAt?: Date
  createdAt: Date
  coSpeakerInvitations: CoSpeakerInvitation[]
  coSpeakers: Array<{ id: string; firstName: string; lastName: string; email: string }>
}

async function getSpeakerFromAuth(
  locals: App.Locals,
  url: URL,
  editionId: string
): Promise<{ speakerId: string | null; token: string | null }> {
  const token = url.searchParams.get('token')

  if (token) {
    const validation = await validateSpeakerToken(locals.pb, token, editionId)
    if (validation.valid && validation.speakerId) {
      return { speakerId: validation.speakerId, token }
    }
  }

  return { speakerId: null, token: null }
}

export const load: PageServerLoad = async ({ parent, url, locals }) => {
  const { edition, cfpStatus, allowCoSpeakers } = await parent()
  const success = url.searchParams.get('success') === 'true'

  // Try token-based authentication
  const { speakerId, token } = await getSpeakerFromAuth(locals, url, edition.id)

  if (!speakerId) {
    return {
      edition,
      cfpStatus,
      allowCoSpeakers,
      speaker: null,
      talks: [],
      success,
      needsToken: true,
      token: null
    }
  }

  const talkRepository = createTalkRepository(locals.pb)
  const speakerRepository = createSpeakerRepository(locals.pb)

  // Get speaker by ID
  const speaker = await speakerRepository.findById(speakerId)
  if (!speaker) {
    return {
      edition,
      cfpStatus,
      allowCoSpeakers,
      speaker: null,
      talks: [],
      success,
      needsToken: true,
      token: null
    }
  }

  const getSpeakerSubmissions = createGetSpeakerSubmissionsUseCase(
    talkRepository,
    speakerRepository
  )

  const result = await getSpeakerSubmissions({
    email: speaker.email,
    editionId: edition.id
  })

  // Get co-speaker invitations for each talk
  const talksWithCoSpeakers: TalkWithCoSpeakers[] = await Promise.all(
    result.talks.map(async (talk) => {
      // Get pending co-speaker invitations
      let coSpeakerInvitations: CoSpeakerInvitation[] = []
      try {
        const invitations = await locals.pb.collection('cospeaker_invitations').getFullList({
          filter: `talkId="${talk.id}" && status="pending"`,
          requestKey: null
        })
        coSpeakerInvitations = invitations.map((inv) => ({
          id: inv.id as string,
          email: inv.email as string,
          status: inv.status as string
        }))
      } catch {
        // Collection might not exist yet
      }

      // Get co-speakers (other speakers on this talk)
      const coSpeakers = await speakerRepository.findByIds(talk.speakerIds)
      const currentSpeaker = result.speaker

      return {
        ...talk,
        coSpeakerInvitations,
        coSpeakers: coSpeakers
          .filter((s) => s.id !== currentSpeaker?.id)
          .map((s) => ({
            id: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email
          }))
      }
    })
  )

  return {
    edition,
    cfpStatus,
    allowCoSpeakers,
    speaker: result.speaker,
    talks: talksWithCoSpeakers,
    success,
    needsToken: false,
    token
  }
}

async function validateTokenAndGetSpeaker(
  locals: App.Locals,
  url: URL,
  editionId: string
): Promise<{ speaker: { id: string; email: string } | null; error: string | null }> {
  const token = url.searchParams.get('token')

  if (!token) {
    return { speaker: null, error: 'Authentication token is required' }
  }

  const validation = await validateSpeakerToken(locals.pb, token, editionId)
  if (!validation.valid || !validation.speakerId) {
    return { speaker: null, error: 'Invalid or expired token' }
  }

  const speakerRepository = createSpeakerRepository(locals.pb)
  const speaker = await speakerRepository.findById(validation.speakerId)
  if (!speaker) {
    return { speaker: null, error: 'Speaker not found' }
  }

  return { speaker: { id: speaker.id, email: speaker.email }, error: null }
}

export const actions: Actions = {
  withdraw: async ({ request, locals, url, params }) => {
    const formData = await request.formData()
    const talkId = formData.get('talkId') as string

    if (!talkId) {
      return fail(400, { error: 'Talk ID is required' })
    }

    // Get edition ID from params
    const edition = await locals.pb
      .collection('editions')
      .getFirstListItem(`slug="${params.editionSlug}"`)

    const { speaker, error } = await validateTokenAndGetSpeaker(locals, url, edition.id)
    if (error || !speaker) {
      return fail(401, { error: error || 'Authentication required' })
    }

    const talkRepository = createTalkRepository(locals.pb)

    try {
      // Verify the talk belongs to this speaker
      const talk = await talkRepository.findById(talkId)
      if (!talk) {
        return fail(404, { error: 'Talk not found' })
      }

      // Check speaker authorization using speaker ID
      const speakerRepository = createSpeakerRepository(locals.pb)
      const fullSpeaker = await speakerRepository.findById(speaker.id)
      if (!fullSpeaker || !talk.speakerIds.includes(fullSpeaker.id)) {
        return fail(403, { error: 'You are not authorized to withdraw this talk' })
      }

      // Only allow withdrawal if talk is in draft, submitted, or under_review status
      const withdrawableStatuses = ['draft', 'submitted', 'under_review', 'accepted']
      if (!withdrawableStatuses.includes(talk.status)) {
        return fail(400, {
          error: `Cannot withdraw a talk with status "${talk.status}"`
        })
      }

      // Update talk status to withdrawn
      await talkRepository.updateStatus(talkId, 'withdrawn')

      return { withdrawSuccess: true, message: 'Your talk has been withdrawn successfully.' }
    } catch (err) {
      console.error('Failed to withdraw talk:', err)
      return fail(500, { error: 'Failed to withdraw talk. Please try again.' })
    }
  },

  confirm: async ({ request, locals, url, params }) => {
    const formData = await request.formData()
    const talkId = formData.get('talkId') as string

    if (!talkId) {
      return fail(400, { error: 'Talk ID is required' })
    }

    const edition = await locals.pb
      .collection('editions')
      .getFirstListItem(`slug="${params.editionSlug}"`)

    const { speaker, error } = await validateTokenAndGetSpeaker(locals, url, edition.id)
    if (error || !speaker) {
      return fail(401, { error: error || 'Authentication required' })
    }

    const talkRepository = createTalkRepository(locals.pb)
    const speakerRepository = createSpeakerRepository(locals.pb)

    try {
      const talk = await talkRepository.findById(talkId)
      if (!talk) {
        return fail(404, { error: 'Talk not found' })
      }

      const fullSpeaker = await speakerRepository.findById(speaker.id)
      if (!fullSpeaker || !talk.speakerIds.includes(fullSpeaker.id)) {
        return fail(403, { error: 'You are not authorized to confirm this talk' })
      }

      if (talk.status !== 'accepted') {
        return fail(400, { error: 'Only accepted talks can be confirmed' })
      }

      await talkRepository.updateStatus(talkId, 'confirmed')

      return { confirmSuccess: true, message: 'Your participation has been confirmed!' }
    } catch (err) {
      console.error('Failed to confirm talk:', err)
      return fail(500, { error: 'Failed to confirm participation. Please try again.' })
    }
  },

  decline: async ({ request, locals, url, params }) => {
    const formData = await request.formData()
    const talkId = formData.get('talkId') as string

    if (!talkId) {
      return fail(400, { error: 'Talk ID is required' })
    }

    const edition = await locals.pb
      .collection('editions')
      .getFirstListItem(`slug="${params.editionSlug}"`)

    const { speaker, error } = await validateTokenAndGetSpeaker(locals, url, edition.id)
    if (error || !speaker) {
      return fail(401, { error: error || 'Authentication required' })
    }

    const talkRepository = createTalkRepository(locals.pb)
    const speakerRepository = createSpeakerRepository(locals.pb)

    try {
      const talk = await talkRepository.findById(talkId)
      if (!talk) {
        return fail(404, { error: 'Talk not found' })
      }

      const fullSpeaker = await speakerRepository.findById(speaker.id)
      if (!fullSpeaker || !talk.speakerIds.includes(fullSpeaker.id)) {
        return fail(403, { error: 'You are not authorized to decline this talk' })
      }

      if (talk.status !== 'accepted') {
        return fail(400, { error: 'Only accepted talks can be declined' })
      }

      await talkRepository.updateStatus(talkId, 'declined')

      return { declineSuccess: true, message: 'You have declined to participate.' }
    } catch (err) {
      console.error('Failed to decline talk:', err)
      return fail(500, { error: 'Failed to decline participation. Please try again.' })
    }
  },

  inviteCospeaker: async ({ request, locals, url, params }) => {
    const formData = await request.formData()
    const talkId = formData.get('talkId') as string
    const cospeakerEmail = formData.get('cospeakerEmail') as string

    if (!talkId || !cospeakerEmail) {
      return fail(400, { error: 'All fields are required' })
    }

    const edition = await locals.pb
      .collection('editions')
      .getFirstListItem(`slug="${params.editionSlug}"`)

    const { speaker, error } = await validateTokenAndGetSpeaker(locals, url, edition.id)
    if (error || !speaker) {
      return fail(401, { error: error || 'Authentication required' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cospeakerEmail)) {
      return fail(400, { inviteError: 'Please enter a valid email address' })
    }

    // Can't invite yourself
    if (cospeakerEmail.toLowerCase() === speaker.email.toLowerCase()) {
      return fail(400, { inviteError: "You can't invite yourself as a co-speaker" })
    }

    const talkRepository = createTalkRepository(locals.pb)
    const speakerRepository = createSpeakerRepository(locals.pb)

    try {
      // Verify the talk belongs to this speaker
      const talk = await talkRepository.findById(talkId)
      if (!talk) {
        return fail(404, { error: 'Talk not found' })
      }

      const fullSpeaker = await speakerRepository.findById(speaker.id)
      if (!fullSpeaker || !talk.speakerIds.includes(fullSpeaker.id)) {
        return fail(403, { error: 'You are not authorized to invite co-speakers for this talk' })
      }

      // Check if already a co-speaker
      const existingSpeaker = await speakerRepository.findByEmail(cospeakerEmail)
      if (existingSpeaker && talk.speakerIds.includes(existingSpeaker.id)) {
        return fail(400, { inviteError: 'This person is already a co-speaker on this talk' })
      }

      // Check for existing pending invitation
      try {
        const existingInvitation = await locals.pb
          .collection('cospeaker_invitations')
          .getFirstListItem(`talkId="${talkId}" && email="${cospeakerEmail}" && status="pending"`)
        if (existingInvitation) {
          return fail(400, { inviteError: 'An invitation has already been sent to this email' })
        }
      } catch {
        // No existing invitation, continue
      }

      // Create invitation
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 14) // 14 days expiry

      await locals.pb.collection('cospeaker_invitations').create({
        talkId,
        email: cospeakerEmail,
        status: 'pending',
        invitedBy: fullSpeaker.id,
        expiresAt: expiresAt.toISOString()
      })

      return { inviteSuccess: true, message: `Invitation sent to ${cospeakerEmail}` }
    } catch (err) {
      console.error('Failed to invite co-speaker:', err)
      return fail(500, { error: 'Failed to send invitation. Please try again.' })
    }
  },

  cancelCospeakerInvitation: async ({ request, locals, url, params }) => {
    const formData = await request.formData()
    const invitationId = formData.get('invitationId') as string

    if (!invitationId) {
      return fail(400, { error: 'Invitation ID is required' })
    }

    const edition = await locals.pb
      .collection('editions')
      .getFirstListItem(`slug="${params.editionSlug}"`)

    const { speaker, error } = await validateTokenAndGetSpeaker(locals, url, edition.id)
    if (error || !speaker) {
      return fail(401, { error: error || 'Authentication required' })
    }

    const speakerRepository = createSpeakerRepository(locals.pb)
    const talkRepository = createTalkRepository(locals.pb)

    try {
      // Get the invitation
      const invitation = await locals.pb.collection('cospeaker_invitations').getOne(invitationId)

      // Verify the requester is a speaker on this talk
      const talk = await talkRepository.findById(invitation.talkId as string)
      if (!talk) {
        return fail(404, { error: 'Talk not found' })
      }

      const fullSpeaker = await speakerRepository.findById(speaker.id)
      if (!fullSpeaker || !talk.speakerIds.includes(fullSpeaker.id)) {
        return fail(403, { error: 'You are not authorized to cancel this invitation' })
      }

      // Cancel the invitation
      await locals.pb.collection('cospeaker_invitations').update(invitationId, {
        status: 'cancelled'
      })

      return { cancelSuccess: true, message: 'Invitation cancelled' }
    } catch (err) {
      console.error('Failed to cancel invitation:', err)
      return fail(500, { error: 'Failed to cancel invitation. Please try again.' })
    }
  },

  requestAccess: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string

    if (!email) {
      return fail(400, { accessError: 'Email is required' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return fail(400, { accessError: 'Please enter a valid email address' })
    }

    const speakerRepository = createSpeakerRepository(locals.pb)
    const speaker = await speakerRepository.findByEmail(email)

    if (!speaker) {
      // Don't reveal if the email exists or not for security
      return {
        accessRequested: true,
        message: 'If you have submissions with this email, you will receive an access link shortly.'
      }
    }

    // Get edition
    const edition = await locals.pb
      .collection('editions')
      .getFirstListItem(`slug="${params.editionSlug}"`)

    // Check if this speaker has any talks for this edition
    const talkRepository = createTalkRepository(locals.pb)
    const talks = await talkRepository.findByFilters({
      speakerId: speaker.id,
      editionId: edition.id
    })

    if (talks.length === 0) {
      // Don't reveal if they have submissions or not
      return {
        accessRequested: true,
        message: 'If you have submissions with this email, you will receive an access link shortly.'
      }
    }

    // Generate token and send email
    const token = await generateSpeakerToken(locals.pb, speaker.id, edition.id)

    // Get event name
    let eventName = edition.name as string
    try {
      const event = await locals.pb.collection('events').getOne(edition.eventId as string)
      eventName = event.name as string
    } catch {
      // Use edition name as fallback
    }

    // Send email with access link using the first talk as reference
    const baseUrl = request.url.split('/cfp')[0]
    const accessUrl = buildSubmissionsUrl(baseUrl, params.editionSlug, token)

    await sendCfpNotification({
      pb: locals.pb,
      type: 'submission_confirmed',
      talkId: talks[0].id,
      speakerId: speaker.id,
      editionId: edition.id,
      editionSlug: params.editionSlug,
      editionName: edition.name as string,
      eventName,
      baseUrl,
      customCfpUrl: accessUrl
    })

    return {
      accessRequested: true,
      message: 'If you have submissions with this email, you will receive an access link shortly.'
    }
  }
}
