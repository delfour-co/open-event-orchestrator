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
let isUploadingLogo = $state(false)
let isUploadingBanner = $state(false)
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
