import { ClientResponseError } from 'pocketbase'

/**
 * Checks if an error is a "not found" error from PocketBase.
 * This allows distinguishing between "record doesn't exist" (expected)
 * and other errors like network failures or server errors (unexpected).
 *
 * @param error - The error to check
 * @returns true if the error is a 404 "not found" error
 */
export function isNotFoundError(error: unknown): boolean {
  return error instanceof ClientResponseError && error.status === 404
}

/**
 * Handles common PocketBase errors in repository findById-style methods.
 * Returns null for "not found" errors, re-throws all other errors.
 *
 * @param error - The error to handle
 * @returns null if it's a "not found" error
 * @throws The original error if it's not a "not found" error
 *
 * @example
 * async findById(id: string): Promise<Entity | null> {
 *   try {
 *     const record = await pb.collection('entities').getOne(id)
 *     return mapRecordToEntity(record)
 *   } catch (error) {
 *     return handleNotFoundError(error)
 *   }
 * }
 */
export function handleNotFoundError(error: unknown): null {
  if (isNotFoundError(error)) {
    return null
  }
  throw error
}

/**
 * Handles common PocketBase errors in repository findFirst-style methods.
 * Returns null for "not found" errors, re-throws all other errors.
 *
 * Same as handleNotFoundError but with a more descriptive name for
 * methods that return the first matching record.
 */
export const handleNoMatchError = handleNotFoundError
