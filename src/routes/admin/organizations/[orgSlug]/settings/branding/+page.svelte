<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as m from '$lib/paraglide/messages'
import { Loader2, Palette, Trash2, Upload } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isSubmitting = $state(false)
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
      action="?/updateBranding"
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
