<script lang="ts">
import { enhance } from '$app/forms'
import { page } from '$app/stores'
import { Alert, ImageCropUpload, PasswordStrengthIndicator } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import {
  formatSessionDate,
  getSessionDisplayName,
  getSessionLocation
} from '$lib/features/auth/domain/user-session'
import * as m from '$lib/paraglide/messages'
import { getLocale } from '$lib/paraglide/runtime'
import {
  ArrowLeft,
  Bell,
  Camera,
  Check,
  Eye,
  EyeOff,
  Key,
  Laptop,
  Monitor,
  Shield,
  Smartphone,
  Tablet,
  Trash2,
  User
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

// Tab definitions
const tabs = [
  { id: 'profile', label: () => m.profile_tab_profile(), icon: User },
  { id: 'security', label: () => m.profile_tab_security(), icon: Shield },
  { id: 'notifications', label: () => m.profile_tab_notifications(), icon: Bell },
  { id: 'account', label: () => m.profile_tab_account(), icon: Trash2 }
]

const activeTab = $derived($page.url.searchParams.get('tab') || 'profile')

// Helper to safely access form errors
function getFormError(field: string): string | undefined {
  if (!form?.errors) return undefined
  return (form.errors as Record<string, string>)[field]
}

let showOldPassword = $state(false)
let showNewPassword = $state(false)
let showConfirmPassword = $state(false)
let showDeletePassword = $state(false)
let newPassword = $state('')
let isRevokingSession = $state<string | null>(null)
let isRevokingAll = $state(false)
let isDeletingAccount = $state(false)
let qrCanvas: HTMLCanvasElement

// Generate QR code client-side when TOTP URI is available
$effect(() => {
  if (form?.totpUri && qrCanvas) {
    import('qrcode').then((QRCode) => {
      QRCode.toCanvas(qrCanvas, form.totpUri, { width: 192, margin: 2 })
    })
  }
})

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

    <!-- Tab Navigation -->
    <div class="mb-6 flex border-b">
      {#each tabs as tab}
        <a
          href="?tab={tab.id}"
          class="border-b-2 px-4 py-2 text-sm font-medium {activeTab === tab.id
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'}"
        >
          <svelte:component this={tab.icon} class="mr-2 inline h-4 w-4" />
          {tab.label()}
        </a>
      {/each}
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

      {#if form?.success && form?.action === 'revokeSession'}
        <Alert variant="success">{m.profile_sessions_revoked()}</Alert>
      {/if}

      {#if form?.success && form?.action === 'revokeAllSessions'}
        <Alert variant="success">{m.profile_sessions_all_revoked()}</Alert>
      {/if}

      {#if form?.success && form?.action === 'updateNotifications'}
        <Alert variant="success">{m.profile_notifications_success()}</Alert>
      {/if}

      {#if form?.error && !form?.errors}
        <Alert variant="error">{form.error}</Alert>
      {/if}

      <!-- ==================== PROFILE TAB ==================== -->
      {#if activeTab === 'profile'}
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
                <ImageCropUpload
                  action="?/uploadAvatar"
                  aspectRatio={1}
                  label={m.profile_upload_avatar()}
                  removeLabel={m.profile_remove_avatar()}
                  name="avatar"
                  currentImageUrl={null}
                  removeAction={data.user.avatarUrl ? '?/removeAvatar' : null}
                />

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
      {/if}

      <!-- ==================== SECURITY TAB ==================== -->
      {#if activeTab === 'security'}
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

        <!-- Two-Factor Authentication (Coming Soon) -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Shield class="h-5 w-5" />
              {m.profile_security_2fa_title()}
            </Card.Title>
            <Card.Description>
              {m.profile_security_2fa_description()}
            </Card.Description>
          </Card.Header>
          <Card.Content>
            {#if data.twoFactorEnabled}
              <div class="space-y-4">
                <div class="flex items-center gap-2 text-green-600">
                  <Shield class="h-5 w-5" />
                  <span class="font-medium">{m.profile_2fa_enabled()}</span>
                </div>
                <p class="text-sm text-muted-foreground">
                  {m.profile_2fa_backup_remaining({ count: String(data.backupCodesRemaining) })}
                </p>
                <form method="POST" action="?/disable2fa" use:enhance class="space-y-3">
                  <div class="space-y-2">
                    <Label for="disable2fa-password">{m.profile_2fa_disable_confirm()}</Label>
                    <Input id="disable2fa-password" name="password" type="password" required />
                  </div>
                  {#if form?.error && form?.action === 'disable2fa'}
                    <p class="text-sm text-destructive">{form.error}</p>
                  {/if}
                  <Button type="submit" variant="destructive" size="sm">{m.profile_2fa_disable_button()}</Button>
                </form>
              </div>
            {:else}
              {#if form?.action === 'setup2fa' && form?.totpUri}
                <div class="space-y-4">
                  <p class="text-sm">{m.profile_2fa_setup_description()}</p>
                  <div class="flex justify-center rounded-lg border bg-background p-4">
                    <canvas bind:this={qrCanvas} class="h-48 w-48"></canvas>
                  </div>
                  <div class="space-y-2">
                    <Label>{m.profile_2fa_manual_entry()}</Label>
                    <code class="block rounded bg-muted p-2 text-center font-mono text-sm tracking-wider">{form.totpSecret}</code>
                  </div>
                  {#if form.backupCodes}
                    <div class="space-y-2">
                      <Label>{m.profile_2fa_backup_codes_title()}</Label>
                      <p class="text-xs text-muted-foreground">{m.profile_2fa_backup_codes_description()}</p>
                      <div class="grid grid-cols-2 gap-1 rounded border bg-muted p-3 font-mono text-sm">
                        {#each form.backupCodes as code}
                          <span>{code}</span>
                        {/each}
                      </div>
                    </div>
                  {/if}
                  <form method="POST" action="?/enable2fa" use:enhance class="space-y-3">
                    <div class="space-y-2">
                      <Label for="totp-code">{m.profile_2fa_verify_code()}</Label>
                      <Input id="totp-code" name="code" type="text" inputmode="numeric" maxlength={6} placeholder="000000" autocomplete="one-time-code" required class="text-center text-lg tracking-widest" />
                    </div>
                    {#if form?.error && form?.action === 'enable2fa'}
                      <p class="text-sm text-destructive">{form.error}</p>
                    {/if}
                    <Button type="submit">{m.profile_2fa_enable_button()}</Button>
                  </form>
                </div>
              {:else}
                <form method="POST" action="?/setup2fa" use:enhance>
                  <Button variant="outline">
                    <Shield class="mr-2 h-4 w-4" />
                    {m.profile_2fa_setup_button()}
                  </Button>
                </form>
              {/if}
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
              <p class="py-4 text-center text-sm text-muted-foreground">
                {m.profile_sessions_none()}
              </p>
            {/if}
          </Card.Content>
        </Card.Root>
      {/if}

      <!-- ==================== NOTIFICATIONS TAB ==================== -->
      {#if activeTab === 'notifications'}
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Bell class="h-5 w-5" />
              {m.profile_notifications_title()}
            </Card.Title>
            <Card.Description>
              {m.profile_notifications_description()}
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <form method="POST" action="?/updateNotifications" use:enhance class="space-y-6">
              <!-- Event Updates -->
              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <Label for="eventUpdates" class="text-sm font-medium">
                    {m.profile_notifications_event_updates()}
                  </Label>
                  <p class="text-sm text-muted-foreground">
                    {m.profile_notifications_event_updates_description()}
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="eventUpdates"
                  name="eventUpdates"
                  checked={data.notificationPreferences.eventUpdates}
                  class="h-4 w-4 rounded border-gray-300"
                />
              </div>

              <!-- Team Activity -->
              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <Label for="teamActivity" class="text-sm font-medium">
                    {m.profile_notifications_team_activity()}
                  </Label>
                  <p class="text-sm text-muted-foreground">
                    {m.profile_notifications_team_activity_description()}
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="teamActivity"
                  name="teamActivity"
                  checked={data.notificationPreferences.teamActivity}
                  class="h-4 w-4 rounded border-gray-300"
                />
              </div>

              <!-- Marketing / Product Updates -->
              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <Label for="marketing" class="text-sm font-medium">
                    {m.profile_notifications_marketing()}
                  </Label>
                  <p class="text-sm text-muted-foreground">
                    {m.profile_notifications_marketing_description()}
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="marketing"
                  name="marketing"
                  checked={data.notificationPreferences.marketing}
                  class="h-4 w-4 rounded border-gray-300"
                />
              </div>

              <div class="flex justify-end pt-2">
                <Button type="submit">
                  <Check class="mr-2 h-4 w-4" />
                  {m.profile_notifications_save()}
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card.Root>
      {/if}

      <!-- ==================== ACCOUNT TAB ==================== -->
      {#if activeTab === 'account'}
        <Card.Root class="border-destructive/50">
          <Card.Header>
            <Card.Title class="flex items-center gap-2 text-destructive">
              <Trash2 class="h-5 w-5" />
              {m.profile_account_title()}
            </Card.Title>
            <Card.Description>
              {m.profile_account_description()}
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div class="space-y-4">
              <div class="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <p class="text-sm text-destructive">
                  {m.profile_account_delete_warning()}
                </p>
              </div>

              <form
                method="POST"
                action="?/requestAccountDeletion"
                use:enhance={() => {
                  if (!confirm(m.profile_account_delete_warning())) {
                    return () => {}
                  }
                  isDeletingAccount = true
                  return async ({ update }) => {
                    isDeletingAccount = false
                    await update()
                  }
                }}
                class="space-y-4"
              >
                <div class="space-y-2">
                  <Label for="deletePassword">{m.profile_account_confirm_password()}</Label>
                  <div class="relative">
                    <Input
                      id="deletePassword"
                      name="password"
                      type={showDeletePassword ? 'text' : 'password'}
                      required
                      autocomplete="current-password"
                      class="pr-10"
                    />
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onclick={() => (showDeletePassword = !showDeletePassword)}
                    >
                      {#if showDeletePassword}
                        <EyeOff class="h-4 w-4" />
                      {:else}
                        <Eye class="h-4 w-4" />
                      {/if}
                    </button>
                  </div>
                  {#if form?.error && form?.action === 'requestAccountDeletion'}
                    <p class="text-sm text-destructive">{form.error}</p>
                  {/if}
                </div>

                <div class="flex justify-end">
                  <Button type="submit" variant="destructive" disabled={isDeletingAccount}>
                    <Trash2 class="mr-2 h-4 w-4" />
                    {m.profile_account_delete_button()}
                  </Button>
                </div>
              </form>
            </div>
          </Card.Content>
        </Card.Root>
      {/if}
    </div>
  </div>
</div>
