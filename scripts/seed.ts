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
  {
    title: 'Building Scalable Web Apps with SvelteKit',
    abstract:
      'Learn how to build performant and scalable web applications using SvelteKit, the modern framework for building web apps.',
    description:
      'In this talk, we will explore the key features of SvelteKit that make it ideal for building production-ready applications. We will cover routing, server-side rendering, API endpoints, and deployment strategies.',
    level: 'intermediate',
    language: 'en',
    status: 'submitted',
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
    status: 'under_review',
    categoryIndex: 3,
    formatIndex: 2,
    speakerIndex: 0
  },
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

// Collection schemas WITHOUT relation fields (relations are added later)
// Test tokens for E2E tests (64 hex chars = 32 bytes)
const TEST_SPEAKER_TOKENS = {
  speaker1: 'a'.repeat(64), // For speaker@example.com
  speaker2: 'b'.repeat(64) // For speaker2@example.com
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
  { collection: 'speaker_tokens', field: 'editionId', target: 'editions', maxSelect: 1 }
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

    if (!hasNameField || !hasRoleField) {
      const newFields = [...(usersCollection.fields || [])]

      if (!hasNameField) {
        newFields.push(textField('name', true))
      }
      if (!hasRoleField) {
        newFields.push(selectField('role', ['speaker', 'organizer', 'reviewer', 'admin']))
      }

      await pb.collections.update(usersCollection.id, { fields: newFields })
      console.log('  Updated users collection with name and role fields')
    } else {
      console.log('  Users collection already has name and role fields')
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
  } = {
    users: [],
    organization: '',
    event: '',
    edition: '',
    categories: [],
    formats: [],
    speakers: [],
    talks: []
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
    // Summary
    // ========================================================================
    console.log('✅ Seed completed!\n')
    console.log('📊 Summary:')
    console.log(`   Users: ${ids.users.length}`)
    console.log(`   Organization: ${ids.organization ? 1 : 0}`)
    console.log(`   Event: ${ids.event ? 1 : 0}`)
    console.log(`   Edition: ${ids.edition ? 1 : 0}`)
    console.log(`   Categories: ${ids.categories.length}`)
    console.log(`   Formats: ${ids.formats.length}`)
    console.log(`   Speakers: ${ids.speakers.length}`)
    console.log(`   Talks: ${ids.talks.length}`)
    console.log('')
    console.log('🔐 Test accounts:')
    console.log('   admin@example.com / admin123 (organizer)')
    console.log('   speaker@example.com / speaker123 (speaker)')
    console.log('   speaker2@example.com / speaker123 (speaker)')
    console.log('   reviewer@example.com / reviewer123 (reviewer)')
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
