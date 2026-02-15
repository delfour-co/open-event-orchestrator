# Attendee App Module

The Attendee App module provides a Progressive Web App (PWA) for event attendees, offering schedule viewing, session favorites, speaker information, ticket access, and feedback submission.

## Overview

The Attendee App provides:
- **PWA Schedule**: Mobile-first event schedule viewer
- **Favorites**: Personal agenda management with local storage
- **Speakers**: Speaker directory with talk details
- **Ticket Lookup**: QR code access for check-in
- **Session Feedback**: Rate and comment on sessions
- **Event Feedback**: General feedback and problem reporting
- **Admin Settings**: Configure app appearance and features

## Architecture

```
src/lib/features/app/
├── domain/
│   ├── app-settings.ts         # PWA settings schema
│   └── index.ts
├── infra/
│   ├── app-settings-repository.ts
│   └── index.ts
└── index.ts

src/lib/features/feedback/
├── domain/
│   ├── feedback-settings.ts    # Feedback configuration
│   ├── session-feedback.ts     # Session rating schema
│   ├── event-feedback.ts       # Event feedback schema
│   ├── rating-mode.ts          # Rating mode options
│   └── index.ts
├── infra/
│   ├── feedback-settings-repository.ts
│   ├── session-feedback-repository.ts
│   ├── event-feedback-repository.ts
│   └── index.ts
├── ui/
│   ├── RatingInput.svelte      # Rating component
│   └── index.ts
└── index.ts

src/routes/app/[editionSlug]/
├── +layout.svelte              # PWA layout with meta tags
├── +page.server.ts             # Server data loader
└── +page.svelte                # Main PWA view

src/routes/admin/app/
├── +page.svelte                # Edition selector
├── +page.server.ts
└── [editionSlug]/
    ├── +page.svelte            # Settings UI
    └── +page.server.ts         # Settings actions
```

## Domain Entities

### AppSettings

Stores PWA appearance and feature configuration per edition.

```typescript
type AppSettings = {
  id: string
  editionId: string
  title?: string                 // Custom app title
  subtitle?: string              // Custom subtitle
  logoFile?: string              // Logo image file
  headerImage?: string           // Header background image
  primaryColor?: string          // Primary color (hex)
  accentColor?: string           // Accent color (hex)
  showScheduleTab: boolean       // Always true
  showSpeakersTab: boolean       // Show speakers list
  showTicketsTab: boolean        // Show ticket lookup
  showFeedbackTab: boolean       // Show feedback forms
  showFavoritesTab: boolean      // Enable favorites feature
  created: Date
  updated: Date
}
```

### FeedbackSettings

Configures feedback collection behavior.

```typescript
type FeedbackSettings = {
  id: string
  editionId: string
  sessionRatingEnabled: boolean  // Enable session ratings
  sessionRatingMode: RatingMode  // Rating UI style
  sessionCommentRequired: boolean
  eventFeedbackEnabled: boolean  // Enable general feedback
  feedbackIntroText?: string     // Custom intro message
  created: Date
  updated: Date
}

type RatingMode = 'stars' | 'scale_10' | 'thumbs' | 'yes_no'
```

### SessionFeedback

Attendee rating for a session.

```typescript
type SessionFeedback = {
  id: string
  sessionId: string
  editionId: string
  anonymousUserId: string        // Generated client-side
  numericValue: number           // Rating value
  comment?: string               // Optional text
  created: Date
  updated: Date
}
```

### EventFeedback

General event feedback or problem report.

```typescript
type EventFeedback = {
  id: string
  editionId: string
  anonymousUserId: string
  feedbackType: 'general' | 'problem'
  subject?: string
  message: string
  created: Date
}
```

## PWA Features

### Navigation Tabs

The app has a bottom navigation with configurable tabs (in order):

1. **Schedule** - Always visible, displays event schedule
2. **Favorites** - Optional, personal agenda with saved sessions
3. **Speakers** - Optional, speaker directory with talk details
4. **My Ticket** - Optional, ticket lookup by email
5. **Feedback** - Optional, event feedback forms

### Schedule View

Features:
- Day selector for multi-day events
- Track filter pills
- Session cards with time, room, type badge
- Favorite button (heart icon)
- Give feedback button per session

### Favorites View

Features:
- Sessions grouped by date
- Empty state with guidance
- Badge showing favorite count
- Remove from favorites button

### Speakers View

Features:
- Speaker cards with photo
- Company information
- Talk list with schedule details (time, date, room)
- Sorted alphabetically by name

### Ticket Lookup

Features:
- Email input form
- Automatic email persistence
- Ticket card with status
- QR code display
- Fullscreen QR code on tap
- Check-in status indicator
- Auto-reload on page refresh

### Feedback

#### Session Feedback
- Rating input (configurable mode)
- Optional/required comment
- Edit existing feedback
- Dialog-based UI

#### Event Feedback
- General feedback form
- Problem report form
- Subject and message fields
- Character counter

## Admin Settings

### Appearance Tab

| Setting | Description |
|---------|-------------|
| App Title | Custom header title |
| Subtitle | Secondary text (e.g., venue) |
| Primary Color | Buttons, active tabs |
| Accent Color | Secondary highlights |
| Logo | Header logo image |
| Header Image | Background image |

### Features Tab

| Feature | Default | Description |
|---------|---------|-------------|
| Schedule | Always On | Event schedule (not toggleable) |
| Favorites | On | Save sessions to personal agenda |
| Speakers | On | Speaker directory |
| My Ticket | On | Ticket lookup and QR display |
| Feedback | On | Event feedback forms |

### Feedback Tab

| Setting | Description |
|---------|-------------|
| Session Ratings | Enable/disable session rating |
| Rating Mode | Stars, 1-10, Thumbs, Yes/No |
| Require Comments | Make comment mandatory |
| Event Feedback | Enable general feedback |
| Intro Text | Custom feedback page message |

## API Endpoints

### Ticket Lookup

```
POST /api/tickets/lookup
Content-Type: application/json

{
  "email": "attendee@example.com",
  "editionId": "edition_id"
}
```

Response:
```json
{
  "success": true,
  "tickets": [{
    "id": "...",
    "ticketNumber": "TKT-001",
    "status": "valid",
    "attendeeFirstName": "John",
    "attendeeLastName": "Doe",
    "qrCode": "data:image/png;base64,...",
    "ticketType": { "name": "Standard Pass" }
  }]
}
```

### Session Feedback

```
POST /api/feedback/session
Content-Type: application/json

{
  "sessionId": "session_id",
  "editionId": "edition_id",
  "userId": "anon_123_abc",
  "numericValue": 5,
  "comment": "Great talk!"
}
```

```
GET /api/feedback/session?userId=anon_123&editionId=edition_id
```

### Event Feedback

```
POST /api/feedback/event
Content-Type: application/json

{
  "editionId": "edition_id",
  "userId": "anon_123_abc",
  "feedbackType": "general",
  "subject": "Great event!",
  "message": "Really enjoyed the sessions..."
}
```

## Offline Support

### Schedule Caching

The app uses IndexedDB for offline schedule access:

```typescript
import { scheduleCacheService } from '$lib/features/planning/services'

// Cache schedule on load
await scheduleCacheService.cacheSchedule({
  editionSlug: 'my-event-2025',
  edition: {...},
  rooms: [...],
  tracks: [...],
  slots: [...],
  sessions: [...],
  talks: [...]
})

// Retrieve cached data
const cached = await scheduleCacheService.getSchedule('my-event-2025')

// Manage favorites
await scheduleCacheService.toggleFavorite(sessionId, editionSlug)
const favorites = await scheduleCacheService.getFavorites(editionSlug)
```

### Service Worker

The PWA uses a service worker for:
- Caching static assets
- Offline fallback
- Background sync

Files:
- `static/manifest-app.json` - PWA manifest
- `static/sw-app.js` - Service worker

### Connectivity Indicator

The layout shows online/offline status:
- Green "Online" indicator when connected
- Red "Offline" indicator when disconnected
- Automatically updates on connectivity change

## PocketBase Collections

| Collection | Description |
|------------|-------------|
| `pwa_settings` | App appearance and features |
| `pwa_feedback_settings` | Feedback configuration |
| `pwa_session_feedback` | Session ratings |
| `pwa_event_feedback` | General feedback |
| `billing_tickets` | Ticket lookup source |

## Routes

### Public Routes

| Route | Description |
|-------|-------------|
| `/app/[editionSlug]` | Attendee PWA |

### Admin Routes

| Route | Description |
|-------|-------------|
| `/admin/app` | Edition selector |
| `/admin/app/[editionSlug]` | App settings |

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/tickets/lookup` | POST | Find tickets by email |
| `/api/feedback/session` | POST | Submit session rating |
| `/api/feedback/session` | GET | Get user's session ratings |
| `/api/feedback/event` | POST | Submit event feedback |

## Admin Workflow

1. **Navigate to Admin**: Go to `/admin/app`
2. **Select Edition**: Choose the event edition
3. **Configure Appearance**: Set branding (logo, colors, title)
4. **Toggle Features**: Enable/disable tabs
5. **Setup Feedback**: Configure rating modes and options
6. **Preview**: Use phone preview to see changes
7. **Save Settings**: Apply changes

## UI Components

### RatingInput

Reusable rating component supporting multiple modes:

```svelte
<RatingInput
  mode="stars"
  value={rating}
  onValueChange={(v) => rating = v}
/>
```

Modes:
- `stars` - 5 star rating (click to select)
- `scale_10` - 1-10 buttons
- `thumbs` - Thumbs up/down
- `yes_no` - Yes/No buttons

## Testing

### E2E Tests

```bash
# Run attendee app tests
pnpm test:e2e tests/e2e/attendee-pwa.spec.ts

# Run admin settings tests
pnpm test:e2e tests/e2e/admin-app-settings.spec.ts
```

### Test Coverage

- Tab navigation
- Schedule day switching
- Favorites toggle and view
- Speaker display with talk info
- Ticket lookup flow
- QR code fullscreen
- Feedback submission
- Feature toggles
- Appearance settings

## Mobile Responsiveness

The app is designed mobile-first:

| Viewport | Behavior |
|----------|----------|
| < 375px | Single column, compact cards |
| 375-768px | Standard mobile view |
| > 768px | Two-column speaker grid |

### Safe Areas

The app respects iOS safe areas:
- `safe-area-bottom` on navigation
- Proper spacing for notches

## Best Practices

### For Event Organizers

1. **Test on mobile**: Always preview using admin phone preview
2. **Upload logo**: Adds professional branding
3. **Set colors**: Match your event theme
4. **Enable favorites**: Helps attendees plan
5. **Configure feedback**: Collect valuable insights

### For Development

1. **Use test IDs**: Add `data-testid` for E2E tests
2. **Handle offline**: Check connectivity before API calls
3. **Validate input**: Server-side validation for all forms
4. **Anonymous users**: Use consistent ID generation

## Related Documentation

- [Planning Module](./planning-module.md)
- [Billing Module](./billing-module.md)
- [Core Module](./core-module.md)
- [Architecture Overview](../architecture.md)
