/**
 * Seed script for Open Event Orchestrator
 *
 * Creates test data for development and testing:
 * - Collections (if they don't exist)
 * - Users (admin, speaker, reviewer)
 * - Organization, Event, Edition
 * - Categories and Formats
 * - Sample talks with reviews
 *
 * Usage: pnpm seed
 *
 * Requirements:
 * - PocketBase must be running
 * - First run: go to http://localhost:8090/_/ to create admin account
 */

import { randomBytes } from 'node:crypto'
import PocketBase from 'pocketbase'

const POCKETBASE_URL = process.env.PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'admin@pocketbase.local'
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || 'adminpassword123'

const pb = new PocketBase(POCKETBASE_URL)

// Disable auto-cancellation for batch operations
pb.autoCancellation(false)

// ============================================================================
// Data definitions
// ============================================================================

const users = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    passwordConfirm: 'admin123',
    name: 'Admin User',
    role: 'organizer'
  },
  {
    email: 'speaker@example.com',
    password: 'speaker123',
    passwordConfirm: 'speaker123',
    name: 'Jane Speaker',
    role: 'speaker'
  },
  {
    email: 'speaker2@example.com',
    password: 'speaker123',
    passwordConfirm: 'speaker123',
    name: 'John Talker',
    role: 'speaker'
  },
  {
    email: 'reviewer@example.com',
    password: 'reviewer123',
    passwordConfirm: 'reviewer123',
    name: 'Bob Reviewer',
    role: 'reviewer'
  },
  // Additional team members for room assignments
  {
    email: 'marie@example.com',
    password: 'volunteer123',
    passwordConfirm: 'volunteer123',
    name: 'Marie Dupont',
    role: 'organizer'
  },
  {
    email: 'pierre@example.com',
    password: 'volunteer123',
    passwordConfirm: 'volunteer123',
    name: 'Pierre Martin',
    role: 'organizer'
  },
  {
    email: 'sophie@example.com',
    password: 'volunteer123',
    passwordConfirm: 'volunteer123',
    name: 'Sophie Bernard',
    role: 'organizer'
  }
]

const organization = {
  name: 'Demo Conference Org',
  slug: 'demo-conf',
  description: 'A demo organization for testing Open Event Orchestrator'
}

const event = {
  name: 'DevFest',
  slug: 'devfest',
  description: 'The biggest developer festival in the region'
}

const edition = {
  name: 'DevFest Paris 2025',
  slug: 'devfest-paris-2025',
  year: 2025,
  startDate: '2025-10-15',
  endDate: '2025-10-16',
  venue: 'Palais des Congres',
  city: 'Paris',
  country: 'France',
  status: 'published'
}

const categories = [
  {
    name: 'Web Development',
    color: 'blue',
    description: 'Frontend, Backend, Full-stack web technologies',
    order: 0
  },
  {
    name: 'Mobile',
    color: 'green',
    description: 'iOS, Android, Cross-platform mobile development',
    order: 1
  },
  {
    name: 'Cloud & DevOps',
    color: 'purple',
    description: 'Cloud platforms, CI/CD, Infrastructure as Code',
    order: 2
  },
  {
    name: 'AI & Machine Learning',
    color: 'orange',
    description: 'Artificial Intelligence, ML, Data Science',
    order: 3
  },
  {
    name: 'Security',
    color: 'red',
    description: 'Application security, DevSecOps, Best practices',
    order: 4
  }
]

const formats = [
  { name: 'Lightning Talk', duration: 15, description: 'Quick 15-minute presentation', order: 0 },
  {
    name: 'Conference Talk',
    duration: 45,
    description: 'Standard conference presentation',
    order: 1
  },
  { name: 'Deep Dive', duration: 60, description: 'In-depth technical session', order: 2 },
  { name: 'Workshop', duration: 120, description: '2-hour hands-on workshop', order: 3 }
]

const talks = [
  // Accepted talks - will be scheduled
  {
    title: 'Building Scalable Web Apps with SvelteKit',
    abstract:
      'Learn how to build performant and scalable web applications using SvelteKit, the modern framework for building web apps.',
    description:
      'In this talk, we will explore the key features of SvelteKit that make it ideal for building production-ready applications. We will cover routing, server-side rendering, API endpoints, and deployment strategies.',
    level: 'intermediate',
    language: 'en',
    status: 'accepted',
    categoryIndex: 0,
    formatIndex: 1,
    speakerIndex: 0
  },
  {
    title: 'Kubernetes for Developers: A Practical Guide',
    abstract:
      'Demystifying Kubernetes for application developers who want to deploy their apps to the cloud.',
    description:
      'This session will teach you the essential Kubernetes concepts you need as a developer. We will go through pods, deployments, services, and config maps with practical examples.',
    level: 'beginner',
    language: 'en',
    status: 'accepted',
    categoryIndex: 2,
    formatIndex: 1,
    speakerIndex: 1
  },
  {
    title: 'Introduction to Large Language Models',
    abstract: 'Understanding how LLMs work and how to integrate them into your applications.',
    description:
      'We will explore the fundamentals of large language models, from transformers to prompt engineering. You will learn how to effectively use APIs like OpenAI and build AI-powered features.',
    level: 'beginner',
    language: 'en',
    status: 'accepted',
    categoryIndex: 3,
    formatIndex: 2,
    speakerIndex: 0
  },
  {
    title: 'TypeScript Advanced Patterns',
    abstract:
      'Master advanced TypeScript patterns for better type safety and code maintainability.',
    description:
      'Explore conditional types, template literal types, mapped types and other advanced TypeScript features to write more robust applications.',
    level: 'advanced',
    language: 'en',
    status: 'accepted',
    categoryIndex: 0,
    formatIndex: 1,
    speakerIndex: 1
  },
  {
    title: 'GraphQL in Production: Lessons Learned',
    abstract: 'Real-world experiences running GraphQL APIs at scale.',
    description:
      'After 3 years of running GraphQL in production, we share our lessons on schema design, performance optimization, caching strategies, and monitoring.',
    level: 'intermediate',
    language: 'en',
    status: 'accepted',
    categoryIndex: 0,
    formatIndex: 1,
    speakerIndex: 0
  },
  {
    title: 'From Monolith to Microservices',
    abstract: 'A practical guide to migrating your monolithic application to microservices.',
    description:
      'Learn the patterns, pitfalls, and best practices for breaking down a monolith. We cover strangler fig pattern, data migration, and service boundaries.',
    level: 'intermediate',
    language: 'en',
    status: 'accepted',
    categoryIndex: 2,
    formatIndex: 2,
    speakerIndex: 1
  },
  {
    title: 'Building AI-Powered Code Assistants',
    abstract: 'How to build your own AI coding assistant using modern LLMs.',
    description:
      'We dive into RAG, embeddings, and prompt engineering to build effective code completion and refactoring tools.',
    level: 'advanced',
    language: 'en',
    status: 'accepted',
    categoryIndex: 3,
    formatIndex: 1,
    speakerIndex: 0
  },
  {
    title: 'PWA in 2025: The State of Progressive Web Apps',
    abstract: "What's new in PWAs and why they matter more than ever.",
    description:
      'Progressive Web Apps have evolved significantly. Learn about new capabilities, improved APIs, and success stories from major companies.',
    level: 'beginner',
    language: 'en',
    status: 'accepted',
    categoryIndex: 0,
    formatIndex: 0,
    speakerIndex: 1
  },
  {
    title: 'Terraform Best Practices',
    abstract: 'Infrastructure as Code done right with Terraform.',
    description:
      'Learn module design, state management, testing strategies, and CI/CD integration for Terraform projects.',
    level: 'intermediate',
    language: 'en',
    status: 'accepted',
    categoryIndex: 2,
    formatIndex: 1,
    speakerIndex: 0
  },
  {
    title: 'React Server Components Deep Dive',
    abstract: 'Understanding React Server Components and their impact on web development.',
    description:
      'A comprehensive look at RSC architecture, streaming, and how to build hybrid applications with server and client components.',
    level: 'advanced',
    language: 'en',
    status: 'accepted',
    categoryIndex: 0,
    formatIndex: 2,
    speakerIndex: 1
  },
  // Non-accepted talks
  {
    title: 'Securing Your Node.js Applications',
    abstract:
      'Best practices for building secure Node.js applications and avoiding common vulnerabilities.',
    description:
      'Security is crucial for any application. This talk covers OWASP Top 10 vulnerabilities in the context of Node.js, authentication best practices, and tools for security testing.',
    level: 'intermediate',
    language: 'en',
    status: 'rejected',
    categoryIndex: 4,
    formatIndex: 1,
    speakerIndex: 1
  },
  {
    title: 'React Native vs Flutter: A 2025 Comparison',
    abstract: 'Comparing the two leading cross-platform mobile frameworks in 2025.',
    description:
      'Both React Native and Flutter have evolved significantly. This lightning talk gives you a quick comparison to help you choose the right framework for your next mobile project.',
    level: 'beginner',
    language: 'en',
    status: 'submitted',
    categoryIndex: 1,
    formatIndex: 0,
    speakerIndex: 0
  },
  {
    title: 'Mobile Performance Optimization',
    abstract: 'Tips and tricks to make your mobile apps blazing fast.',
    description:
      'Learn profiling techniques, memory management, and rendering optimizations for mobile applications.',
    level: 'intermediate',
    language: 'en',
    status: 'under_review',
    categoryIndex: 1,
    formatIndex: 1,
    speakerIndex: 1
  }
]

const reviews = [
  {
    talkIndex: 0,
    userIndex: 3,
    rating: 4,
    comment:
      'Great topic, well structured abstract. Would love to see more details about performance optimization.'
  },
  {
    talkIndex: 0,
    userIndex: 0,
    rating: 5,
    comment: 'SvelteKit is trending, this will attract a lot of attendees.'
  },
  {
    talkIndex: 1,
    userIndex: 3,
    rating: 5,
    comment: 'Excellent practical approach to K8s. Clear and concise.'
  },
  {
    talkIndex: 1,
    userIndex: 0,
    rating: 4,
    comment: 'Good beginner content. Accepted for the conference.'
  },
  {
    talkIndex: 2,
    userIndex: 3,
    rating: 3,
    comment: 'Topic is interesting but the abstract could be more specific.'
  },
  {
    talkIndex: 3,
    userIndex: 3,
    rating: 2,
    comment: 'Too generic, we already have similar content.'
  },
  {
    talkIndex: 4,
    userIndex: 0,
    rating: 4,
    comment: 'Good comparison topic, perfect for a lightning talk.'
  }
]

const rooms = [
  {
    name: 'Grand Amphithéâtre',
    capacity: 500,
    floor: 'Niveau 0',
    description: 'Salle principale pour les keynotes',
    equipment: [
      'projector',
      'screen',
      'microphone',
      'video_recording',
      'live_streaming',
      'wifi',
      'wheelchair_accessible'
    ],
    equipmentNotes: 'Système son professionnel, 2 écrans géants',
    order: 0
  },
  {
    name: 'Salle Turing',
    capacity: 150,
    floor: 'Niveau 1',
    description: 'Salle de conférence standard',
    equipment: ['projector', 'screen', 'microphone', 'wifi', 'power_outlets'],
    equipmentNotes: '',
    order: 1
  },
  {
    name: 'Salle Lovelace',
    capacity: 80,
    floor: 'Niveau 1',
    description: 'Salle pour workshops',
    equipment: ['projector', 'whiteboard', 'wifi', 'power_outlets', 'air_conditioning'],
    equipmentNotes: 'Tables configurables pour ateliers',
    order: 2
  }
]

const tracks = [
  {
    name: 'Web & Frontend',
    color: '#3B82F6',
    description: 'Technologies web et frontend',
    order: 0
  },
  {
    name: 'Cloud & Backend',
    color: '#8B5CF6',
    description: 'Infrastructure cloud et développement backend',
    order: 1
  },
  {
    name: 'AI & Data',
    color: '#F59E0B',
    description: 'Intelligence artificielle et data science',
    order: 2
  }
]

// Time slots for the conference
// Day 1: 2025-10-15, Day 2: 2025-10-16
const slotDefinitions = [
  // Day 1 slots
  { date: '2025-10-15', startTime: '09:00', endTime: '09:45' },
  { date: '2025-10-15', startTime: '10:00', endTime: '10:45' },
  { date: '2025-10-15', startTime: '11:00', endTime: '11:45' },
  { date: '2025-10-15', startTime: '14:00', endTime: '14:45' },
  { date: '2025-10-15', startTime: '15:00', endTime: '15:45' },
  { date: '2025-10-15', startTime: '16:00', endTime: '16:45' },
  // Day 2 slots
  { date: '2025-10-16', startTime: '09:00', endTime: '09:45' },
  { date: '2025-10-16', startTime: '10:00', endTime: '10:45' },
  { date: '2025-10-16', startTime: '11:00', endTime: '11:45' },
  { date: '2025-10-16', startTime: '14:00', endTime: '14:45' },
  { date: '2025-10-16', startTime: '15:00', endTime: '15:45' }
]

// Organization members - link users to the organization with roles
// userIndex corresponds to the users array
const organizationMemberDefinitions = [
  { userIndex: 0, role: 'owner' }, // Admin User - owner
  { userIndex: 3, role: 'reviewer' }, // Bob Reviewer
  { userIndex: 4, role: 'organizer' }, // Marie Dupont
  { userIndex: 5, role: 'organizer' }, // Pierre Martin
  { userIndex: 6, role: 'organizer' } // Sophie Bernard
]

// Room assignments - assign organization members to rooms
// memberIndex corresponds to organizationMemberDefinitions array
const roomAssignmentDefinitions = [
  // Grand Amphithéâtre - Marie on Day 1, Pierre on Day 2
  { roomIndex: 0, memberIndex: 2, date: '2025-10-15', notes: 'Responsable accueil speakers' },
  { roomIndex: 0, memberIndex: 3, date: '2025-10-16', notes: 'Responsable accueil speakers' },
  // Salle Turing - Sophie both days
  { roomIndex: 1, memberIndex: 4, date: null, notes: 'Responsable salle pour toute la conférence' },
  // Salle Lovelace - Marie on Day 2 (after her shift at Grand Amphi)
  { roomIndex: 2, memberIndex: 2, date: '2025-10-16', notes: 'Aide pour les workshops' }
]

// Session definitions - will be populated with actual IDs during seeding
// Sessions reference slots, talks, and tracks by index
// talkIndex corresponds to the accepted talks in the talks array
const sessionDefinitions = [
  // ============ DAY 1 - 2025-10-15 ============

  // 09:00 - Keynote slot (Grand Amphithéâtre only)
  {
    title: 'Building Scalable Web Apps with SvelteKit',
    type: 'keynote',
    talkIndex: 0,
    trackIndex: 0, // Web & Frontend
    slotKey: '2025-10-15_09:00_0'
  },

  // 10:00 - All rooms
  {
    title: 'Kubernetes for Developers: A Practical Guide',
    type: 'talk',
    talkIndex: 1,
    trackIndex: 1, // Cloud & Backend
    slotKey: '2025-10-15_10:00_0'
  },
  {
    title: 'TypeScript Advanced Patterns',
    type: 'talk',
    talkIndex: 3,
    trackIndex: 0, // Web & Frontend
    slotKey: '2025-10-15_10:00_1'
  },
  {
    title: 'Introduction to Large Language Models',
    type: 'workshop',
    talkIndex: 2,
    trackIndex: 2, // AI & Data
    slotKey: '2025-10-15_10:00_2'
  },

  // 11:00 - All rooms
  {
    title: 'GraphQL in Production: Lessons Learned',
    type: 'talk',
    talkIndex: 4,
    trackIndex: 0, // Web & Frontend
    slotKey: '2025-10-15_11:00_0'
  },
  {
    title: 'From Monolith to Microservices',
    type: 'talk',
    talkIndex: 5,
    trackIndex: 1, // Cloud & Backend
    slotKey: '2025-10-15_11:00_1'
  },

  // 14:00 - Afternoon sessions
  {
    title: 'Building AI-Powered Code Assistants',
    type: 'talk',
    talkIndex: 6,
    trackIndex: 2, // AI & Data
    slotKey: '2025-10-15_14:00_0'
  },
  {
    title: 'PWA in 2025: The State of Progressive Web Apps',
    type: 'talk',
    talkIndex: 7,
    trackIndex: 0, // Web & Frontend
    slotKey: '2025-10-15_14:00_1'
  },

  // 15:00 - Afternoon sessions
  {
    title: 'Terraform Best Practices',
    type: 'talk',
    talkIndex: 8,
    trackIndex: 1, // Cloud & Backend
    slotKey: '2025-10-15_15:00_0'
  },

  // ============ DAY 2 - 2025-10-16 ============

  // 09:00 - Opening Day 2
  {
    title: 'React Server Components Deep Dive',
    type: 'keynote',
    talkIndex: 9,
    trackIndex: 0, // Web & Frontend
    slotKey: '2025-10-16_09:00_0'
  },

  // Break and lunch sessions (not assigned to slots)
  {
    title: 'Pause café matin',
    description: 'Networking et rafraîchissements',
    type: 'break',
    talkIndex: null,
    trackIndex: null,
    slotKey: null
  },
  {
    title: 'Déjeuner',
    description: 'Repas et networking',
    type: 'lunch',
    talkIndex: null,
    trackIndex: null,
    slotKey: null
  },
  {
    title: 'Pause café après-midi',
    description: 'Networking et rafraîchissements',
    type: 'break',
    talkIndex: null,
    trackIndex: null,
    slotKey: null
  }
]

// ============================================================================
// Collection schemas for PocketBase 0.36+
// PB 0.36+ uses 'fields' instead of 'schema'
// ============================================================================

// Helper function to create text field for PB 0.36+
function textField(name: string, required = false): Record<string, unknown> {
  return {
    id: name,
    name,
    type: 'text',
    required,
    hidden: false,
    presentable: false,
    autogeneratePattern: '',
    min: 0,
    max: 0,
    pattern: ''
  }
}

// Helper function to create number field
function numberField(name: string, required = false): Record<string, unknown> {
  return {
    id: name,
    name,
    type: 'number',
    required,
    hidden: false,
    presentable: false,
    min: null,
    max: null,
    noDecimal: false
  }
}

// Helper function to create date field
function dateField(name: string, required = false): Record<string, unknown> {
  return {
    id: name,
    name,
    type: 'date',
    required,
    hidden: false,
    presentable: false,
    min: '',
    max: ''
  }
}

// Helper function to create select field
function selectField(name: string, values: string[], required = false): Record<string, unknown> {
  return {
    id: name,
    name,
    type: 'select',
    required,
    hidden: false,
    presentable: false,
    values,
    maxSelect: 1
  }
}

// Helper function to create email field
function emailField(name: string, required = false): Record<string, unknown> {
  return {
    id: name,
    name,
    type: 'email',
    required,
    hidden: false,
    presentable: false,
    exceptDomains: null,
    onlyDomains: null
  }
}

// Helper function to create url field
function urlField(name: string, required = false): Record<string, unknown> {
  return {
    id: name,
    name,
    type: 'url',
    required,
    hidden: false,
    presentable: false,
    exceptDomains: null,
    onlyDomains: null
  }
}

// Helper function to create autodate field (PocketBase 0.23+)
function autodateField(
  name: string,
  onCreate: boolean,
  onUpdate: boolean
): Record<string, unknown> {
  return {
    id: name,
    name,
    type: 'autodate',
    required: false,
    hidden: false,
    presentable: false,
    onCreate,
    onUpdate
  }
}

function jsonField(name: string, required = false): Record<string, unknown> {
  return {
    id: name,
    name,
    type: 'json',
    required,
    hidden: false,
    presentable: false,
    maxSize: 2000000
  }
}

function boolField(name: string, required = false): Record<string, unknown> {
  return {
    id: name,
    name,
    type: 'bool',
    required,
    hidden: false,
    presentable: false
  }
}

// Collection schemas WITHOUT relation fields (relations are added later)
// Generate real random tokens for speaker access (32 bytes = 64 hex chars)
function generateToken(): string {
  return randomBytes(32).toString('hex')
}

// Fixed tokens for E2E tests - must match tests/e2e/cfp-speaker-submissions.spec.ts
const TEST_SPEAKER_TOKENS = {
  speaker1: 'a'.repeat(64), // For speaker@example.com (Jane Speaker)
  speaker2: 'b'.repeat(64) // For speaker2@example.com (John Talker)
}

const collectionSchemas: Array<{
  name: string
  type: 'base' | 'auth'
  fields: Record<string, unknown>[]
  listRule?: string | null
  viewRule?: string | null
  createRule?: string | null
  updateRule?: string | null
  deleteRule?: string | null
}> = [
  {
    name: 'organizations',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('name', true),
      textField('slug', true),
      textField('description'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'events',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('name', true),
      textField('slug', true),
      textField('description'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'editions',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('name', true),
      textField('slug', true),
      numberField('year', true),
      dateField('startDate', true),
      dateField('endDate', true),
      textField('venue'),
      textField('city'),
      textField('country'),
      selectField('status', ['draft', 'published', 'archived']),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'categories',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('name', true),
      textField('description'),
      textField('color'),
      numberField('order'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'formats',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('name', true),
      textField('description'),
      numberField('duration', true),
      numberField('order'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'speakers',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('firstName', true),
      textField('lastName', true),
      emailField('email', true),
      textField('bio'),
      textField('company'),
      textField('jobTitle'),
      urlField('photoUrl'),
      textField('twitter'),
      textField('github'),
      urlField('linkedin'),
      textField('city'),
      textField('country'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'talks',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('title', true),
      textField('abstract'),
      textField('description'),
      selectField('level', ['beginner', 'intermediate', 'advanced']),
      textField('language'),
      selectField('status', [
        'draft',
        'submitted',
        'under_review',
        'accepted',
        'rejected',
        'confirmed',
        'declined',
        'withdrawn'
      ]),
      dateField('submittedAt'),
      textField('notes'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'reviews',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      numberField('rating', true),
      textField('comment'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'comments',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('content', true),
      {
        id: 'isInternal',
        name: 'isInternal',
        type: 'bool',
        required: false,
        hidden: false,
        presentable: false
      },
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'email_logs',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      selectField(
        'type',
        [
          'submission_confirmed',
          'talk_accepted',
          'talk_rejected',
          'confirmation_reminder',
          'cfp_closing_reminder'
        ],
        true
      ),
      emailField('to', true),
      textField('subject', true),
      selectField('status', ['sent', 'failed', 'pending'], true),
      textField('error'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'organization_members',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      selectField('role', ['owner', 'admin', 'organizer', 'reviewer'], true),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'organization_invitations',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      emailField('email', true),
      selectField('role', ['admin', 'organizer', 'reviewer'], true),
      selectField('status', ['pending', 'accepted', 'expired', 'cancelled'], true),
      dateField('expiresAt'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'speaker_tokens',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('token', true),
      dateField('expiresAt', true),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  // Planning collections
  {
    name: 'rooms',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('name', true),
      numberField('capacity'),
      textField('floor'),
      textField('description'),
      jsonField('equipment'),
      textField('equipmentNotes'),
      numberField('order'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'tracks',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('name', true),
      textField('color'),
      textField('description'),
      numberField('order'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'slots',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      dateField('date', true),
      textField('startTime', true),
      textField('endTime', true),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'sessions',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('title', true),
      textField('description'),
      selectField('type', [
        'talk',
        'workshop',
        'keynote',
        'panel',
        'break',
        'lunch',
        'networking',
        'registration',
        'other'
      ]),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'room_assignments',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      dateField('date'),
      textField('startTime'),
      textField('endTime'),
      textField('notes'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  // App settings (singleton)
  {
    name: 'app_settings',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('smtpHost'),
      numberField('smtpPort'),
      textField('smtpUser'),
      textField('smtpPass'),
      textField('smtpFrom'),
      {
        id: 'smtpEnabled',
        name: 'smtpEnabled',
        type: 'bool',
        required: false,
        hidden: false,
        presentable: false
      },
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  // Billing collections
  {
    name: 'ticket_types',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('name', true),
      textField('description'),
      numberField('price'),
      selectField('currency', ['EUR', 'USD', 'GBP']),
      numberField('quantity', true),
      numberField('quantitySold'),
      dateField('salesStartDate'),
      dateField('salesEndDate'),
      {
        id: 'isActive',
        name: 'isActive',
        type: 'bool',
        required: false,
        hidden: false,
        presentable: false
      },
      numberField('order'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'orders',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('orderNumber', true),
      emailField('email', true),
      textField('firstName', true),
      textField('lastName', true),
      selectField('status', ['pending', 'paid', 'cancelled', 'refunded']),
      numberField('totalAmount'),
      selectField('currency', ['EUR', 'USD', 'GBP']),
      textField('stripeSessionId'),
      textField('stripePaymentIntentId'),
      dateField('paidAt'),
      dateField('cancelledAt'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'order_items',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('ticketTypeName', true),
      numberField('quantity', true),
      numberField('unitPrice'),
      numberField('totalPrice'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'billing_tickets',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      emailField('attendeeEmail', true),
      textField('attendeeFirstName', true),
      textField('attendeeLastName', true),
      textField('ticketNumber', true),
      textField('qrCode'),
      selectField('status', ['valid', 'used', 'cancelled']),
      dateField('checkedInAt'),
      textField('checkedInBy'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  // CRM collections
  {
    name: 'contacts',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('eventId'),
      emailField('email', true),
      textField('firstName', true),
      textField('lastName', true),
      textField('company'),
      textField('jobTitle'),
      textField('phone'),
      textField('address'),
      textField('bio'),
      textField('photoUrl'),
      textField('twitter'),
      textField('linkedin'),
      textField('github'),
      textField('city'),
      textField('country'),
      selectField('source', ['speaker', 'attendee', 'sponsor', 'manual', 'import']),
      jsonField('tags'),
      textField('notes'),
      textField('unsubscribeToken'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'contact_edition_links',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('contactId'),
      textField('editionId'),
      jsonField('roles'),
      textField('speakerId'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'consents',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('contactId'),
      selectField('type', ['marketing_email', 'data_sharing', 'analytics']),
      selectField('status', ['granted', 'denied', 'withdrawn']),
      dateField('grantedAt'),
      dateField('withdrawnAt'),
      selectField('source', ['form', 'import', 'api', 'manual']),
      textField('ipAddress'),
      textField('userAgent'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'segments',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('eventId'),
      textField('editionId'),
      textField('name', true),
      textField('description'),
      jsonField('criteria'),
      {
        id: 'isStatic',
        name: 'isStatic',
        type: 'bool',
        required: false,
        hidden: false,
        presentable: false
      },
      numberField('contactCount'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'email_templates',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('eventId'),
      textField('name', true),
      textField('subject', true),
      textField('bodyHtml'),
      textField('bodyText'),
      jsonField('variables'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'email_campaigns',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('eventId'),
      textField('editionId'),
      textField('name', true),
      textField('templateId'),
      textField('segmentId'),
      textField('subject', true),
      textField('bodyHtml'),
      textField('bodyText'),
      selectField('status', ['draft', 'scheduled', 'sending', 'sent', 'cancelled']),
      dateField('scheduledAt'),
      dateField('sentAt'),
      numberField('totalRecipients'),
      numberField('totalSent'),
      numberField('totalFailed'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  // Budget collections
  {
    name: 'edition_budgets',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      numberField('totalBudget'),
      selectField('currency', ['EUR', 'USD', 'GBP']),
      selectField('status', ['draft', 'approved', 'closed']),
      textField('notes'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'budget_categories',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('name', true),
      numberField('plannedAmount'),
      textField('notes'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'budget_transactions',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      selectField('type', ['expense', 'income'], true),
      numberField('amount', true),
      textField('description', true),
      textField('vendor'),
      textField('invoiceNumber'),
      dateField('date'),
      selectField('status', ['pending', 'paid', 'cancelled']),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  // Quotes & Invoices collections
  {
    name: 'budget_quotes',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('quoteNumber', true),
      textField('vendor', true),
      emailField('vendorEmail'),
      textField('vendorAddress'),
      textField('description'),
      jsonField('items'),
      numberField('totalAmount'),
      selectField('currency', ['EUR', 'USD', 'GBP']),
      selectField('status', ['draft', 'sent', 'accepted', 'rejected', 'expired']),
      dateField('validUntil'),
      textField('notes'),
      dateField('sentAt'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'budget_invoices',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('invoiceNumber', true),
      textField('file'),
      dateField('issueDate'),
      dateField('dueDate'),
      numberField('amount'),
      textField('notes'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  // Reimbursement collections
  {
    name: 'reimbursement_requests',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('requestNumber', true),
      selectField('status', ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid']),
      numberField('totalAmount'),
      selectField('currency', ['EUR', 'USD', 'GBP']),
      textField('notes'),
      textField('adminNotes'),
      dateField('reviewedAt'),
      dateField('submittedAt'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'reimbursement_items',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      selectField('expenseType', ['transport', 'accommodation', 'meals', 'other']),
      textField('description', true),
      numberField('amount', true),
      dateField('date'),
      textField('receipt'),
      textField('notes'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  // Financial Audit Log - immutable audit trail for budget operations
  {
    name: 'financial_audit_log',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: null,
    deleteRule: null,
    fields: [
      selectField('action', [
        'create',
        'update',
        'delete',
        'status_change',
        'send',
        'accept',
        'reject',
        'convert',
        'submit',
        'approve',
        'mark_paid'
      ]),
      selectField('entityType', [
        'transaction',
        'quote',
        'invoice',
        'reimbursement',
        'category',
        'budget'
      ]),
      textField('entityId', true),
      textField('entityReference'),
      jsonField('oldValue'),
      jsonField('newValue'),
      jsonField('metadata'),
      autodateField('created', true, false)
    ]
  },
  {
    name: 'alert_thresholds',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('name', true),
      textField('description'),
      textField('editionId', true),
      textField('metricSource', true),
      textField('operator', true),
      numberField('thresholdValue', true),
      textField('level', true),
      boolField('enabled'),
      boolField('notifyByEmail'),
      boolField('notifyInApp'),
      jsonField('emailRecipients'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  },
  {
    name: 'alerts',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: [
      textField('editionId', true),
      textField('thresholdId'),
      textField('title', true),
      textField('message'),
      textField('level', true),
      textField('metricSource'),
      numberField('currentValue'),
      numberField('thresholdValue'),
      textField('status'),
      textField('acknowledgedBy'),
      dateField('acknowledgedAt'),
      dateField('resolvedAt'),
      textField('dismissedBy'),
      dateField('dismissedAt'),
      autodateField('created', true, false),
      autodateField('updated', true, true)
    ]
  }
]

// Relation field definitions to add after collections are created
const relationDefinitions = [
  { collection: 'events', field: 'organizationId', target: 'organizations', maxSelect: 1 },
  { collection: 'editions', field: 'eventId', target: 'events', maxSelect: 1 },
  { collection: 'categories', field: 'editionId', target: 'editions', maxSelect: 1 },
  { collection: 'formats', field: 'editionId', target: 'editions', maxSelect: 1 },
  { collection: 'speakers', field: 'userId', target: 'users', maxSelect: 1 },
  { collection: 'talks', field: 'editionId', target: 'editions', maxSelect: 1 },
  { collection: 'talks', field: 'categoryId', target: 'categories', maxSelect: 1 },
  { collection: 'talks', field: 'formatId', target: 'formats', maxSelect: 1 },
  { collection: 'talks', field: 'speakerIds', target: 'speakers', maxSelect: 10 },
  { collection: 'reviews', field: 'talkId', target: 'talks', maxSelect: 1 },
  { collection: 'reviews', field: 'userId', target: 'users', maxSelect: 1 },
  { collection: 'comments', field: 'talkId', target: 'talks', maxSelect: 1 },
  { collection: 'comments', field: 'userId', target: 'users', maxSelect: 1 },
  { collection: 'email_logs', field: 'talkId', target: 'talks', maxSelect: 1 },
  { collection: 'email_logs', field: 'speakerId', target: 'speakers', maxSelect: 1 },
  { collection: 'email_logs', field: 'editionId', target: 'editions', maxSelect: 1 },
  {
    collection: 'organization_members',
    field: 'organizationId',
    target: 'organizations',
    maxSelect: 1
  },
  { collection: 'organization_members', field: 'userId', target: 'users', maxSelect: 1 },
  {
    collection: 'organization_invitations',
    field: 'organizationId',
    target: 'organizations',
    maxSelect: 1
  },
  { collection: 'organization_invitations', field: 'invitedBy', target: 'users', maxSelect: 1 },
  { collection: 'speaker_tokens', field: 'speakerId', target: 'speakers', maxSelect: 1 },
  { collection: 'speaker_tokens', field: 'editionId', target: 'editions', maxSelect: 1 },
  // Planning relations
  { collection: 'rooms', field: 'editionId', target: 'editions', maxSelect: 1 },
  { collection: 'tracks', field: 'editionId', target: 'editions', maxSelect: 1 },
  { collection: 'slots', field: 'editionId', target: 'editions', maxSelect: 1 },
  { collection: 'slots', field: 'roomId', target: 'rooms', maxSelect: 1 },
  { collection: 'sessions', field: 'editionId', target: 'editions', maxSelect: 1 },
  { collection: 'sessions', field: 'slotId', target: 'slots', maxSelect: 1 },
  { collection: 'sessions', field: 'talkId', target: 'talks', maxSelect: 1 },
  { collection: 'sessions', field: 'trackId', target: 'tracks', maxSelect: 1 },
  // Room assignments relations
  { collection: 'room_assignments', field: 'roomId', target: 'rooms', maxSelect: 1 },
  {
    collection: 'room_assignments',
    field: 'memberId',
    target: 'organization_members',
    maxSelect: 1
  },
  { collection: 'room_assignments', field: 'editionId', target: 'editions', maxSelect: 1 },
  // Billing relations
  { collection: 'ticket_types', field: 'editionId', target: 'editions', maxSelect: 1 },
  { collection: 'orders', field: 'editionId', target: 'editions', maxSelect: 1 },
  { collection: 'order_items', field: 'orderId', target: 'orders', maxSelect: 1 },
  { collection: 'order_items', field: 'ticketTypeId', target: 'ticket_types', maxSelect: 1 },
  { collection: 'billing_tickets', field: 'orderId', target: 'orders', maxSelect: 1 },
  { collection: 'billing_tickets', field: 'ticketTypeId', target: 'ticket_types', maxSelect: 1 },
  { collection: 'billing_tickets', field: 'editionId', target: 'editions', maxSelect: 1 },
  // Budget relations
  { collection: 'edition_budgets', field: 'editionId', target: 'editions', maxSelect: 1 },
  { collection: 'budget_categories', field: 'budgetId', target: 'edition_budgets', maxSelect: 1 },
  {
    collection: 'budget_transactions',
    field: 'categoryId',
    target: 'budget_categories',
    maxSelect: 1
  },
  // Quotes & Invoices relations
  { collection: 'budget_quotes', field: 'editionId', target: 'editions', maxSelect: 1 },
  {
    collection: 'budget_quotes',
    field: 'transactionId',
    target: 'budget_transactions',
    maxSelect: 1
  },
  {
    collection: 'budget_invoices',
    field: 'transactionId',
    target: 'budget_transactions',
    maxSelect: 1
  },
  // Reimbursement relations
  { collection: 'reimbursement_requests', field: 'editionId', target: 'editions', maxSelect: 1 },
  { collection: 'reimbursement_requests', field: 'speakerId', target: 'speakers', maxSelect: 1 },
  { collection: 'reimbursement_requests', field: 'reviewedBy', target: 'users', maxSelect: 1 },
  {
    collection: 'reimbursement_requests',
    field: 'transactionId',
    target: 'budget_transactions',
    maxSelect: 1
  },
  {
    collection: 'reimbursement_items',
    field: 'requestId',
    target: 'reimbursement_requests',
    maxSelect: 1
  },
  // Financial Audit Log relations
  { collection: 'financial_audit_log', field: 'editionId', target: 'editions', maxSelect: 1 },
  { collection: 'financial_audit_log', field: 'userId', target: 'users', maxSelect: 1 }
]

// ============================================================================
// Helper functions
// ============================================================================

async function authenticateAdmin(): Promise<boolean> {
  try {
    // PocketBase 0.23+ uses _superusers collection for admin auth
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log('  Authenticated as PocketBase superuser')
    return true
  } catch (err) {
    // Fallback to old admin API for older PocketBase versions
    try {
      await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
      console.log('  Authenticated as PocketBase admin (legacy)')
      return true
    } catch {
      console.log('  ⚠️  Could not authenticate as admin.')
      console.log('     Please create a PocketBase admin at http://localhost:8090/_/')
      console.log('     Then set PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD environment variables')
      console.log(`     Or use default: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
      return false
    }
  }
}

async function collectionExists(name: string): Promise<boolean> {
  try {
    await pb.collections.getOne(name)
    return true
  } catch {
    return false
  }
}

async function updateUsersCollection(): Promise<void> {
  console.log('📦 Updating users collection...')
  try {
    const usersCollection = await pb.collections.getOne('users')

    // Check if 'name' and 'role' fields already exist
    const hasNameField = usersCollection.fields?.some((f: { name: string }) => f.name === 'name')
    const hasRoleField = usersCollection.fields?.some((f: { name: string }) => f.name === 'role')

    const updateData: Record<string, unknown> = {}
    let needsUpdate = false

    if (!hasNameField || !hasRoleField) {
      const newFields = [...(usersCollection.fields || [])]

      if (!hasNameField) {
        newFields.push(textField('name', true))
      }
      if (!hasRoleField) {
        newFields.push(selectField('role', ['speaker', 'organizer', 'reviewer', 'admin']))
      }

      updateData.fields = newFields
      needsUpdate = true
    }

    // Update API rules to allow authenticated users to view all users
    // This is needed for expanding relations to users (e.g., organization_members.userId)
    if (
      usersCollection.listRule !== '@request.auth.id != ""' ||
      usersCollection.viewRule !== '@request.auth.id != ""'
    ) {
      updateData.listRule = '@request.auth.id != ""'
      updateData.viewRule = '@request.auth.id != ""'
      needsUpdate = true
    }

    if (needsUpdate) {
      await pb.collections.update(usersCollection.id, updateData)
      console.log('  Updated users collection with fields and API rules')
    } else {
      console.log('  Users collection already has name, role fields and proper API rules')
    }
  } catch (err) {
    console.error('  Failed to update users collection:', err)
  }
}

async function updateCollectionViaApi(
  collectionId: string,
  data: Record<string, unknown>
): Promise<boolean> {
  const response = await fetch(`${POCKETBASE_URL}/api/collections/${collectionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('  API Error:', JSON.stringify(error, null, 2))
    return false
  }
  return true
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Seed script intentionally handles many cases sequentially
async function createCollections(): Promise<Record<string, string>> {
  console.log('📦 Creating collections...')
  const collectionIds: Record<string, string> = {}

  // First, get the users collection ID
  try {
    const usersCollection = await pb.collections.getOne('users')
    collectionIds.users = usersCollection.id
  } catch (err) {
    console.error('  Failed to get users collection:', err)
  }

  // Collections that need to be deleted and recreated due to schema changes
  // (PocketBase doesn't allow changing field types, so we need to recreate)
  const collectionsToRecreate = ['speakers']

  // Step 0: Delete collections that need schema changes (only if empty or during reset)
  for (const collectionName of collectionsToRecreate) {
    try {
      if (await collectionExists(collectionName)) {
        const existing = await pb.collections.getOne(collectionName)
        // Check if collection needs recreation by looking for old 'name' field (speakers migration)
        const hasOldNameField = (existing.fields || []).some(
          (f: { name: string }) => f.name === 'name'
        )
        const hasNewFirstNameField = (existing.fields || []).some(
          (f: { name: string }) => f.name === 'firstName'
        )

        if (hasOldNameField && !hasNewFirstNameField) {
          // Need to delete and recreate - first check if empty
          const records = await pb.collection(collectionName).getList(1, 1)
          if (records.items.length === 0) {
            await pb.collections.delete(existing.id)
            console.log(`  Deleted collection '${collectionName}' for schema migration`)
          } else {
            console.log(
              `  Warning: Collection '${collectionName}' has records, manual migration needed`
            )
          }
        }
      }
    } catch (err) {
      console.error(`  Failed to check/delete collection ${collectionName}:`, err)
    }
  }

  // Step 1: Create or update collections with non-relation fields only
  for (const schema of collectionSchemas) {
    try {
      if (await collectionExists(schema.name)) {
        const existing = await pb.collections.getOne(schema.name)
        collectionIds[schema.name] = existing.id

        // Check for missing fields
        const existingFieldNames = new Set(
          (existing.fields || [])
            .filter((f: { system?: boolean }) => !f.system)
            .map((f: { name: string }) => f.name)
        )

        const missingFields = schema.fields.filter(
          (f: { name: string }) => !existingFieldNames.has(f.name)
        )

        if (missingFields.length > 0) {
          // Collection is missing some fields - add them
          const currentFields = existing.fields || []
          const updatedFields = [...currentFields, ...missingFields]

          const success = await updateCollectionViaApi(existing.id, {
            fields: updatedFields,
            listRule: schema.listRule ?? '',
            viewRule: schema.viewRule ?? '',
            createRule: schema.createRule ?? '',
            updateRule: schema.updateRule ?? '',
            deleteRule: schema.deleteRule ?? ''
          })

          if (success) {
            console.log(
              `  Updated collection '${schema.name}' (added: ${missingFields.map((f: { name: string }) => f.name).join(', ')})`
            )
          } else {
            console.error(`  Failed to update collection '${schema.name}'`)
          }
        } else {
          console.log(`  Collection '${schema.name}' already exists with all fields`)
        }
      } else {
        const collection = await pb.collections.create(schema)
        collectionIds[schema.name] = collection.id
        console.log(`  Created collection: ${schema.name}`)
      }
    } catch (err) {
      console.error(`  Failed to create/update collection ${schema.name}:`, err)
    }
  }

  // Step 2: Add relation fields to collections
  console.log('\n🔗 Adding relation fields...')

  for (const relDef of relationDefinitions) {
    try {
      const collection = await pb.collections.getOne(relDef.collection)
      const targetId = collectionIds[relDef.target]

      if (!targetId) {
        console.log(
          `  Skipping ${relDef.collection}.${relDef.field} - target '${relDef.target}' not found`
        )
        continue
      }

      // Check if field already exists
      const existingField = (collection.fields || []).find(
        (f: { name: string }) => f.name === relDef.field
      )

      if (existingField) {
        // Field exists - update collectionId if needed
        if (existingField.collectionId !== targetId) {
          const fields = (collection.fields || []).map((f: { name: string }) => {
            if (f.name === relDef.field) {
              return { ...f, collectionId: targetId }
            }
            return f
          })

          const success = await updateCollectionViaApi(collection.id, { fields })
          if (success) {
            console.log(`  Updated ${relDef.collection}.${relDef.field} -> ${relDef.target}`)
          }
        }
      } else {
        // Field doesn't exist - add it
        const newRelationField = {
          id: relDef.field,
          name: relDef.field,
          type: 'relation',
          required: false,
          hidden: false,
          presentable: false,
          collectionId: targetId,
          cascadeDelete: false,
          minSelect: 0,
          maxSelect: relDef.maxSelect
        }

        const fields = [...(collection.fields || []), newRelationField]

        const success = await updateCollectionViaApi(collection.id, { fields })
        if (success) {
          console.log(`  Added ${relDef.collection}.${relDef.field} -> ${relDef.target}`)
        } else {
          console.error(`  Failed to add ${relDef.collection}.${relDef.field}`)
        }
      }
    } catch (err) {
      console.error(`  Failed to process relation ${relDef.collection}.${relDef.field}:`, err)
    }
  }

  return collectionIds
}

// ============================================================================
// Main seed function
// ============================================================================

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Seed script intentionally handles many entities sequentially
async function seed(): Promise<void> {
  console.log('🌱 Starting seed...\n')
  console.log(`📡 PocketBase URL: ${POCKETBASE_URL}\n`)

  // Authenticate as admin first
  console.log('🔐 Authenticating...')
  const isAdmin = await authenticateAdmin()

  if (isAdmin) {
    // Update users collection with name and role fields
    await updateUsersCollection()

    // Create collections
    await createCollections()
    console.log('')
  }

  // Store created IDs for relations
  const ids: {
    users: string[]
    organization: string
    event: string
    edition: string
    categories: string[]
    formats: string[]
    speakers: string[]
    talks: string[]
    rooms: string[]
    tracks: string[]
    slots: Map<string, string> // key: date_startTime_roomIndex, value: slot ID
    sessions: string[]
    organizationMembers: string[]
    roomAssignments: string[]
    contacts: string[]
    segments: string[]
    emailTemplates: string[]
    emailCampaigns: string[]
    budget: string
    budgetCategories: string[]
    quotes: string[]
    invoices: string[]
    reimbursementRequests: string[]
    sponsors: string[]
    sponsorPackages: string[]
    editionSponsors: string[]
    apiKeys: string[]
    webhooks: string[]
  } = {
    users: [],
    organization: '',
    event: '',
    edition: '',
    categories: [],
    formats: [],
    speakers: [],
    talks: [],
    rooms: [],
    tracks: [],
    slots: new Map(),
    sessions: [],
    organizationMembers: [],
    roomAssignments: [],
    contacts: [],
    segments: [],
    emailTemplates: [],
    emailCampaigns: [],
    budget: '',
    budgetCategories: [],
    quotes: [],
    invoices: [],
    reimbursementRequests: [],
    sponsors: [],
    sponsorPackages: [],
    editionSponsors: [],
    apiKeys: [],
    webhooks: []
  }

  try {
    // ========================================================================
    // 1. Create Users
    // ========================================================================
    console.log('👤 Creating users...')
    for (const userData of users) {
      try {
        // Check if user exists
        const existing = await pb.collection('users').getList(1, 1, {
          filter: `email = "${userData.email}"`
        })

        if (existing.items.length > 0) {
          console.log(`  User '${userData.email}' already exists`)
          ids.users.push(existing.items[0].id)
        } else {
          const user = await pb.collection('users').create(userData)
          console.log(`  Created user: ${userData.email}`)
          ids.users.push(user.id)
        }
      } catch (err) {
        console.error(`  Failed to create user ${userData.email}:`, err)
      }
    }
    console.log('')

    // ========================================================================
    // 2. Create Organization
    // ========================================================================
    console.log('🏢 Creating organization...')
    try {
      const existing = await pb.collection('organizations').getList(1, 1, {
        filter: `slug = "${organization.slug}"`
      })

      if (existing.items.length > 0) {
        console.log(`  Organization '${organization.slug}' already exists`)
        ids.organization = existing.items[0].id
      } else {
        const org = await pb.collection('organizations').create(organization)
        console.log(`  Created organization: ${organization.name}`)
        ids.organization = org.id
      }
    } catch (err) {
      console.error('  Failed to create organization:', err)
    }
    console.log('')

    // ========================================================================
    // 2b. Create Organization Members
    // ========================================================================
    console.log('👥 Creating organization members...')
    for (const memberDef of organizationMemberDefinitions) {
      try {
        const userId = ids.users[memberDef.userIndex]
        if (!userId) {
          console.log(`  Skipping member (user index ${memberDef.userIndex} not found)`)
          continue
        }

        const existing = await pb.collection('organization_members').getList(1, 1, {
          filter: `organizationId = "${ids.organization}" && userId = "${userId}"`
        })

        if (existing.items.length > 0) {
          console.log(`  Member for user ${memberDef.userIndex} already exists`)
          ids.organizationMembers.push(existing.items[0].id)
        } else {
          const member = await pb.collection('organization_members').create({
            organizationId: ids.organization,
            userId,
            role: memberDef.role
          })
          console.log(`  Created member: ${users[memberDef.userIndex].name} (${memberDef.role})`)
          ids.organizationMembers.push(member.id)
        }
      } catch (err) {
        console.error('  Failed to create organization member:', err)
      }
    }
    console.log('')

    // ========================================================================
    // 3. Create Event
    // ========================================================================
    console.log('📅 Creating event...')
    try {
      const existing = await pb.collection('events').getList(1, 1, {
        filter: `slug = "${event.slug}"`
      })

      if (existing.items.length > 0) {
        console.log(`  Event '${event.slug}' already exists`)
        ids.event = existing.items[0].id
      } else {
        const evt = await pb.collection('events').create({
          ...event,
          organizationId: ids.organization
        })
        console.log(`  Created event: ${event.name}`)
        ids.event = evt.id
      }
    } catch (err) {
      console.error('  Failed to create event:', err)
    }
    console.log('')

    // ========================================================================
    // 4. Create Edition
    // ========================================================================
    console.log('🎫 Creating edition...')
    try {
      const existing = await pb.collection('editions').getList(1, 1, {
        filter: `slug = "${edition.slug}"`
      })

      if (existing.items.length > 0) {
        console.log(`  Edition '${edition.slug}' already exists`)
        ids.edition = existing.items[0].id
      } else {
        const ed = await pb.collection('editions').create({
          ...edition,
          eventId: ids.event
        })
        console.log(`  Created edition: ${edition.name}`)
        ids.edition = ed.id
      }
    } catch (err) {
      console.error('  Failed to create edition:', err)
    }
    console.log('')

    // ========================================================================
    // 5. Create Categories
    // ========================================================================
    console.log('🏷️  Creating categories...')
    for (const category of categories) {
      try {
        const existing = await pb.collection('categories').getList(1, 1, {
          filter: `name = "${category.name}" && editionId = "${ids.edition}"`
        })

        if (existing.items.length > 0) {
          console.log(`  Category '${category.name}' already exists`)
          ids.categories.push(existing.items[0].id)
        } else {
          const cat = await pb.collection('categories').create({
            ...category,
            editionId: ids.edition
          })
          console.log(`  Created category: ${category.name}`)
          ids.categories.push(cat.id)
        }
      } catch (err) {
        console.error(`  Failed to create category ${category.name}:`, err)
      }
    }
    console.log('')

    // ========================================================================
    // 6. Create Formats
    // ========================================================================
    console.log('⏱️  Creating formats...')
    for (const format of formats) {
      try {
        const existing = await pb.collection('formats').getList(1, 1, {
          filter: `name = "${format.name}" && editionId = "${ids.edition}"`
        })

        if (existing.items.length > 0) {
          console.log(`  Format '${format.name}' already exists`)
          ids.formats.push(existing.items[0].id)
        } else {
          const fmt = await pb.collection('formats').create({
            ...format,
            editionId: ids.edition
          })
          console.log(`  Created format: ${format.name}`)
          ids.formats.push(fmt.id)
        }
      } catch (err) {
        console.error(`  Failed to create format ${format.name}:`, err)
      }
    }
    console.log('')

    // ========================================================================
    // 7. Create Speakers
    // ========================================================================
    console.log('🎤 Creating speakers...')
    const speakerUsers = [users[1], users[2]] // speaker and speaker2
    for (let i = 0; i < speakerUsers.length; i++) {
      const user = speakerUsers[i]
      try {
        const existing = await pb.collection('speakers').getList(1, 1, {
          filter: `email = "${user.email}"`
        })

        if (existing.items.length > 0) {
          console.log(`  Speaker '${user.email}' already exists`)
          ids.speakers.push(existing.items[0].id)
        } else {
          // Split name into firstName and lastName
          const nameParts = user.name.split(' ')
          const firstName = nameParts[0]
          const lastName = nameParts.slice(1).join(' ') || 'Speaker'

          const speaker = await pb.collection('speakers').create({
            firstName,
            lastName,
            email: user.email,
            bio: `${user.name} is a passionate developer and speaker.`,
            company: 'Tech Corp',
            jobTitle: 'Senior Developer',
            userId: ids.users[i + 1] // +1 because admin is at index 0
          })
          console.log(`  Created speaker: ${user.name}`)
          ids.speakers.push(speaker.id)
        }
      } catch (err) {
        console.error(`  Failed to create speaker ${user.name}:`, err)
      }
    }
    console.log('')

    // ========================================================================
    // 7b. Create Speaker Tokens for E2E tests
    // ========================================================================
    console.log('🔑 Creating speaker tokens...')
    const tokenKeys = Object.keys(TEST_SPEAKER_TOKENS) as Array<keyof typeof TEST_SPEAKER_TOKENS>
    for (let i = 0; i < Math.min(ids.speakers.length, tokenKeys.length); i++) {
      const speakerId = ids.speakers[i]
      const tokenKey = tokenKeys[i]
      const token = TEST_SPEAKER_TOKENS[tokenKey]

      try {
        const existing = await pb.collection('speaker_tokens').getList(1, 1, {
          filter: `speakerId = "${speakerId}" && editionId = "${ids.edition}"`
        })

        if (existing.items.length > 0) {
          console.log(`  Token already exists for speaker ${i + 1}`)
        } else {
          // Token expires in 30 days
          const expiresAt = new Date()
          expiresAt.setDate(expiresAt.getDate() + 30)

          await pb.collection('speaker_tokens').create({
            speakerId,
            editionId: ids.edition,
            token,
            expiresAt: expiresAt.toISOString()
          })
          console.log(`  Created token for speaker ${i + 1}`)
        }
      } catch (err) {
        console.error(`  Failed to create token for speaker ${i + 1}:`, err)
      }
    }
    console.log('')

    // ========================================================================
    // 8. Create Talks
    // ========================================================================
    console.log('💬 Creating talks...')
    for (const talk of talks) {
      try {
        const existing = await pb.collection('talks').getList(1, 1, {
          filter: `title = "${talk.title.replace(/"/g, '\\"')}" && editionId = "${ids.edition}"`
        })

        if (existing.items.length > 0) {
          console.log(`  Talk '${talk.title.substring(0, 40)}...' already exists`)
          ids.talks.push(existing.items[0].id)
        } else {
          const speakerId = ids.speakers[talk.speakerIndex]
          if (!speakerId) {
            console.log(`  Skipping talk (no speaker): ${talk.title.substring(0, 40)}`)
            continue
          }

          const t = await pb.collection('talks').create({
            title: talk.title,
            abstract: talk.abstract,
            description: talk.description,
            level: talk.level,
            language: talk.language,
            status: talk.status,
            editionId: ids.edition,
            categoryId: ids.categories[talk.categoryIndex],
            formatId: ids.formats[talk.formatIndex],
            speakerIds: [speakerId]
          })
          console.log(`  Created talk: ${talk.title.substring(0, 50)}...`)
          ids.talks.push(t.id)
        }
      } catch (err) {
        console.error(`  Failed to create talk ${talk.title}:`, err)
      }
    }
    console.log('')

    // ========================================================================
    // 9. Create Reviews
    // ========================================================================
    console.log('⭐ Creating reviews...')
    for (const review of reviews) {
      try {
        const talkId = ids.talks[review.talkIndex]
        const userId = ids.users[review.userIndex]

        if (!talkId || !userId) {
          console.log('  Skipping review (missing talk or user)')
          continue
        }

        const existing = await pb.collection('reviews').getList(1, 1, {
          filter: `talkId = "${talkId}" && userId = "${userId}"`
        })

        if (existing.items.length > 0) {
          console.log(`  Review already exists for talk ${review.talkIndex}`)
        } else {
          await pb.collection('reviews').create({
            rating: review.rating,
            comment: review.comment,
            talkId,
            userId
          })
          console.log(`  Created review for talk ${review.talkIndex} (${review.rating} stars)`)
        }
      } catch (err) {
        console.error('  Failed to create review:', err)
      }
    }
    console.log('')

    // ========================================================================
    // 10. Create Rooms
    // ========================================================================
    console.log('🏛️  Creating rooms...')
    for (const room of rooms) {
      try {
        const existing = await pb.collection('rooms').getList(1, 1, {
          filter: `name = "${room.name}" && editionId = "${ids.edition}"`
        })

        if (existing.items.length > 0) {
          console.log(`  Room '${room.name}' already exists`)
          ids.rooms.push(existing.items[0].id)
        } else {
          const r = await pb.collection('rooms').create({
            ...room,
            editionId: ids.edition
          })
          console.log(`  Created room: ${room.name}`)
          ids.rooms.push(r.id)
        }
      } catch (err) {
        console.error(`  Failed to create room ${room.name}:`, err)
      }
    }
    console.log('')

    // ========================================================================
    // 11. Create Tracks
    // ========================================================================
    console.log('🎯 Creating tracks...')
    for (const track of tracks) {
      try {
        const existing = await pb.collection('tracks').getList(1, 1, {
          filter: `name = "${track.name}" && editionId = "${ids.edition}"`
        })

        if (existing.items.length > 0) {
          console.log(`  Track '${track.name}' already exists`)
          ids.tracks.push(existing.items[0].id)
        } else {
          const t = await pb.collection('tracks').create({
            ...track,
            editionId: ids.edition
          })
          console.log(`  Created track: ${track.name}`)
          ids.tracks.push(t.id)
        }
      } catch (err) {
        console.error(`  Failed to create track ${track.name}:`, err)
      }
    }
    console.log('')

    // ========================================================================
    // 12. Create Slots
    // ========================================================================
    console.log('🕐 Creating slots...')
    // Create slots for each room and each time slot definition
    for (let roomIndex = 0; roomIndex < ids.rooms.length; roomIndex++) {
      const roomId = ids.rooms[roomIndex]
      for (const slotDef of slotDefinitions) {
        try {
          const existing = await pb.collection('slots').getList(1, 1, {
            filter: `date = "${slotDef.date}" && startTime = "${slotDef.startTime}" && roomId = "${roomId}" && editionId = "${ids.edition}"`
          })

          const slotKey = `${slotDef.date}_${slotDef.startTime}_${roomIndex}`

          if (existing.items.length > 0) {
            console.log(
              `  Slot '${slotDef.date} ${slotDef.startTime}' for room ${roomIndex} already exists`
            )
            ids.slots.set(slotKey, existing.items[0].id)
          } else {
            const s = await pb.collection('slots').create({
              date: slotDef.date,
              startTime: slotDef.startTime,
              endTime: slotDef.endTime,
              roomId,
              editionId: ids.edition
            })
            console.log(
              `  Created slot: ${slotDef.date} ${slotDef.startTime}-${slotDef.endTime} (Room ${roomIndex})`
            )
            ids.slots.set(slotKey, s.id)
          }
        } catch (err) {
          console.error(`  Failed to create slot ${slotDef.date} ${slotDef.startTime}:`, err)
        }
      }
    }
    console.log('')

    // ========================================================================
    // 13. Create Sessions
    // ========================================================================
    console.log('📋 Creating sessions...')
    for (const sessionDef of sessionDefinitions) {
      try {
        const existing = await pb.collection('sessions').getList(1, 1, {
          filter: `title = "${sessionDef.title.replace(/"/g, '\\"')}" && editionId = "${ids.edition}"`
        })

        if (existing.items.length > 0) {
          console.log(`  Session '${sessionDef.title}' already exists`)
          ids.sessions.push(existing.items[0].id)
        } else {
          const sessionData: Record<string, unknown> = {
            title: sessionDef.title,
            description: sessionDef.description,
            type: sessionDef.type,
            editionId: ids.edition
          }

          // Add talk reference if specified
          if (sessionDef.talkIndex !== null && ids.talks[sessionDef.talkIndex]) {
            sessionData.talkId = ids.talks[sessionDef.talkIndex]
          }

          // Add track reference if specified
          if (sessionDef.trackIndex !== null && ids.tracks[sessionDef.trackIndex]) {
            sessionData.trackId = ids.tracks[sessionDef.trackIndex]
          }

          // Add slot reference if specified
          if (sessionDef.slotKey !== null && ids.slots.has(sessionDef.slotKey)) {
            sessionData.slotId = ids.slots.get(sessionDef.slotKey)
          }

          const session = await pb.collection('sessions').create(sessionData)
          console.log(`  Created session: ${sessionDef.title}`)
          ids.sessions.push(session.id)
        }
      } catch (err) {
        console.error(`  Failed to create session ${sessionDef.title}:`, err)
      }
    }
    console.log('')

    // ========================================================================
    // 14. Create Room Assignments
    // ========================================================================
    console.log('🎫 Creating room assignments...')
    for (const assignmentDef of roomAssignmentDefinitions) {
      try {
        const roomId = ids.rooms[assignmentDef.roomIndex]
        const memberId = ids.organizationMembers[assignmentDef.memberIndex]

        if (!roomId || !memberId) {
          console.log(
            `  Skipping assignment (room ${assignmentDef.roomIndex} or member ${assignmentDef.memberIndex} not found)`
          )
          continue
        }

        // Build filter based on date presence
        let filter = `roomId = "${roomId}" && memberId = "${memberId}" && editionId = "${ids.edition}"`
        if (assignmentDef.date) {
          filter += ` && date = "${assignmentDef.date}"`
        }

        const existing = await pb.collection('room_assignments').getList(1, 1, { filter })

        if (existing.items.length > 0) {
          console.log(`  Room assignment already exists for room ${assignmentDef.roomIndex}`)
          ids.roomAssignments.push(existing.items[0].id)
        } else {
          const assignmentData: Record<string, unknown> = {
            roomId,
            memberId,
            editionId: ids.edition,
            notes: assignmentDef.notes
          }

          if (assignmentDef.date) {
            assignmentData.date = assignmentDef.date
          }

          const assignment = await pb.collection('room_assignments').create(assignmentData)
          const memberUser =
            users[organizationMemberDefinitions[assignmentDef.memberIndex].userIndex]
          const dateStr = assignmentDef.date || 'all days'
          console.log(
            `  Created assignment: ${memberUser.name} -> ${rooms[assignmentDef.roomIndex].name} (${dateStr})`
          )
          ids.roomAssignments.push(assignment.id)
        }
      } catch (err) {
        console.error('  Failed to create room assignment:', err)
      }
    }
    console.log('')

    // ========================================================================
    // 15. Create Ticket Types
    // ========================================================================
    console.log('🎫 Creating ticket types...')
    const ticketTypes = [
      {
        name: 'Early Bird',
        description: 'Discounted early bird ticket - limited availability',
        price: 4900,
        currency: 'EUR',
        quantity: 50,
        isActive: true,
        order: 0
      },
      {
        name: 'Standard',
        description: 'Standard conference ticket with access to all talks',
        price: 9900,
        currency: 'EUR',
        quantity: 200,
        isActive: true,
        order: 1
      },
      {
        name: 'VIP',
        description: 'VIP ticket with reserved seating and exclusive networking dinner',
        price: 19900,
        currency: 'EUR',
        quantity: 30,
        isActive: true,
        order: 2
      },
      {
        name: 'Student',
        description: 'Free ticket for students (valid student ID required at check-in)',
        price: 0,
        currency: 'EUR',
        quantity: 100,
        isActive: true,
        order: 3
      }
    ]

    for (const ticketType of ticketTypes) {
      try {
        const existing = await pb.collection('ticket_types').getList(1, 1, {
          filter: `name = "${ticketType.name}" && editionId = "${ids.edition}"`
        })

        if (existing.items.length > 0) {
          console.log(`  Ticket type '${ticketType.name}' already exists`)
        } else {
          await pb.collection('ticket_types').create({
            ...ticketType,
            editionId: ids.edition,
            quantitySold: 0
          })
          console.log(`  Created ticket type: ${ticketType.name}`)
        }
      } catch (err) {
        console.error(`  Failed to create ticket type ${ticketType.name}:`, err)
      }
    }
    console.log('')

    // ========================================================================
    // 15b. Create App Settings (SMTP defaults for Mailpit)
    // ========================================================================
    console.log('⚙️  Creating app settings...')
    try {
      const existing = await pb.collection('app_settings').getList(1, 1)
      if (existing.items.length > 0) {
        console.log('  App settings already exist')
      } else {
        await pb.collection('app_settings').create({
          smtpHost: 'localhost',
          smtpPort: 1025,
          smtpUser: '',
          smtpPass: '',
          smtpFrom: 'noreply@open-event-orchestrator.local',
          smtpEnabled: true
        })
        console.log('  Created default SMTP settings (Mailpit localhost:1025)')
      }
    } catch (err) {
      console.error('  Failed to create app settings:', err)
    }
    console.log('')

    // ========================================================================
    // Billing: Orders, Order Items, and Tickets
    // ========================================================================
    console.log('🛒 Creating orders and tickets...')

    // Get ticket type IDs
    const ttRecords = await pb.collection('ticket_types').getFullList({
      filter: `editionId = "${ids.edition}"`
    })
    const ttMap = new Map(ttRecords.map((r) => [r.name as string, r]))

    const QRCode = await import('qrcode')

    const generateOrderNumber = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let result = 'ORD-'
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    const generateTicketNumber = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let result = 'TKT-'
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    const orderData = [
      {
        email: 'alice.martin@example.com',
        firstName: 'Alice',
        lastName: 'Martin',
        status: 'paid',
        items: [{ ticketType: 'Early Bird', quantity: 2 }],
        checkedIn: [true, false]
      },
      {
        email: 'bob.dupont@example.com',
        firstName: 'Bob',
        lastName: 'Dupont',
        status: 'paid',
        items: [{ ticketType: 'Standard', quantity: 1 }],
        checkedIn: [true]
      },
      {
        email: 'claire.bernard@example.com',
        firstName: 'Claire',
        lastName: 'Bernard',
        status: 'paid',
        items: [
          { ticketType: 'VIP', quantity: 1 },
          { ticketType: 'Standard', quantity: 1 }
        ],
        checkedIn: [true, false]
      },
      {
        email: 'david.leroy@example.com',
        firstName: 'David',
        lastName: 'Leroy',
        status: 'paid',
        items: [{ ticketType: 'Student', quantity: 3 }],
        checkedIn: [true, true, false]
      },
      {
        email: 'emma.petit@example.com',
        firstName: 'Emma',
        lastName: 'Petit',
        status: 'paid',
        items: [{ ticketType: 'Standard', quantity: 2 }],
        checkedIn: [false, false]
      },
      {
        email: 'francois.moreau@example.com',
        firstName: 'François',
        lastName: 'Moreau',
        status: 'paid',
        items: [{ ticketType: 'Early Bird', quantity: 1 }],
        checkedIn: [true]
      },
      {
        email: 'gabrielle.thomas@example.com',
        firstName: 'Gabrielle',
        lastName: 'Thomas',
        status: 'cancelled',
        items: [{ ticketType: 'Standard', quantity: 1 }],
        checkedIn: [false]
      },
      {
        email: 'hugo.robert@example.com',
        firstName: 'Hugo',
        lastName: 'Robert',
        status: 'pending',
        items: [{ ticketType: 'VIP', quantity: 2 }],
        checkedIn: [false, false]
      },
      {
        email: 'isabelle.richard@example.com',
        firstName: 'Isabelle',
        lastName: 'Richard',
        status: 'paid',
        items: [{ ticketType: 'Student', quantity: 2 }],
        checkedIn: [false, false]
      },
      {
        email: 'julien.durand@example.com',
        firstName: 'Julien',
        lastName: 'Durand',
        status: 'paid',
        items: [
          { ticketType: 'Standard', quantity: 1 },
          { ticketType: 'Student', quantity: 1 }
        ],
        checkedIn: [true, false]
      }
    ]

    let ordersCreated = 0
    let orderItemsCreated = 0
    let ticketsCreated = 0

    for (const order of orderData) {
      try {
        // Check if order already exists
        const existing = await pb.collection('orders').getList(1, 1, {
          filter: `email = "${order.email}" && editionId = "${ids.edition}"`
        })

        if (existing.items.length > 0) {
          console.log(`  Order for '${order.email}' already exists`)
          continue
        }

        // Calculate total
        let totalAmount = 0
        const resolvedItems: Array<{
          ticketType: string
          ticketTypeId: string
          quantity: number
          unitPrice: number
        }> = []

        for (const item of order.items) {
          const tt = ttMap.get(item.ticketType)
          if (!tt) {
            console.error(`  Ticket type '${item.ticketType}' not found`)
            continue
          }
          const unitPrice = tt.price as number
          totalAmount += unitPrice * item.quantity
          resolvedItems.push({
            ticketType: item.ticketType,
            ticketTypeId: tt.id,
            quantity: item.quantity,
            unitPrice
          })
        }

        const orderNumber = generateOrderNumber()

        const orderRecord = await pb.collection('orders').create({
          editionId: ids.edition,
          orderNumber,
          email: order.email,
          firstName: order.firstName,
          lastName: order.lastName,
          status: order.status,
          totalAmount,
          currency: 'EUR',
          paidAt: order.status === 'paid' ? new Date().toISOString() : undefined
        })
        ordersCreated++

        // Create order items
        for (const item of resolvedItems) {
          await pb.collection('order_items').create({
            orderId: orderRecord.id,
            ticketTypeId: item.ticketTypeId,
            ticketTypeName: item.ticketType,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity
          })
          orderItemsCreated++
        }

        // Create tickets (only for paid orders)
        if (order.status === 'paid') {
          let ticketIndex = 0
          for (const item of resolvedItems) {
            const tt = ttMap.get(item.ticketType)
            if (!tt) continue

            for (let i = 0; i < item.quantity; i++) {
              const ticketNumber = generateTicketNumber()
              const isCheckedIn = order.checkedIn[ticketIndex] === true
              const qrPayload = JSON.stringify({
                ticketId: 'pending',
                ticketNumber,
                editionId: ids.edition
              })
              const qrCode = await QRCode.default.toDataURL(qrPayload, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                margin: 2,
                width: 300
              })

              await pb.collection('billing_tickets').create({
                orderId: orderRecord.id,
                ticketTypeId: tt.id,
                editionId: ids.edition,
                attendeeEmail: order.email,
                attendeeFirstName: order.firstName,
                attendeeLastName: order.lastName,
                ticketNumber,
                qrCode,
                status: isCheckedIn ? 'used' : 'valid',
                checkedInAt: isCheckedIn ? new Date().toISOString() : undefined,
                checkedInBy: isCheckedIn ? 'admin' : undefined
              })
              ticketsCreated++

              // Update quantitySold on ticket type
              await pb.collection('ticket_types').update(tt.id, {
                quantitySold: ((tt.quantitySold as number) || 0) + 1
              })

              ticketIndex++
            }
          }
        }

        console.log(
          `  Created order: ${orderNumber} (${order.firstName} ${order.lastName}, ${order.status})`
        )
      } catch (err) {
        console.error(`  Failed to create order for ${order.email}:`, err)
      }
    }

    console.log(
      `  Total: ${ordersCreated} orders, ${orderItemsCreated} order items, ${ticketsCreated} tickets`
    )
    console.log('')

    // ========================================================================
    // 16. Create CRM Contacts
    // ========================================================================
    console.log('📇 Creating CRM contacts...')
    const contactDefinitions = [
      {
        email: 'speaker@example.com',
        firstName: 'Jane',
        lastName: 'Speaker',
        company: 'Tech Corp',
        jobTitle: 'Senior Developer',
        bio: 'Passionate developer and speaker.',
        city: 'Paris',
        country: 'France',
        twitter: '@janespeaker',
        linkedin: 'https://linkedin.com/in/janespeaker',
        github: 'janespeaker',
        source: 'speaker',
        tags: ['speaker', 'web', 'sveltekit']
      },
      {
        email: 'speaker2@example.com',
        firstName: 'John',
        lastName: 'Talker',
        company: 'Tech Corp',
        jobTitle: 'Senior Developer',
        bio: 'Passionate developer and speaker.',
        city: 'Lyon',
        country: 'France',
        twitter: '@johntalker',
        linkedin: 'https://linkedin.com/in/johntalker',
        github: 'johntalker',
        source: 'speaker',
        tags: ['speaker', 'cloud', 'kubernetes']
      },
      {
        email: 'alice.martin@example.com',
        firstName: 'Alice',
        lastName: 'Martin',
        company: 'Acme Inc',
        jobTitle: 'Frontend Developer',
        city: 'Paris',
        country: 'France',
        source: 'attendee',
        tags: ['attendee', 'vip']
      },
      {
        email: 'bob.dupont@example.com',
        firstName: 'Bob',
        lastName: 'Dupont',
        company: 'StartupXYZ',
        jobTitle: 'CTO',
        city: 'Marseille',
        country: 'France',
        source: 'attendee',
        tags: ['attendee']
      },
      {
        email: 'claire.bernard@example.com',
        firstName: 'Claire',
        lastName: 'Bernard',
        company: 'DataCorp',
        jobTitle: 'Data Engineer',
        city: 'Paris',
        country: 'France',
        source: 'attendee',
        tags: ['attendee', 'vip']
      },
      {
        email: 'david.leroy@example.com',
        firstName: 'David',
        lastName: 'Leroy',
        city: 'Bordeaux',
        country: 'France',
        source: 'attendee',
        tags: ['attendee', 'student']
      },
      {
        email: 'emma.petit@example.com',
        firstName: 'Emma',
        lastName: 'Petit',
        company: 'WebAgency',
        jobTitle: 'UX Designer',
        city: 'Nantes',
        country: 'France',
        source: 'attendee',
        tags: ['attendee']
      },
      {
        email: 'nathalie.dubois@example.com',
        firstName: 'Nathalie',
        lastName: 'Dubois',
        company: 'BigCorp France',
        jobTitle: 'VP Engineering',
        city: 'Paris',
        country: 'France',
        source: 'manual',
        tags: ['sponsor', 'vip']
      },
      {
        email: 'thomas.laurent@example.com',
        firstName: 'Thomas',
        lastName: 'Laurent',
        company: 'CloudOps',
        jobTitle: 'DevOps Engineer',
        city: 'Toulouse',
        country: 'France',
        source: 'import',
        tags: ['prospect']
      },
      {
        email: 'marie.garcia@example.com',
        firstName: 'Marie',
        lastName: 'Garcia',
        company: 'AI Solutions',
        jobTitle: 'ML Engineer',
        city: 'Paris',
        country: 'France',
        source: 'manual',
        tags: ['prospect', 'ai']
      }
    ]

    for (const contact of contactDefinitions) {
      try {
        const existing = await pb.collection('contacts').getList(1, 1, {
          filter: `eventId = "${ids.event}" && email = "${contact.email}"`
        })

        if (existing.items.length > 0) {
          console.log(`  Contact '${contact.email}' already exists`)
          ids.contacts.push(existing.items[0].id)
        } else {
          const c = await pb.collection('contacts').create({
            eventId: ids.event,
            email: contact.email,
            firstName: contact.firstName,
            lastName: contact.lastName,
            company: contact.company || '',
            jobTitle: contact.jobTitle || '',
            bio: contact.bio || '',
            photoUrl: '',
            twitter: contact.twitter || '',
            linkedin: contact.linkedin || '',
            github: contact.github || '',
            city: contact.city || '',
            country: contact.country || '',
            source: contact.source,
            tags: JSON.stringify(contact.tags || []),
            notes: ''
          })
          console.log(`  Created contact: ${contact.firstName} ${contact.lastName}`)
          ids.contacts.push(c.id)
        }
      } catch (err) {
        console.error(`  Failed to create contact ${contact.email}:`, err)
      }
    }
    console.log('')

    // ========================================================================
    // 16b. Create Contact Edition Links
    // ========================================================================
    console.log('🔗 Creating contact edition links...')
    const editionLinkDefinitions = [
      { contactIndex: 0, role: 'speaker', speakerIndex: 0 },
      { contactIndex: 1, role: 'speaker', speakerIndex: 1 },
      { contactIndex: 2, role: 'attendee' },
      { contactIndex: 3, role: 'attendee' },
      { contactIndex: 4, role: 'attendee' },
      { contactIndex: 5, role: 'attendee' },
      { contactIndex: 6, role: 'attendee' }
    ]

    for (const linkDef of editionLinkDefinitions) {
      try {
        const contactId = ids.contacts[linkDef.contactIndex]
        if (!contactId) {
          console.log(`  Skipping link (contact index ${linkDef.contactIndex} not found)`)
          continue
        }

        const existing = await pb.collection('contact_edition_links').getList(1, 1, {
          filter: `contactId = "${contactId}" && editionId = "${ids.edition}"`
        })

        if (existing.items.length > 0) {
          console.log(`  Link for contact ${linkDef.contactIndex} already exists`)
        } else {
          const speakerId =
            linkDef.speakerIndex !== undefined ? ids.speakers[linkDef.speakerIndex] : ''
          await pb.collection('contact_edition_links').create({
            contactId,
            editionId: ids.edition,
            roles: JSON.stringify([linkDef.role]),
            speakerId: speakerId || ''
          })
          console.log(
            `  Created link: contact ${linkDef.contactIndex} -> edition (${linkDef.role})`
          )
        }
      } catch (err) {
        console.error('  Failed to create edition link:', err)
      }
    }
    console.log('')

    // ========================================================================
    // 16c. Create Consents (GDPR)
    // ========================================================================
    console.log('🔒 Creating consents...')
    const consentDefinitions = [
      // Marketing email consents
      { contactIndex: 0, type: 'marketing_email', status: 'granted' },
      { contactIndex: 1, type: 'marketing_email', status: 'granted' },
      { contactIndex: 2, type: 'marketing_email', status: 'granted' },
      { contactIndex: 3, type: 'marketing_email', status: 'granted' },
      { contactIndex: 4, type: 'marketing_email', status: 'granted' },
      { contactIndex: 5, type: 'marketing_email', status: 'denied' },
      { contactIndex: 6, type: 'marketing_email', status: 'granted' },
      { contactIndex: 7, type: 'marketing_email', status: 'granted' },
      { contactIndex: 8, type: 'marketing_email', status: 'denied' },
      { contactIndex: 9, type: 'marketing_email', status: 'granted' },
      // Data sharing consents
      { contactIndex: 0, type: 'data_sharing', status: 'granted' },
      { contactIndex: 2, type: 'data_sharing', status: 'granted' },
      { contactIndex: 4, type: 'data_sharing', status: 'granted' },
      { contactIndex: 7, type: 'data_sharing', status: 'granted' },
      // Analytics consents
      { contactIndex: 0, type: 'analytics', status: 'granted' },
      { contactIndex: 1, type: 'analytics', status: 'granted' },
      { contactIndex: 2, type: 'analytics', status: 'granted' },
      { contactIndex: 3, type: 'analytics', status: 'granted' },
      { contactIndex: 4, type: 'analytics', status: 'granted' },
      { contactIndex: 6, type: 'analytics', status: 'granted' },
      { contactIndex: 7, type: 'analytics', status: 'granted' },
      { contactIndex: 9, type: 'analytics', status: 'granted' }
    ]

    let consentsCreated = 0
    for (const consentDef of consentDefinitions) {
      try {
        const contactId = ids.contacts[consentDef.contactIndex]
        if (!contactId) continue

        const existing = await pb.collection('consents').getList(1, 1, {
          filter: `contactId = "${contactId}" && type = "${consentDef.type}"`
        })

        if (existing.items.length > 0) continue

        await pb.collection('consents').create({
          contactId,
          type: consentDef.type,
          status: consentDef.status,
          grantedAt: consentDef.status === 'granted' ? new Date().toISOString() : '',
          source: 'manual'
        })
        consentsCreated++
      } catch (err) {
        console.error('  Failed to create consent:', err)
      }
    }
    console.log(`  Created ${consentsCreated} consents`)
    console.log('')

    // ========================================================================
    // 16d. Create Segments
    // ========================================================================
    console.log('📊 Creating segments...')
    const segmentDefinitions = [
      {
        name: 'All Speakers',
        description: 'All contacts who have been speakers',
        criteria: {
          match: 'all',
          rules: [{ field: 'source', operator: 'equals', value: 'speaker' }]
        },
        isStatic: false
      },
      {
        name: 'All Attendees',
        description: 'All contacts who attended an event',
        criteria: {
          match: 'all',
          rules: [{ field: 'source', operator: 'equals', value: 'attendee' }]
        },
        isStatic: false
      },
      {
        name: 'VIP Contacts',
        description: 'Contacts tagged as VIP',
        criteria: {
          match: 'all',
          rules: [{ field: 'tags', operator: 'contains', value: 'vip' }]
        },
        isStatic: false
      },
      {
        name: 'Paris Area',
        description: 'Contacts based in Paris',
        criteria: {
          match: 'all',
          rules: [{ field: 'city', operator: 'equals', value: 'Paris' }]
        },
        isStatic: false
      }
    ]

    for (const segment of segmentDefinitions) {
      try {
        const existing = await pb.collection('segments').getList(1, 1, {
          filter: `eventId = "${ids.event}" && name = "${segment.name}"`
        })

        if (existing.items.length > 0) {
          console.log(`  Segment '${segment.name}' already exists`)
          ids.segments.push(existing.items[0].id)
        } else {
          const s = await pb.collection('segments').create({
            eventId: ids.event,
            name: segment.name,
            description: segment.description,
            criteria: JSON.stringify(segment.criteria),
            isStatic: segment.isStatic,
            contactCount: 0
          })
          console.log(`  Created segment: ${segment.name}`)
          ids.segments.push(s.id)
        }
      } catch (err) {
        console.error(`  Failed to create segment ${segment.name}:`, err)
      }
    }
    console.log('')

    // ========================================================================
    // 16e. Create Email Templates
    // ========================================================================
    console.log('📧 Creating email templates...')
    const emailTemplateDefinitions = [
      {
        name: 'Event Invitation',
        subject: "You're invited to {{eventName}}!",
        bodyHtml:
          "<h1>Hello {{firstName}},</h1><p>We'd like to invite you to <strong>{{eventName}}</strong>.</p><p>Join us for an amazing experience with top speakers and workshops.</p><p>Best regards,<br>The Organizing Team</p>",
        bodyText:
          "Hello {{firstName}},\n\nWe'd like to invite you to {{eventName}}.\n\nJoin us for an amazing experience with top speakers and workshops.\n\nBest regards,\nThe Organizing Team",
        variables: ['{{firstName}}', '{{lastName}}', '{{eventName}}', '{{email}}']
      },
      {
        name: 'Thank You Post-Event',
        subject: 'Thank you for attending {{eventName}}!',
        bodyHtml:
          "<h1>Thank you, {{firstName}}!</h1><p>We hope you enjoyed <strong>{{eventName}}</strong>.</p><p>We'd love to hear your feedback. Please take a moment to fill out our survey.</p><p>See you next year!</p>",
        bodyText:
          "Thank you, {{firstName}}!\n\nWe hope you enjoyed {{eventName}}.\n\nWe'd love to hear your feedback. Please take a moment to fill out our survey.\n\nSee you next year!",
        variables: ['{{firstName}}', '{{lastName}}', '{{eventName}}', '{{email}}']
      },
      {
        name: 'Monthly Newsletter',
        subject: 'News from {{company}} - Monthly Update',
        bodyHtml:
          '<h1>Hello {{firstName}},</h1><p>Here are the latest updates from our community.</p><p>Stay tuned for more exciting events and announcements!</p>',
        bodyText:
          'Hello {{firstName}},\n\nHere are the latest updates from our community.\n\nStay tuned for more exciting events and announcements!',
        variables: ['{{firstName}}', '{{lastName}}', '{{company}}', '{{email}}']
      }
    ]

    for (const template of emailTemplateDefinitions) {
      try {
        const existing = await pb.collection('email_templates').getList(1, 1, {
          filter: `eventId = "${ids.event}" && name = "${template.name}"`
        })

        if (existing.items.length > 0) {
          console.log(`  Template '${template.name}' already exists`)
          ids.emailTemplates.push(existing.items[0].id)
        } else {
          const t = await pb.collection('email_templates').create({
            eventId: ids.event,
            name: template.name,
            subject: template.subject,
            bodyHtml: template.bodyHtml,
            bodyText: template.bodyText,
            variables: JSON.stringify(template.variables)
          })
          console.log(`  Created template: ${template.name}`)
          ids.emailTemplates.push(t.id)
        }
      } catch (err) {
        console.error(`  Failed to create template ${template.name}:`, err)
      }
    }
    console.log('')

    // ========================================================================
    // 16f. Create Email Campaigns
    // ========================================================================
    console.log('📨 Creating email campaigns...')
    const campaignDefinitions = [
      {
        name: 'DevFest 2025 Invitation',
        templateIndex: 0,
        segmentIndex: null as number | null,
        subject: "You're invited to DevFest Paris 2025!",
        bodyHtml:
          '<h1>Hello {{firstName}},</h1><p>We are thrilled to invite you to <strong>DevFest Paris 2025</strong>!</p><p>Join us on October 15-16 at the Palais des Congres for two days of talks, workshops, and networking.</p><p>Get your tickets now!</p><p>Best regards,<br>The DevFest Team</p>',
        bodyText:
          'Hello {{firstName}},\n\nWe are thrilled to invite you to DevFest Paris 2025!\n\nJoin us on October 15-16 at the Palais des Congres for two days of talks, workshops, and networking.\n\nGet your tickets now!\n\nBest regards,\nThe DevFest Team',
        status: 'sent',
        sentAt: '2025-09-01T10:00:00Z',
        totalRecipients: 8,
        totalSent: 8,
        totalFailed: 0
      },
      {
        name: 'Post-Event Survey',
        templateIndex: 1,
        segmentIndex: 1 as number | null,
        subject: 'Thank you for attending DevFest Paris 2025!',
        bodyHtml:
          '<h1>Thank you, {{firstName}}!</h1><p>We hope you had a great time at DevFest Paris 2025.</p><p>Please share your feedback to help us improve.</p>',
        bodyText:
          'Thank you, {{firstName}}!\n\nWe hope you had a great time at DevFest Paris 2025.\n\nPlease share your feedback to help us improve.',
        status: 'draft',
        sentAt: null as string | null,
        totalRecipients: 0,
        totalSent: 0,
        totalFailed: 0
      }
    ]

    for (const campaign of campaignDefinitions) {
      try {
        const existing = await pb.collection('email_campaigns').getList(1, 1, {
          filter: `eventId = "${ids.event}" && name = "${campaign.name}"`
        })

        if (existing.items.length > 0) {
          console.log(`  Campaign '${campaign.name}' already exists`)
          ids.emailCampaigns.push(existing.items[0].id)
        } else {
          const c = await pb.collection('email_campaigns').create({
            eventId: ids.event,
            name: campaign.name,
            templateId:
              campaign.templateIndex !== null
                ? ids.emailTemplates[campaign.templateIndex] || ''
                : '',
            segmentId:
              campaign.segmentIndex !== null ? ids.segments[campaign.segmentIndex] || '' : '',
            subject: campaign.subject,
            bodyHtml: campaign.bodyHtml,
            bodyText: campaign.bodyText,
            status: campaign.status,
            sentAt: campaign.sentAt || '',
            totalRecipients: campaign.totalRecipients,
            totalSent: campaign.totalSent,
            totalFailed: campaign.totalFailed
          })
          console.log(`  Created campaign: ${campaign.name}`)
          ids.emailCampaigns.push(c.id)
        }
      } catch (err) {
        console.error(`  Failed to create campaign ${campaign.name}:`, err)
      }
    }
    console.log('')

    // ========================================================================
    // 17. Create Budget
    // ========================================================================
    console.log('💰 Creating budget...')
    try {
      const existing = await pb.collection('edition_budgets').getList(1, 1, {
        filter: `editionId = "${ids.edition}"`
      })

      if (existing.items.length > 0) {
        console.log('  Budget already exists')
        ids.budget = existing.items[0].id
      } else {
        const budget = await pb.collection('edition_budgets').create({
          editionId: ids.edition,
          totalBudget: 50000,
          currency: 'EUR',
          status: 'approved',
          notes: 'Budget for DevFest Paris 2025'
        })
        console.log('  Created budget: 50,000 EUR (approved)')
        ids.budget = budget.id
      }
    } catch (err) {
      console.error('  Failed to create budget:', err)
    }
    console.log('')

    // ========================================================================
    // 17b. Create Budget Categories
    // ========================================================================
    console.log('📂 Creating budget categories...')
    const budgetCategoryDefinitions = [
      { name: 'Venue', plannedAmount: 15000, notes: 'Palais des Congres rental and setup' },
      { name: 'Catering', plannedAmount: 8000, notes: 'Coffee breaks, lunch, and dinner' },
      { name: 'Speakers', plannedAmount: 5000, notes: 'Travel and accommodation' },
      { name: 'Marketing', plannedAmount: 3000, notes: 'Social media, flyers, videos' },
      { name: 'Equipment', plannedAmount: 4000, notes: 'AV equipment, badges, signage' },
      { name: 'Staff', plannedAmount: 2000, notes: 'Volunteer t-shirts and meals' },
      { name: 'Other', plannedAmount: 3000, notes: 'Miscellaneous expenses' }
    ]

    if (ids.budget) {
      for (const catDef of budgetCategoryDefinitions) {
        try {
          const existing = await pb.collection('budget_categories').getList(1, 1, {
            filter: `budgetId = "${ids.budget}" && name = "${catDef.name}"`
          })

          if (existing.items.length > 0) {
            console.log(`  Category '${catDef.name}' already exists`)
            ids.budgetCategories.push(existing.items[0].id)
          } else {
            const cat = await pb.collection('budget_categories').create({
              budgetId: ids.budget,
              name: catDef.name,
              plannedAmount: catDef.plannedAmount,
              notes: catDef.notes
            })
            console.log(`  Created category: ${catDef.name} (${catDef.plannedAmount} EUR)`)
            ids.budgetCategories.push(cat.id)
          }
        } catch (err) {
          console.error(`  Failed to create budget category ${catDef.name}:`, err)
        }
      }
    }
    console.log('')

    // ========================================================================
    // 17c. Create Budget Transactions
    // ========================================================================
    console.log('💸 Creating budget transactions...')
    const transactionDefinitions = [
      // Venue expenses
      {
        categoryIndex: 0,
        type: 'expense',
        amount: 10000,
        description: 'Venue deposit',
        vendor: 'Palais des Congres',
        invoiceNumber: 'PDC-2025-001',
        date: '2025-06-01',
        status: 'paid'
      },
      {
        categoryIndex: 0,
        type: 'expense',
        amount: 5000,
        description: 'Venue final payment',
        vendor: 'Palais des Congres',
        invoiceNumber: 'PDC-2025-002',
        date: '2025-09-15',
        status: 'paid'
      },
      // Catering
      {
        categoryIndex: 1,
        type: 'expense',
        amount: 4500,
        description: 'Catering contract - Day 1',
        vendor: 'Traiteur Paris',
        invoiceNumber: 'TP-2025-042',
        date: '2025-09-01',
        status: 'paid'
      },
      {
        categoryIndex: 1,
        type: 'expense',
        amount: 3500,
        description: 'Catering contract - Day 2',
        vendor: 'Traiteur Paris',
        invoiceNumber: 'TP-2025-043',
        date: '2025-09-01',
        status: 'pending'
      },
      // Speakers
      {
        categoryIndex: 2,
        type: 'expense',
        amount: 1200,
        description: 'Speaker travel - Jane Speaker',
        vendor: 'Air France',
        invoiceNumber: 'AF-789456',
        date: '2025-10-01',
        status: 'paid'
      },
      {
        categoryIndex: 2,
        type: 'expense',
        amount: 800,
        description: 'Hotel accommodation - Jane Speaker',
        vendor: 'Hotel Mercure',
        invoiceNumber: 'HM-2025-234',
        date: '2025-10-14',
        status: 'paid'
      },
      // Marketing
      {
        categoryIndex: 3,
        type: 'expense',
        amount: 1500,
        description: 'Social media campaign',
        vendor: 'Marketing Agency',
        invoiceNumber: 'MA-2025-019',
        date: '2025-08-01',
        status: 'paid'
      },
      // Equipment
      {
        categoryIndex: 4,
        type: 'expense',
        amount: 2000,
        description: 'Badge printing and lanyards',
        vendor: 'PrintShop',
        invoiceNumber: 'PS-2025-112',
        date: '2025-09-20',
        status: 'paid'
      },
      // Income - sponsorships
      {
        categoryIndex: 6,
        type: 'income',
        amount: 15000,
        description: 'Gold sponsor - TechCorp',
        vendor: 'TechCorp',
        invoiceNumber: 'OEO-2025-S001',
        date: '2025-07-01',
        status: 'paid'
      },
      {
        categoryIndex: 6,
        type: 'income',
        amount: 5000,
        description: 'Silver sponsor - StartupXYZ',
        vendor: 'StartupXYZ',
        invoiceNumber: 'OEO-2025-S002',
        date: '2025-08-01',
        status: 'paid'
      }
    ]

    let transactionsCreated = 0
    if (ids.budget && ids.budgetCategories.length > 0) {
      for (const txDef of transactionDefinitions) {
        try {
          const categoryId = ids.budgetCategories[txDef.categoryIndex]
          if (!categoryId) {
            console.log(`  Skipping transaction (category index ${txDef.categoryIndex} not found)`)
            continue
          }

          const existing = await pb.collection('budget_transactions').getList(1, 1, {
            filter: `categoryId = "${categoryId}" && description = "${txDef.description.replace(/"/g, '\\"')}"`
          })

          if (existing.items.length > 0) {
            console.log(`  Transaction '${txDef.description}' already exists`)
          } else {
            await pb.collection('budget_transactions').create({
              categoryId,
              type: txDef.type,
              amount: txDef.amount,
              description: txDef.description,
              vendor: txDef.vendor || '',
              invoiceNumber: txDef.invoiceNumber || '',
              date: txDef.date,
              status: txDef.status
            })
            console.log(`  Created transaction: ${txDef.description} (${txDef.amount} EUR)`)
            transactionsCreated++
          }
        } catch (err) {
          console.error('  Failed to create transaction:', err)
        }
      }
    }
    console.log(`  Total: ${transactionsCreated} transactions created`)
    console.log('')

    // ========================================================================
    // 17d. Create Budget Quotes
    // ========================================================================
    console.log('📝 Creating budget quotes...')
    const quoteDefinitions = [
      {
        quoteNumber: 'QT-DEVFEST-0001',
        vendor: 'AudioVisual Pro',
        vendorEmail: 'contact@avpro.fr',
        vendorAddress: '12 Rue de la Technique, 75001 Paris',
        description: 'AV equipment rental for 2-day conference',
        items: [
          { description: 'Projector rental (3 rooms)', quantity: 3, unitPrice: 500 },
          { description: 'Microphone sets', quantity: 6, unitPrice: 150 },
          { description: 'Sound system', quantity: 3, unitPrice: 800 }
        ],
        totalAmount: 5700,
        currency: 'EUR',
        status: 'accepted',
        validUntil: '2025-09-30',
        notes: 'Includes delivery and setup'
      },
      {
        quoteNumber: 'QT-DEVFEST-0002',
        vendor: 'PrintMaster',
        vendorEmail: 'info@printmaster.fr',
        vendorAddress: '45 Avenue du Commerce, 75008 Paris',
        description: 'Conference materials printing',
        items: [
          { description: 'Event program booklets (500)', quantity: 500, unitPrice: 2.5 },
          { description: 'Roll-up banners', quantity: 4, unitPrice: 120 },
          { description: 'Speaker name badges', quantity: 20, unitPrice: 8 }
        ],
        totalAmount: 1890,
        currency: 'EUR',
        status: 'sent',
        validUntil: '2025-10-15',
        notes: ''
      },
      {
        quoteNumber: 'QT-DEVFEST-0003',
        vendor: 'SwagFactory',
        vendorEmail: 'orders@swagfactory.com',
        vendorAddress: '8 Boulevard des Goodies, 69002 Lyon',
        description: 'Conference swag and goodies',
        items: [
          { description: 'Custom t-shirts (400)', quantity: 400, unitPrice: 8 },
          { description: 'Branded stickers pack', quantity: 1000, unitPrice: 0.5 },
          { description: 'Tote bags', quantity: 400, unitPrice: 3 }
        ],
        totalAmount: 4900,
        currency: 'EUR',
        status: 'draft',
        validUntil: '2025-11-01',
        notes: 'Pending design approval'
      }
    ]

    if (ids.budget) {
      for (const quoteDef of quoteDefinitions) {
        try {
          const existing = await pb.collection('budget_quotes').getList(1, 1, {
            filter: `quoteNumber = "${quoteDef.quoteNumber}" && editionId = "${ids.edition}"`
          })

          if (existing.items.length > 0) {
            console.log(`  Quote '${quoteDef.quoteNumber}' already exists`)
            ids.quotes.push(existing.items[0].id)
          } else {
            const q = await pb.collection('budget_quotes').create({
              editionId: ids.edition,
              quoteNumber: quoteDef.quoteNumber,
              vendor: quoteDef.vendor,
              vendorEmail: quoteDef.vendorEmail,
              vendorAddress: quoteDef.vendorAddress,
              description: quoteDef.description,
              items: JSON.stringify(quoteDef.items),
              totalAmount: quoteDef.totalAmount,
              currency: quoteDef.currency,
              status: quoteDef.status,
              validUntil: quoteDef.validUntil,
              notes: quoteDef.notes,
              sentAt:
                quoteDef.status === 'sent' || quoteDef.status === 'accepted' ? '2025-09-01' : ''
            })
            console.log(`  Created quote: ${quoteDef.quoteNumber} (${quoteDef.vendor})`)
            ids.quotes.push(q.id)
          }
        } catch (err) {
          console.error(`  Failed to create quote ${quoteDef.quoteNumber}:`, err)
        }
      }
    }
    console.log('')

    // ========================================================================
    // 17e. Create Budget Invoices
    // ========================================================================
    console.log('🧾 Creating budget invoices...')
    // Get transaction IDs for linking invoices
    let transactionRecords: Array<{ id: string; description: string }> = []
    if (ids.budget && ids.budgetCategories.length > 0) {
      try {
        const filter = ids.budgetCategories.map((id) => `categoryId = "${id}"`).join(' || ')
        const txRecords = await pb.collection('budget_transactions').getFullList({
          filter,
          sort: '-date'
        })
        transactionRecords = txRecords.map((r) => ({
          id: r.id as string,
          description: r.description as string
        }))
      } catch {
        console.log('  Could not fetch transactions for invoices')
      }
    }

    const invoiceDefinitions = [
      {
        invoiceNumber: 'INV-PDC-2025-001',
        transactionDescription: 'Venue deposit',
        issueDate: '2025-06-01',
        dueDate: '2025-06-30',
        amount: 10000,
        notes: 'Palais des Congres - 50% deposit'
      },
      {
        invoiceNumber: 'INV-TP-2025-042',
        transactionDescription: 'Catering contract - Day 1',
        issueDate: '2025-09-01',
        dueDate: '2025-10-01',
        amount: 4500,
        notes: 'Traiteur Paris - Day 1 catering'
      }
    ]

    for (const invDef of invoiceDefinitions) {
      try {
        const matchingTx = transactionRecords.find(
          (t) => t.description === invDef.transactionDescription
        )
        if (!matchingTx) {
          console.log(`  Skipping invoice ${invDef.invoiceNumber} (no matching transaction)`)
          continue
        }

        const existing = await pb.collection('budget_invoices').getList(1, 1, {
          filter: `invoiceNumber = "${invDef.invoiceNumber}"`
        })

        if (existing.items.length > 0) {
          console.log(`  Invoice '${invDef.invoiceNumber}' already exists`)
          ids.invoices.push(existing.items[0].id)
        } else {
          const inv = await pb.collection('budget_invoices').create({
            transactionId: matchingTx.id,
            invoiceNumber: invDef.invoiceNumber,
            issueDate: invDef.issueDate,
            dueDate: invDef.dueDate,
            amount: invDef.amount,
            notes: invDef.notes
          })
          console.log(`  Created invoice: ${invDef.invoiceNumber} (${invDef.amount} EUR)`)
          ids.invoices.push(inv.id)
        }
      } catch (err) {
        console.error(`  Failed to create invoice ${invDef.invoiceNumber}:`, err)
      }
    }
    console.log('')

    // ========================================================================
    // 17f. Create Reimbursement Requests
    // ========================================================================
    console.log('💸 Creating reimbursement requests...')
    const reimbursementDefinitions = [
      {
        speakerIndex: 0,
        requestNumber: 'RB-DEVFEST-0001',
        status: 'submitted',
        currency: 'EUR',
        notes: 'Travel expenses for DevFest Paris 2025',
        items: [
          {
            expenseType: 'transport',
            description: 'Train ticket London-Paris (Eurostar)',
            amount: 250,
            date: '2025-10-14',
            notes: 'Round trip'
          },
          {
            expenseType: 'accommodation',
            description: 'Hotel Mercure 2 nights',
            amount: 320,
            date: '2025-10-14',
            notes: 'Oct 14-16'
          },
          {
            expenseType: 'meals',
            description: 'Dinner with co-speakers',
            amount: 45,
            date: '2025-10-14',
            notes: ''
          }
        ]
      },
      {
        speakerIndex: 1,
        requestNumber: 'RB-DEVFEST-0002',
        status: 'draft',
        currency: 'EUR',
        notes: 'Speaker expenses',
        items: [
          {
            expenseType: 'transport',
            description: 'TGV Lyon-Paris return',
            amount: 120,
            date: '2025-10-15',
            notes: ''
          },
          {
            expenseType: 'other',
            description: 'Taxi to venue',
            amount: 35,
            date: '2025-10-15',
            notes: 'From Gare de Lyon'
          }
        ]
      }
    ]

    for (const rbDef of reimbursementDefinitions) {
      try {
        const speakerId = ids.speakers[rbDef.speakerIndex]
        if (!speakerId) {
          console.log(`  Skipping reimbursement (speaker index ${rbDef.speakerIndex} not found)`)
          continue
        }

        const existing = await pb.collection('reimbursement_requests').getList(1, 1, {
          filter: `requestNumber = "${rbDef.requestNumber}" && editionId = "${ids.edition}"`
        })

        if (existing.items.length > 0) {
          console.log(`  Reimbursement '${rbDef.requestNumber}' already exists`)
          ids.reimbursementRequests.push(existing.items[0].id)
          continue
        }

        const totalAmount = rbDef.items.reduce((sum, item) => sum + item.amount, 0)

        const req = await pb.collection('reimbursement_requests').create({
          editionId: ids.edition,
          speakerId,
          requestNumber: rbDef.requestNumber,
          status: rbDef.status,
          totalAmount,
          currency: rbDef.currency,
          notes: rbDef.notes,
          submittedAt: rbDef.status === 'submitted' ? new Date().toISOString() : ''
        })
        ids.reimbursementRequests.push(req.id)

        // Create items
        for (const itemDef of rbDef.items) {
          await pb.collection('reimbursement_items').create({
            requestId: req.id,
            expenseType: itemDef.expenseType,
            description: itemDef.description,
            amount: itemDef.amount,
            date: itemDef.date,
            notes: itemDef.notes
          })
        }

        console.log(
          `  Created reimbursement: ${rbDef.requestNumber} (${totalAmount} EUR, ${rbDef.items.length} items)`
        )
      } catch (err) {
        console.error(`  Failed to create reimbursement ${rbDef.requestNumber}:`, err)
      }
    }
    console.log('')

    // ========================================================================
    // 17g. Create Financial Audit Log Entries
    // ========================================================================
    console.log('📋 Creating financial audit log entries...')
    let auditLogsCreated = 0

    if (ids.edition && ids.users.length > 0) {
      const auditLogEntries = [
        // Budget creation
        {
          action: 'create',
          entityType: 'budget',
          entityId: ids.budget || 'budget-001',
          entityReference: 'Budget 2025',
          oldValue: null,
          newValue: { totalBudget: 50000, currency: 'EUR', status: 'draft' },
          metadata: { source: 'seed' },
          daysAgo: 30
        },
        // Category creations
        {
          action: 'create',
          entityType: 'category',
          entityId: ids.budgetCategories[0] || 'cat-001',
          entityReference: 'Venue & Logistics',
          oldValue: null,
          newValue: { name: 'Venue & Logistics', plannedBudget: 20000 },
          metadata: { source: 'seed' },
          daysAgo: 29
        },
        {
          action: 'create',
          entityType: 'category',
          entityId: ids.budgetCategories[1] || 'cat-002',
          entityReference: 'Catering',
          oldValue: null,
          newValue: { name: 'Catering', plannedBudget: 15000 },
          metadata: { source: 'seed' },
          daysAgo: 29
        },
        // Transaction creations
        {
          action: 'create',
          entityType: 'transaction',
          entityId: transactionRecords[0]?.id || 'tx-001',
          entityReference: 'Venue deposit',
          oldValue: null,
          newValue: { description: 'Venue deposit', amount: 10000, type: 'expense' },
          metadata: { source: 'seed' },
          daysAgo: 25
        },
        {
          action: 'status_change',
          entityType: 'transaction',
          entityId: transactionRecords[0]?.id || 'tx-001',
          entityReference: 'Venue deposit',
          oldValue: { status: 'pending' },
          newValue: { status: 'paid' },
          metadata: { source: 'seed' },
          daysAgo: 20
        },
        {
          action: 'create',
          entityType: 'transaction',
          entityId: transactionRecords[1]?.id || 'tx-002',
          entityReference: 'Catering contract - Day 1',
          oldValue: null,
          newValue: { description: 'Catering contract - Day 1', amount: 4500, type: 'expense' },
          metadata: { source: 'seed' },
          daysAgo: 18
        },
        // Quote operations
        {
          action: 'create',
          entityType: 'quote',
          entityId: ids.quotes[0] || 'quote-001',
          entityReference: 'QT-2025-001',
          oldValue: null,
          newValue: { quoteNumber: 'QT-2025-001', vendorName: 'AudioTech Pro', totalAmount: 3500 },
          metadata: { source: 'seed' },
          daysAgo: 15
        },
        {
          action: 'send',
          entityType: 'quote',
          entityId: ids.quotes[0] || 'quote-001',
          entityReference: 'QT-2025-001',
          oldValue: { status: 'draft' },
          newValue: { status: 'sent' },
          metadata: { sentTo: 'vendor@audiotech.com', source: 'seed' },
          daysAgo: 14
        },
        {
          action: 'accept',
          entityType: 'quote',
          entityId: ids.quotes[0] || 'quote-001',
          entityReference: 'QT-2025-001',
          oldValue: { status: 'sent' },
          newValue: { status: 'accepted' },
          metadata: { source: 'seed' },
          daysAgo: 10
        },
        // Invoice operations
        {
          action: 'create',
          entityType: 'invoice',
          entityId: ids.invoices[0] || 'inv-001',
          entityReference: 'INV-PDC-2025-001',
          oldValue: null,
          newValue: { invoiceNumber: 'INV-PDC-2025-001', amount: 10000 },
          metadata: { source: 'seed' },
          daysAgo: 12
        },
        // Reimbursement operations
        {
          action: 'create',
          entityType: 'reimbursement',
          entityId: ids.reimbursementRequests[0] || 'rb-001',
          entityReference: 'RB-DEVFEST-0001',
          oldValue: null,
          newValue: { requestNumber: 'RB-DEVFEST-0001', totalAmount: 615, status: 'draft' },
          metadata: { speakerName: 'Jane Speaker', source: 'seed' },
          daysAgo: 7
        },
        {
          action: 'submit',
          entityType: 'reimbursement',
          entityId: ids.reimbursementRequests[0] || 'rb-001',
          entityReference: 'RB-DEVFEST-0001',
          oldValue: { status: 'draft' },
          newValue: { status: 'submitted' },
          metadata: { source: 'seed' },
          daysAgo: 6
        },
        // Budget update
        {
          action: 'update',
          entityType: 'budget',
          entityId: ids.budget || 'budget-001',
          entityReference: 'Budget 2025',
          oldValue: { totalBudget: 50000 },
          newValue: { totalBudget: 55000 },
          metadata: { reason: 'Additional sponsorship received', source: 'seed' },
          daysAgo: 5
        },
        // Recent transaction
        {
          action: 'create',
          entityType: 'transaction',
          entityId: transactionRecords[2]?.id || 'tx-003',
          entityReference: 'Speaker gifts',
          oldValue: null,
          newValue: { description: 'Speaker gifts', amount: 500, type: 'expense' },
          metadata: { source: 'seed' },
          daysAgo: 2
        },
        // Quote rejection
        {
          action: 'create',
          entityType: 'quote',
          entityId: ids.quotes[2] || 'quote-003',
          entityReference: 'QT-2025-003',
          oldValue: null,
          newValue: {
            quoteNumber: 'QT-2025-003',
            vendorName: 'PrintShop Express',
            totalAmount: 800
          },
          metadata: { source: 'seed' },
          daysAgo: 3
        },
        {
          action: 'reject',
          entityType: 'quote',
          entityId: ids.quotes[2] || 'quote-003',
          entityReference: 'QT-2025-003',
          oldValue: { status: 'sent' },
          newValue: { status: 'rejected' },
          metadata: { reason: 'Found better pricing elsewhere', source: 'seed' },
          daysAgo: 1
        }
      ]

      for (const entry of auditLogEntries) {
        try {
          const createdDate = new Date()
          createdDate.setDate(createdDate.getDate() - entry.daysAgo)

          await pb.collection('financial_audit_log').create({
            editionId: ids.edition,
            userId: ids.users[0], // admin user
            action: entry.action,
            entityType: entry.entityType,
            entityId: entry.entityId,
            entityReference: entry.entityReference,
            oldValue: entry.oldValue,
            newValue: entry.newValue,
            metadata: entry.metadata
          })
          auditLogsCreated++
        } catch (err) {
          console.error('  Failed to create audit log entry:', err)
        }
      }
      console.log(`  Created ${auditLogsCreated} audit log entries`)
    } else {
      console.log('  Skipping audit log entries (no edition or users)')
    }
    console.log('')

    // ========================================================================
    // Sponsors
    // ========================================================================
    console.log('🤝 Creating sponsors...')
    if (ids.organization && ids.edition) {
      const sponsorDefs = [
        {
          name: 'TechCorp International',
          website: 'https://techcorp.example.com',
          description: 'Leading provider of enterprise software solutions',
          contactName: 'Sarah Johnson',
          contactEmail: 'sarah.johnson@techcorp.example.com',
          contactPhone: '+1 555 123 4567'
        },
        {
          name: 'CloudScale Inc',
          website: 'https://cloudscale.example.com',
          description: 'Cloud infrastructure and DevOps solutions',
          contactName: 'Michael Chen',
          contactEmail: 'mchen@cloudscale.example.com',
          contactPhone: '+1 555 234 5678'
        },
        {
          name: 'DataFlow Systems',
          website: 'https://dataflow.example.com',
          description: 'Big data and analytics platform',
          contactName: 'Emily Davis',
          contactEmail: 'emily.davis@dataflow.example.com',
          contactPhone: '+1 555 345 6789'
        },
        {
          name: 'SecureNet Solutions',
          website: 'https://securenet.example.com',
          description: 'Cybersecurity and compliance services',
          contactName: 'James Wilson',
          contactEmail: 'jwilson@securenet.example.com',
          contactPhone: '+1 555 456 7890'
        },
        {
          name: 'AI Innovations Lab',
          website: 'https://ailab.example.com',
          description: 'Artificial intelligence research and products',
          contactName: 'Lisa Park',
          contactEmail: 'lisa@ailab.example.com',
          contactPhone: '+1 555 567 8901'
        },
        {
          name: 'StartupXYZ',
          website: 'https://startupxyz.example.com',
          description: 'Emerging tech startup accelerator',
          contactName: 'Alex Kumar',
          contactEmail: 'alex@startupxyz.example.com',
          contactPhone: '+1 555 678 9012'
        }
      ]

      for (const sponsor of sponsorDefs) {
        try {
          const existing = await pb.collection('sponsors').getList(1, 1, {
            filter: `name = "${sponsor.name}" && organizationId = "${ids.organization}"`
          })

          if (existing.items.length === 0) {
            const record = await pb.collection('sponsors').create({
              organizationId: ids.organization,
              ...sponsor
            })
            ids.sponsors.push(record.id)
            console.log(`  Created sponsor: ${sponsor.name}`)
          } else {
            ids.sponsors.push(existing.items[0].id)
            console.log(`  Sponsor already exists: ${sponsor.name}`)
          }
        } catch (err) {
          console.error(`  Failed to create sponsor ${sponsor.name}:`, err)
        }
      }
    } else {
      console.log('  Skipping sponsors (no organization)')
    }
    console.log('')

    // ========================================================================
    // Sponsor Packages
    // ========================================================================
    console.log('📦 Creating sponsor packages...')
    if (ids.edition) {
      const packageDefs = [
        {
          name: 'Platinum',
          tier: 1,
          price: 25000,
          currency: 'EUR',
          maxSponsors: 2,
          description: 'Premium visibility with exclusive benefits',
          benefits: [
            { name: 'Logo on website', included: true },
            { name: 'Logo on printed materials', included: true },
            { name: 'Social media mention', included: true },
            { name: 'Booth at venue', included: true },
            { name: 'Speaking slot', included: true },
            { name: 'Attendee list access', included: true },
            { name: 'VIP dinner invitation', included: true },
            { name: 'Free tickets', included: true }
          ],
          isActive: true
        },
        {
          name: 'Gold',
          tier: 2,
          price: 15000,
          currency: 'EUR',
          maxSponsors: 5,
          description: 'High visibility with great exposure',
          benefits: [
            { name: 'Logo on website', included: true },
            { name: 'Logo on printed materials', included: true },
            { name: 'Social media mention', included: true },
            { name: 'Booth at venue', included: true },
            { name: 'Speaking slot', included: false },
            { name: 'Attendee list access', included: true },
            { name: 'VIP dinner invitation', included: true },
            { name: 'Free tickets', included: true }
          ],
          isActive: true
        },
        {
          name: 'Silver',
          tier: 3,
          price: 8000,
          currency: 'EUR',
          maxSponsors: 10,
          description: 'Standard sponsorship package',
          benefits: [
            { name: 'Logo on website', included: true },
            { name: 'Logo on printed materials', included: true },
            { name: 'Social media mention', included: true },
            { name: 'Booth at venue', included: false },
            { name: 'Speaking slot', included: false },
            { name: 'Attendee list access', included: false },
            { name: 'VIP dinner invitation', included: false },
            { name: 'Free tickets', included: true }
          ],
          isActive: true
        },
        {
          name: 'Bronze',
          tier: 4,
          price: 3000,
          currency: 'EUR',
          maxSponsors: null,
          description: 'Entry-level sponsorship',
          benefits: [
            { name: 'Logo on website', included: true },
            { name: 'Logo on printed materials', included: false },
            { name: 'Social media mention', included: true },
            { name: 'Booth at venue', included: false },
            { name: 'Speaking slot', included: false },
            { name: 'Attendee list access', included: false },
            { name: 'VIP dinner invitation', included: false },
            { name: 'Free tickets', included: false }
          ],
          isActive: true
        }
      ]

      for (const pkg of packageDefs) {
        try {
          const existing = await pb.collection('sponsor_packages').getList(1, 1, {
            filter: `name = "${pkg.name}" && editionId = "${ids.edition}"`
          })

          if (existing.items.length === 0) {
            const record = await pb.collection('sponsor_packages').create({
              editionId: ids.edition,
              name: pkg.name,
              tier: pkg.tier,
              price: pkg.price,
              currency: pkg.currency,
              maxSponsors: pkg.maxSponsors,
              description: pkg.description,
              benefits: pkg.benefits,
              isActive: pkg.isActive
            })
            ids.sponsorPackages.push(record.id)
            console.log(`  Created package: ${pkg.name} (${pkg.price} ${pkg.currency})`)
          } else {
            ids.sponsorPackages.push(existing.items[0].id)
            console.log(`  Package already exists: ${pkg.name}`)
          }
        } catch (err) {
          console.error(`  Failed to create package ${pkg.name}:`, err)
        }
      }
    } else {
      console.log('  Skipping sponsor packages (no edition)')
    }
    console.log('')

    // ========================================================================
    // Edition Sponsors (linking sponsors to edition with status)
    // ========================================================================
    console.log('🔗 Creating edition sponsors...')
    if (ids.edition && ids.sponsors.length > 0 && ids.sponsorPackages.length > 0) {
      const editionSponsorDefs = [
        {
          sponsorIndex: 0, // TechCorp - Platinum sponsor, confirmed & paid
          packageIndex: 0,
          status: 'confirmed',
          amount: 25000,
          paidAt: new Date('2025-07-15'),
          notes: 'Long-term partner, signed early'
        },
        {
          sponsorIndex: 1, // CloudScale - Gold sponsor, confirmed & paid
          packageIndex: 1,
          status: 'confirmed',
          amount: 15000,
          paidAt: new Date('2025-08-01'),
          notes: 'First time sponsor, very engaged'
        },
        {
          sponsorIndex: 2, // DataFlow - Gold sponsor, confirmed but not yet paid
          packageIndex: 1,
          status: 'confirmed',
          amount: 15000,
          paidAt: null,
          notes: 'Invoice sent, awaiting payment'
        },
        {
          sponsorIndex: 3, // SecureNet - Silver, negotiating
          packageIndex: 2,
          status: 'negotiating',
          amount: null,
          paidAt: null,
          notes: 'Discussing custom booth location'
        },
        {
          sponsorIndex: 4, // AI Lab - Bronze, contacted
          packageIndex: 3,
          status: 'contacted',
          amount: null,
          paidAt: null,
          notes: 'Initial contact made, waiting for response'
        },
        {
          sponsorIndex: 5, // StartupXYZ - prospect
          packageIndex: null,
          status: 'prospect',
          amount: null,
          paidAt: null,
          notes: 'Potential sponsor from accelerator network'
        }
      ]

      for (const esDef of editionSponsorDefs) {
        const sponsorId = ids.sponsors[esDef.sponsorIndex]
        const packageId =
          esDef.packageIndex !== null ? ids.sponsorPackages[esDef.packageIndex] : null

        if (!sponsorId) continue

        try {
          const existing = await pb.collection('edition_sponsors').getList(1, 1, {
            filter: `editionId = "${ids.edition}" && sponsorId = "${sponsorId}"`
          })

          if (existing.items.length === 0) {
            const data: Record<string, unknown> = {
              editionId: ids.edition,
              sponsorId,
              status: esDef.status,
              notes: esDef.notes
            }
            if (packageId) data.packageId = packageId
            if (esDef.amount) data.amount = esDef.amount
            if (esDef.paidAt) data.paidAt = esDef.paidAt.toISOString()
            if (esDef.status === 'confirmed') data.confirmedAt = new Date().toISOString()

            const record = await pb.collection('edition_sponsors').create(data)
            ids.editionSponsors.push(record.id)

            // Get sponsor name for logging
            const sponsor = await pb.collection('sponsors').getOne(sponsorId)
            console.log(`  Created edition sponsor: ${sponsor.name} (${esDef.status})`)
          } else {
            ids.editionSponsors.push(existing.items[0].id)
            const sponsor = await pb.collection('sponsors').getOne(sponsorId)
            console.log(`  Edition sponsor already exists: ${sponsor.name}`)
          }
        } catch (err) {
          console.error('  Failed to create edition sponsor:', err)
        }
      }
    } else {
      console.log('  Skipping edition sponsors (no sponsors or packages)')
    }
    console.log('')

    // ========================================================================
    // API Keys
    // ========================================================================
    console.log('🔑 Creating API keys...')
    let apiKeysCreated = 0
    if (ids.users.length > 0) {
      const apiKeyDefs = [
        {
          name: 'Production API Key',
          keyPrefix: 'oeo_live_abc',
          // Pre-hashed for testing - in real use, this would be generated
          keyHash: 'a'.repeat(64),
          permissions: [
            'read:organizations',
            'read:events',
            'read:editions',
            'read:speakers',
            'read:sessions',
            'read:schedule',
            'read:ticket-types',
            'read:sponsors'
          ],
          rateLimit: 60,
          isActive: true,
          organizationId: ids.organization || null,
          lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        },
        {
          name: 'Mobile App Key',
          keyPrefix: 'oeo_live_xyz',
          keyHash: 'b'.repeat(64),
          permissions: ['read:events', 'read:editions', 'read:schedule', 'read:speakers'],
          rateLimit: 120,
          isActive: true,
          editionId: ids.edition || null,
          lastUsedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 min ago
        },
        {
          name: 'Test Environment Key',
          keyPrefix: 'oeo_test_123',
          keyHash: 'c'.repeat(64),
          permissions: [
            'read:organizations',
            'read:events',
            'read:editions',
            'read:speakers',
            'read:sessions',
            'read:schedule',
            'write:orders'
          ],
          rateLimit: 100,
          isActive: true,
          lastUsedAt: null
        },
        {
          name: 'Deprecated Legacy Key',
          keyPrefix: 'oeo_live_old',
          keyHash: 'd'.repeat(64),
          permissions: ['read:events', 'read:editions'],
          rateLimit: 30,
          isActive: false, // Revoked
          lastUsedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
        }
      ]

      for (const keyDef of apiKeyDefs) {
        try {
          const existing = await pb.collection('api_keys').getList(1, 1, {
            filter: `name = "${keyDef.name}"`
          })

          if (existing.items.length === 0) {
            const data: Record<string, unknown> = {
              name: keyDef.name,
              keyPrefix: keyDef.keyPrefix,
              keyHash: keyDef.keyHash,
              permissions: keyDef.permissions,
              rateLimit: keyDef.rateLimit,
              isActive: keyDef.isActive,
              createdBy: ids.users[0]
            }
            if (keyDef.organizationId) data.organizationId = keyDef.organizationId
            if (keyDef.editionId) data.editionId = keyDef.editionId
            if (keyDef.lastUsedAt) data.lastUsedAt = keyDef.lastUsedAt

            const record = await pb.collection('api_keys').create(data)
            ids.apiKeys.push(record.id)
            console.log(`  Created API key: ${keyDef.name}`)
            apiKeysCreated++
          } else {
            ids.apiKeys.push(existing.items[0].id)
            console.log(`  API key already exists: ${keyDef.name}`)
          }
        } catch (err) {
          console.error(`  Failed to create API key ${keyDef.name}:`, err)
        }
      }
    } else {
      console.log('  Skipping API keys (no users)')
    }
    console.log('')

    // ========================================================================
    // Webhooks
    // ========================================================================
    console.log('🔔 Creating webhooks...')
    let webhooksCreated = 0
    if (ids.users.length > 0) {
      const webhookDefs = [
        {
          name: 'Slack Notifications',
          url: 'https://hooks.slack.example.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
          secret: randomBytes(32).toString('hex'),
          events: ['talk.submitted', 'talk.accepted', 'order.completed'],
          isActive: true,
          retryCount: 3,
          headers: { 'X-Custom-Header': 'slack-integration' },
          organizationId: ids.organization || null
        },
        {
          name: 'CRM Sync',
          url: 'https://api.crm.example.com/webhooks/oeo',
          secret: randomBytes(32).toString('hex'),
          events: ['order.created', 'order.completed', 'order.refunded', 'ticket.checked_in'],
          isActive: true,
          retryCount: 5,
          headers: {},
          editionId: ids.edition || null
        },
        {
          name: 'Analytics Pipeline',
          url: 'https://analytics.example.com/ingest/events',
          secret: randomBytes(32).toString('hex'),
          events: [
            'talk.submitted',
            'talk.accepted',
            'talk.rejected',
            'order.created',
            'order.completed',
            'ticket.checked_in',
            'sponsor.confirmed'
          ],
          isActive: true,
          retryCount: 3,
          headers: { Authorization: 'Bearer analytics-token' }
        },
        {
          name: 'Legacy System (Disabled)',
          url: 'https://old-system.example.com/webhook',
          secret: randomBytes(32).toString('hex'),
          events: ['order.completed'],
          isActive: false, // Disabled
          retryCount: 1,
          headers: {}
        }
      ]

      for (const whDef of webhookDefs) {
        try {
          const existing = await pb.collection('webhooks').getList(1, 1, {
            filter: `name = "${whDef.name}"`
          })

          if (existing.items.length === 0) {
            const data: Record<string, unknown> = {
              name: whDef.name,
              url: whDef.url,
              secret: whDef.secret,
              events: whDef.events,
              isActive: whDef.isActive,
              retryCount: whDef.retryCount,
              headers: whDef.headers,
              createdBy: ids.users[0]
            }
            if (whDef.organizationId) data.organizationId = whDef.organizationId
            if (whDef.editionId) data.editionId = whDef.editionId

            const record = await pb.collection('webhooks').create(data)
            ids.webhooks.push(record.id)
            console.log(`  Created webhook: ${whDef.name}`)
            webhooksCreated++
          } else {
            ids.webhooks.push(existing.items[0].id)
            console.log(`  Webhook already exists: ${whDef.name}`)
          }
        } catch (err) {
          console.error(`  Failed to create webhook ${whDef.name}:`, err)
        }
      }
    } else {
      console.log('  Skipping webhooks (no users)')
    }
    console.log('')

    // ========================================================================
    // API Request Logs
    // ========================================================================
    console.log('📊 Creating API request logs...')
    let apiLogsCreated = 0
    if (ids.apiKeys.length > 0) {
      const logEntries = [
        {
          method: 'GET',
          path: '/api/v1/editions',
          statusCode: 200,
          responseTimeMs: 45,
          hoursAgo: 0.5
        },
        {
          method: 'GET',
          path: '/api/v1/editions/abc123/schedule',
          statusCode: 200,
          responseTimeMs: 120,
          hoursAgo: 1
        },
        {
          method: 'GET',
          path: '/api/v1/speakers',
          statusCode: 200,
          responseTimeMs: 35,
          hoursAgo: 1.5
        },
        {
          method: 'GET',
          path: '/api/v1/organizations',
          statusCode: 200,
          responseTimeMs: 28,
          hoursAgo: 2
        },
        {
          method: 'GET',
          path: '/api/v1/editions/abc123/sessions',
          statusCode: 200,
          responseTimeMs: 89,
          hoursAgo: 3
        },
        {
          method: 'GET',
          path: '/api/v1/events/xyz789',
          statusCode: 404,
          responseTimeMs: 12,
          hoursAgo: 4
        },
        {
          method: 'GET',
          path: '/api/v1/editions',
          statusCode: 200,
          responseTimeMs: 42,
          hoursAgo: 5
        },
        {
          method: 'GET',
          path: '/api/v1/editions/abc123/sponsors',
          statusCode: 200,
          responseTimeMs: 56,
          hoursAgo: 6
        },
        { method: 'POST', path: '/api/v1/orders', statusCode: 401, responseTimeMs: 8, hoursAgo: 8 },
        {
          method: 'GET',
          path: '/api/v1/editions/abc123/ticket-types',
          statusCode: 200,
          responseTimeMs: 33,
          hoursAgo: 12
        }
      ]

      for (const log of logEntries) {
        try {
          const createdAt = new Date(Date.now() - log.hoursAgo * 60 * 60 * 1000)
          await pb.collection('api_request_logs').create({
            apiKeyId: ids.apiKeys[0],
            method: log.method,
            path: log.path,
            statusCode: log.statusCode,
            responseTimeMs: log.responseTimeMs,
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
            userAgent: 'Mozilla/5.0 (compatible; APIClient/1.0)'
          })
          apiLogsCreated++
        } catch (err) {
          // Silently ignore log creation errors
        }
      }
      console.log(`  Created ${apiLogsCreated} API request logs`)
    } else {
      console.log('  Skipping API logs (no API keys)')
    }
    console.log('')

    // ========================================================================
    // Webhook Deliveries
    // ========================================================================
    console.log('📤 Creating webhook deliveries...')
    let deliveriesCreated = 0
    if (ids.webhooks.length > 0) {
      const deliveryDefs = [
        {
          webhookIndex: 0,
          event: 'talk.submitted',
          payload: {
            talkId: 'talk-001',
            title: 'Introduction to SvelteKit',
            speakerName: 'Jane Speaker'
          },
          statusCode: 200,
          responseBody: '{"ok":true}',
          attempt: 1,
          deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          hoursAgo: 2
        },
        {
          webhookIndex: 0,
          event: 'order.completed',
          payload: { orderId: 'order-001', amount: 5000, currency: 'EUR', tickets: 2 },
          statusCode: 200,
          responseBody: '{"received":true}',
          attempt: 1,
          deliveredAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          hoursAgo: 4
        },
        {
          webhookIndex: 1,
          event: 'ticket.checked_in',
          payload: {
            ticketId: 'ticket-001',
            attendeeName: 'John Doe',
            checkInTime: new Date().toISOString()
          },
          statusCode: 200,
          responseBody: '{"status":"ok"}',
          attempt: 1,
          deliveredAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          hoursAgo: 1
        },
        {
          webhookIndex: 2,
          event: 'sponsor.confirmed',
          payload: { sponsorId: 'sponsor-001', sponsorName: 'TechCorp', package: 'Gold' },
          statusCode: 500,
          responseBody: 'Internal Server Error',
          attempt: 2,
          error: 'Server returned 500',
          nextRetryAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          hoursAgo: 0.5
        }
      ]

      for (const delDef of deliveryDefs) {
        try {
          const webhookId = ids.webhooks[delDef.webhookIndex]
          if (!webhookId) continue

          const data: Record<string, unknown> = {
            webhookId,
            event: delDef.event,
            payload: delDef.payload,
            statusCode: delDef.statusCode,
            responseBody: delDef.responseBody,
            attempt: delDef.attempt
          }
          if (delDef.deliveredAt) data.deliveredAt = delDef.deliveredAt
          if (delDef.error) data.error = delDef.error
          if (delDef.nextRetryAt) data.nextRetryAt = delDef.nextRetryAt

          await pb.collection('webhook_deliveries').create(data)
          deliveriesCreated++
        } catch (err) {
          // Silently ignore delivery creation errors
        }
      }
      console.log(`  Created ${deliveriesCreated} webhook deliveries`)
    } else {
      console.log('  Skipping webhook deliveries (no webhooks)')
    }
    console.log('')

    // ========================================================================
    // Summary
    // ========================================================================
    console.log('✅ Seed completed!\n')
    console.log('📊 Summary:')
    console.log(`   Users: ${ids.users.length}`)
    console.log(`   Organization: ${ids.organization ? 1 : 0}`)
    console.log(`   Organization Members: ${ids.organizationMembers.length}`)
    console.log(`   Event: ${ids.event ? 1 : 0}`)
    console.log(`   Edition: ${ids.edition ? 1 : 0}`)
    console.log(`   Categories: ${ids.categories.length}`)
    console.log(`   Formats: ${ids.formats.length}`)
    console.log(`   Speakers: ${ids.speakers.length}`)
    console.log(`   Talks: ${ids.talks.length}`)
    console.log(`   Rooms: ${ids.rooms.length}`)
    console.log(`   Tracks: ${ids.tracks.length}`)
    console.log(`   Slots: ${ids.slots.size}`)
    console.log(`   Sessions: ${ids.sessions.length}`)
    console.log(`   Room Assignments: ${ids.roomAssignments.length}`)
    console.log(`   Orders: ${ordersCreated}`)
    console.log(`   Order Items: ${orderItemsCreated}`)
    console.log(`   Tickets: ${ticketsCreated}`)
    console.log(`   Contacts: ${ids.contacts.length}`)
    console.log(`   Consents: ${consentsCreated}`)
    console.log(`   Segments: ${ids.segments.length}`)
    console.log(`   Email Templates: ${ids.emailTemplates.length}`)
    console.log(`   Email Campaigns: ${ids.emailCampaigns.length}`)
    console.log(`   Budget: ${ids.budget ? 1 : 0}`)
    console.log(`   Budget Categories: ${ids.budgetCategories.length}`)
    console.log(`   Budget Transactions: ${transactionsCreated}`)
    console.log(`   Budget Quotes: ${ids.quotes.length}`)
    console.log(`   Budget Invoices: ${ids.invoices.length}`)
    console.log(`   Reimbursement Requests: ${ids.reimbursementRequests.length}`)
    console.log(`   Audit Log Entries: ${auditLogsCreated}`)
    console.log(`   Sponsors: ${ids.sponsors.length}`)
    console.log(`   Sponsor Packages: ${ids.sponsorPackages.length}`)
    console.log(`   Edition Sponsors: ${ids.editionSponsors.length}`)
    console.log(`   API Keys: ${ids.apiKeys.length}`)
    console.log(`   Webhooks: ${ids.webhooks.length}`)
    console.log(`   API Request Logs: ${apiLogsCreated}`)
    console.log(`   Webhook Deliveries: ${deliveriesCreated}`)
    console.log('')
    console.log('🔐 Test accounts:')
    console.log('   admin@example.com / admin123 (organizer, owner)')
    console.log('   speaker@example.com / speaker123 (speaker)')
    console.log('   speaker2@example.com / speaker123 (speaker)')
    console.log('   reviewer@example.com / reviewer123 (reviewer)')
    console.log('   marie@example.com / volunteer123 (organizer, staff)')
    console.log('   pierre@example.com / volunteer123 (organizer, staff)')
    console.log('   sophie@example.com / volunteer123 (organizer, staff)')
    console.log('')
    console.log(`🌐 Edition URL: /cfp/${edition.slug}`)
    console.log(`🔧 Admin URL: /admin/cfp/${edition.slug}/submissions`)
    console.log('')
    console.log('🔑 Test tokens for E2E:')
    console.log(
      `   Speaker 1: /cfp/${edition.slug}/submissions?token=${TEST_SPEAKER_TOKENS.speaker1}`
    )
    console.log(
      `   Speaker 2: /cfp/${edition.slug}/submissions?token=${TEST_SPEAKER_TOKENS.speaker2}`
    )
  } catch (err) {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  }
}

// Run seed
seed()
