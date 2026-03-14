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
import * as m from '$lib/paraglide/messages'
import { getLocale } from '$lib/paraglide/runtime'
import {
  ArrowLeft,
  Camera,
  Check,
  Copy,
  Eye,
  EyeOff,
  Key,
  Laptop,
  Monitor,
  Shield,
  ShieldCheck,
  Smartphone,
  Tablet,
  Trash2,
  Upload,
  User
} from 'lucide-svelte'
import QRCode from 'qrcode'
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

// 2FA state
let twoFactorStep = $state<'idle' | 'setup' | 'verify'>('idle')
let totpUri = $state('')
let totpSecret = $state('')
let backupCodes = $state<string[]>([])
let qrCodeDataUrl = $state('')
let showDisableForm = $state(false)
let copiedSecret = $state(false)
let copiedBackupCodes = $state(false)

async function generateQrCode(uri: string): Promise<void> {
  try {
    qrCodeDataUrl = await QRCode.toDataURL(uri, { width: 256, margin: 2 })
  } catch {
    qrCodeDataUrl = ''
  }
}

function copyToClipboard(text: string, type: 'secret' | 'backup'): void {
  navigator.clipboard.writeText(text)
  if (type === 'secret') {
    copiedSecret = true
    setTimeout(() => {
      copiedSecret = false
    }, 2000)
  } else {
    copiedBackupCodes = true
    setTimeout(() => {
      copiedBackupCodes = false
    }, 2000)
  }
}

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

      {#if form?.success && form?.action === 'revokeSession'}
        <Alert variant="success">{m.profile_sessions_revoked()}</Alert>
      {/if}

      {#if form?.success && form?.action === 'revokeAllSessions'}
        <Alert variant="success">{m.profile_sessions_all_revoked()}</Alert>
      {/if}

      {#if form?.success && form?.action === 'enable2fa'}
        <Alert variant="success">{m.profile_2fa_enabled()}</Alert>
      {/if}

      {#if form?.success && form?.action === 'disable2fa'}
        <Alert variant="success">2FA has been disabled.</Alert>
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

      <!-- Two-Factor Authentication -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <ShieldCheck class="h-5 w-5" />
            {m.auth_2fa_verify_heading()}
          </Card.Title>
          <Card.Description>
            {m.profile_2fa_setup_description()}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {#if data.twoFactorEnabled && twoFactorStep === 'idle'}
            <!-- 2FA is enabled -->
            <div class="space-y-4">
              <div class="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                <Shield class="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p class="font-medium text-green-800 dark:text-green-200">{m.profile_2fa_enabled()}</p>
                  <p class="text-sm text-green-600 dark:text-green-400">
                    {m.profile_2fa_backup_remaining({ count: data.backupCodesRemaining.toString() })}
                  </p>
                </div>
              </div>

              {#if !showDisableForm}
                <Button
                  variant="destructive"
                  onclick={() => (showDisableForm = true)}
                >
                  {m.profile_2fa_disable_button()}
                </Button>
              {:else}
                <form
                  method="POST"
                  action="?/disable2fa"
                  use:enhance={() => {
                    return async ({ update }) => {
                      showDisableForm = false
                      await update()
                    }
                  }}
                  class="space-y-3"
                >
                  <p class="text-sm text-muted-foreground">{m.profile_2fa_disable_confirm()}</p>
                  <Input
                    name="password"
                    type="password"
                    placeholder="Password"
                    required
                    autocomplete="current-password"
                  />
                  {#if form?.error && form?.action === 'disable2fa'}
                    <p class="text-sm text-destructive">{form.error}</p>
                  {/if}
                  <div class="flex gap-2">
                    <Button type="submit" variant="destructive">{m.profile_2fa_disable_button()}</Button>
                    <Button type="button" variant="outline" onclick={() => (showDisableForm = false)}>
                      {m.action_cancel()}
                    </Button>
                  </div>
                </form>
              {/if}
            </div>
          {:else if twoFactorStep === 'idle'}
            <!-- 2FA not enabled - show setup button -->
            <form
              method="POST"
              action="?/setup2fa"
              use:enhance={() => {
                return async ({ result, update }) => {
                  if (result.type === 'success' && result.data) {
                    const resultData = result.data as { totpUri: string; totpSecret: string; backupCodes: string[] }
                    totpUri = resultData.totpUri
                    totpSecret = resultData.totpSecret
                    backupCodes = resultData.backupCodes
                    await generateQrCode(totpUri)
                    twoFactorStep = 'setup'
                  } else {
                    await update()
                  }
                }
              }}
            >
              <Button type="submit">
                <ShieldCheck class="mr-2 h-4 w-4" />
                {m.profile_2fa_setup_button()}
              </Button>
            </form>
          {:else if twoFactorStep === 'setup'}
            <!-- Setup flow: show QR code and backup codes -->
            <div class="space-y-6">
              <!-- QR Code -->
              <div class="space-y-3">
                <h4 class="font-medium">{m.profile_2fa_setup_title()}</h4>
                {#if qrCodeDataUrl}
                  <div class="flex justify-center">
                    <img src={qrCodeDataUrl} alt="TOTP QR Code" class="rounded-lg border" />
                  </div>
                {/if}

                <!-- Manual entry -->
                <div class="space-y-1">
                  <p class="text-sm text-muted-foreground">{m.profile_2fa_manual_entry()}</p>
                  <div class="flex items-center gap-2">
                    <code class="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono break-all">
                      {totpSecret}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onclick={() => copyToClipboard(totpSecret, 'secret')}
                    >
                      {#if copiedSecret}
                        <Check class="h-4 w-4" />
                      {:else}
                        <Copy class="h-4 w-4" />
                      {/if}
                    </Button>
                  </div>
                </div>
              </div>

              <!-- Backup Codes -->
              <div class="space-y-3">
                <h4 class="font-medium">{m.profile_2fa_backup_codes_title()}</h4>
                <p class="text-sm text-muted-foreground">{m.profile_2fa_backup_codes_description()}</p>
                <div class="grid grid-cols-2 gap-2 rounded-lg border bg-muted/50 p-4">
                  {#each backupCodes as code}
                    <code class="text-sm font-mono">{code}</code>
                  {/each}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => copyToClipboard(backupCodes.join('\n'), 'backup')}
                >
                  <Copy class="mr-2 h-4 w-4" />
                  {#if copiedBackupCodes}
                    Copied!
                  {:else}
                    Copy codes
                  {/if}
                </Button>
              </div>

              <!-- Verify code to enable -->
              <div class="space-y-3 border-t pt-4">
                <p class="text-sm font-medium">{m.profile_2fa_verify_code()}</p>
                <form
                  method="POST"
                  action="?/enable2fa"
                  use:enhance={() => {
                    return async ({ result, update }) => {
                      if (result.type === 'success') {
                        twoFactorStep = 'idle'
                        totpUri = ''
                        totpSecret = ''
                        backupCodes = []
                        qrCodeDataUrl = ''
                      }
                      await update()
                    }
                  }}
                  class="flex gap-2"
                >
                  <Input
                    name="code"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength={6}
                    placeholder="000000"
                    autocomplete="one-time-code"
                    required
                    class="max-w-[200px] text-center text-lg tracking-widest"
                  />
                  <Button type="submit">
                    <Key class="mr-2 h-4 w-4" />
                    {m.profile_2fa_enable_button()}
                  </Button>
                </form>
                {#if form?.error && form?.action === 'enable2fa'}
                  <p class="text-sm text-destructive">{form.error}</p>
                {/if}
              </div>

              <!-- Cancel -->
              <Button
                variant="outline"
                onclick={() => {
                  twoFactorStep = 'idle'
                  totpUri = ''
                  totpSecret = ''
                  backupCodes = []
                  qrCodeDataUrl = ''
                }}
              >
                {m.action_cancel()}
              </Button>
            </div>
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
