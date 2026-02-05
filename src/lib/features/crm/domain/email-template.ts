import { z } from 'zod'

export const emailTemplateSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string().min(1).max(100),
  subject: z.string().min(1).max(200),
  bodyHtml: z.string(),
  bodyText: z.string(),
  variables: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type EmailTemplate = z.infer<typeof emailTemplateSchema>

export type CreateEmailTemplate = Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>

export const TEMPLATE_VARIABLES: Record<string, string> = {
  '{{firstName}}': 'Contact first name',
  '{{lastName}}': 'Contact last name',
  '{{email}}': 'Contact email',
  '{{company}}': 'Contact company',
  '{{eventName}}': 'Event name',
  '{{editionName}}': 'Edition name',
  '{{unsubscribeUrl}}': 'Unsubscribe link'
}

export const interpolateTemplate = (
  template: string,
  variables: Record<string, string>
): string => {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(key, value)
  }
  return result
}

export const extractVariables = (template: string): string[] => {
  const regex = /\{\{(\w+)\}\}/g
  const variables: string[] = []
  let match: RegExpExecArray | null = regex.exec(template)
  while (match !== null) {
    const variable = `{{${match[1]}}}`
    if (!variables.includes(variable)) {
      variables.push(variable)
    }
    match = regex.exec(template)
  }
  return variables
}
