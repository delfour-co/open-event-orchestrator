import {
  generateOrganizationSlug,
  initialSetupSchema,
  isTokenValid
} from '$lib/features/auth/domain'
import { createSetupTokenRepository } from '$lib/features/auth/infra'
import { createOrganizationRepository } from '$lib/features/core/infra'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const tokenRepository = createSetupTokenRepository(locals.pb)
  const setupToken = await tokenRepository.findByToken(params.token)

  if (!setupToken) {
    throw error(404, {
      message: 'Setup link not found. Please check the URL or request a new setup link.'
    })
  }

  if (!isTokenValid(setupToken)) {
    if (setupToken.used) {
      throw error(410, {
        message: 'This setup link has already been used. Please login with your admin account.'
      })
    }
    throw error(410, {
      message: 'This setup link has expired. Please restart the server to generate a new link.'
    })
  }

  return {
    tokenValid: true
  }
}

export const actions: Actions = {
  default: async ({ request, params, locals }) => {
    const tokenRepository = createSetupTokenRepository(locals.pb)
    const setupToken = await tokenRepository.findByToken(params.token)

    if (!setupToken || !isTokenValid(setupToken)) {
      return fail(400, { error: 'Invalid or expired setup link' })
    }

    const formData = await request.formData()
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      passwordConfirm: formData.get('passwordConfirm') as string,
      organizationName: formData.get('organizationName') as string
    }

    const result = initialSetupSchema.safeParse(data)
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errors[issue.path[0] as string] = issue.message
      }
      return fail(400, {
        errors,
        values: { email: data.email, organizationName: data.organizationName }
      })
    }

    try {
      // Create the admin user with super_admin role
      const userRecord = await locals.pb.collection('users').create({
        email: data.email,
        password: data.password,
        passwordConfirm: data.passwordConfirm,
        name: data.email.split('@')[0],
        role: 'super_admin',
        emailVisibility: true
      })

      // Create the organization
      const orgRepository = createOrganizationRepository(locals.pb)
      const organization = await orgRepository.create({
        name: data.organizationName,
        slug: generateOrganizationSlug(data.organizationName)
      })

      // Add user as organization owner
      await locals.pb.collection('organization_members').create({
        userId: userRecord.id,
        organizationId: organization.id,
        role: 'owner'
      })

      // Mark the setup token as used
      await tokenRepository.markAsUsed(setupToken.id)

      // Auto login
      await locals.pb.collection('users').authWithPassword(data.email, data.password)

      // Log the successful setup
      console.log(
        `[Setup] Initial setup completed - Admin: ${data.email}, Organization: ${data.organizationName}`
      )
    } catch (err) {
      console.error('Initial setup error:', err)
      const pbError = err as { response?: { data?: Record<string, { message: string }> } }

      if (pbError.response?.data?.email) {
        return fail(400, {
          errors: { email: 'Email already exists' },
          values: { email: data.email, organizationName: data.organizationName }
        })
      }

      return fail(500, {
        error: 'Failed to complete setup. Please try again.',
        values: { email: data.email, organizationName: data.organizationName }
      })
    }

    throw redirect(303, '/admin')
  }
}
