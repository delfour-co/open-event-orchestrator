# Feedback Feature

The feedback feature enables attendees to provide ratings and feedback on sessions and submit general event feedback through the PWA.

## Architecture

This feature follows Clean Architecture principles with separate layers:

```
feedback/
├── domain/              # Business logic and entities
│   ├── rating-mode.ts   # Rating system configuration
│   ├── session-feedback.ts  # Session feedback entity
│   ├── event-feedback.ts    # Event feedback entity
│   └── feedback-settings.ts # Settings entity
├── infra/              # Data access (PocketBase)
│   ├── session-feedback-repository.ts
│   ├── event-feedback-repository.ts
│   └── feedback-settings-repository.ts
└── ui/                 # Svelte components
    └── RatingInput.svelte
```

## Features

### Session Feedback

Attendees can rate sessions using configurable rating modes:

- **Stars (1-5)**: Classic 5-star rating with labels (Poor, Fair, Good, Very Good, Excellent)
- **Scale 10 (1-10)**: Numeric scale from 1 to 10
- **Thumbs**: Simple thumbs up/down
- **Yes/No**: Binary yes/no question

Each session feedback includes:
- Rating value (based on selected mode)
- Optional comment (can be made required via settings)
- Automatic timestamp tracking

### Event Feedback

Two types of event feedback:
- **General Feedback**: Overall event comments and suggestions
- **Problem Reports**: Report issues or problems during the event

Event feedback includes:
- Type (general/problem)
- Optional subject line
- Message body (required)
- Status tracking (open, acknowledged, resolved, closed)

### Feedback Settings

Per-edition configuration:
- Enable/disable session ratings
- Choose rating mode
- Require comments for session feedback
- Enable/disable event feedback
- Custom intro text

## Database Schema

### session_feedback

```
- id: string (PK)
- sessionId: string (FK -> sessions)
- userId: string (FK -> users)
- ratingMode: enum (stars, scale_10, thumbs, yes_no)
- numericValue: int (nullable)
- comment: text (max 2000 chars)
- created: datetime
- updated: datetime

UNIQUE INDEX: (sessionId, userId)
```

### event_feedback

```
- id: string (PK)
- editionId: string (FK -> editions)
- userId: string (FK -> users)
- feedbackType: enum (general, problem)
- subject: string (max 200 chars, optional)
- message: text (max 5000 chars)
- status: enum (open, acknowledged, resolved, closed)
- created: datetime
- updated: datetime
```

### feedback_settings

```
- id: string (PK)
- editionId: string (FK -> editions)
- sessionRatingEnabled: bool (default true)
- sessionRatingMode: enum (default stars)
- sessionCommentRequired: bool (default false)
- eventFeedbackEnabled: bool (default true)
- feedbackIntroText: text (max 2000 chars, optional)
- created: datetime
- updated: datetime

UNIQUE INDEX: (editionId)
```

## Usage

### Enable Feedback for an Edition

```typescript
import { FeedbackSettingsRepository } from '$lib/features/feedback'

const settingsRepo = new FeedbackSettingsRepository(pb)

await settingsRepo.create({
  editionId: 'edition123',
  sessionRatingEnabled: true,
  sessionRatingMode: 'stars',
  sessionCommentRequired: false,
  eventFeedbackEnabled: true,
  feedbackIntroText: 'We value your feedback!'
})
```

### Submit Session Feedback

```typescript
import { SessionFeedbackRepository } from '$lib/features/feedback'

const feedbackRepo = new SessionFeedbackRepository(pb)

await feedbackRepo.create({
  sessionId: 'session123',
  userId: 'user123',
  ratingMode: 'stars',
  numericValue: 5,
  comment: 'Great session!'
})
```

### Get Feedback Summary

```typescript
import { calculateFeedbackSummary } from '$lib/features/feedback'

const feedback = await feedbackRepo.getBySession('session123')
const summary = calculateFeedbackSummary(feedback)

console.log(summary)
// {
//   sessionId: 'session123',
//   totalFeedback: 42,
//   averageRating: 4.2,
//   ratingDistribution: { 1: 2, 2: 3, 3: 8, 4: 15, 5: 14 },
//   hasComments: true
// }
```

## PWA Integration

The attendee PWA (`/app/[editionSlug]`) has been redesigned with:

- Minimalist, clean UI design
- Mobile-first responsive layout
- Session rating buttons on each session card
- Dedicated feedback tab for event feedback
- Persistent favorites using IndexedDB

## Admin Configuration

Organizers can configure feedback settings in the admin panel:

1. Navigate to edition settings
2. Find "Feedback Settings" section
3. Enable/disable session ratings
4. Choose rating mode (stars, 1-10, thumbs, yes/no)
5. Toggle comment requirement
6. Enable/disable event feedback
7. Customize intro text

## Testing

Run tests:
```bash
pnpm test src/lib/features/feedback
```

Run E2E tests:
```bash
pnpm test:e2e tests/e2e/attendee-pwa.spec.ts
```

## Future Enhancements

- [ ] Admin dashboard to view feedback analytics
- [ ] Export feedback to CSV
- [ ] Email notifications for problem reports
- [ ] Sentiment analysis on comments
- [ ] Anonymous feedback option
- [ ] Feedback moderation workflow
