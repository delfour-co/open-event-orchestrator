<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { ImageCropUpload } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as m from '$lib/paraglide/messages'
import { Loader2, Palette } from 'lucide-svelte'
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
      {m.admin_event_branding_title()}
    </Card.Title>
    <Card.Description>{m.admin_event_branding_description()}</Card.Description>
  </Card.Header>
  <Card.Content class="space-y-6">
    <!-- Logo Upload -->
    <div class="space-y-2">
      <Label>{m.admin_event_branding_logo()}</Label>
      <ImageCropUpload
        action="?/uploadLogo"
        aspectRatio={1}
        label={m.admin_event_branding_upload_logo()}
        removeLabel={m.admin_event_branding_remove_logo()}
        name="logo"
        currentImageUrl={data.event.logoUrl}
        removeAction={data.event.logo ? '?/removeLogo' : null}
      />
    </div>

    <!-- Banner Upload -->
    <div class="space-y-2">
      <Label>{m.admin_event_branding_banner()}</Label>
      <p class="text-xs text-muted-foreground">{m.admin_event_branding_banner_description()}</p>
      <ImageCropUpload
        action="?/uploadBanner"
        aspectRatio={16 / 9}
        label={m.admin_event_branding_upload_banner()}
        removeLabel={m.admin_event_branding_remove_banner()}
        name="banner"
        currentImageUrl={data.event.bannerUrl}
        removeAction={data.event.banner ? '?/removeBanner' : null}
        maxSizeMB={5}
      />
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
