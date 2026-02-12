# CFP (Call for Papers) Module

The CFP module provides a complete solution for managing talk submissions, speaker communications, and review processes for conference events.

## Overview

The CFP module enables:

- **Speakers** to submit talks, manage submissions, and respond to acceptance decisions
- **Reviewers** to evaluate submissions with ratings and comments
- **Organizers** to manage the entire CFP lifecycle, from opening to final selection
- **Agents** (speaker bureaus, agencies) to submit talks on behalf of speakers

## Architecture

```
src/lib/features/cfp/
├── domain/           # Business entities and rules
│   ├── talk.ts       # Talk entity and status management
│   ├── speaker.ts    # Speaker profile
│   ├── category.ts   # Talk categories
│   ├── format.ts     # Talk formats (duration types)
│   ├── review.ts     # Review ratings
│   ├── comment.ts    # Internal comments
│   ├── notification.ts # Email notification types
│   ├── secret-link.ts  # Secure submission links
│   ├── agent-submission.ts # Agent/proxy submissions
│   └── speaker-feedback.ts # Personalized feedback
├── usecases/         # Application logic
│   ├── submit-talk.ts
│   ├── get-speaker-submissions.ts
│   └── index.ts
├── infra/            # PocketBase repositories
│   ├── talk-repository.ts
│   ├── speaker-repository.ts
│   ├── category-repository.ts
│   ├── format-repository.ts
│   ├── review-repository.ts
│   └── comment-repository.ts
├── services/         # External services
│   └── email-service.ts
└── ui/               # Reusable components
```

## Routes Structure

### Public Routes (Speakers)

| Route | Description |
|-------|-------------|
| `/cfp/[editionSlug]` | CFP landing page with event info, categories, formats |
| `/cfp/[editionSlug]/submit` | Talk submission form |
| `/cfp/[editionSlug]/submissions` | View submissions (requires secure token) |
| `/cfp/[editionSlug]/submissions?token=xxx` | Access submissions with token |
| `/cfp/[editionSlug]/submissions/[talkId]/edit?token=xxx` | Edit a submitted talk |

### Admin Routes (Reviewers/Organizers)

| Route | Description |
|-------|-------------|
| `/admin/cfp` | CFP editions list |
| `/admin/cfp/[editionSlug]/submissions` | All submissions with filtering |
| `/admin/cfp/[editionSlug]/submissions/[talkId]` | Talk detail with review UI |
| `/admin/cfp/[editionSlug]/settings` | CFP configuration |

## Talk Status Flow

```
draft → submitted → under_review → accepted → confirmed
                                ↘            ↘ declined
                                  rejected

Any status → withdrawn (by speaker)
```

### Status Definitions

| Status | Description | Speaker Actions | Reviewer Actions |
|--------|-------------|-----------------|------------------|
| `draft` | Not yet submitted | Edit, Submit | - |
| `submitted` | Awaiting review | Edit, Withdraw | Start Review |
| `under_review` | Being evaluated | Withdraw | Review, Accept/Reject |
| `accepted` | Talk selected | Confirm, Decline, Withdraw | - |
| `rejected` | Not selected | - | - |
| `confirmed` | Speaker confirmed | - | - |
| `declined` | Speaker declined | - | - |
| `withdrawn` | Speaker withdrew | - | - |

## Features

### 1. Talk Submission

Speakers submit talks through a two-step form:

1. **Speaker Profile**: Name, email, bio, company, social links
2. **Talk Details**: Title, abstract, description, category, format, level, language

Requirements:
- Title: 5-200 characters
- Abstract: 50-500 characters
- Description: Optional, max 5000 characters
- Language: French or English
- Level: Beginner, Intermediate, Advanced

### 2. CFP Timeline Enforcement

CFP can be configured with open/close dates:

- **Before open date**: Submission form inaccessible, "CFP Not Yet Open" displayed
- **During CFP**: Full submission capabilities
- **After close date**: Submission form inaccessible, "CFP Closed" displayed

### 3. Secure Token-Based Access

Speakers access their submissions using secure tokens instead of email addresses:

**How it works:**
1. When a speaker submits a talk, a secure token is generated and included in the confirmation email
2. The token is valid for 30 days and is tied to the speaker and edition
3. Speakers use the token URL to access their submissions page
4. If a speaker loses access, they can request a new token via email

**Security benefits:**
- Prevents unauthorized access if someone knows the speaker's email
- Tokens are cryptographically secure (64-character hex strings)
- Tokens expire after 30 days
- Each speaker/edition combination has a unique token

**Token endpoints:**
- `GET /cfp/[editionSlug]/submissions` - Shows "Request Access" form if no valid token
- `POST ?/requestAccess` - Sends access link to speaker's email
- All submission actions (edit, withdraw, confirm, decline) require a valid token

### 4. Speaker Submissions Management

Speakers can (via secure token):
- View all their submissions with status
- Edit talks in `draft` or `submitted` status (while CFP is open)
- Withdraw talks (from `draft`, `submitted`, `under_review`, or `accepted`)
- Confirm participation (for `accepted` talks)
- Decline participation (for `accepted` talks)

### 5. Co-Speaker Management

When enabled in CFP settings:
- Primary speaker can invite co-speakers by email
- Invitations expire after 14 days
- Co-speakers can accept or decline invitations
- All speakers on a talk receive notifications

### 6. Review System

Reviewers can:
- View all submissions with filters (status, category, format)
- Search by title or speaker name
- Rate talks (1-5 scale)
- Add review comments
- Add internal comments (visible only to organizers/reviewers)
- Change talk status (bulk or individual)

### 7. Anonymous Review Mode

When enabled:
- Speaker names hidden from reviewers in submission list
- Speaker info hidden on talk detail page (except for admins/owners)
- Reviews focus on content only

### 8. Email Notifications

Automatic notifications sent for:

| Event | Recipient | Subject |
|-------|-----------|---------|
| Submission confirmed | Speaker | Your talk submission has been received |
| Talk accepted | Speaker | Congratulations! Your talk has been accepted |
| Talk rejected | Speaker | Update on your talk submission |
| Confirmation reminder | Speaker | Please confirm your participation |
| CFP closing reminder | Speaker | CFP closing soon |
| Co-speaker invitation | Invitee | You've been invited as a co-speaker |

Email service supports:
- **Console** (development): Logs emails to console
- **Resend** (production): Sends via Resend API

## Configuration

### CFP Settings (per edition)

| Setting | Description | Default |
|---------|-------------|---------|
| `cfpOpenDate` | When CFP opens for submissions | - |
| `cfpCloseDate` | Deadline for submissions | - |
| `introText` | Welcome message on CFP page | - |
| `maxSubmissionsPerSpeaker` | Limit per speaker | 3 |
| `requireAbstract` | Abstract required | true |
| `requireDescription` | Description required | false |
| `allowCoSpeakers` | Enable co-speaker feature | false |
| `anonymousReview` | Hide speaker info from reviewers | false |

### Categories

Define talk topics (e.g., "Web Development", "Mobile", "AI/ML"):
- Name (required)
- Description (optional)
- Color (hex code for display)

### Formats

Define session types with durations:
- Name (e.g., "Lightning Talk", "Workshop")
- Duration in minutes
- Description (optional)

## Agent Submissions

The agent submission feature allows speaker bureaus, agencies, or representatives to submit talks on behalf of speakers.

### How It Works

1. **Agent Registration**: Organizers can create agent accounts with submission tokens
2. **Proxy Submission**: Agents submit talks with speaker information
3. **Speaker Validation**: Speakers receive email to confirm or reject submissions
4. **Status Tracking**: Organizers can track which submissions came from agents

### Agent Submission Entity

```typescript
type AgentSubmission = {
  id: string
  editionId: string
  agentId: string              // Agent identifier
  agentEmail: string           // Agent contact
  agentName: string            // Agent/agency name
  speakerEmail: string         // Actual speaker email
  talkId: string               // Linked talk
  submissionToken: string      // Secure access token
  validationStatus: 'pending' | 'validated' | 'rejected'
  validatedAt?: Date
  rejectedAt?: Date
  rejectionReason?: string
  notificationSentAt?: Date
  reminderSentAt?: Date
  origin: 'api' | 'form' | 'import'
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}
```

### Features

- **Token-based access**: Agents use secure tokens to submit
- **Speaker validation workflow**: Speakers must confirm submissions
- **Automatic notifications**: Email to speaker when submission made
- **Reminder system**: Automatic reminders for pending validations
- **Audit trail**: Track submission origin and agent information

### Helper Functions

- `isValidAgentToken(token)`: Validate agent submission token
- `needsSpeakerValidation(submission)`: Check if pending validation
- `getSubmissionsNeedingAction(submissions)`: Filter submissions needing notification/reminder
- `buildAgentNotificationContext(submission)`: Build email template context

## Database Collections

| Collection | Description |
|------------|-------------|
| `speakers` | Speaker profiles |
| `talks` | Talk submissions |
| `categories` | Talk categories (per edition) |
| `formats` | Talk formats (per edition) |
| `reviews` | Reviewer ratings |
| `comments` | Internal discussion comments |
| `cfp_settings` | CFP configuration (per edition) |
| `cospeaker_invitations` | Pending co-speaker invitations |
| `speaker_tokens` | Secure access tokens for speaker submissions |
| `agent_submissions` | Proxy submissions from agents/bureaus |
| `feedback_templates` | Personalized speaker feedback templates |

## Testing

### Unit Tests

Tests located in `src/lib/features/cfp/domain/*.test.ts`:
- Talk status transitions
- Speaker validation
- Category/format schemas
- Review rating calculations
- Notification subject generation

### E2E Tests

Tests located in `tests/e2e/`:
- `cfp-public.spec.ts` - Public CFP pages
- `cfp-submit.spec.ts` - Talk submission form
- `cfp-speaker-submissions.spec.ts` - Speaker submissions management
- `cfp-admin-submissions.spec.ts` - Admin submissions list
- `cfp-admin-talk-detail.spec.ts` - Talk review page
- `cfp-reviewer.spec.ts` - Reviewer workflow

## Usage Examples

### Submit a Talk (API)

```typescript
import { createSubmitTalkUseCase } from '$lib/features/cfp/usecases'

const submitTalk = createSubmitTalkUseCase(talkRepository, speakerRepository)

const result = await submitTalk({
  editionId: 'edition-123',
  speaker: {
    email: 'speaker@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    bio: 'Senior developer...'
  },
  talk: {
    title: 'Building Modern Web Apps',
    abstract: 'Learn how to build performant web applications...',
    language: 'en',
    level: 'intermediate',
    categoryId: 'cat-web',
    formatId: 'fmt-talk'
  }
})
```

### Change Talk Status (API)

```typescript
import { createTalkRepository } from '$lib/features/cfp/infra'

const talkRepo = createTalkRepository(pb)
await talkRepo.updateStatus(talkId, 'accepted')
```

### Send Notification (API)

```typescript
import { sendCfpNotification } from '$lib/server/cfp-notifications'

await sendCfpNotification({
  pb,
  type: 'talk_accepted',
  talkId,
  speakerId,
  editionId,
  editionSlug,
  editionName: 'DevFest 2025',
  eventName: 'DevFest',
  baseUrl: 'https://yoursite.com'
})
```

## Related Documentation

- [Database Seeding](../development/database-seeding.md) - Test data setup
- [Architecture Overview](../architecture.md) - Project structure
- [Contributing Guide](../../CONTRIBUTING.md) - Development workflow
