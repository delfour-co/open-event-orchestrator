/**
 * Safe PocketBase filter builder to prevent NoSQL injection attacks.
 *
 * PocketBase filter syntax uses double quotes for string values.
 * Special characters that need escaping: \ " and control characters.
 *
 * @example
 * // Safe usage:
 * const filter = safeFilter`slug = ${userInput}`
 * // Result: slug = "escaped_value"
 *
 * // Multiple conditions:
 * const filter = safeFilter`editionId = ${editionId} && status = ${status}`
 */

/**
 * Escapes a string value for safe use in PocketBase filters.
 * Handles: backslashes, double quotes, and control characters.
 */
export function escapeFilterValue(value: string): string {
  if (typeof value !== 'string') {
    return String(value)
  }

  return value
    .replace(/\\/g, '\\\\') // Escape backslashes first
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/\n/g, '\\n') // Escape newlines
    .replace(/\r/g, '\\r') // Escape carriage returns
    .replace(/\t/g, '\\t') // Escape tabs
}

/**
 * Tagged template literal for building safe PocketBase filters.
 * Automatically escapes and quotes string values.
 *
 * @example
 * const filter = safeFilter`slug = ${slug} && status = ${status}`
 * // If slug = 'test"injection', result: slug = "test\"injection" && status = "active"
 */
export function safeFilter(
  strings: TemplateStringsArray,
  ...values: (string | number | boolean | null | undefined)[]
): string {
  let result = ''

  for (let i = 0; i < strings.length; i++) {
    result += strings[i]

    if (i < values.length) {
      const value = values[i]

      if (value === null || value === undefined) {
        result += 'null'
      } else if (typeof value === 'boolean') {
        result += value ? 'true' : 'false'
      } else if (typeof value === 'number') {
        result += String(value)
      } else {
        // String value - escape and quote
        result += `"${escapeFilterValue(value)}"`
      }
    }
  }

  return result
}

/**
 * Builds an equals condition with safe escaping.
 */
export function filterEquals(field: string, value: string): string {
  return `${field} = "${escapeFilterValue(value)}"`
}

/**
 * Builds a contains condition with safe escaping (for relation arrays).
 */
export function filterContains(field: string, value: string): string {
  return `${field} ~ "${escapeFilterValue(value)}"`
}

/**
 * Builds an IN condition with safe escaping.
 */
export function filterIn(field: string, values: string[]): string {
  if (values.length === 0) {
    return 'false' // No values = no match
  }
  const conditions = values.map((v) => `${field} = "${escapeFilterValue(v)}"`).join(' || ')
  return `(${conditions})`
}

/**
 * Combines multiple filter conditions with AND.
 */
export function filterAnd(...conditions: (string | null | undefined)[]): string {
  const validConditions = conditions.filter((c): c is string => !!c && c.trim() !== '')
  if (validConditions.length === 0) return ''
  if (validConditions.length === 1) return validConditions[0]
  return validConditions.join(' && ')
}

/**
 * Combines multiple filter conditions with OR.
 */
export function filterOr(...conditions: (string | null | undefined)[]): string {
  const validConditions = conditions.filter((c): c is string => !!c && c.trim() !== '')
  if (validConditions.length === 0) return ''
  if (validConditions.length === 1) return validConditions[0]
  return `(${validConditions.join(' || ')})`
}
