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
  Loader2,
  Mail,
  Plus,
  Trash2,
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
        <Button size="sm" variant="outline" onclick={() => (showAddMember = !showAddMember)}>
          <UserPlus class="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>
    </Card.Header>
    <Card.Content>
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
