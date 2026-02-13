import type { PageLoad } from './$types'

export const load: PageLoad = async ({ params, parent }) => {
  const { pb } = await parent()
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
