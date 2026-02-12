# Planning Module

The planning module manages event schedules, including rooms, tracks, time slots, sessions, and staff assignments.

## Overview

The planning module provides:
- **Rooms**: Physical venues with capacity and equipment
- **Tracks**: Thematic categorization of sessions
- **Slots**: Time windows in specific rooms
- **Sessions**: Scheduled activities (talks, workshops, breaks)
- **Staff Assignments**: Team members assigned to rooms
- **Public Schedule**: Viewer with export options (iCal, JSON, PDF)

## Architecture

```
planning/
├── domain/                    # Business entities & rules
│   ├── session.ts            # Session with type and track
│   ├── slot.ts               # Time slot with overlap detection
│   ├── room.ts               # Room with equipment
│   ├── track.ts              # Track with color coding
│   ├── room-assignment.ts    # Staff assignments
│   └── index.ts              # Domain exports
├── infra/                     # Data access
│   ├── session-repository.ts
│   ├── slot-repository.ts
│   ├── room-repository.ts
│   ├── track-repository.ts
│   └── index.ts
├── usecases/                  # (Empty - logic in routes)
└── ui/                        # (Empty - components in routes)
```

## Domain Entities

### Room

Represents a physical venue or space.

```typescript
type Room = {
  id: string
  editionId: string
  name: string                   // 1-100 chars
  capacity?: number              // Seating capacity
  floor?: string                 // Floor/location
  equipment: Equipment[]         // Available equipment
  equipmentNotes?: string        // Additional details
  order: number                  // Display ordering
  createdAt: Date
  updatedAt: Date
}

type Equipment =
  | 'projector' | 'screen' | 'microphone' | 'whiteboard'
  | 'video_recording' | 'live_streaming' | 'power_outlets'
  | 'wifi' | 'air_conditioning' | 'wheelchair_accessible'
```

### Track

Organizes sessions by theme or topic.

```typescript
type Track = {
  id: string
  editionId: string
  name: string                   // 1-100 chars
  color: string                  // Hex color (default: #6b7280)
  description?: string           // max 500 chars
  order: number                  // Display ordering
  createdAt: Date
  updatedAt: Date
}
```

### Slot

Time window in a specific room.

```typescript
type Slot = {
  id: string
  editionId: string
  roomId: string
  date: Date                     // Event date
  startTime: string              // HH:MM format
  endTime: string                // HH:MM format
  createdAt: Date
  updatedAt: Date
}
```

**Helper Functions:**
- `getSlotDuration(slot)`: Returns duration in minutes
- `slotsOverlap(slot1, slot2)`: Detects time conflicts in same room

### Session

Scheduled activity within a slot.

```typescript
type Session = {
  id: string
  editionId: string
  slotId: string
  talkId?: string                // Link to CFP talk
  trackId?: string               // Track categorization
  title: string                  // 1-200 chars
  description?: string           // max 2000 chars
  type: SessionType
  createdAt: Date
  updatedAt: Date
}

type SessionType =
  | 'talk' | 'workshop' | 'keynote' | 'panel'
  | 'break' | 'lunch' | 'networking' | 'registration' | 'other'
```

**Helper Functions:**
- `isBreakSession(type)`: Identifies non-content sessions
- `requiresTalk(type)`: Determines if CFP talk is required
- `getSessionTypeLabel(type)`: Human-readable labels
- `getSessionTypeColor(type)`: Color coding for UI

### RoomAssignment

Staff member assigned to manage a room.

```typescript
type RoomAssignment = {
  id: string
  roomId: string
  memberId: string               // TeamMember ID
  editionId: string
  date?: Date                    // null = all edition days
  startTime?: string             // Optional time window
  endTime?: string
  notes?: string                 // Instructions (max 500 chars)
  createdAt: Date
  updatedAt: Date
}
```

## Business Rules

### Slot Constraints

1. **No Overlap**: Slots in the same room on the same date cannot overlap
2. **Time Validation**: End time must be after start time
3. **Time Format**: Must be HH:MM (24-hour format)

### Session Constraints

1. **Slot Exclusivity**: One session per slot
2. **Talk Uniqueness**: Each CFP talk can only be scheduled once
3. **Talk Requirement**: Some session types (talk, workshop, keynote, panel) require a linked talk
4. **Break Sessions**: Types like break, lunch, networking don't require talks

### Deletion Constraints

1. Cannot delete rooms with assigned slots
2. Cannot delete tracks with assigned sessions
3. Cannot delete slots with assigned sessions

## Routes

### Admin Routes

| Route | Description |
|-------|-------------|
| `/admin/planning` | Edition selector |
| `/admin/planning/[editionSlug]` | Schedule manager with tabs |
| `/admin/planning/[editionSlug]/settings` | Planning statistics |

### Schedule Manager Tabs

The main planning interface has 6 tabs:

1. **Schedule**: Visual grid view (by room or by track)
2. **Sessions**: Manage sessions and link talks
3. **Rooms**: CRUD for rooms with equipment
4. **Tracks**: CRUD for tracks with colors
5. **Slots**: Time slot management
6. **Staff**: Room assignments

### Public Routes

| Route | Description |
|-------|-------------|
| `/schedule/[editionSlug]` | Public schedule viewer |
| `/api/schedule/[editionSlug]/json` | JSON export |
| `/api/schedule/[editionSlug]/ical` | iCal export |

## Public Schedule

The public schedule displays:
- Only published editions
- Dual view: "By Room" (grid) or "By Track" (cards)
- Day selector for multi-day events
- Session type badges with colors
- Speaker information from CFP talks
- Responsive design (grid on desktop, cards on mobile)

### Export Formats

#### JSON Export

Complete schedule data for integrations:

```json
{
  "edition": { "name": "...", "dates": "..." },
  "event": { "name": "..." },
  "rooms": [...],
  "tracks": [...],
  "sessions": [
    {
      "title": "...",
      "type": "talk",
      "room": "Main Hall",
      "track": "Web Development",
      "date": "2025-03-15",
      "startTime": "10:00",
      "endTime": "10:45",
      "speakers": [{ "name": "...", "company": "..." }]
    }
  ]
}
```

#### iCal Export

RFC 5545 compliant calendar:
- Each session as VEVENT
- Location includes room name
- Description includes track and speakers
- Compatible with Outlook, Google Calendar, Apple Calendar

## Admin Workflow

1. **Create Rooms**: Define physical spaces with capacity and equipment
2. **Create Tracks** (optional): Set up thematic categories
3. **Create Time Slots**: Define time windows in rooms
4. **Import/Create Sessions**: Link CFP talks or create custom sessions
5. **Drag & Drop**: Rearrange sessions by dragging between slots
6. **Assign Staff** (optional): Assign team members to rooms
7. **Publish Edition**: Make schedule public

## Drag & Drop

The schedule grid supports drag & drop for easy session rearrangement.

### Features

- **Drag Sessions**: Sessions can be dragged from their current slot to another slot
- **Move to Empty Slot**: Drop a session on an empty slot to move it
- **Swap Sessions**: Drop a session on an occupied slot to swap the two sessions
- **Visual Feedback**: Drag handles and drop indicators show valid targets
- **Keyboard Accessible**: Sessions can also be edited via click/Enter key

### Implementation

The drag & drop uses native HTML5 Drag & Drop API:

```svelte
<div
  draggable={session ? 'true' : 'false'}
  ondragstart={(e) => handleDragStart(e, session.id, slot.id)}
  ondragend={handleDragEnd}
  ondragover={(e) => handleDragOver(e, slot.id)}
  ondrop={(e) => handleDrop(e, slot.id)}
>
  <!-- Session content -->
</div>
```

### Server Actions

| Action | Description |
|--------|-------------|
| `moveSession` | Move session to an empty slot |
| `swapSessions` | Swap two sessions between slots |

### Visual Indicators

- **Grip Handle**: `GripVertical` icon indicates draggable sessions
- **Drop Zone**: Empty slots highlight when a valid drop target
- **Swap Indicator**: Occupied slots show "Swap" label when hovering
- **Opacity**: Dragged session becomes semi-transparent during drag

## UI Components

### Schedule View

```svelte
<!-- By Room View -->
<table>
  <thead>
    <tr>
      <th>Time</th>
      {#each rooms as room}
        <th>{room.name}</th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each slots as slot}
      <tr>
        <td>{slot.startTime} - {slot.endTime}</td>
        {#each rooms as room}
          <td>
            {#if session}
              <SessionCard {session} />
            {/if}
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
```

### Session Card

Displays:
- Session title
- Type badge (color-coded)
- Track name (if assigned)
- Speaker names (for talks)
- Duration

## Repositories

### SessionRepository

```typescript
interface SessionRepository {
  findById(id: string): Promise<Session | null>
  findByEdition(editionId: string): Promise<Session[]>
  findBySlot(slotId: string): Promise<Session | null>
  findByTalk(talkId: string): Promise<Session | null>
  findByTrack(trackId: string): Promise<Session[]>
  create(data: CreateSession): Promise<Session>
  update(data: UpdateSession): Promise<Session>
  delete(id: string): Promise<void>
  isSlotOccupied(slotId: string, excludeSessionId?: string): Promise<boolean>
}
```

### SlotRepository

```typescript
interface SlotRepository {
  findById(id: string): Promise<Slot | null>
  findByEdition(editionId: string): Promise<Slot[]>
  findByRoom(roomId: string): Promise<Slot[]>
  findByDate(editionId: string, date: Date): Promise<Slot[]>
  create(data: CreateSlot): Promise<Slot>
  update(data: UpdateSlot): Promise<Slot>
  delete(id: string): Promise<void>
  checkOverlap(slot: Slot): Promise<Slot | null>
}
```

## PocketBase Collections

| Collection | Description |
|------------|-------------|
| `rooms` | Physical venues |
| `tracks` | Session tracks |
| `slots` | Time slots |
| `sessions` | Scheduled sessions |
| `room_assignments` | Staff assignments |

## Integration with CFP

The planning module integrates with CFP:

1. **Available Talks**: Lists accepted/confirmed talks not yet scheduled
2. **Session Creation**: Links a talk to a slot
3. **Speaker Display**: Shows speaker info in schedule
4. **Talk Status**: Scheduling a talk may update its status

## Testing

E2E tests cover:
- Room CRUD operations
- Track management
- Slot creation with overlap validation
- Session assignment
- Public schedule display
- Export functionality

```bash
pnpm test:e2e tests/e2e/planning.spec.ts
```

## Related Documentation

- [CFP Module](./cfp-module.md)
- [Core Module](./core-module.md)
- [Architecture Overview](../architecture.md)
