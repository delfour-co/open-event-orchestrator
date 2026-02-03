# Database Seeding

This guide explains how to set up and seed the database with test data for local development.

## Quick Start

```bash
# Start PocketBase and initialize with test data
docker compose up -d
pnpm db:init
```

Or reset everything from scratch:

```bash
pnpm db:reset
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm db:init` | Initialize PocketBase with superuser and seed data |
| `pnpm db:reset` | Reset database completely and re-seed |
| `pnpm seed` | Run seed script only (requires PocketBase running) |

## Test Accounts

After seeding, the following test accounts are available:

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `admin123` | Organizer |
| `speaker@example.com` | `speaker123` | Speaker |
| `speaker2@example.com` | `speaker123` | Speaker |
| `reviewer@example.com` | `reviewer123` | Reviewer |

## PocketBase Admin

- **URL**: http://localhost:8090/_/
- **Email**: `admin@pocketbase.local`
- **Password**: `adminpassword123`

## Seed Data Overview

The seed script creates a complete demo environment:

### Organization & Event Structure

```
Demo Conference Org (organization)
└── DevFest (event)
    └── DevFest Paris 2025 (edition)
        ├── Categories (5)
        ├── Formats (4)
        ├── Talks (5)
        └── Reviews (7)
```

### Categories

| Name | Color |
|------|-------|
| Web Development | blue |
| Mobile | green |
| Cloud & DevOps | purple |
| AI & Machine Learning | orange |
| Security | red |

### Formats

| Name | Duration |
|------|----------|
| Lightning Talk | 15 min |
| Conference Talk | 45 min |
| Deep Dive | 60 min |
| Workshop | 120 min |

### Sample Talks

The seed includes 5 talks with different statuses:

1. **Building Scalable Web Apps with SvelteKit** - `pending`
2. **Kubernetes for Developers: A Practical Guide** - `accepted`
3. **Introduction to Large Language Models** - `pending`
4. **Securing Your Node.js Applications** - `rejected`
5. **React Native vs Flutter: A 2025 Comparison** - `pending`

Each talk has associated reviews from the organizer and reviewer accounts.

## Test URLs

After seeding, you can access:

- **Public CFP**: http://localhost:5173/cfp/devfest-paris-2025
- **Admin Dashboard**: http://localhost:5173/admin/cfp/devfest-paris-2025/submissions

## Environment Variables

You can customize the seed behavior with environment variables:

```bash
# PocketBase connection
PUBLIC_POCKETBASE_URL=http://localhost:8090

# Superuser credentials
PB_ADMIN_EMAIL=admin@pocketbase.local
PB_ADMIN_PASSWORD=adminpassword123

# Docker container name
POCKETBASE_CONTAINER=oeo-pocketbase
```

## Troubleshooting

### PocketBase not ready

If you see "Timeout waiting for PocketBase", make sure the container is running:

```bash
docker compose up -d
docker ps
```

### Permission errors on reset

If `db:reset` fails with permission errors, the script uses Docker to clean the data directory. Make sure Docker is running and you have access to run containers.

### Authentication fails

If the seed script can't authenticate:

1. Check PocketBase is running: `curl http://localhost:8090/api/health`
2. Verify superuser exists: Access http://localhost:8090/_/
3. Check credentials match environment variables

### Collections already exist

The seed script is idempotent - it checks for existing data before creating. If you want a completely fresh database, use `pnpm db:reset`.

## Adding Custom Seed Data

To modify the seed data, edit `scripts/seed.ts`:

```typescript
// Add a new user
const users = [
  // ... existing users
  {
    email: 'newuser@example.com',
    password: 'password123',
    passwordConfirm: 'password123',
    name: 'New User',
    role: 'speaker'
  }
]

// Add a new category
const categories = [
  // ... existing categories
  { name: 'New Category', color: 'cyan', description: 'Description', order: 5 }
]
```

## Architecture

The seed script follows this order to respect foreign key relationships:

1. **Users** - Auth collection (built-in)
2. **Organizations** - No dependencies
3. **Events** - Depends on organizations
4. **Editions** - Depends on events
5. **Categories** - Depends on editions
6. **Formats** - Depends on editions
7. **Speakers** - Depends on users
8. **Talks** - Depends on editions, categories, formats, speakers
9. **Reviews** - Depends on talks, users

## Related Documentation

- [PocketBase Documentation](https://pocketbase.io/docs/)
- [Project Architecture](./architecture.md)
- [Contributing Guide](../../CONTRIBUTING.md)
