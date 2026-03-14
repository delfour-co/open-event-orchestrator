<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import * as m from '$lib/paraglide/messages'
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  Globe,
  Loader2,
  Mail,
  Palette,
  Plus,
  RefreshCw,
  Share2,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isSubmitting = $state(false)
let showDeleteConfirm = $state(false)
let showAddMember = $state(false)
let showBulkImport = $state(false)

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'owner':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'admin':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'organizer':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'reviewer':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}
</script>

<svelte:head>
  <title>{m.admin_org_settings_title({ name: data.organization.name })}</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center gap-4">
    <a href="/admin/organizations">
      <Button variant="ghost" size="icon">
        <ArrowLeft class="h-4 w-4" />
      </Button>
    </a>
    <div>
      <h2 class="text-3xl font-bold tracking-tight">{data.organization.name}</h2>
      <p class="text-muted-foreground">{m.admin_org_settings_heading()}</p>
    </div>
  </div>

  {#if form?.error}
    <div class="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
      {form.error}
    </div>
  {/if}

  {#if form?.success}
    <div class="rounded-md border border-green-500 bg-green-500/10 p-4 text-green-700 dark:text-green-400">
      {form.message}
    </div>
  {/if}

  <!-- Organization Details Card -->
  <Card.Root>
    <Card.Header>
      <Card.Title>Organization Details</Card.Title>
      <Card.Description>Basic information about this organization</Card.Description>
    </Card.Header>
    <Card.Content>
      <form
        method="POST"
        action="?/updateOrganization"
        use:enhance={() => {
          isSubmitting = true
          return async ({ update }) => {
            isSubmitting = false
            await update()
            await invalidateAll()
          }
        }}
        class="space-y-4"
      >
        <!-- Hidden fields to preserve legal data -->
        <input type="hidden" name="legalName" value={data.organization.legalName} />
        <input type="hidden" name="legalForm" value={data.organization.legalForm} />
        <input type="hidden" name="rcsNumber" value={data.organization.rcsNumber} />
        <input type="hidden" name="shareCapital" value={data.organization.shareCapital} />
        <input type="hidden" name="siret" value={data.organization.siret} />
        <input type="hidden" name="vatNumber" value={data.organization.vatNumber} />
        <input type="hidden" name="address" value={data.organization.address} />
        <input type="hidden" name="city" value={data.organization.city} />
        <input type="hidden" name="postalCode" value={data.organization.postalCode} />
        <input type="hidden" name="country" value={data.organization.country} />
        <input type="hidden" name="primaryColor" value={data.organization.primaryColor} />
        <input type="hidden" name="secondaryColor" value={data.organization.secondaryColor} />
        <input type="hidden" name="twitter" value={data.organization.twitter} />
        <input type="hidden" name="linkedin" value={data.organization.linkedin} />
        <input type="hidden" name="github" value={data.organization.github} />
        <input type="hidden" name="youtube" value={data.organization.youtube} />
        <input type="hidden" name="timezone" value={data.organization.timezone} />
        <input type="hidden" name="defaultLocale" value={data.organization.defaultLocale} />

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="org-name">Name</Label>
            <Input
              id="org-name"
              name="name"
              value={data.organization.name}
              required
              oninput={(e) => {
                const slugInput = document.getElementById('org-slug') as HTMLInputElement
                if (slugInput && !slugInput.dataset.modified) {
                  slugInput.value = generateSlug((e.target as HTMLInputElement).value)
                }
              }}
            />
          </div>
          <div class="space-y-2">
            <Label for="org-slug">Slug</Label>
            <Input
              id="org-slug"
              name="slug"
              value={data.organization.slug}
              required
              pattern="[a-z0-9-]+"
              oninput={(e) => {
                (e.target as HTMLInputElement).dataset.modified = 'true'
              }}
            />
            <p class="text-xs text-muted-foreground">URL: /org/{data.organization.slug}</p>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="org-description">Description</Label>
          <Textarea
            id="org-description"
            name="description"
            value={data.organization.description}
            rows={3}
            placeholder="A brief description of this organization..."
          />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="org-website">Website</Label>
            <Input
              id="org-website"
              name="website"
              type="url"
              value={data.organization.website}
              placeholder="https://myorg.com"
            />
          </div>
          <div class="space-y-2">
            <Label for="org-email">Contact Email</Label>
            <Input
              id="org-email"
              name="contactEmail"
              type="email"
              value={data.organization.contactEmail}
              placeholder="contact@myorg.com"
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="org-vat-rate">{m.admin_org_settings_vat_rate()}</Label>
            <Input
              id="org-vat-rate"
              name="vatRate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={String(data.organization.vatRate)}
              placeholder="20"
            />
            <p class="text-xs text-muted-foreground">{m.admin_org_settings_vat_rate_hint()}</p>
          </div>
        </div>

        <div class="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {#if isSubmitting}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              Saving...
            {:else}
              Save Details
            {/if}
          </Button>
        </div>
      </form>
    </Card.Content>
  </Card.Root>

  <!-- Branding Card -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <Palette class="h-5 w-5" />
        {m.admin_org_branding_title()}
      </Card.Title>
      <Card.Description>{m.admin_org_branding_description()}</Card.Description>
    </Card.Header>
    <Card.Content class="space-y-6">
      <!-- Logo Upload -->
      <div class="space-y-2">
        <Label>{m.admin_org_branding_logo()}</Label>
        <p class="text-sm text-muted-foreground">{m.admin_org_branding_logo_description()}</p>
        <div class="flex items-center gap-4">
          {#if data.logoUrl}
            <img
              src={data.logoUrl}
              alt="Organization logo"
              class="h-16 w-16 rounded-md border object-contain"
            />
          {:else}
            <div class="flex h-16 w-16 items-center justify-center rounded-md border bg-muted text-muted-foreground">
              <Palette class="h-8 w-8" />
            </div>
          {/if}
          <div class="flex gap-2">
            <form
              method="POST"
              action="?/uploadLogo"
              enctype="multipart/form-data"
              use:enhance={() => {
                isSubmitting = true
                return async ({ update }) => {
                  isSubmitting = false
                  await update()
                  await invalidateAll()
                }
              }}
            >
              <input
                type="file"
                name="logo"
                id="logo-upload"
                accept="image/jpeg,image/png,image/svg+xml,image/webp"
                class="hidden"
                onchange={(e) => {
                  const form = (e.target as HTMLInputElement).closest('form')
                  if (form) form.requestSubmit()
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onclick={() => document.getElementById('logo-upload')?.click()}
              >
                <Upload class="mr-2 h-4 w-4" />
                {m.admin_org_branding_upload_logo()}
              </Button>
            </form>
            {#if data.organization.logo}
              <form
                method="POST"
                action="?/removeLogo"
                use:enhance={() => {
                  isSubmitting = true
                  return async ({ update }) => {
                    isSubmitting = false
                    await update()
                    await invalidateAll()
                  }
                }}
              >
                <Button type="submit" variant="ghost" size="sm" class="text-destructive hover:text-destructive" disabled={isSubmitting}>
                  <Trash2 class="mr-2 h-4 w-4" />
                  {m.admin_org_branding_remove_logo()}
                </Button>
              </form>
            {/if}
          </div>
        </div>
      </div>

      <!-- Colors -->
      <form
        method="POST"
        action="?/updateOrganization"
        use:enhance={() => {
          isSubmitting = true
          return async ({ update }) => {
            isSubmitting = false
            await update()
            await invalidateAll()
          }
        }}
        class="space-y-4"
      >
        <!-- Hidden fields to preserve existing data -->
        <input type="hidden" name="name" value={data.organization.name} />
        <input type="hidden" name="slug" value={data.organization.slug} />
        <input type="hidden" name="description" value={data.organization.description} />
        <input type="hidden" name="website" value={data.organization.website} />
        <input type="hidden" name="contactEmail" value={data.organization.contactEmail} />
        <input type="hidden" name="vatRate" value={String(data.organization.vatRate)} />
        <input type="hidden" name="legalName" value={data.organization.legalName} />
        <input type="hidden" name="legalForm" value={data.organization.legalForm} />
        <input type="hidden" name="rcsNumber" value={data.organization.rcsNumber} />
        <input type="hidden" name="shareCapital" value={data.organization.shareCapital} />
        <input type="hidden" name="siret" value={data.organization.siret} />
        <input type="hidden" name="vatNumber" value={data.organization.vatNumber} />
        <input type="hidden" name="address" value={data.organization.address} />
        <input type="hidden" name="city" value={data.organization.city} />
        <input type="hidden" name="postalCode" value={data.organization.postalCode} />
        <input type="hidden" name="country" value={data.organization.country} />
        <input type="hidden" name="twitter" value={data.organization.twitter} />
        <input type="hidden" name="linkedin" value={data.organization.linkedin} />
        <input type="hidden" name="github" value={data.organization.github} />
        <input type="hidden" name="youtube" value={data.organization.youtube} />
        <input type="hidden" name="timezone" value={data.organization.timezone} />
        <input type="hidden" name="defaultLocale" value={data.organization.defaultLocale} />

        <p class="text-sm text-muted-foreground">{m.admin_org_branding_colors_description()}</p>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="org-primary-color">{m.admin_org_branding_primary_color()}</Label>
            <div class="flex items-center gap-2">
              <input
                type="color"
                id="org-primary-color-picker"
                value={data.organization.primaryColor || '#000000'}
                class="h-10 w-10 cursor-pointer rounded border"
                oninput={(e) => {
                  const textInput = document.getElementById('org-primary-color') as HTMLInputElement
                  if (textInput) textInput.value = (e.target as HTMLInputElement).value
                }}
              />
              <Input
                id="org-primary-color"
                name="primaryColor"
                value={data.organization.primaryColor}
                placeholder="#3B82F6"
                oninput={(e) => {
                  const colorInput = document.getElementById('org-primary-color-picker') as HTMLInputElement
                  if (colorInput) colorInput.value = (e.target as HTMLInputElement).value
                }}
              />
            </div>
          </div>
          <div class="space-y-2">
            <Label for="org-secondary-color">{m.admin_org_branding_secondary_color()}</Label>
            <div class="flex items-center gap-2">
              <input
                type="color"
                id="org-secondary-color-picker"
                value={data.organization.secondaryColor || '#000000'}
                class="h-10 w-10 cursor-pointer rounded border"
                oninput={(e) => {
                  const textInput = document.getElementById('org-secondary-color') as HTMLInputElement
                  if (textInput) textInput.value = (e.target as HTMLInputElement).value
                }}
              />
              <Input
                id="org-secondary-color"
                name="secondaryColor"
                value={data.organization.secondaryColor}
                placeholder="#10B981"
                oninput={(e) => {
                  const colorInput = document.getElementById('org-secondary-color-picker') as HTMLInputElement
                  if (colorInput) colorInput.value = (e.target as HTMLInputElement).value
                }}
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {#if isSubmitting}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              {m.admin_org_settings_saving()}
            {:else}
              {m.admin_org_settings_save()}
            {/if}
          </Button>
        </div>
      </form>
    </Card.Content>
  </Card.Root>

  <!-- Social Links Card -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <Share2 class="h-5 w-5" />
        {m.admin_org_social_title()}
      </Card.Title>
      <Card.Description>{m.admin_org_social_description()}</Card.Description>
    </Card.Header>
    <Card.Content>
      <form
        method="POST"
        action="?/updateOrganization"
        use:enhance={() => {
          isSubmitting = true
          return async ({ update }) => {
            isSubmitting = false
            await update()
            await invalidateAll()
          }
        }}
        class="space-y-4"
      >
        <!-- Hidden fields to preserve existing data -->
        <input type="hidden" name="name" value={data.organization.name} />
        <input type="hidden" name="slug" value={data.organization.slug} />
        <input type="hidden" name="description" value={data.organization.description} />
        <input type="hidden" name="website" value={data.organization.website} />
        <input type="hidden" name="contactEmail" value={data.organization.contactEmail} />
        <input type="hidden" name="vatRate" value={String(data.organization.vatRate)} />
        <input type="hidden" name="legalName" value={data.organization.legalName} />
        <input type="hidden" name="legalForm" value={data.organization.legalForm} />
        <input type="hidden" name="rcsNumber" value={data.organization.rcsNumber} />
        <input type="hidden" name="shareCapital" value={data.organization.shareCapital} />
        <input type="hidden" name="siret" value={data.organization.siret} />
        <input type="hidden" name="vatNumber" value={data.organization.vatNumber} />
        <input type="hidden" name="address" value={data.organization.address} />
        <input type="hidden" name="city" value={data.organization.city} />
        <input type="hidden" name="postalCode" value={data.organization.postalCode} />
        <input type="hidden" name="country" value={data.organization.country} />
        <input type="hidden" name="primaryColor" value={data.organization.primaryColor} />
        <input type="hidden" name="secondaryColor" value={data.organization.secondaryColor} />
        <input type="hidden" name="timezone" value={data.organization.timezone} />
        <input type="hidden" name="defaultLocale" value={data.organization.defaultLocale} />

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="org-twitter">{m.admin_org_social_twitter()}</Label>
            <Input
              id="org-twitter"
              name="twitter"
              type="url"
              value={data.organization.twitter}
              placeholder="https://x.com/yourorg"
            />
          </div>
          <div class="space-y-2">
            <Label for="org-linkedin">{m.admin_org_social_linkedin()}</Label>
            <Input
              id="org-linkedin"
              name="linkedin"
              type="url"
              value={data.organization.linkedin}
              placeholder="https://linkedin.com/company/yourorg"
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="org-github">{m.admin_org_social_github()}</Label>
            <Input
              id="org-github"
              name="github"
              type="url"
              value={data.organization.github}
              placeholder="https://github.com/yourorg"
            />
          </div>
          <div class="space-y-2">
            <Label for="org-youtube">{m.admin_org_social_youtube()}</Label>
            <Input
              id="org-youtube"
              name="youtube"
              type="url"
              value={data.organization.youtube}
              placeholder="https://youtube.com/@yourorg"
            />
          </div>
        </div>

        <div class="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {#if isSubmitting}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              {m.admin_org_settings_saving()}
            {:else}
              {m.admin_org_settings_save()}
            {/if}
          </Button>
        </div>
      </form>
    </Card.Content>
  </Card.Root>

  <!-- Localization Card -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <Globe class="h-5 w-5" />
        {m.admin_org_localization_title()}
      </Card.Title>
      <Card.Description>{m.admin_org_localization_description()}</Card.Description>
    </Card.Header>
    <Card.Content>
      <form
        method="POST"
        action="?/updateOrganization"
        use:enhance={() => {
          isSubmitting = true
          return async ({ update }) => {
            isSubmitting = false
            await update()
            await invalidateAll()
          }
        }}
        class="space-y-4"
      >
        <!-- Hidden fields to preserve existing data -->
        <input type="hidden" name="name" value={data.organization.name} />
        <input type="hidden" name="slug" value={data.organization.slug} />
        <input type="hidden" name="description" value={data.organization.description} />
        <input type="hidden" name="website" value={data.organization.website} />
        <input type="hidden" name="contactEmail" value={data.organization.contactEmail} />
        <input type="hidden" name="vatRate" value={String(data.organization.vatRate)} />
        <input type="hidden" name="legalName" value={data.organization.legalName} />
        <input type="hidden" name="legalForm" value={data.organization.legalForm} />
        <input type="hidden" name="rcsNumber" value={data.organization.rcsNumber} />
        <input type="hidden" name="shareCapital" value={data.organization.shareCapital} />
        <input type="hidden" name="siret" value={data.organization.siret} />
        <input type="hidden" name="vatNumber" value={data.organization.vatNumber} />
        <input type="hidden" name="address" value={data.organization.address} />
        <input type="hidden" name="city" value={data.organization.city} />
        <input type="hidden" name="postalCode" value={data.organization.postalCode} />
        <input type="hidden" name="country" value={data.organization.country} />
        <input type="hidden" name="primaryColor" value={data.organization.primaryColor} />
        <input type="hidden" name="secondaryColor" value={data.organization.secondaryColor} />
        <input type="hidden" name="twitter" value={data.organization.twitter} />
        <input type="hidden" name="linkedin" value={data.organization.linkedin} />
        <input type="hidden" name="github" value={data.organization.github} />
        <input type="hidden" name="youtube" value={data.organization.youtube} />

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="org-timezone">{m.admin_org_localization_timezone()}</Label>
            <select
              id="org-timezone"
              name="timezone"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="" selected={!data.organization.timezone}>--</option>
              <option value="Europe/Paris" selected={data.organization.timezone === 'Europe/Paris'}>Europe/Paris</option>
              <option value="Europe/London" selected={data.organization.timezone === 'Europe/London'}>Europe/London</option>
              <option value="Europe/Berlin" selected={data.organization.timezone === 'Europe/Berlin'}>Europe/Berlin</option>
              <option value="Europe/Madrid" selected={data.organization.timezone === 'Europe/Madrid'}>Europe/Madrid</option>
              <option value="Europe/Rome" selected={data.organization.timezone === 'Europe/Rome'}>Europe/Rome</option>
              <option value="Europe/Brussels" selected={data.organization.timezone === 'Europe/Brussels'}>Europe/Brussels</option>
              <option value="Europe/Amsterdam" selected={data.organization.timezone === 'Europe/Amsterdam'}>Europe/Amsterdam</option>
              <option value="Europe/Zurich" selected={data.organization.timezone === 'Europe/Zurich'}>Europe/Zurich</option>
              <option value="America/New_York" selected={data.organization.timezone === 'America/New_York'}>America/New_York</option>
              <option value="America/Chicago" selected={data.organization.timezone === 'America/Chicago'}>America/Chicago</option>
              <option value="America/Denver" selected={data.organization.timezone === 'America/Denver'}>America/Denver</option>
              <option value="America/Los_Angeles" selected={data.organization.timezone === 'America/Los_Angeles'}>America/Los_Angeles</option>
              <option value="America/Toronto" selected={data.organization.timezone === 'America/Toronto'}>America/Toronto</option>
              <option value="America/Sao_Paulo" selected={data.organization.timezone === 'America/Sao_Paulo'}>America/Sao_Paulo</option>
              <option value="Asia/Tokyo" selected={data.organization.timezone === 'Asia/Tokyo'}>Asia/Tokyo</option>
              <option value="Asia/Shanghai" selected={data.organization.timezone === 'Asia/Shanghai'}>Asia/Shanghai</option>
              <option value="Asia/Singapore" selected={data.organization.timezone === 'Asia/Singapore'}>Asia/Singapore</option>
              <option value="Asia/Dubai" selected={data.organization.timezone === 'Asia/Dubai'}>Asia/Dubai</option>
              <option value="Australia/Sydney" selected={data.organization.timezone === 'Australia/Sydney'}>Australia/Sydney</option>
              <option value="Pacific/Auckland" selected={data.organization.timezone === 'Pacific/Auckland'}>Pacific/Auckland</option>
              <option value="UTC" selected={data.organization.timezone === 'UTC'}>UTC</option>
            </select>
          </div>
          <div class="space-y-2">
            <Label for="org-locale">{m.admin_org_localization_locale()}</Label>
            <select
              id="org-locale"
              name="defaultLocale"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="" selected={!data.organization.defaultLocale}>--</option>
              <option value="en" selected={data.organization.defaultLocale === 'en'}>English</option>
              <option value="fr" selected={data.organization.defaultLocale === 'fr'}>Français</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {#if isSubmitting}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              {m.admin_org_settings_saving()}
            {:else}
              {m.admin_org_settings_save()}
            {/if}
          </Button>
        </div>
      </form>
    </Card.Content>
  </Card.Root>

  <!-- Legal & Billing Information Card -->
  <Card.Root>
    <Card.Header>
      <Card.Title>{m.admin_org_settings_legal_title()}</Card.Title>
      <Card.Description>{m.admin_org_settings_legal_description()}</Card.Description>
    </Card.Header>
    <Card.Content>
      <form
        method="POST"
        action="?/updateOrganization"
        use:enhance={() => {
          isSubmitting = true
          return async ({ update }) => {
            isSubmitting = false
            await update()
            await invalidateAll()
          }
        }}
        class="space-y-4"
      >
        <!-- Hidden fields to preserve existing org data -->
        <input type="hidden" name="name" value={data.organization.name} />
        <input type="hidden" name="slug" value={data.organization.slug} />
        <input type="hidden" name="description" value={data.organization.description} />
        <input type="hidden" name="website" value={data.organization.website} />
        <input type="hidden" name="contactEmail" value={data.organization.contactEmail} />
        <input type="hidden" name="vatRate" value={String(data.organization.vatRate)} />
        <input type="hidden" name="primaryColor" value={data.organization.primaryColor} />
        <input type="hidden" name="secondaryColor" value={data.organization.secondaryColor} />
        <input type="hidden" name="twitter" value={data.organization.twitter} />
        <input type="hidden" name="linkedin" value={data.organization.linkedin} />
        <input type="hidden" name="github" value={data.organization.github} />
        <input type="hidden" name="youtube" value={data.organization.youtube} />
        <input type="hidden" name="timezone" value={data.organization.timezone} />
        <input type="hidden" name="defaultLocale" value={data.organization.defaultLocale} />

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="org-legal-name">{m.admin_org_settings_legal_name()}</Label>
            <Input
              id="org-legal-name"
              name="legalName"
              value={data.organization.legalName}
              placeholder="ACME SAS"
            />
          </div>
          <div class="space-y-2">
            <Label for="org-legal-form">{m.admin_org_settings_legal_form()}</Label>
            <Input
              id="org-legal-form"
              name="legalForm"
              value={data.organization.legalForm}
              placeholder="SAS"
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="org-siret">{m.admin_org_settings_siret()}</Label>
            <Input
              id="org-siret"
              name="siret"
              value={data.organization.siret}
              placeholder="123 456 789 00012"
            />
          </div>
          <div class="space-y-2">
            <Label for="org-rcs-number">{m.admin_org_settings_rcs_number()}</Label>
            <Input
              id="org-rcs-number"
              name="rcsNumber"
              value={data.organization.rcsNumber}
              placeholder="Paris B 123 456 789"
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="org-vat-number">{m.admin_org_settings_vat_number()}</Label>
            <Input
              id="org-vat-number"
              name="vatNumber"
              value={data.organization.vatNumber}
              placeholder="FR12345678901"
            />
          </div>
          <div class="space-y-2">
            <Label for="org-share-capital">{m.admin_org_settings_share_capital()}</Label>
            <Input
              id="org-share-capital"
              name="shareCapital"
              value={data.organization.shareCapital}
              placeholder="10 000 EUR"
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="org-address">{m.admin_org_settings_address()}</Label>
          <Input
            id="org-address"
            name="address"
            value={data.organization.address}
            placeholder="123 rue de la Paix"
          />
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div class="space-y-2">
            <Label for="org-postal-code">{m.admin_org_settings_postal_code()}</Label>
            <Input
              id="org-postal-code"
              name="postalCode"
              value={data.organization.postalCode}
              placeholder="75001"
            />
          </div>
          <div class="space-y-2">
            <Label for="org-city">{m.admin_org_settings_city()}</Label>
            <Input
              id="org-city"
              name="city"
              value={data.organization.city}
              placeholder="Paris"
            />
          </div>
          <div class="space-y-2">
            <Label for="org-country">{m.admin_org_settings_country()}</Label>
            <Input
              id="org-country"
              name="country"
              value={data.organization.country}
              placeholder="France"
            />
          </div>
        </div>

        <div class="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {#if isSubmitting}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              Saving...
            {:else}
              Save Legal Information
            {/if}
          </Button>
        </div>
      </form>
    </Card.Content>
  </Card.Root>

  <!-- Team Management Card -->
  <Card.Root>
    <Card.Header>
      <div class="flex items-center justify-between">
        <div>
          <Card.Title class="flex items-center gap-2">
            <Users class="h-5 w-5" />
            Team Members
          </Card.Title>
          <Card.Description>Manage who has access to this organization</Card.Description>
        </div>
        <div class="flex gap-2">
          <Button size="sm" variant="outline" onclick={() => (showAddMember = !showAddMember)}>
            <UserPlus class="mr-2 h-4 w-4" />
            Add Member
          </Button>
          <Button size="sm" variant="outline" onclick={() => (showBulkImport = !showBulkImport)}>
            <Upload class="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
        </div>
      </div>
    </Card.Header>
    <Card.Content>
      {#if showBulkImport}
        <form
          method="POST"
          action="?/bulkInvite"
          use:enhance={() => {
            return async ({ update }) => {
              await update()
              await invalidateAll()
              showBulkImport = false
            }
          }}
          class="mb-4 rounded-md border bg-muted/50 p-4"
        >
          <div class="space-y-2">
            <Label for="csv-input">CSV Content (email,role per line)</Label>
            <Textarea
              id="csv-input"
              name="csv"
              rows={5}
              placeholder={"john@example.com,organizer\njane@example.com,reviewer"}
            />
            <p class="text-xs text-muted-foreground">
              One entry per line. Roles: admin, organizer, reviewer
            </p>
          </div>
          <div class="mt-4 flex gap-2">
            <Button type="submit" size="sm">
              <Upload class="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onclick={() => (showBulkImport = false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      {/if}

      {#if showAddMember}
        <form
          method="POST"
          action="?/addMember"
          use:enhance={() => {
            return async ({ update }) => {
              await update()
              await invalidateAll()
              showAddMember = false
            }
          }}
          class="mb-4 rounded-md border bg-muted/50 p-4"
        >
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="member-email">Email Address</Label>
              <Input
                id="member-email"
                name="email"
                type="email"
                placeholder="user@example.com"
                required
              />
              <p class="text-xs text-muted-foreground">An invitation will be sent if the user doesn't have an account</p>
            </div>
            <div class="space-y-2">
              <Label for="member-role">Role</Label>
              <select
                id="member-role"
                name="role"
                required
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="reviewer">Reviewer - Can review CFP submissions</option>
                <option value="organizer">Organizer - Can manage events and CFP</option>
                <option value="admin">Admin - Full access except delete organization</option>
              </select>
            </div>
          </div>
          <div class="mt-4 flex gap-2">
            <Button type="submit" size="sm">
              <Plus class="mr-2 h-4 w-4" />
              Add Member
            </Button>
            <Button type="button" variant="ghost" size="sm" onclick={() => (showAddMember = false)}>
              Cancel
            </Button>
          </div>
        </form>
      {/if}

      {#if data.organization.ownerName}
        <div class="mb-4 flex items-center justify-between rounded-md border bg-muted/30 p-3">
          <div class="flex items-center gap-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
              {data.organization.ownerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p class="font-medium">{data.organization.ownerName}</p>
              <p class="text-sm text-muted-foreground">Owner</p>
            </div>
          </div>
          <span class="rounded-full px-2 py-0.5 text-xs font-medium {getRoleBadgeColor('owner')}">
            owner
          </span>
        </div>
      {/if}

      {#if data.members.length === 0 && data.invitations.length === 0}
        <p class="text-sm text-muted-foreground">
          No team members yet. Add members to collaborate on events.
        </p>
      {:else}
        <div class="space-y-2">
          {#each data.members as member}
            <div class="flex items-center justify-between rounded-md border bg-background p-3">
              <div class="flex items-center gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p class="font-medium">{member.name}</p>
                  <p class="text-sm text-muted-foreground">{member.email}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <form method="POST" action="?/updateMemberRole" use:enhance class="inline">
                  <input type="hidden" name="memberId" value={member.id} />
                  <select
                    name="role"
                    class="rounded-md border border-input bg-background px-2 py-1 text-sm"
                    onchange={(e) => (e.target as HTMLSelectElement).form?.requestSubmit()}
                  >
                    <option value="reviewer" selected={member.role === 'reviewer'}>Reviewer</option>
                    <option value="organizer" selected={member.role === 'organizer'}>Organizer</option>
                    <option value="admin" selected={member.role === 'admin'}>Admin</option>
                  </select>
                </form>
                <form method="POST" action="?/removeMember" use:enhance>
                  <input type="hidden" name="memberId" value={member.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-destructive hover:text-destructive"
                    onclick={(e) => {
                      if (!confirm(`Remove ${member.name} from this organization?`)) {
                        e.preventDefault()
                      }
                    }}
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Pending Invitations -->
      {#if data.invitations.length > 0}
        <div class="mt-6">
          <h4 class="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock class="h-4 w-4" />
            Pending Invitations
          </h4>
          <div class="space-y-2">
            {#each data.invitations as invitation}
              <div class="flex items-center justify-between rounded-md border border-dashed bg-muted/30 p-3">
                <div class="flex items-center gap-3">
                  <div class="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm">
                    <Mail class="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p class="font-medium">{invitation.email}</p>
                    <p class="text-sm text-muted-foreground">
                      Invited as {invitation.role}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    pending
                  </span>
                  <form method="POST" action="?/resendInvitation" use:enhance={() => {
                    return async ({ update }) => {
                      await update()
                      await invalidateAll()
                    }
                  }}>
                    <input type="hidden" name="invitationId" value={invitation.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8"
                      title="Resend invitation"
                    >
                      <RefreshCw class="h-4 w-4" />
                    </Button>
                  </form>
                  <form method="POST" action="?/cancelInvitation" use:enhance={() => {
                    return async ({ update }) => {
                      await update()
                      await invalidateAll()
                    }
                  }}>
                    <input type="hidden" name="invitationId" value={invitation.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Cancel invitation"
                    >
                      <X class="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>

  <!-- Danger Zone -->
  <Card.Root class="border-destructive">
    <Card.Header>
      <Card.Title class="flex items-center gap-2 text-destructive">
        <AlertTriangle class="h-5 w-5" />
        Danger Zone
      </Card.Title>
      <Card.Description>Irreversible actions for this organization</Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium">Delete this organization</p>
          <p class="text-sm text-muted-foreground">
            {#if data.eventsCount > 0}
              Cannot delete: {data.eventsCount} event(s) exist. Delete events first.
            {:else}
              Permanently delete this organization and remove all team members.
            {/if}
          </p>
        </div>
        {#if showDeleteConfirm}
          <form method="POST" action="?/deleteOrganization" use:enhance class="flex gap-2">
            <Button type="submit" variant="destructive" size="sm">
              Confirm Delete
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onclick={() => (showDeleteConfirm = false)}
            >
              Cancel
            </Button>
          </form>
        {:else}
          <Button
            variant="destructive"
            size="sm"
            disabled={data.eventsCount > 0}
            onclick={() => (showDeleteConfirm = true)}
          >
            Delete Organization
          </Button>
        {/if}
      </div>
    </Card.Content>
  </Card.Root>
</div>
