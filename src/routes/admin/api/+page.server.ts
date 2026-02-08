import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  // Load API keys stats
  const [apiKeys, webhooks, recentLogs] = await Promise.all([
    locals.pb.collection('api_keys').getList(1, 5, {
      filter: 'isActive = true',
      sort: '-lastUsedAt,-created'
    }),
    locals.pb.collection('webhooks').getList(1, 5, {
      filter: 'isActive = true',
      sort: '-created'
    }),
    locals.pb.collection('api_request_logs').getList(1, 10, {
      sort: '-created'
    })
  ])

  // Compute stats
  const totalApiKeys = await locals.pb.collection('api_keys').getList(1, 1, {})
  const activeApiKeys = await locals.pb.collection('api_keys').getList(1, 1, {
    filter: 'isActive = true'
  })
  const totalWebhooks = await locals.pb.collection('webhooks').getList(1, 1, {})
  const activeWebhooks = await locals.pb.collection('webhooks').getList(1, 1, {
    filter: 'isActive = true'
  })

  // Get request count for last 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const recentRequests = await locals.pb.collection('api_request_logs').getList(1, 1, {
    filter: `created >= "${yesterday}"`
  })

  return {
    stats: {
      totalApiKeys: totalApiKeys.totalItems,
      activeApiKeys: activeApiKeys.totalItems,
      totalWebhooks: totalWebhooks.totalItems,
      activeWebhooks: activeWebhooks.totalItems,
      requestsLast24h: recentRequests.totalItems
    },
    recentApiKeys: apiKeys.items.map((key) => ({
      id: key.id as string,
      name: key.name as string,
      keyPrefix: key.keyPrefix as string,
      lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt as string) : null,
      createdAt: new Date(key.created as string)
    })),
    recentWebhooks: webhooks.items.map((wh) => ({
      id: wh.id as string,
      name: wh.name as string,
      url: wh.url as string,
      events: wh.events as string[],
      createdAt: new Date(wh.created as string)
    })),
    recentLogs: recentLogs.items.map((log) => ({
      id: log.id as string,
      method: log.method as string,
      path: log.path as string,
      statusCode: log.statusCode as number,
      responseTimeMs: log.responseTimeMs as number,
      createdAt: new Date(log.created as string)
    }))
  }
}
