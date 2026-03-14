<script lang="ts">
import { enhance } from '$app/forms'
import { Alert, PasswordStrengthIndicator } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import {
  formatSessionDate,
  getSessionDisplayName,
  getSessionLocation
} from '$lib/features/auth/domain/user-session'
import { getProviderLabel } from '$lib/features/auth/services/social-auth-service'
import * as m from '$lib/paraglide/messages'
import { getLocale } from '$lib/paraglide/runtime'
import {
  ArrowLeft,
  Camera,
  Check,
  Eye,
  EyeOff,
  Key,
  Laptop,
  Link,
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
  Unlink,
  Upload,
  User
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

// Helper to safely access form errors
function getFormError(field: string): string | undefined {
  if (!form?.errors) return undefined
  return (form.errors as Record<string, string>)[field]
}

let showOldPassword = $state(false)
let showNewPassword = $state(false)
let showConfirmPassword = $state(false)
let newPassword = $state('')
let avatarInput: HTMLInputElement
let isUploadingAvatar = $state(false)
let isRevokingSession = $state<string | null>(null)
let isRevokingAll = $state(false)

// Format creation date based on current language
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const locale = getLocale() === 'fr' ? 'fr-FR' : 'en-US'
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Get initials for avatar fallback
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Get device icon based on device type
function getDeviceIcon(device: string | undefined) {
  switch (device) {
    case 'Mobile':
      return Smartphone
    case 'Tablet':
      return Tablet
    default:
      return Monitor
  }
}

// Current session and other sessions
const currentSession = $derived(data.sessions.find((s) => s.id === data.currentSessionId))
const otherSessions = $derived(data.sessions.filter((s) => s.id !== data.currentSessionId))
</script>

<svelte:head>
  <title>{m.profile_page_title()}</title>
</svelte:head>

<div class="min-h-screen bg-muted/30 py-8">
  <div class="container mx-auto max-w-2xl px-4">
    <!-- Header -->
    <div class="mb-6">
      <a
        href="/admin"
        class="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft class="h-4 w-4" />
        {m.profile_back_to_dashboard()}
      </a>
      <h1 class="text-3xl font-bold tracking-tight">{m.profile_title()}</h1>
      <p class="text-muted-foreground">{m.profile_description()}</p>
    </div>

    <div class="space-y-6">
      <!-- Success/Error Messages -->
      {#if form?.success && form?.action === 'updateProfile'}
        <Alert variant="success">{m.profile_success_updated()}</Alert>
      {/if}

      {#if form?.success && form?.action === 'uploadAvatar'}
        <Alert variant="success">{m.profile_success_avatar_updated()}</Alert>
      {/if}

      {#if form?.success && form?.action === 'removeAvatar'}
        <Alert variant="success">{m.profile_success_avatar_removed()}</Alert>
      {/if}

      {#if form?.success && form?.action === 'changePassword'}
        <Alert variant="success">{m.profile_success_password_changed()}</Alert>
      {/if}

      {#if form?.success && form?.action === 'unlinkAccount'}
        <Alert variant="success">{m.profile_linked_accounts_unlinked()}</Alert>
      {/if}

      {#if form?.success && form?.action === 'revokeSession'}
        <Alert variant="success">{m.profile_sessions_revoked()}</Alert>
      {/if}

      {#if form?.success && form?.action === 'revokeAllSessions'}
        <Alert variant="success">{m.profile_sessions_all_revoked()}</Alert>
      {/if}

      {#if form?.error && !form?.errors}
        <Alert variant="error">{form.error}</Alert>
      {/if}

      <!-- Avatar Section -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Camera class="h-5 w-5" />
            {m.profile_avatar()}
          </Card.Title>
          <Card.Description>
            {m.profile_avatar_description()}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="flex items-center gap-6">
            <!-- Avatar Display -->
            <div class="relative">
              {#if data.user.avatarUrl}
                <img
                  src={data.user.avatarUrl}
                  alt={data.user.name}
                  class="h-24 w-24 rounded-full object-cover ring-2 ring-muted"
                />
              {:else}
                <div
                  class="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground ring-2 ring-muted"
                >
                  {getInitials(data.user.name)}
                </div>
              {/if}
            </div>

            <!-- Upload/Remove Actions -->
            <div class="space-y-3">
              <form
                method="POST"
                action="?/uploadAvatar"
                enctype="multipart/form-data"
                use:enhance={() => {
                  isUploadingAvatar = true
                  return async ({ update }) => {
                    isUploadingAvatar = false
                    await update()
                  }
                }}
              >
                <input
                  bind:this={avatarInput}
                  type="file"
                  name="avatar"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  class="hidden"
                  onchange={(e) => {
                    const form = (e.target as HTMLInputElement).form
                    if (form) form.requestSubmit()
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingAvatar}
                  onclick={() => avatarInput.click()}
                >
                  <Upload class="mr-2 h-4 w-4" />
                  {isUploadingAvatar ? m.profile_uploading() : m.profile_upload_avatar()}
                </Button>
              </form>

              {#if data.user.avatarUrl}
                <form method="POST" action="?/removeAvatar" use:enhance>
                  <Button type="submit" variant="ghost" size="sm" class="text-destructive">
                    <Trash2 class="mr-2 h-4 w-4" />
                    {m.profile_remove_avatar()}
                  </Button>
                </form>
              {/if}

              <p class="text-xs text-muted-foreground">
                {m.profile_avatar_formats()}
              </p>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Profile Information -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <User class="h-5 w-5" />
            {m.profile_info()}
          </Card.Title>
          <Card.Description>
            {m.profile_info_description()}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <form method="POST" action="?/updateProfile" use:enhance class="space-y-4">
            <!-- Email (read-only) -->
            <div class="space-y-2">
              <Label for="email">{m.auth_email()}</Label>
              <Input
                id="email"
                type="email"
                value={data.user.email}
                disabled
                class="bg-muted"
              />
              <p class="text-xs text-muted-foreground">
                {m.profile_email_cannot_change()}
              </p>
            </div>

            <!-- Name -->
            <div class="space-y-2">
              <Label for="name">{m.profile_name()}</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={data.user.name}
                placeholder={m.profile_name_placeholder()}
                required
              />
              {#if getFormError('name') && form?.action === 'updateProfile'}
                <p class="text-sm text-destructive">{getFormError('name')}</p>
              {/if}
            </div>

            <!-- Role (read-only) -->
            <div class="space-y-2">
              <Label for="role">{m.profile_role()}</Label>
              <Input
                id="role"
                type="text"
                value={data.user.role.replace('_', ' ')}
                disabled
                class="bg-muted capitalize"
              />
            </div>

            <!-- Member Since (read-only) -->
            <div class="space-y-2">
              <Label for="created">{m.profile_member_since()}</Label>
              <Input
                id="created"
                type="text"
                value={formatDate(data.user.created)}
                disabled
                class="bg-muted"
              />
            </div>

            <div class="flex justify-end pt-2">
              <Button type="submit">
                <Check class="mr-2 h-4 w-4" />
                {m.profile_save_changes()}
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card.Root>

      <!-- Change Password -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Key class="h-5 w-5" />
            {m.profile_change_password()}
          </Card.Title>
          <Card.Description>
            {m.profile_change_password_description()}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <form method="POST" action="?/changePassword" use:enhance class="space-y-4">
            <!-- Current Password -->
            <div class="space-y-2">
              <Label for="oldPassword">{m.profile_current_password()}</Label>
              <div class="relative">
                <Input
                  id="oldPassword"
                  name="oldPassword"
                  type={showOldPassword ? 'text' : 'password'}
                  placeholder={m.profile_current_password_placeholder()}
                  required
                  autocomplete="current-password"
                  class="pr-10"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onclick={() => (showOldPassword = !showOldPassword)}
                >
                  {#if showOldPassword}
                    <EyeOff class="h-4 w-4" />
                  {:else}
                    <Eye class="h-4 w-4" />
                  {/if}
                </button>
              </div>
              {#if getFormError('oldPassword') && form?.action === 'changePassword'}
                <p class="text-sm text-destructive">{getFormError('oldPassword')}</p>
              {/if}
            </div>

            <!-- New Password -->
            <div class="space-y-2">
              <Label for="password">{m.profile_new_password()}</Label>
              <div class="relative">
                <Input
                  id="password"
                  name="password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder={m.profile_new_password_placeholder()}
                  required
                  autocomplete="new-password"
                  class="pr-10"
                  bind:value={newPassword}
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onclick={() => (showNewPassword = !showNewPassword)}
                >
                  {#if showNewPassword}
                    <EyeOff class="h-4 w-4" />
                  {:else}
                    <Eye class="h-4 w-4" />
                  {/if}
                </button>
              </div>
              {#if getFormError('password') && form?.action === 'changePassword'}
                <p class="text-sm text-destructive">{getFormError('password')}</p>
              {/if}
              <PasswordStrengthIndicator password={newPassword} />
            </div>

            <!-- Confirm New Password -->
            <div class="space-y-2">
              <Label for="passwordConfirm">{m.profile_confirm_new_password()}</Label>
              <div class="relative">
                <Input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={m.profile_confirm_password_placeholder()}
                  required
                  autocomplete="new-password"
                  class="pr-10"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onclick={() => (showConfirmPassword = !showConfirmPassword)}
                >
                  {#if showConfirmPassword}
                    <EyeOff class="h-4 w-4" />
                  {:else}
                    <Eye class="h-4 w-4" />
                  {/if}
                </button>
              </div>
              {#if getFormError('passwordConfirm') && form?.action === 'changePassword'}
                <p class="text-sm text-destructive">{getFormError('passwordConfirm')}</p>
              {/if}
            </div>

            <div class="flex justify-end pt-2">
              <Button type="submit">
                <Key class="mr-2 h-4 w-4" />
                {m.profile_change_password()}
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card.Root>

      <!-- Linked Accounts -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Link class="h-5 w-5" />
            {m.profile_linked_accounts_title()}
          </Card.Title>
          <Card.Description>
            {m.profile_linked_accounts_description()}
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-3">
          {#if data.linkedAccounts.length > 0}
            {#each data.linkedAccounts as account}
              <div class="flex items-center justify-between rounded-lg border p-4">
                <div class="flex items-center gap-3">
                  {#if account.provider === 'google'}
                    <svg class="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  {:else if account.provider === 'github'}
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  {/if}
                  <div>
                    <p class="font-medium">{getProviderLabel(account.provider)}</p>
                    <p class="text-sm text-muted-foreground">{account.providerId}</p>
                  </div>
                </div>
                <form
                  method="POST"
                  action="?/unlinkAccount"
                  use:enhance={() => {
                    if (!confirm(m.profile_linked_accounts_unlink_confirm())) {
                      return () => {}
                    }
                    return async ({ update }) => {
                      await update()
                    }
                  }}
                >
                  <input type="hidden" name="provider" value={account.provider} />
                  <Button type="submit" variant="ghost" size="sm" class="text-destructive hover:text-destructive">
                    <Unlink class="mr-1 h-4 w-4" />
                    {m.profile_linked_accounts_unlink()}
                  </Button>
                </form>
              </div>
            {/each}
          {:else}
            <p class="py-4 text-center text-sm text-muted-foreground">
              {m.profile_linked_accounts_none()}
            </p>
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Active Sessions -->
      <Card.Root>
        <Card.Header>
          <div class="flex items-center justify-between">
            <div>
              <Card.Title class="flex items-center gap-2">
                <Laptop class="h-5 w-5" />
                {m.profile_sessions_title()}
              </Card.Title>
              <Card.Description>
                {m.profile_sessions_description()}
              </Card.Description>
            </div>
            {#if otherSessions.length > 0}
              <form
                method="POST"
                action="?/revokeAllSessions"
                use:enhance={() => {
                  if (!confirm(m.profile_sessions_revoke_all_confirm())) {
                    return () => {}
                  }
                  isRevokingAll = true
                  return async ({ update }) => {
                    isRevokingAll = false
                    await update()
                  }
                }}
              >
                <Button type="submit" variant="outline" size="sm" disabled={isRevokingAll}>
                  {m.profile_sessions_revoke_all()}
                </Button>
              </form>
            {/if}
          </div>
        </Card.Header>
        <Card.Content class="space-y-4">
          <!-- Current Session -->
          {#if currentSession}
            {@const DeviceIcon = getDeviceIcon(currentSession.device)}
            <div class="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div class="flex items-start gap-4">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <DeviceIcon class="h-5 w-5 text-primary" />
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{getSessionDisplayName(currentSession)}</span>
                    <span class="rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      {m.profile_sessions_current()}
                    </span>
                  </div>
                  <div class="mt-1 text-sm text-muted-foreground">
                    {#if getSessionLocation(currentSession)}
                      <span>{m.profile_sessions_location({ location: getSessionLocation(currentSession) ?? '' })}</span>
                      <span class="mx-2">•</span>
                    {/if}
                    <span>{m.profile_sessions_last_active({ date: formatSessionDate(currentSession.lastActive) })}</span>
                  </div>
                </div>
              </div>
            </div>
          {/if}

          <!-- Other Sessions -->
          {#if otherSessions.length > 0}
            <div class="space-y-3">
              <h4 class="text-sm font-medium text-muted-foreground">{m.profile_sessions_other()}</h4>
              {#each otherSessions as session (session.id)}
                {@const DeviceIcon = getDeviceIcon(session.device)}
                <div class="flex items-start gap-4 rounded-lg border p-4">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <DeviceIcon class="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div class="flex-1">
                    <div class="font-medium">
                      {getSessionDisplayName(session)}
                    </div>
                    <div class="mt-1 text-sm text-muted-foreground">
                      {#if getSessionLocation(session)}
                        <span>{m.profile_sessions_location({ location: getSessionLocation(session) ?? '' })}</span>
                        <span class="mx-2">•</span>
                      {/if}
                      <span>{m.profile_sessions_last_active({ date: formatSessionDate(session.lastActive) })}</span>
                    </div>
                  </div>
                  <form
                    method="POST"
                    action="?/revokeSession"
                    use:enhance={() => {
                      if (!confirm(m.profile_sessions_revoke_confirm())) {
                        return () => {}
                      }
                      isRevokingSession = session.id
                      return async ({ update }) => {
                        isRevokingSession = null
                        await update()
                      }
                    }}
                  >
                    <input type="hidden" name="sessionId" value={session.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      class="text-destructive hover:text-destructive"
                      disabled={isRevokingSession === session.id}
                    >
                      <Trash2 class="mr-1 h-4 w-4" />
                      {m.profile_sessions_revoke()}
                    </Button>
                  </form>
                </div>
              {/each}
            </div>
          {:else if !currentSession}
            <p class="text-center text-sm text-muted-foreground py-4">
              {m.profile_sessions_none()}
            </p>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>
  </div>
</div>
