<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { AdminSubNav } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Checkbox } from '$lib/components/ui/checkbox'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { getBillingNavItems } from '$lib/config'
import { DEFAULT_TICKET_TEMPLATE } from '$lib/features/billing/domain'
import { TicketPreview } from '$lib/features/billing/ui'
import * as m from '$lib/paraglide/messages'
import { ArrowLeft, Palette, RotateCcw, Trash2, Upload } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let primaryColor = $state(data.template?.primaryColor || DEFAULT_TICKET_TEMPLATE.primaryColor)
let backgroundColor = $state(
  data.template?.backgroundColor || DEFAULT_TICKET_TEMPLATE.backgroundColor
)
let textColor = $state(data.template?.textColor || DEFAULT_TICKET_TEMPLATE.textColor)
let accentColor = $state(data.template?.accentColor || DEFAULT_TICKET_TEMPLATE.accentColor)
let showVenue = $state(data.template?.showVenue ?? DEFAULT_TICKET_TEMPLATE.showVenue)
let showDate = $state(data.template?.showDate ?? DEFAULT_TICKET_TEMPLATE.showDate)
let showQrCode = $state(data.template?.showQrCode ?? DEFAULT_TICKET_TEMPLATE.showQrCode)
let customFooterText = $state(data.template?.customFooterText || '')
let logoPreviewUrl = $state(data.template?.logoUrl || '')
let logoFile: File | null = $state(null)

const templatePreview = $derived({
  primaryColor,
  backgroundColor,
  textColor,
  accentColor,
  showVenue,
  showDate,
  showQrCode,
  customFooterText
})

function handleLogoChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    logoFile = input.files[0]
    logoPreviewUrl = URL.createObjectURL(logoFile)
  }
}

function resetToDefaults() {
  primaryColor = DEFAULT_TICKET_TEMPLATE.primaryColor
  backgroundColor = DEFAULT_TICKET_TEMPLATE.backgroundColor
  textColor = DEFAULT_TICKET_TEMPLATE.textColor
  accentColor = DEFAULT_TICKET_TEMPLATE.accentColor
  showVenue = DEFAULT_TICKET_TEMPLATE.showVenue
  showDate = DEFAULT_TICKET_TEMPLATE.showDate
  showQrCode = DEFAULT_TICKET_TEMPLATE.showQrCode
  customFooterText = ''
  logoPreviewUrl = ''
  logoFile = null
}
</script>

<svelte:head>
  <title>{m.billing_design_title()} - {data.edition.name}</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center gap-4">
    <a href="/admin/billing/{data.edition.slug}">
      <Button variant="ghost" size="icon">
        <ArrowLeft class="h-5 w-5" />
      </Button>
    </a>
    <div>
      <h2 class="text-3xl font-bold tracking-tight">{data.edition.name}</h2>
    </div>
  </div>

  <!-- Sub-navigation -->
  <AdminSubNav basePath="/admin/billing/{data.edition.slug}" items={getBillingNavItems(data.edition.slug)} />

  {#if form?.success}
    <div
      class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
    >
      {form.message || m.message_saved_successfully()}
    </div>
  {/if}

  {#if form?.error}
    <div
      class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
    >
      {form.error}
    </div>
  {/if}

  <div class="grid gap-6 lg:grid-cols-2">
    <!-- Settings Panel -->
    <div class="space-y-6">
      <form
        method="POST"
        action="?/save"
        enctype="multipart/form-data"
        use:enhance={() => {
          return async ({ update }) => {
            await update()
            await invalidateAll()
          }
        }}
      >
        <!-- Colors -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Palette class="h-5 w-5" />
              {m.billing_design_colors()}
            </Card.Title>
            <Card.Description>
              {m.billing_design_colors_desc()}
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="primaryColor">{m.billing_design_primary_color()}</Label>
                <div class="flex gap-2">
                  <input
                    type="color"
                    id="primaryColorPicker"
                    bind:value={primaryColor}
                    class="h-10 w-12 cursor-pointer rounded border"
                  />
                  <Input
                    id="primaryColor"
                    name="primaryColor"
                    bind:value={primaryColor}
                    placeholder="#000000"
                    class="font-mono"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <Label for="backgroundColor">{m.billing_design_background_color()}</Label>
                <div class="flex gap-2">
                  <input
                    type="color"
                    id="backgroundColorPicker"
                    bind:value={backgroundColor}
                    class="h-10 w-12 cursor-pointer rounded border"
                  />
                  <Input
                    id="backgroundColor"
                    name="backgroundColor"
                    bind:value={backgroundColor}
                    placeholder="#ffffff"
                    class="font-mono"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <Label for="textColor">{m.billing_design_text_color()}</Label>
                <div class="flex gap-2">
                  <input
                    type="color"
                    id="textColorPicker"
                    bind:value={textColor}
                    class="h-10 w-12 cursor-pointer rounded border"
                  />
                  <Input
                    id="textColor"
                    name="textColor"
                    bind:value={textColor}
                    placeholder="#000000"
                    class="font-mono"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <Label for="accentColor">{m.billing_design_accent_color()}</Label>
                <div class="flex gap-2">
                  <input
                    type="color"
                    id="accentColorPicker"
                    bind:value={accentColor}
                    class="h-10 w-12 cursor-pointer rounded border"
                  />
                  <Input
                    id="accentColor"
                    name="accentColor"
                    bind:value={accentColor}
                    placeholder="#3b82f6"
                    class="font-mono"
                  />
                </div>
              </div>
            </div>
          </Card.Content>
        </Card.Root>

        <!-- Logo Upload -->
        <Card.Root class="mt-6">
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Upload class="h-5 w-5" />
              {m.billing_design_logo()}
            </Card.Title>
            <Card.Description>
              {m.billing_design_logo_desc()}
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-4">
            {#if logoPreviewUrl}
              <div class="flex items-center gap-4">
                <img
                  src={logoPreviewUrl}
                  alt={m.billing_design_logo_preview()}
                  class="h-16 w-auto max-w-[200px] rounded border object-contain p-2"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onclick={() => {
                    logoPreviewUrl = ''
                    logoFile = null
                  }}
                >
                  <Trash2 class="mr-2 h-4 w-4" />
                  {m.billing_design_remove_logo()}
                </Button>
              </div>
            {/if}

            <div>
              <Label for="logoFile">{m.billing_design_upload_logo()}</Label>
              <Input
                id="logoFile"
                name="logoFile"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onchange={handleLogoChange}
                class="mt-2"
              />
              <p class="mt-1 text-xs text-muted-foreground">
                {m.billing_design_logo_formats()}
              </p>
            </div>

            <div>
              <Label for="logoUrl">{m.billing_design_logo_url()}</Label>
              <Input
                id="logoUrl"
                name="logoUrl"
                type="url"
                placeholder="https://example.com/logo.png"
                value={data.template?.logoUrl || ''}
              />
            </div>
          </Card.Content>
        </Card.Root>

        <!-- Display Options -->
        <Card.Root class="mt-6">
          <Card.Header>
            <Card.Title>{m.billing_design_display_options()}</Card.Title>
            <Card.Description>
              {m.billing_design_display_options_desc()}
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-4">
            <div class="flex items-center gap-3">
              <Checkbox
                id="showDate"
                checked={showDate}
                onCheckedChange={(checked) => (showDate = checked === true)}
              />
              <input type="hidden" name="showDate" value={showDate} />
              <Label for="showDate" class="cursor-pointer">{m.billing_design_show_date()}</Label>
            </div>

            <div class="flex items-center gap-3">
              <Checkbox
                id="showVenue"
                checked={showVenue}
                onCheckedChange={(checked) => (showVenue = checked === true)}
              />
              <input type="hidden" name="showVenue" value={showVenue} />
              <Label for="showVenue" class="cursor-pointer">{m.billing_design_show_venue()}</Label>
            </div>

            <div class="flex items-center gap-3">
              <Checkbox
                id="showQrCode"
                checked={showQrCode}
                onCheckedChange={(checked) => (showQrCode = checked === true)}
              />
              <input type="hidden" name="showQrCode" value={showQrCode} />
              <Label for="showQrCode" class="cursor-pointer">{m.billing_design_show_qr()}</Label>
            </div>

            <div class="space-y-2">
              <Label for="customFooterText">{m.billing_design_footer_text()}</Label>
              <Textarea
                id="customFooterText"
                name="customFooterText"
                bind:value={customFooterText}
                placeholder={m.billing_design_footer_placeholder()}
                maxlength={200}
              />
              <p class="text-xs text-muted-foreground">
                {m.billing_design_characters({ count: customFooterText.length })}
              </p>
            </div>
          </Card.Content>
        </Card.Root>

        <!-- Actions -->
        <div class="mt-6 flex gap-3">
          <Button type="submit">{m.billing_design_save()}</Button>
          <Button type="button" variant="outline" onclick={resetToDefaults}>
            <RotateCcw class="mr-2 h-4 w-4" />
            {m.billing_design_reset()}
          </Button>
        </div>
      </form>

      {#if data.template}
        <form method="POST" action="?/reset" use:enhance>
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 class="mr-2 h-4 w-4" />
            {m.billing_design_delete()}
          </Button>
        </form>
      {/if}
    </div>

    <!-- Preview Panel -->
    <div class="space-y-4">
      <Card.Root>
        <Card.Header>
          <Card.Title>{m.billing_design_preview()}</Card.Title>
          <Card.Description>
            {m.billing_design_preview_desc()}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <TicketPreview
            template={templatePreview}
            eventName={data.event.name}
            editionName={data.edition.name}
            venue={data.edition.venue}
            startDate={data.edition.startDate}
            logoUrl={logoPreviewUrl}
          />
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>{m.billing_design_tips()}</Card.Title>
        </Card.Header>
        <Card.Content class="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>{m.billing_design_colors()}:</strong> {m.billing_design_tip_colors()}
          </p>
          <p>
            <strong>{m.billing_design_logo()}:</strong> {m.billing_design_tip_logo()}
          </p>
          <p>
            <strong>QR Code:</strong> {m.billing_design_tip_qr()}
          </p>
        </Card.Content>
      </Card.Root>
    </div>
  </div>
</div>
