import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const membership = await locals.pb.collection('organization_members').getList(1, 1, {
    filter: `userId = "${locals.user?.id}"`
  })
  if (membership.items.length === 0) throw error(404, 'No organization found')
  const organizationId = membership.items[0].organizationId as string

  const templates = await locals.pb.collection('email_templates').getFullList({
    filter: `organizationId = "${organizationId}"`,
    sort: '-created'
  })

  return {
    organizationId,
    templates: templates.map((t) => ({
      id: t.id as string,
      name: t.name as string,
      subject: t.subject as string,
      bodyHtml: t.bodyHtml as string,
      bodyText: t.bodyText as string,
      variables: (t.variables as string[]) || [],
      createdAt: new Date(t.created as string)
    }))
  }
}

export const actions: Actions = {
  createTemplate: async ({ request, locals }) => {
    const formData = await request.formData()
    const name = (formData.get('name') as string)?.trim()
    const subject = (formData.get('subject') as string)?.trim()
    const bodyHtml = (formData.get('bodyHtml') as string) || ''
    const bodyText = (formData.get('bodyText') as string) || ''

    if (!name) {
      return fail(400, { error: 'Name is required', action: 'createTemplate' })
    }
    if (!subject) {
      return fail(400, { error: 'Subject is required', action: 'createTemplate' })
    }

    const membership = await locals.pb.collection('organization_members').getList(1, 1, {
      filter: `userId = "${locals.user?.id}"`
    })
    if (membership.items.length === 0) {
      return fail(404, { error: 'No organization found', action: 'createTemplate' })
    }
    const organizationId = membership.items[0].organizationId as string

    // Extract variables from body
    const regex = /\{\{(\w+)\}\}/g
    const variables: string[] = []
    const combined = `${subject} ${bodyHtml} ${bodyText}`
    let match: RegExpExecArray | null = regex.exec(combined)
    while (match !== null) {
      const variable = `{{${match[1]}}}`
      if (!variables.includes(variable)) {
        variables.push(variable)
      }
      match = regex.exec(combined)
    }

    try {
      await locals.pb.collection('email_templates').create({
        organizationId,
        name,
        subject,
        bodyHtml,
        bodyText,
        variables: JSON.stringify(variables)
      })

      return { success: true, action: 'createTemplate' }
    } catch (err) {
      console.error('Failed to create template:', err)
      return fail(500, { error: 'Failed to create template', action: 'createTemplate' })
    }
  },

  updateTemplate: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const name = (formData.get('name') as string)?.trim()
    const subject = (formData.get('subject') as string)?.trim()
    const bodyHtml = (formData.get('bodyHtml') as string) || ''
    const bodyText = (formData.get('bodyText') as string) || ''

    if (!id) {
      return fail(400, { error: 'Template ID is required', action: 'updateTemplate' })
    }
    if (!name) {
      return fail(400, { error: 'Name is required', action: 'updateTemplate' })
    }
    if (!subject) {
      return fail(400, { error: 'Subject is required', action: 'updateTemplate' })
    }

    // Extract variables
    const regex = /\{\{(\w+)\}\}/g
    const variables: string[] = []
    const combined = `${subject} ${bodyHtml} ${bodyText}`
    let match: RegExpExecArray | null = regex.exec(combined)
    while (match !== null) {
      const variable = `{{${match[1]}}}`
      if (!variables.includes(variable)) {
        variables.push(variable)
      }
      match = regex.exec(combined)
    }

    try {
      await locals.pb.collection('email_templates').update(id, {
        name,
        subject,
        bodyHtml,
        bodyText,
        variables: JSON.stringify(variables)
      })

      return { success: true, action: 'updateTemplate' }
    } catch (err) {
      console.error('Failed to update template:', err)
      return fail(500, { error: 'Failed to update template', action: 'updateTemplate' })
    }
  },

  deleteTemplate: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Template ID is required', action: 'deleteTemplate' })
    }

    try {
      await locals.pb.collection('email_templates').delete(id)
      return { success: true, action: 'deleteTemplate' }
    } catch (err) {
      console.error('Failed to delete template:', err)
      return fail(500, { error: 'Failed to delete template', action: 'deleteTemplate' })
    }
  }
}
