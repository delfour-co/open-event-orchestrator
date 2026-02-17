<script lang="ts">
import { enhance } from '$app/forms'
import { Alert, PasswordStrengthIndicator } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as m from '$lib/paraglide/messages'
import { getLocale } from '$lib/paraglide/runtime'
import { ArrowLeft, Camera, Check, Eye, EyeOff, Key, Trash2, Upload, User } from 'lucide-svelte'
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
    </div>
  </div>
</div>
