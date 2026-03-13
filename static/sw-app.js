const CACHE_NAME = 'oeo-attendee-v2'
const OFFLINE_CACHE = 'oeo-attendee-offline-v1'
const DATA_CACHE = 'oeo-attendee-data-v1'

const STATIC_ASSETS = ['/app', '/favicon.png']

// Reminder state
let activeReminders = []
let reminderCheckInterval = null
const REMINDER_CHECK_MS = 30000 // Check every 30 seconds
const SHOWN_REMINDERS_KEY = 'oeo-shown-reminders'

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(
            (name) =>
              name.startsWith('oeo-attendee') &&
              name !== CACHE_NAME &&
              name !== OFFLINE_CACHE &&
              name !== DATA_CACHE
          )
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
  startReminderCheck()
})

// Fetch: network-first with cache fallback for pages, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // API requests - network only with offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })
      })
    )
    return
  }

  // SvelteKit __data.json requests - network first, cache fallback (for offline page data)
  if (url.pathname.startsWith('/app/') && url.pathname.endsWith('__data.json')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(DATA_CACHE).then((cache) => {
              cache.put(request, clone)
            })
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          if (cached) {
            return cached
          }
          return new Response(JSON.stringify({ error: 'offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          })
        })
    )
    return
  }

  // Pages in /app - network first, cache fallback
  if (url.pathname.startsWith('/app')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful responses
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone)
            })
          }
          return response
        })
        .catch(async () => {
          // Try cache first
          const cached = await caches.match(request)
          if (cached) {
            return cached
          }
          // Fall back to app shell
          const appShell = await caches.match('/app')
          if (appShell) {
            return appShell
          }
          // Return offline page
          return new Response(
            `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Offline - Event Schedule</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
      color: #333;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #666; margin-bottom: 1rem; }
    button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-size: 1rem;
      cursor: pointer;
    }
    button:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <h1>You're Offline</h1>
    <p>Please check your internet connection and try again.</p>
    <button onclick="location.reload()">Retry</button>
  </div>
</body>
</html>`,
            {
              status: 200,
              headers: { 'Content-Type': 'text/html' }
            }
          )
        })
    )
    return
  }

  // Static assets - cache first, network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached
      }
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone)
          })
        }
        return response
      })
    })
  )
})

// Handle messages from client
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data.type === 'SYNC_REMINDERS') {
    activeReminders = event.data.reminders || []
    startReminderCheck()
  }

  if (event.data.type === 'GET_REMINDERS') {
    event.source.postMessage({
      type: 'REMINDERS_STATE',
      reminders: activeReminders
    })
  }
})

// Handle notification click - open the app at the session
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  const targetUrl = data.url || '/app'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Try to focus an existing window
      for (const client of clients) {
        if (client.url.includes('/app/') && 'focus' in client) {
          client.focus()
          client.navigate(targetUrl)
          return
        }
      }
      // Open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})

// Start periodic reminder check
function startReminderCheck() {
  if (reminderCheckInterval) {
    clearInterval(reminderCheckInterval)
  }

  if (activeReminders.length === 0) {
    return
  }

  // Check immediately
  checkReminders()

  // Then check periodically
  reminderCheckInterval = setInterval(checkReminders, REMINDER_CHECK_MS)
}

// Check if any reminders are due
function checkReminders() {
  const now = Date.now()

  for (const reminder of activeReminders) {
    if (!reminder.enabled) continue

    const sessionStart = new Date(reminder.startTime).getTime()
    if (Number.isNaN(sessionStart)) continue

    const reminderTime = sessionStart - reminder.reminderMinutes * 60 * 1000
    const reminderKey = `${reminder.sessionId}_${reminder.reminderMinutes}`

    // Check if reminder is due (within the check window)
    // Due means: reminderTime <= now AND sessionStart > now (session hasn't started yet)
    if (reminderTime <= now && sessionStart > now) {
      // Check if we already showed this reminder
      if (!hasShownReminder(reminderKey)) {
        markReminderShown(reminderKey)
        showReminderNotification(reminder)
      }
    }

    // Clean up past reminders (session already started)
    if (sessionStart <= now) {
      activeReminders = activeReminders.filter((r) => r.sessionId !== reminder.sessionId)
    }
  }

  // Stop checking if no more reminders
  if (activeReminders.length === 0 && reminderCheckInterval) {
    clearInterval(reminderCheckInterval)
    reminderCheckInterval = null
  }
}

// Track shown reminders to avoid duplicates (in-memory, resets on SW restart)
const shownReminders = new Set()

function hasShownReminder(key) {
  return shownReminders.has(key)
}

function markReminderShown(key) {
  shownReminders.add(key)
}

// Show the notification
function showReminderNotification(reminder) {
  const minutesText = `${reminder.reminderMinutes} min`
  const title = reminder.sessionTitle || 'Session starting soon'
  const roomInfo = reminder.roomName ? ` - ${reminder.roomName}` : ''
  const body = `Starts in ${minutesText}${roomInfo}`

  const appUrl = `/app/${reminder.editionSlug}?session=${reminder.sessionId}`

  self.registration.showNotification(title, {
    body: body,
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: `session-reminder-${reminder.sessionId}`,
    renotify: false,
    requireInteraction: false,
    data: {
      url: appUrl,
      sessionId: reminder.sessionId
    },
    actions: [
      {
        action: 'view',
        title: 'View session'
      }
    ]
  })
}
