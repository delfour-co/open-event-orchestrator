import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const pb = locals.pb

  const user = pb.authStore.record

  if (!user) {
    return {
      user: null,
      editions: []
    }
  }

  try {
    // Get editions the user has access to
    const records = await pb.collection('editions').getFullList({
      sort: '-created',
      fields: 'id,name,slug'
    })

    const editions = records.map((record) => ({
      id: record.id,
      name: record.name as string,
      slug: record.slug as string
    }))

    return {
      user: {
        id: user.id,
        email: user.email
      },
      editions
    }
  } catch {
    return {
      user: {
        id: user.id,
        email: user.email
      },
      editions: []
    }
  }
}
