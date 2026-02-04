import { createSpeakerRepository, createTalkRepository } from '$lib/features/cfp/infra'
import { createGetSpeakerSubmissionsUseCase } from '$lib/features/cfp/usecases'
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

export const load: PageServerLoad = async ({ parent, url, locals }) => {
  const { edition, cfpStatus, allowCoSpeakers } = await parent()
  const email = url.searchParams.get('email')
  const success = url.searchParams.get('success') === 'true'

  if (!email) {
    return {
      edition,
      cfpStatus,
      allowCoSpeakers,
      speaker: null,
      talks: [],
      success,
      needsEmail: true
    }
  }

  const talkRepository = createTalkRepository(locals.pb)
  const speakerRepository = createSpeakerRepository(locals.pb)
  const getSpeakerSubmissions = createGetSpeakerSubmissionsUseCase(
    talkRepository,
    speakerRepository
  )

  const result = await getSpeakerSubmissions({
    email,
    editionId: edition.id
  })

  // Get co-speaker invitations for each talk
  const talksWithCoSpeakers: TalkWithCoSpeakers[] = await Promise.all(
    result.talks.map(async (talk) => {
      // Get pending co-speaker invitations
      let coSpeakerInvitations: CoSpeakerInvitation[] = []
      try {
        const invitations = await locals.pb.collection('cospeaker_invitations').getFullList({
          filter: `talkId="${talk.id}" && status="pending"`
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
    needsEmail: false
  }
}

export const actions: Actions = {
  withdraw: async ({ request, locals, url }) => {
    const formData = await request.formData()
    const talkId = formData.get('talkId') as string
    const email = url.searchParams.get('email')

    if (!talkId) {
      return fail(400, { error: 'Talk ID is required' })
    }

    if (!email) {
      return fail(400, { error: 'Email is required' })
    }

    const talkRepository = createTalkRepository(locals.pb)
    const speakerRepository = createSpeakerRepository(locals.pb)

    try {
      // Verify the talk belongs to this speaker
      const talk = await talkRepository.findById(talkId)
      if (!talk) {
        return fail(404, { error: 'Talk not found' })
      }

      // Get speaker by email
      const speaker = await speakerRepository.findByEmail(email)
      if (!speaker || !talk.speakerIds.includes(speaker.id)) {
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

  confirm: async ({ request, locals, url }) => {
    const formData = await request.formData()
    const talkId = formData.get('talkId') as string
    const email = url.searchParams.get('email')

    if (!talkId || !email) {
      return fail(400, { error: 'Talk ID and email are required' })
    }

    const talkRepository = createTalkRepository(locals.pb)
    const speakerRepository = createSpeakerRepository(locals.pb)

    try {
      const talk = await talkRepository.findById(talkId)
      if (!talk) {
        return fail(404, { error: 'Talk not found' })
      }

      const speaker = await speakerRepository.findByEmail(email)
      if (!speaker || !talk.speakerIds.includes(speaker.id)) {
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

  decline: async ({ request, locals, url }) => {
    const formData = await request.formData()
    const talkId = formData.get('talkId') as string
    const email = url.searchParams.get('email')

    if (!talkId || !email) {
      return fail(400, { error: 'Talk ID and email are required' })
    }

    const talkRepository = createTalkRepository(locals.pb)
    const speakerRepository = createSpeakerRepository(locals.pb)

    try {
      const talk = await talkRepository.findById(talkId)
      if (!talk) {
        return fail(404, { error: 'Talk not found' })
      }

      const speaker = await speakerRepository.findByEmail(email)
      if (!speaker || !talk.speakerIds.includes(speaker.id)) {
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

  inviteCospeaker: async ({ request, locals, url }) => {
    const formData = await request.formData()
    const talkId = formData.get('talkId') as string
    const cospeakerEmail = formData.get('cospeakerEmail') as string
    const email = url.searchParams.get('email')

    if (!talkId || !cospeakerEmail || !email) {
      return fail(400, { error: 'All fields are required' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cospeakerEmail)) {
      return fail(400, { inviteError: 'Please enter a valid email address' })
    }

    // Can't invite yourself
    if (cospeakerEmail.toLowerCase() === email.toLowerCase()) {
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

      const speaker = await speakerRepository.findByEmail(email)
      if (!speaker || !talk.speakerIds.includes(speaker.id)) {
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
        invitedBy: speaker.id,
        expiresAt: expiresAt.toISOString()
      })

      return { inviteSuccess: true, message: `Invitation sent to ${cospeakerEmail}` }
    } catch (err) {
      console.error('Failed to invite co-speaker:', err)
      return fail(500, { error: 'Failed to send invitation. Please try again.' })
    }
  },

  cancelCospeakerInvitation: async ({ request, locals, url }) => {
    const formData = await request.formData()
    const invitationId = formData.get('invitationId') as string
    const email = url.searchParams.get('email')

    if (!invitationId || !email) {
      return fail(400, { error: 'Invitation ID and email are required' })
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

      const speaker = await speakerRepository.findByEmail(email)
      if (!speaker || !talk.speakerIds.includes(speaker.id)) {
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
  }
}
