<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import {
  DEFAULT_TEAMS,
  type SocialLink,
  getSocialIcon
} from '$lib/features/core/domain/team-member'
import * as m from '$lib/paraglide/messages'
import {
  ArrowLeft,
  Check,
  Github,
  Globe,
  Linkedin,
  Loader2,
  Plus,
  Trash2,
  Twitter,
  User,
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

let showForm = $state(false)
let showImport = $state(false)
let editingMember = $state<(typeof data.members)[0] | null>(null)
let isSubmitting = $state(false)
let isImporting = $state(false)

// Import state
let selectedOrgMembers = $state<Set<string>>(new Set())
let importTeam = $state('Organizers')

// Form state
let formName = $state('')
let formTeam = $state('')
let formRole = $state('')
let formBio = $state('')
let formPhotoUrl = $state('')
let formPhotoPreview = $state<string | null>(null)
let formSocials = $state<SocialLink[]>([])
let newSocialName = $state('')
let newSocialUrl = $state('')

function handlePhotoChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      formPhotoPreview = e.target?.result as string
    }
    reader.readAsDataURL(file)
  } else {
    formPhotoPreview = null
  }
}

function toggleOrgMember(id: string) {
  if (selectedOrgMembers.has(id)) {
    selectedOrgMembers.delete(id)
  } else {
    selectedOrgMembers.add(id)
  }
  selectedOrgMembers = new Set(selectedOrgMembers)
}

function selectAllOrgMembers() {
  if (selectedOrgMembers.size === data.orgMembers.length) {
    selectedOrgMembers = new Set()
  } else {
    selectedOrgMembers = new Set(data.orgMembers.map((m) => m.id))
  }
}

function closeImport() {
  showImport = false
  selectedOrgMembers = new Set()
  importTeam = 'Organizers'
}

function resetForm() {
  formName = ''
  formTeam = ''
  formRole = ''
  formBio = ''
  formPhotoUrl = ''
  formPhotoPreview = null
  formSocials = []
  newSocialName = ''
  newSocialUrl = ''
  editingMember = null
}

function openNewForm() {
  resetForm()
  showForm = true
}

function openEditForm(member: (typeof data.members)[0]) {
  editingMember = member
  formName = member.name
  formTeam = member.team || ''
  formRole = member.role || ''
  formBio = member.bio || ''
  formPhotoUrl = member.photoUrl || ''
  formSocials = [...(member.socials || [])]
  showForm = true
}

function closeForm() {
  showForm = false
  resetForm()
}

function addSocial() {
  if (newSocialName && newSocialUrl) {
    formSocials = [
      ...formSocials,
      {
        name: newSocialName,
        icon: getSocialIcon(newSocialName),
        url: newSocialUrl
      }
    ]
    newSocialName = ''
    newSocialUrl = ''
  }
}

function removeSocial(index: number) {
  formSocials = formSocials.filter((_, i) => i !== index)
}

function getSocialIconComponent(icon: string) {
  switch (icon) {
    case 'twitter':
      return Twitter
    case 'linkedin':
      return Linkedin
    case 'github':
      return Github
    case 'globe':
      return Globe
    default:
      return Globe
  }
}

// Group members by team
const membersByTeam = $derived(() => {
  const grouped: Record<string, typeof data.members> = {}
  for (const member of data.members) {
    const team = member.team || 'Other'
    if (!grouped[team]) {
      grouped[team] = []
    }
    grouped[team].push(member)
  }
  return grouped
})

const teamNames = $derived(() => {
  return Object.keys(membersByTeam()).sort((a, b) => {
    if (a === 'Other') return 1
    if (b === 'Other') return -1
    return a.localeCompare(b)
  })
})
</script>

<svelte:head>
  <title>Team Members - {data.edition.name} - Open Event Orchestrator</title>
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
      <h2 class="text-3xl font-bold tracking-tight">{data.edition.name}</h2>
      <p class="text-muted-foreground">
        {data.edition.eventName}
      </p>
    </div>
  </div>

  <!-- Tab Navigation -->
  <nav class="flex gap-1 rounded-lg border bg-muted/40 p-1">
    <a
      href="/admin/editions/{data.edition.slug}/settings"
      class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-background hover:shadow-sm"
    >
      {m.nav_settings()}
    </a>
    <span
      class="rounded-md px-3 py-1.5 text-sm font-medium bg-background shadow-sm"
    >
      {m.admin_events_team_members()}
    </span>
    <a
      href="/admin/editions/{data.edition.slug}/settings/legal-documents"
      class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-background hover:shadow-sm"
    >
      {m.legal_documents_title()}
    </a>
  </nav>

  <!-- Actions -->
  <div class="flex justify-end gap-2">
    {#if data.orgMembers.length > 0}
      <Button variant="outline" onclick={() => (showImport = !showImport)}>
        <Users class="mr-2 h-4 w-4" />
        Import from Org ({data.orgMembers.length})
      </Button>
    {/if}
    <Button onclick={openNewForm}>
      <UserPlus class="mr-2 h-4 w-4" />
      Add Member
    </Button>
  </div>

  {#if form?.error}
    <div class="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
      {form.error}
    </div>
  {/if}

  {#if form?.message}
    <div class="rounded-md border border-green-500 bg-green-500/10 p-4 text-green-700 dark:text-green-400">
      {form.message}
    </div>
  {/if}

  <!-- Import from Organization -->
  {#if showImport && data.orgMembers.length > 0}
    <Card.Root>
      <Card.Header>
        <div class="flex items-center justify-between">
          <div>
            <Card.Title class="flex items-center gap-2">
              <Users class="h-5 w-5" />
              Import Organization Members
            </Card.Title>
            <Card.Description>
              Select members from your organization to add to this edition's team
            </Card.Description>
          </div>
          <Button variant="ghost" size="icon" onclick={closeImport}>
            <X class="h-4 w-4" />
          </Button>
        </div>
      </Card.Header>
      <Card.Content>
        <form
          method="POST"
          action="?/importOrgMembers"
          use:enhance={() => {
            isImporting = true
            return async ({ result, update }) => {
              isImporting = false
              if (result.type === 'success') {
                closeImport()
                await invalidateAll()
              } else {
                await update()
              }
            }
          }}
          class="space-y-4"
        >
          <input type="hidden" name="memberIds" value={JSON.stringify([...selectedOrgMembers])} />

          <div class="space-y-2">
            <Label for="import-team">Assign to Team</Label>
            <Input
              id="import-team"
              name="team"
              bind:value={importTeam}
              placeholder="Organizers"
              list="import-team-suggestions"
            />
            <datalist id="import-team-suggestions">
              {#each DEFAULT_TEAMS as team}
                <option value={team}></option>
              {/each}
            </datalist>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label>Select Members</Label>
              <Button type="button" variant="ghost" size="sm" onclick={selectAllOrgMembers}>
                {selectedOrgMembers.size === data.orgMembers.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {#each data.orgMembers as orgMember}
                <button
                  type="button"
                  class="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted {selectedOrgMembers.has(orgMember.id) ? 'border-primary bg-primary/5' : ''}"
                  onclick={() => toggleOrgMember(orgMember.id)}
                >
                  <div class="relative">
                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      {#if orgMember.avatar}
                        <img
                          src={orgMember.avatar}
                          alt={orgMember.name}
                          class="h-full w-full rounded-full object-cover"
                        />
                      {:else}
                        <User class="h-5 w-5 text-muted-foreground" />
                      {/if}
                    </div>
                    {#if selectedOrgMembers.has(orgMember.id)}
                      <div class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check class="h-3 w-3" />
                      </div>
                    {/if}
                  </div>
                  <div class="flex-1 overflow-hidden">
                    <p class="font-medium truncate">{orgMember.name}</p>
                    <p class="text-xs text-muted-foreground capitalize">{orgMember.role}</p>
                  </div>
                </button>
              {/each}
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <Button type="button" variant="ghost" onclick={closeImport}>Cancel</Button>
            <Button type="submit" disabled={isImporting || selectedOrgMembers.size === 0}>
              {#if isImporting}
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                Importing...
              {:else}
                Import {selectedOrgMembers.size} Member{selectedOrgMembers.size !== 1 ? 's' : ''}
              {/if}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  {/if}

  <!-- Member Form Dialog -->
  {#if showForm}
    <Card.Root>
      <Card.Header>
        <div class="flex items-center justify-between">
          <Card.Title>{editingMember ? 'Edit Member' : 'New Member'}</Card.Title>
          <Button variant="ghost" size="icon" onclick={closeForm}>
            <X class="h-4 w-4" />
          </Button>
        </div>
      </Card.Header>
      <Card.Content>
        <form
          method="POST"
          action={editingMember ? '?/update' : '?/create'}
          enctype="multipart/form-data"
          use:enhance={() => {
            isSubmitting = true
            return async ({ result, update }) => {
              isSubmitting = false
              if (result.type === 'success') {
                closeForm()
                await invalidateAll()
              } else {
                await update()
              }
            }
          }}
          class="space-y-6"
        >
          {#if editingMember}
            <input type="hidden" name="id" value={editingMember.id} />
          {/if}
          <input type="hidden" name="socials" value={JSON.stringify(formSocials)} />

          <div class="grid gap-6 md:grid-cols-2">
            <!-- Left column -->
            <div class="space-y-4">
              <div class="space-y-2">
                <Label for="member-name">Name *</Label>
                <Input
                  id="member-name"
                  name="name"
                  bind:value={formName}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div class="space-y-2">
                <Label for="member-team">Team</Label>
                <Input
                  id="member-team"
                  name="team"
                  bind:value={formTeam}
                  placeholder="Core Team"
                  list="team-suggestions"
                />
                <datalist id="team-suggestions">
                  {#each DEFAULT_TEAMS as team}
                    <option value={team}></option>
                  {/each}
                  {#each data.teams as team}
                    {#if !DEFAULT_TEAMS.includes(team)}
                      <option value={team}></option>
                    {/if}
                  {/each}
                </datalist>
              </div>

              <div class="space-y-2">
                <Label for="member-role">Role</Label>
                <Input
                  id="member-role"
                  name="role"
                  bind:value={formRole}
                  placeholder="Event Manager"
                />
              </div>

              <div class="space-y-2">
                <Label for="member-bio">Bio</Label>
                <Textarea
                  id="member-bio"
                  name="bio"
                  bind:value={formBio}
                  placeholder="Short biography..."
                  rows={4}
                />
              </div>
            </div>

            <!-- Right column -->
            <div class="space-y-4">
              <div class="space-y-2">
                <Label>Photo</Label>
                <div class="flex items-start gap-4">
                  <div
                    class="flex h-24 w-24 items-center justify-center rounded-lg border bg-muted overflow-hidden"
                  >
                    {#if formPhotoPreview}
                      <img
                        src={formPhotoPreview}
                        alt={formName}
                        class="h-full w-full object-cover"
                      />
                    {:else if editingMember?.photoFileUrl}
                      <img
                        src={editingMember.photoFileUrl}
                        alt={formName}
                        class="h-full w-full object-cover"
                      />
                    {:else if formPhotoUrl}
                      <img
                        src={formPhotoUrl}
                        alt={formName}
                        class="h-full w-full object-cover"
                      />
                    {:else}
                      <User class="h-12 w-12 text-muted-foreground" />
                    {/if}
                  </div>
                  <div class="flex-1 space-y-2">
                    <Input
                      id="member-photo"
                      name="photo"
                      type="file"
                      accept="image/*"
                      onchange={handlePhotoChange}
                    />
                    <p class="text-xs text-muted-foreground">Or use a URL:</p>
                    <Input
                      id="member-photo-url"
                      name="photoUrl"
                      bind:value={formPhotoUrl}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <Label>Socials</Label>
                <div class="space-y-2">
                  {#each formSocials as social, index}
                    {@const SocialIcon = getSocialIconComponent(social.icon)}
                    <div class="flex items-center gap-2 rounded-md border p-2">
                      <SocialIcon class="h-4 w-4 text-muted-foreground" />
                      <span class="flex-1 truncate text-sm">{social.name}: {social.url}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        class="h-6 w-6"
                        onclick={() => removeSocial(index)}
                      >
                        <Trash2 class="h-3 w-3" />
                      </Button>
                    </div>
                  {/each}

                  <div class="flex gap-2">
                    <Input
                      bind:value={newSocialName}
                      placeholder="Name (e.g., Twitter)"
                      class="flex-1"
                    />
                    <Input bind:value={newSocialUrl} placeholder="URL" class="flex-[2]" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onclick={addSocial}
                      disabled={!newSocialName || !newSocialUrl}
                    >
                      <Plus class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <Button type="button" variant="ghost" onclick={closeForm}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {#if isSubmitting}
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                Saving...
              {:else}
                {editingMember ? 'Update' : 'Create'}
              {/if}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  {/if}

  <!-- Members List -->
  {#if data.members.length === 0 && !showImport}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <User class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">No team members yet</h3>
        <p class="mb-4 text-center text-sm text-muted-foreground">
          {#if data.orgMembers.length > 0}
            Import members from your organization or add new ones manually.
          {:else}
            Add your first team member to get started.
          {/if}
        </p>
        <div class="flex gap-2">
          {#if data.orgMembers.length > 0}
            <Button variant="outline" onclick={() => (showImport = true)}>
              <Users class="mr-2 h-4 w-4" />
              Import from Org
            </Button>
          {/if}
          <Button onclick={openNewForm}>
            <UserPlus class="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>
      </Card.Content>
    </Card.Root>
  {:else}
    {#each teamNames() as teamName}
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">{teamName}</h3>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {#each membersByTeam()[teamName] as member}
            <Card.Root class="overflow-hidden">
              <div class="aspect-square bg-muted">
                {#if member.photoFileUrl}
                  <img
                    src={member.photoFileUrl}
                    alt={member.name}
                    class="h-full w-full object-cover"
                  />
                {:else if member.photoUrl}
                  <img src={member.photoUrl} alt={member.name} class="h-full w-full object-cover" />
                {:else}
                  <div class="flex h-full w-full items-center justify-center">
                    <User class="h-20 w-20 text-muted-foreground" />
                  </div>
                {/if}
              </div>
              <Card.Content class="p-4">
                <h4 class="font-semibold">{member.name}</h4>
                {#if member.role}
                  <p class="text-sm text-muted-foreground">{member.role}</p>
                {/if}
                {#if member.socials && member.socials.length > 0}
                  <div class="mt-2 flex gap-2">
                    {#each member.socials as social}
                      {@const SocialIcon = getSocialIconComponent(social.icon)}
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-muted-foreground hover:text-foreground"
                        title={social.name}
                      >
                        <SocialIcon class="h-4 w-4" />
                      </a>
                    {/each}
                  </div>
                {/if}
                <div class="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" onclick={() => openEditForm(member)}>
                    Edit
                  </Button>
                  <form
                    method="POST"
                    action="?/delete"
                    use:enhance={() => {
                      return async ({ update }) => {
                        await update()
                        await invalidateAll()
                      }
                    }}
                  >
                    <input type="hidden" name="id" value={member.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      class="text-destructive hover:text-destructive"
                      onclick={(e) => {
                        if (!confirm('Delete this team member?')) {
                          e.preventDefault()
                        }
                      }}
                    >
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </Card.Content>
            </Card.Root>
          {/each}
        </div>
      </div>
    {/each}
  {/if}
</div>
