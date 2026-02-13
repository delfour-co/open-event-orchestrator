import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const pb = locals.pb
  const { editionId } = params

  const user = pb.authStore.record

  if (!user) {
    return {
      user: null,
      edition: null
    }
  }

  try {
    const edition = await pb.collection('editions').getOne(editionId)

    return {
      user: {
        id: user.id,
        email: user.email
      },
      edition: {
        id: edition.id as string,
        name: edition.name as string,
        slug: edition.slug as string
      }
    }
  } catch {
    return {
      user: {
        id: user.id,
        email: user.email
      },
      edition: null
    }
  }
}
