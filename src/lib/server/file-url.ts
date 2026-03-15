import { env } from '$env/dynamic/public'

/**
 * Build a PocketBase file URL for a given collection record and filename
 */
export function buildFileUrl(collectionName: string, recordId: string, filename: string): string {
  const pbUrl = env.PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
  return `${pbUrl}/api/files/${collectionName}/${recordId}/${filename}`
}
