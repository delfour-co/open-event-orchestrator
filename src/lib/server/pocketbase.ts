import { env } from '$env/dynamic/public'
import PocketBase from 'pocketbase'

export const createPocketBase = (): PocketBase => {
  return new PocketBase(env.PUBLIC_POCKETBASE_URL || 'http://localhost:8090')
}
