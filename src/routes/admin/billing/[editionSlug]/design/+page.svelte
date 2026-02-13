<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Checkbox } from '$lib/components/ui/checkbox'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { DEFAULT_TICKET_TEMPLATE } from '$lib/features/billing/domain'
import { TicketPreview } from '$lib/features/billing/ui'
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
  if (input.files && input.files[0]) {
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
  <title>Ticket Design - {data.edition.name}</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center gap-4">
    <a href="/admin/billing/{data.edition.slug}">
      <Button variant="ghost" size="icon">
        <ArrowLeft class="h-5 w-5" />
      </Button>
    </a>
    <div>
      <h2 class="text-3xl font-bold tracking-tight">Ticket Design</h2>
      <p class="text-muted-foreground">{data.edition.name}</p>
    </div>
  </div>

  {#if form?.success}
    <div
      class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
    >
      {form.message || 'Changes saved successfully'}
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
              Colors
            </Card.Title>
            <Card.Description>
              Customize the colors used in your ticket design.
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="primaryColor">Primary Color</Label>
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
                    pattern="^#[0-9A-Fa-f]{6}$"
                    class="font-mono"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <Label for="backgroundColor">Background Color</Label>
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
                    pattern="^#[0-9A-Fa-f]{6}$"
                    class="font-mono"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <Label for="textColor">Text Color</Label>
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
                    pattern="^#[0-9A-Fa-f]{6}$"
                    class="font-mono"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <Label for="accentColor">Accent Color</Label>
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
                    pattern="^#[0-9A-Fa-f]{6}$"
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
              Event Logo
            </Card.Title>
            <Card.Description>
              Upload a logo to display on your tickets. Recommended size: 200x80px.
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-4">
            {#if logoPreviewUrl}
              <div class="flex items-center gap-4">
                <img
                  src={logoPreviewUrl}
                  alt="Logo preview"
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
                  Remove
                </Button>
              </div>
            {/if}

            <div>
              <Label for="logoFile">Upload Logo</Label>
              <Input
                id="logoFile"
                name="logoFile"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onchange={handleLogoChange}
                class="mt-2"
              />
              <p class="mt-1 text-xs text-muted-foreground">
                PNG, JPEG, or WebP. Max 2MB.
              </p>
            </div>

            <div>
              <Label for="logoUrl">Or use a URL</Label>
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
            <Card.Title>Display Options</Card.Title>
            <Card.Description>
              Choose what information to display on the ticket.
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
              <Label for="showDate" class="cursor-pointer">Show event date</Label>
            </div>

            <div class="flex items-center gap-3">
              <Checkbox
                id="showVenue"
                checked={showVenue}
                onCheckedChange={(checked) => (showVenue = checked === true)}
              />
              <input type="hidden" name="showVenue" value={showVenue} />
              <Label for="showVenue" class="cursor-pointer">Show venue</Label>
            </div>

            <div class="flex items-center gap-3">
              <Checkbox
                id="showQrCode"
                checked={showQrCode}
                onCheckedChange={(checked) => (showQrCode = checked === true)}
              />
              <input type="hidden" name="showQrCode" value={showQrCode} />
              <Label for="showQrCode" class="cursor-pointer">Show QR code</Label>
            </div>

            <div class="space-y-2">
              <Label for="customFooterText">Custom Footer Text</Label>
              <Textarea
                id="customFooterText"
                name="customFooterText"
                bind:value={customFooterText}
                placeholder="e.g., Please arrive 30 minutes early"
                maxlength={200}
              />
              <p class="text-xs text-muted-foreground">
                {customFooterText.length}/200 characters
              </p>
            </div>
          </Card.Content>
        </Card.Root>

        <!-- Actions -->
        <div class="mt-6 flex gap-3">
          <Button type="submit">Save Design</Button>
          <Button type="button" variant="outline" onclick={resetToDefaults}>
            <RotateCcw class="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>
      </form>

      {#if data.template}
        <form method="POST" action="?/reset" use:enhance>
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 class="mr-2 h-4 w-4" />
            Delete Custom Design
          </Button>
        </form>
      {/if}
    </div>

    <!-- Preview Panel -->
    <div class="space-y-4">
      <Card.Root>
        <Card.Header>
          <Card.Title>Preview</Card.Title>
          <Card.Description>
            This is how your tickets will appear in emails and PDFs.
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
          <Card.Title>Tips</Card.Title>
        </Card.Header>
        <Card.Content class="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>Colors:</strong> Use contrasting colors for better readability. The header text color is automatically calculated based on the primary color.
          </p>
          <p>
            <strong>Logo:</strong> For best results, use a transparent PNG with your logo on a light background. The logo will be resized to fit.
          </p>
          <p>
            <strong>QR Code:</strong> The QR code contains the ticket ID and is used for check-in. We recommend keeping it enabled.
          </p>
        </Card.Content>
      </Card.Root>
    </div>
  </div>
</div>
