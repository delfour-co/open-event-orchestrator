<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import * as m from '$lib/paraglide/messages'
import { Clock, Mail, Plus, RefreshCw, Trash2, Upload, UserPlus, Users, X } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showAddMember = $state(false)
let showBulkImport = $state(false)

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

<Card.Root>
  <Card.Header>
    <div class="flex items-center justify-between">
      <div>
        <Card.Title class="flex items-center gap-2">
          <Users class="h-5 w-5" />
          {m.team_title()}
        </Card.Title>
        <Card.Description>{m.team_description()}</Card.Description>
      </div>
      <div class="flex gap-2">
        <Button size="sm" variant="outline" onclick={() => (showAddMember = !showAddMember)}>
          <UserPlus class="mr-2 h-4 w-4" />
          {m.team_add_member()}
        </Button>
        <Button size="sm" variant="outline" onclick={() => (showBulkImport = !showBulkImport)}>
          <Upload class="mr-2 h-4 w-4" />
          {m.team_bulk_import()}
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
          <Label for="csv-input">{m.team_csv_label()}</Label>
          <Textarea
            id="csv-input"
            name="csv"
            rows={5}
            placeholder={"john@example.com,organizer\njane@example.com,reviewer"}
          />
          <p class="text-xs text-muted-foreground">
            {m.team_csv_hint()}
          </p>
        </div>
        <div class="mt-4 flex gap-2">
          <Button type="submit" size="sm">
            <Upload class="mr-2 h-4 w-4" />
            {m.action_import()}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onclick={() => (showBulkImport = false)}
          >
            {m.action_cancel()}
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
            <Label for="member-email">{m.team_email_label()}</Label>
            <Input
              id="member-email"
              name="email"
              type="email"
              placeholder="user@example.com"
              required
            />
            <p class="text-xs text-muted-foreground">{m.team_email_hint()}</p>
          </div>
          <div class="space-y-2">
            <Label for="member-role">{m.team_role_label()}</Label>
            <select
              id="member-role"
              name="role"
              required
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="reviewer">{m.team_role_reviewer()}</option>
              <option value="organizer">{m.team_role_organizer()}</option>
              <option value="admin">{m.team_role_admin()}</option>
            </select>
          </div>
        </div>
        <div class="mt-4 flex gap-2">
          <Button type="submit" size="sm">
            <Plus class="mr-2 h-4 w-4" />
            {m.team_add_member()}
          </Button>
          <Button type="button" variant="ghost" size="sm" onclick={() => (showAddMember = false)}>
            {m.action_cancel()}
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
            <p class="text-sm text-muted-foreground">{m.team_owner()}</p>
          </div>
        </div>
        <span class="rounded-full px-2 py-0.5 text-xs font-medium {getRoleBadgeColor('owner')}">
          owner
        </span>
      </div>
    {/if}

    {#if data.members.length === 0 && data.invitations.length === 0}
      <p class="text-sm text-muted-foreground">
        {m.team_no_members()}
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
                    if (!confirm(m.team_remove_confirm({ name: member.name }))) {
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
          {m.team_pending_invitations()}
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
                    {m.team_invited_as({ role: invitation.role })}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  {m.team_pending()}
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
                    title={m.team_resend()}
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
                    title={m.team_cancel_invitation()}
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
