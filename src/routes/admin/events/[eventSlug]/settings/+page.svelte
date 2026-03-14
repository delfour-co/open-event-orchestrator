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
  Globe,
  Loader2,
  Mail,
  Palette,
  Share2,
  Shield,
  Trash2,
  Upload
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isSubmitting = $state(false)
let isUploadingLogo = $state(false)
let isUploadingBanner = $state(false)
let showDeleteConfirm = $state(false)

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Amsterdam',
  'Europe/Brussels',
  'Europe/Zurich',
  'Europe/Moscow',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Pacific/Auckland'
]
</script>

<svelte:head>
  <title>Event Settings - {data.event.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center gap-4">
    <a href="/admin/events">
      <Button variant="ghost" size="icon">
        <ArrowLeft class="h-4 w-4" />
      </Button>
    </a>
    <div>
      <h2 class="text-3xl font-bold tracking-tight">{data.event.name}</h2>
      <p class="text-muted-foreground">
        Event settings - {data.event.organizationName}
      </p>
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

  <!-- Event Details Card -->
  <Card.Root>
    <Card.Header>
      <Card.Title>Event Details</Card.Title>
      <Card.Description>Basic information about this event</Card.Description>
    </Card.Header>
    <Card.Content>
      <form
        method="POST"
        action="?/updateEvent"
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
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="event-name">Name</Label>
            <Input
              id="event-name"
              name="name"
              value={data.event.name}
              required
              oninput={(e) => {
                const slugInput = document.getElementById('event-slug') as HTMLInputElement
                if (slugInput && !slugInput.dataset.modified) {
                  slugInput.value = generateSlug((e.target as HTMLInputElement).value)
                }
              }}
            />
          </div>
          <div class="space-y-2">
            <Label for="event-slug">Slug</Label>
            <Input
              id="event-slug"
              name="slug"
              value={data.event.slug}
              required
              pattern="[a-z0-9-]+"
              oninput={(e) => {
                (e.target as HTMLInputElement).dataset.modified = 'true'
              }}
            />
            <p class="text-xs text-muted-foreground">URL: /events/{data.event.slug}</p>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="event-description">Description</Label>
          <Textarea
            id="event-description"
            name="description"
            value={data.event.description}
            rows={3}
            placeholder="A brief description of this event..."
          />
        </div>

        <div class="space-y-2">
          <Label for="event-website">Website</Label>
          <Input
            id="event-website"
            name="website"
            type="url"
            value={data.event.website}
            placeholder="https://myconference.com"
          />
        </div>

        <input type="hidden" name="defaultVenue" value={data.event.defaultVenue} />
        <input type="hidden" name="defaultCity" value={data.event.defaultCity} />
        <input type="hidden" name="defaultCountry" value={data.event.defaultCountry} />
        <input type="hidden" name="primaryColor" value={data.event.primaryColor} />
        <input type="hidden" name="secondaryColor" value={data.event.secondaryColor} />
        <input type="hidden" name="twitter" value={data.event.twitter} />
        <input type="hidden" name="linkedin" value={data.event.linkedin} />
        <input type="hidden" name="hashtag" value={data.event.hashtag} />
        <input type="hidden" name="contactEmail" value={data.event.contactEmail} />
        <input type="hidden" name="codeOfConductUrl" value={data.event.codeOfConductUrl} />
        <input type="hidden" name="privacyPolicyUrl" value={data.event.privacyPolicyUrl} />
        <input type="hidden" name="timezone" value={data.event.timezone} />

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
        {m.admin_event_branding_title()}
      </Card.Title>
      <Card.Description>{m.admin_event_branding_description()}</Card.Description>
    </Card.Header>
    <Card.Content class="space-y-6">
      <!-- Logo Upload -->
      <div class="space-y-2">
        <Label>{m.admin_event_branding_logo()}</Label>
        <div class="flex items-center gap-4">
          {#if data.event.logoUrl}
            <img
              src={data.event.logoUrl}
              alt="Event logo"
              class="h-16 w-16 rounded-md border object-cover"
            />
          {:else}
            <div class="flex h-16 w-16 items-center justify-center rounded-md border bg-muted">
              <Palette class="h-6 w-6 text-muted-foreground" />
            </div>
          {/if}
          <div class="flex gap-2">
            <form
              method="POST"
              action="?/uploadLogo"
              enctype="multipart/form-data"
              use:enhance={() => {
                isUploadingLogo = true
                return async ({ update }) => {
                  isUploadingLogo = false
                  await update()
                  await invalidateAll()
                }
              }}
            >
              <label class="cursor-pointer">
                <input type="file" name="logo" accept="image/*" class="hidden" onchange={(e) => {
                  const form = (e.target as HTMLInputElement).closest('form')
                  if (form) form.requestSubmit()
                }} />
                <Button type="button" variant="outline" size="sm" disabled={isUploadingLogo} onclick={(e) => {
                  const input = (e.target as HTMLElement).closest('label')?.querySelector('input[type="file"]') as HTMLInputElement
                  input?.click()
                }}>
                  {#if isUploadingLogo}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                  {:else}
                    <Upload class="mr-2 h-4 w-4" />
                  {/if}
                  {m.admin_event_branding_upload_logo()}
                </Button>
              </label>
            </form>
            {#if data.event.logo}
              <form
                method="POST"
                action="?/removeLogo"
                use:enhance={() => {
                  return async ({ update }) => {
                    await update()
                    await invalidateAll()
                  }
                }}
              >
                <Button type="submit" variant="ghost" size="sm">
                  <Trash2 class="mr-2 h-4 w-4" />
                  {m.admin_event_branding_remove_logo()}
                </Button>
              </form>
            {/if}
          </div>
        </div>
      </div>

      <!-- Banner Upload -->
      <div class="space-y-2">
        <Label>{m.admin_event_branding_banner()}</Label>
        <p class="text-xs text-muted-foreground">{m.admin_event_branding_banner_description()}</p>
        <div class="space-y-3">
          {#if data.event.bannerUrl}
            <img
              src={data.event.bannerUrl}
              alt="Event banner"
              class="h-32 w-full rounded-md border object-cover"
            />
          {/if}
          <div class="flex gap-2">
            <form
              method="POST"
              action="?/uploadBanner"
              enctype="multipart/form-data"
              use:enhance={() => {
                isUploadingBanner = true
                return async ({ update }) => {
                  isUploadingBanner = false
                  await update()
                  await invalidateAll()
                }
              }}
            >
              <label class="cursor-pointer">
                <input type="file" name="banner" accept="image/*" class="hidden" onchange={(e) => {
                  const form = (e.target as HTMLInputElement).closest('form')
                  if (form) form.requestSubmit()
                }} />
                <Button type="button" variant="outline" size="sm" disabled={isUploadingBanner} onclick={(e) => {
                  const input = (e.target as HTMLElement).closest('label')?.querySelector('input[type="file"]') as HTMLInputElement
                  input?.click()
                }}>
                  {#if isUploadingBanner}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                  {:else}
                    <Upload class="mr-2 h-4 w-4" />
                  {/if}
                  {m.admin_event_branding_upload_banner()}
                </Button>
              </label>
            </form>
            {#if data.event.banner}
              <form
                method="POST"
                action="?/removeBanner"
                use:enhance={() => {
                  return async ({ update }) => {
                    await update()
                    await invalidateAll()
                  }
                }}
              >
                <Button type="submit" variant="ghost" size="sm">
                  <Trash2 class="mr-2 h-4 w-4" />
                  {m.admin_event_branding_remove_banner()}
                </Button>
              </form>
            {/if}
          </div>
        </div>
      </div>

      <!-- Colors -->
      <form
        method="POST"
        action="?/updateEvent"
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
        <input type="hidden" name="name" value={data.event.name} />
        <input type="hidden" name="slug" value={data.event.slug} />
        <input type="hidden" name="description" value={data.event.description} />
        <input type="hidden" name="website" value={data.event.website} />
        <input type="hidden" name="defaultVenue" value={data.event.defaultVenue} />
        <input type="hidden" name="defaultCity" value={data.event.defaultCity} />
        <input type="hidden" name="defaultCountry" value={data.event.defaultCountry} />
        <input type="hidden" name="twitter" value={data.event.twitter} />
        <input type="hidden" name="linkedin" value={data.event.linkedin} />
        <input type="hidden" name="hashtag" value={data.event.hashtag} />
        <input type="hidden" name="contactEmail" value={data.event.contactEmail} />
        <input type="hidden" name="codeOfConductUrl" value={data.event.codeOfConductUrl} />
        <input type="hidden" name="privacyPolicyUrl" value={data.event.privacyPolicyUrl} />
        <input type="hidden" name="timezone" value={data.event.timezone} />

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="primary-color">{m.admin_event_branding_primary_color()}</Label>
            <div class="flex items-center gap-2">
              <input
                type="color"
                id="primary-color-picker"
                value={data.event.primaryColor || '#000000'}
                class="h-10 w-10 cursor-pointer rounded border"
                oninput={(e) => {
                  const input = document.getElementById('primary-color') as HTMLInputElement
                  if (input) input.value = (e.target as HTMLInputElement).value
                }}
              />
              <Input
                id="primary-color"
                name="primaryColor"
                value={data.event.primaryColor}
                placeholder="#3B82F6"
              />
            </div>
          </div>
          <div class="space-y-2">
            <Label for="secondary-color">{m.admin_event_branding_secondary_color()}</Label>
            <div class="flex items-center gap-2">
              <input
                type="color"
                id="secondary-color-picker"
                value={data.event.secondaryColor || '#000000'}
                class="h-10 w-10 cursor-pointer rounded border"
                oninput={(e) => {
                  const input = document.getElementById('secondary-color') as HTMLInputElement
                  if (input) input.value = (e.target as HTMLInputElement).value
                }}
              />
              <Input
                id="secondary-color"
                name="secondaryColor"
                value={data.event.secondaryColor}
                placeholder="#10B981"
              />
            </div>
          </div>
        </div>
        <p class="text-xs text-muted-foreground">{m.admin_event_branding_colors_hint()}</p>

        <div class="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {#if isSubmitting}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              Saving...
            {:else}
              Save Colors
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
        {m.admin_event_social_title()}
      </Card.Title>
      <Card.Description>{m.admin_event_social_description()}</Card.Description>
    </Card.Header>
    <Card.Content>
      <form
        method="POST"
        action="?/updateEvent"
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
        <input type="hidden" name="name" value={data.event.name} />
        <input type="hidden" name="slug" value={data.event.slug} />
        <input type="hidden" name="description" value={data.event.description} />
        <input type="hidden" name="website" value={data.event.website} />
        <input type="hidden" name="defaultVenue" value={data.event.defaultVenue} />
        <input type="hidden" name="defaultCity" value={data.event.defaultCity} />
        <input type="hidden" name="defaultCountry" value={data.event.defaultCountry} />
        <input type="hidden" name="primaryColor" value={data.event.primaryColor} />
        <input type="hidden" name="secondaryColor" value={data.event.secondaryColor} />
        <input type="hidden" name="contactEmail" value={data.event.contactEmail} />
        <input type="hidden" name="codeOfConductUrl" value={data.event.codeOfConductUrl} />
        <input type="hidden" name="privacyPolicyUrl" value={data.event.privacyPolicyUrl} />
        <input type="hidden" name="timezone" value={data.event.timezone} />

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="event-twitter">{m.admin_event_social_twitter()}</Label>
            <Input
              id="event-twitter"
              name="twitter"
              type="url"
              value={data.event.twitter}
              placeholder="https://twitter.com/myevent"
            />
          </div>
          <div class="space-y-2">
            <Label for="event-linkedin">{m.admin_event_social_linkedin()}</Label>
            <Input
              id="event-linkedin"
              name="linkedin"
              type="url"
              value={data.event.linkedin}
              placeholder="https://linkedin.com/company/myevent"
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="event-hashtag">{m.admin_event_social_hashtag()}</Label>
          <Input
            id="event-hashtag"
            name="hashtag"
            value={data.event.hashtag}
            placeholder="MyConf2024"
          />
          <p class="text-xs text-muted-foreground">{m.admin_event_social_hashtag_hint()}</p>
        </div>

        <div class="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {#if isSubmitting}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              Saving...
            {:else}
              Save Social Links
            {/if}
          </Button>
        </div>
      </form>
    </Card.Content>
  </Card.Root>

  <!-- Policies & Contact Card -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <Shield class="h-5 w-5" />
        {m.admin_event_policies_title()}
      </Card.Title>
      <Card.Description>{m.admin_event_policies_description()}</Card.Description>
    </Card.Header>
    <Card.Content>
      <form
        method="POST"
        action="?/updateEvent"
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
        <input type="hidden" name="name" value={data.event.name} />
        <input type="hidden" name="slug" value={data.event.slug} />
        <input type="hidden" name="description" value={data.event.description} />
        <input type="hidden" name="website" value={data.event.website} />
        <input type="hidden" name="defaultVenue" value={data.event.defaultVenue} />
        <input type="hidden" name="defaultCity" value={data.event.defaultCity} />
        <input type="hidden" name="defaultCountry" value={data.event.defaultCountry} />
        <input type="hidden" name="primaryColor" value={data.event.primaryColor} />
        <input type="hidden" name="secondaryColor" value={data.event.secondaryColor} />
        <input type="hidden" name="twitter" value={data.event.twitter} />
        <input type="hidden" name="linkedin" value={data.event.linkedin} />
        <input type="hidden" name="hashtag" value={data.event.hashtag} />
        <input type="hidden" name="timezone" value={data.event.timezone} />

        <div class="space-y-2">
          <Label for="event-contact-email">
            <span class="flex items-center gap-1">
              <Mail class="h-4 w-4" />
              {m.admin_event_policies_contact_email()}
            </span>
          </Label>
          <Input
            id="event-contact-email"
            name="contactEmail"
            type="email"
            value={data.event.contactEmail}
            placeholder="contact@myevent.com"
          />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="event-coc-url">{m.admin_event_policies_coc_url()}</Label>
            <Input
              id="event-coc-url"
              name="codeOfConductUrl"
              type="url"
              value={data.event.codeOfConductUrl}
              placeholder="https://myevent.com/code-of-conduct"
            />
          </div>
          <div class="space-y-2">
            <Label for="event-privacy-url">{m.admin_event_policies_privacy_url()}</Label>
            <Input
              id="event-privacy-url"
              name="privacyPolicyUrl"
              type="url"
              value={data.event.privacyPolicyUrl}
              placeholder="https://myevent.com/privacy"
            />
          </div>
        </div>

        <div class="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {#if isSubmitting}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              Saving...
            {:else}
              Save Policies
            {/if}
          </Button>
        </div>
      </form>
    </Card.Content>
  </Card.Root>

  <!-- Default Settings Card -->
  <Card.Root>
    <Card.Header>
      <Card.Title>Default Settings for Editions</Card.Title>
      <Card.Description>
        These values will be pre-filled when creating new editions
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <form
        method="POST"
        action="?/updateEvent"
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
        <input type="hidden" name="name" value={data.event.name} />
        <input type="hidden" name="slug" value={data.event.slug} />
        <input type="hidden" name="description" value={data.event.description} />
        <input type="hidden" name="website" value={data.event.website} />
        <input type="hidden" name="primaryColor" value={data.event.primaryColor} />
        <input type="hidden" name="secondaryColor" value={data.event.secondaryColor} />
        <input type="hidden" name="twitter" value={data.event.twitter} />
        <input type="hidden" name="linkedin" value={data.event.linkedin} />
        <input type="hidden" name="hashtag" value={data.event.hashtag} />
        <input type="hidden" name="contactEmail" value={data.event.contactEmail} />
        <input type="hidden" name="codeOfConductUrl" value={data.event.codeOfConductUrl} />
        <input type="hidden" name="privacyPolicyUrl" value={data.event.privacyPolicyUrl} />

        <div class="grid gap-4 sm:grid-cols-3">
          <div class="space-y-2">
            <Label for="default-venue">Default Venue</Label>
            <Input
              id="default-venue"
              name="defaultVenue"
              value={data.event.defaultVenue}
              placeholder="Convention Center"
            />
          </div>
          <div class="space-y-2">
            <Label for="default-city">Default City</Label>
            <Input
              id="default-city"
              name="defaultCity"
              value={data.event.defaultCity}
              placeholder="Paris"
            />
          </div>
          <div class="space-y-2">
            <Label for="default-country">Default Country</Label>
            <Input
              id="default-country"
              name="defaultCountry"
              value={data.event.defaultCountry}
              placeholder="France"
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="event-timezone">
            <span class="flex items-center gap-1">
              <Globe class="h-4 w-4" />
              {m.admin_event_localization_timezone()}
            </span>
          </Label>
          <select
            id="event-timezone"
            name="timezone"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">-- Select timezone --</option>
            {#each COMMON_TIMEZONES as tz}
              <option value={tz} selected={data.event.timezone === tz}>{tz}</option>
            {/each}
          </select>
        </div>

        <div class="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {#if isSubmitting}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              Saving...
            {:else}
              Save Defaults
            {/if}
          </Button>
        </div>
      </form>
    </Card.Content>
  </Card.Root>

  <!-- Danger Zone -->
  <Card.Root class="border-destructive">
    <Card.Header>
      <Card.Title class="flex items-center gap-2 text-destructive">
        <AlertTriangle class="h-5 w-5" />
        Danger Zone
      </Card.Title>
      <Card.Description>Irreversible actions for this event</Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium">Delete this event</p>
          <p class="text-sm text-muted-foreground">
            {#if data.editionsCount > 0}
              Cannot delete: {data.editionsCount} edition(s) exist. Delete editions first.
            {:else}
              Permanently delete this event and all associated data.
            {/if}
          </p>
        </div>
        {#if showDeleteConfirm}
          <form method="POST" action="?/deleteEvent" use:enhance class="flex gap-2">
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
            disabled={data.editionsCount > 0}
            onclick={() => (showDeleteConfirm = true)}
          >
            Delete Event
          </Button>
        {/if}
      </div>
    </Card.Content>
  </Card.Root>
</div>
