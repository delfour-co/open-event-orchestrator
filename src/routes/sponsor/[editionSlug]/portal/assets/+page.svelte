<script lang="ts">
import { enhance } from '$app/forms'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Select } from '$lib/components/ui/select'
import { Textarea } from '$lib/components/ui/textarea'
import {
  ASSET_CATEGORY_LABELS,
  MAX_FILE_SIZE_MB,
  type SponsorAssetCategory,
  type SponsorAssetWithUrl,
  formatDimensions,
  formatFileSize,
  getCategoryLabel,
  groupAssetsByCategory,
  isImageMimeType
} from '$lib/features/sponsoring/domain'
import * as m from '$lib/paraglide/messages'
import {
  ArrowLeft,
  Download,
  Edit,
  FileText,
  Image,
  Loader2,
  Plus,
  Trash2,
  Upload
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isSubmitting = $state(false)
let uploadDialogOpen = $state(false)
let editDialogOpen = $state(false)
let deleteDialogOpen = $state(false)
let previewDialogOpen = $state(false)
let selectedAsset = $state<SponsorAssetWithUrl | null>(null)
let fileInput = $state<HTMLInputElement | null>(null)
let selectedFile = $state<File | null>(null)
let selectedCategory = $state<SponsorAssetCategory>('logo_color')
let editCategory = $state<SponsorAssetCategory>('logo_color')

const groupedAssets = $derived(groupAssetsByCategory(data.assets))
const categories = Object.keys(ASSET_CATEGORY_LABELS) as SponsorAssetCategory[]

function openEditDialog(asset: SponsorAssetWithUrl): void {
  selectedAsset = asset
  editCategory = asset.category
  editDialogOpen = true
}

function openDeleteDialog(asset: SponsorAssetWithUrl): void {
  selectedAsset = asset
  deleteDialogOpen = true
}

function openPreview(asset: SponsorAssetWithUrl): void {
  selectedAsset = asset
  previewDialogOpen = true
}

function handleFileSelect(event: Event): void {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    selectedFile = input.files[0]
  }
}

function resetUploadForm(): void {
  selectedFile = null
  selectedCategory = 'logo_color'
  if (fileInput) {
    fileInput.value = ''
  }
}

function closeUploadDialog(): void {
  uploadDialogOpen = false
  resetUploadForm()
}

function closeEditDialog(): void {
  editDialogOpen = false
  selectedAsset = null
}

function closeDeleteDialog(): void {
  deleteDialogOpen = false
  selectedAsset = null
}

function closePreviewDialog(): void {
  previewDialogOpen = false
  selectedAsset = null
}
</script>

<svelte:head>
  <title>{m.sponsor_assets_title({ eventName: data.event.name })}</title>
</svelte:head>

<div class="min-h-screen bg-muted/30">
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <!-- Header -->
    <div class="mb-8">
      <a
        href="/sponsor/{data.edition.slug}/portal?token={data.token}"
        class="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft class="mr-2 h-4 w-4" />
        {m.sponsor_assets_back()}
      </a>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">{m.sponsor_assets_heading()}</h1>
          <p class="text-muted-foreground mt-1">
            {m.sponsor_assets_description()}
          </p>
        </div>
        <Button onclick={() => (uploadDialogOpen = true)}>
          <Plus class="mr-2 h-4 w-4" />
          {m.sponsor_assets_upload()}
        </Button>
      </div>
    </div>

    <!-- Success/Error Messages -->
    {#if form?.success}
      <div class="rounded-md border border-green-500 bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-400 mb-6">
        {#if form.action === 'upload'}
          {m.sponsor_assets_upload_success()}
        {:else if form.action === 'update'}
          {m.sponsor_assets_update_success()}
        {:else if form.action === 'delete'}
          {m.sponsor_assets_delete_success()}
        {/if}
      </div>
    {/if}
    {#if form?.error && !uploadDialogOpen && !editDialogOpen && !deleteDialogOpen}
      <div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive mb-6">
        {form.error}
      </div>
    {/if}

    <!-- Asset Categories -->
    {#each categories as category}
      {@const assets = groupedAssets[category]}
      {#if assets.length > 0}
        <Card.Root class="mb-6">
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              {getCategoryLabel(category)}
              <Badge variant="secondary">{assets.length}</Badge>
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {#each assets as asset}
                <div class="group relative border rounded-lg p-4 hover:border-primary transition-colors">
                  <!-- Preview -->
                  <button
                    type="button"
                    class="w-full aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden mb-3 cursor-pointer"
                    onclick={() => openPreview(asset)}
                  >
                    {#if asset.thumbUrl && isImageMimeType(asset.mimeType)}
                      <img
                        src={asset.thumbUrl}
                        alt={asset.name}
                        class="max-w-full max-h-full object-contain"
                      />
                    {:else if isImageMimeType(asset.mimeType)}
                      <Image class="h-12 w-12 text-muted-foreground" />
                    {:else}
                      <FileText class="h-12 w-12 text-muted-foreground" />
                    {/if}
                  </button>

                  <!-- Info -->
                  <div class="space-y-1">
                    <h4 class="font-medium truncate">{asset.name}</h4>
                    <div class="text-xs text-muted-foreground space-y-0.5">
                      <p>{formatFileSize(asset.fileSize)}</p>
                      {#if asset.width && asset.height}
                        <p>{formatDimensions(asset.width, asset.height)}</p>
                      {/if}
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <a
                      href={asset.fileUrl}
                      download={asset.name}
                      class="p-1.5 bg-background border rounded-md hover:bg-accent"
                      title={m.action_download()}
                    >
                      <Download class="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      class="p-1.5 bg-background border rounded-md hover:bg-accent"
                      onclick={() => openEditDialog(asset)}
                      title={m.action_edit()}
                    >
                      <Edit class="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      class="p-1.5 bg-background border rounded-md hover:bg-destructive hover:text-destructive-foreground"
                      onclick={() => openDeleteDialog(asset)}
                      title={m.action_delete()}
                    >
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </Card.Content>
        </Card.Root>
      {/if}
    {/each}

    <!-- Empty State -->
    {#if data.assets.length === 0}
      <Card.Root>
        <Card.Content class="flex flex-col items-center justify-center py-12">
          <Upload class="h-12 w-12 text-muted-foreground mb-4" />
          <h3 class="text-lg font-semibold mb-2">{m.sponsor_assets_empty_title()}</h3>
          <p class="text-muted-foreground text-center mb-4 max-w-md">
            {m.sponsor_assets_empty_description()}
          </p>
          <Button onclick={() => (uploadDialogOpen = true)}>
            <Plus class="mr-2 h-4 w-4" />
            {m.sponsor_assets_upload_first()}
          </Button>
        </Card.Content>
      </Card.Root>
    {/if}
  </div>
</div>

<!-- Upload Dialog -->
{#if uploadDialogOpen}
  <Dialog.Content class="sm:max-w-md" onClose={closeUploadDialog}>
    <Dialog.Header>
      <Dialog.Title>{m.sponsor_assets_upload_dialog_title()}</Dialog.Title>
      <Dialog.Description>
        {m.sponsor_assets_upload_dialog_description({ maxSize: String(MAX_FILE_SIZE_MB) })}
      </Dialog.Description>
    </Dialog.Header>

    <form
      method="POST"
      action="?/upload"
      enctype="multipart/form-data"
      use:enhance={() => {
        isSubmitting = true
        return async ({ update }) => {
          isSubmitting = false
          await update({ reset: false })
          if (form?.success) {
            closeUploadDialog()
          }
        }
      }}
      class="space-y-4"
    >
      <input type="hidden" name="token" value={data.token} />

      <div class="space-y-2">
        <Label for="category">{m.sponsor_assets_category()}</Label>
        <Select id="category" name="category" bind:value={selectedCategory}>
          {#each categories as cat}
            <option value={cat}>{getCategoryLabel(cat)}</option>
          {/each}
        </Select>
      </div>

      <div class="space-y-2">
        <Label for="name">{m.sponsor_assets_name()}</Label>
        <Input
          id="name"
          name="name"
          placeholder={m.sponsor_assets_name_placeholder()}
          required
        />
      </div>

      <div class="space-y-2">
        <Label for="description">{m.sponsor_assets_description_label()}</Label>
        <Textarea
          id="description"
          name="description"
          placeholder={m.sponsor_assets_description_placeholder()}
          rows={2}
        />
      </div>

      <div class="space-y-2">
        <Label for="usage">{m.sponsor_assets_usage()}</Label>
        <Input
          id="usage"
          name="usage"
          placeholder={m.sponsor_assets_usage_placeholder()}
        />
      </div>

      <div class="space-y-2">
        <Label for="file">{m.sponsor_assets_file()}</Label>
        <input
          type="file"
          id="file"
          name="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/pdf,.ai,.eps,.psd"
          class="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          bind:this={fileInput}
          onchange={handleFileSelect}
          required
        />
        {#if selectedFile}
          <p class="text-xs text-muted-foreground">
            {m.sponsor_assets_selected({ name: selectedFile.name, size: formatFileSize(selectedFile.size) })}
          </p>
        {/if}
      </div>

      {#if form?.error && form?.action === 'upload'}
        <p class="text-sm text-destructive">{form.error}</p>
      {/if}

      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={closeUploadDialog}>
          {m.action_cancel()}
        </Button>
        <Button type="submit" disabled={isSubmitting || !selectedFile}>
          {#if isSubmitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {:else}
            <Upload class="mr-2 h-4 w-4" />
          {/if}
          {m.action_upload()}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
{/if}

<!-- Edit Dialog -->
{#if editDialogOpen && selectedAsset}
  <Dialog.Content class="sm:max-w-md" onClose={closeEditDialog}>
    <Dialog.Header>
      <Dialog.Title>{m.sponsor_assets_edit_title()}</Dialog.Title>
      <Dialog.Description>{m.sponsor_assets_edit_description()}</Dialog.Description>
    </Dialog.Header>

    <form
      method="POST"
      action="?/update"
      use:enhance={() => {
        isSubmitting = true
        return async ({ update }) => {
          isSubmitting = false
          await update({ reset: false })
          if (form?.success) {
            closeEditDialog()
          }
        }
      }}
      class="space-y-4"
    >
      <input type="hidden" name="token" value={data.token} />
      <input type="hidden" name="assetId" value={selectedAsset.id} />

      <div class="space-y-2">
        <Label for="edit-category">{m.sponsor_assets_category()}</Label>
        <Select id="edit-category" name="category" bind:value={editCategory}>
          {#each categories as cat}
            <option value={cat}>{getCategoryLabel(cat)}</option>
          {/each}
        </Select>
      </div>

      <div class="space-y-2">
        <Label for="edit-name">{m.sponsor_assets_name()}</Label>
        <Input
          id="edit-name"
          name="name"
          value={selectedAsset.name}
          required
        />
      </div>

      <div class="space-y-2">
        <Label for="edit-description">{m.sponsor_assets_description_label()}</Label>
        <Textarea
          id="edit-description"
          name="description"
          value={selectedAsset.description || ''}
          rows={2}
        />
      </div>

      <div class="space-y-2">
        <Label for="edit-usage">{m.sponsor_assets_usage()}</Label>
        <Input
          id="edit-usage"
          name="usage"
          value={selectedAsset.usage || ''}
        />
      </div>

      {#if form?.error && form?.action === 'update'}
        <p class="text-sm text-destructive">{form.error}</p>
      {/if}

      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={closeEditDialog}>
          {m.action_cancel()}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {#if isSubmitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {/if}
          {m.sponsor_assets_save()}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
{/if}

<!-- Delete Confirmation Dialog -->
{#if deleteDialogOpen && selectedAsset}
  <Dialog.Content class="sm:max-w-md" onClose={closeDeleteDialog}>
    <Dialog.Header>
      <Dialog.Title>{m.sponsor_assets_delete_title()}</Dialog.Title>
      <Dialog.Description>
        {m.sponsor_assets_delete_confirm({ name: selectedAsset.name })}
      </Dialog.Description>
    </Dialog.Header>

    <form
      method="POST"
      action="?/delete"
      use:enhance={() => {
        isSubmitting = true
        return async ({ update }) => {
          isSubmitting = false
          await update({ reset: false })
          if (form?.success) {
            closeDeleteDialog()
          }
        }
      }}
    >
      <input type="hidden" name="token" value={data.token} />
      <input type="hidden" name="assetId" value={selectedAsset.id} />

      {#if form?.error && form?.action === 'delete'}
        <p class="text-sm text-destructive mb-4">{form.error}</p>
      {/if}

      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={closeDeleteDialog}>
          {m.action_cancel()}
        </Button>
        <Button type="submit" variant="destructive" disabled={isSubmitting}>
          {#if isSubmitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {/if}
          {m.action_delete()}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
{/if}

<!-- Preview Dialog -->
{#if previewDialogOpen && selectedAsset}
  <Dialog.Content class="sm:max-w-3xl" onClose={closePreviewDialog}>
    <Dialog.Header>
      <Dialog.Title>{selectedAsset.name}</Dialog.Title>
    </Dialog.Header>

    <div class="space-y-4">
      <div class="bg-muted rounded-lg p-4 flex items-center justify-center min-h-[300px]">
        {#if isImageMimeType(selectedAsset.mimeType)}
          <img
            src={selectedAsset.fileUrl}
            alt={selectedAsset.name}
            class="max-w-full max-h-[400px] object-contain"
          />
        {:else}
          <div class="text-center">
            <FileText class="h-24 w-24 text-muted-foreground mx-auto mb-4" />
            <p class="text-muted-foreground">{m.sponsor_assets_preview_not_available()}</p>
          </div>
        {/if}
      </div>

      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p class="text-muted-foreground">{m.sponsor_assets_preview_category()}</p>
          <p class="font-medium">{getCategoryLabel(selectedAsset.category)}</p>
        </div>
        <div>
          <p class="text-muted-foreground">{m.sponsor_assets_preview_file_size()}</p>
          <p class="font-medium">{formatFileSize(selectedAsset.fileSize)}</p>
        </div>
        {#if selectedAsset.width && selectedAsset.height}
          <div>
            <p class="text-muted-foreground">{m.sponsor_assets_preview_dimensions()}</p>
            <p class="font-medium">{formatDimensions(selectedAsset.width, selectedAsset.height)}</p>
          </div>
        {/if}
        <div>
          <p class="text-muted-foreground">{m.sponsor_assets_preview_format()}</p>
          <p class="font-medium">{selectedAsset.mimeType}</p>
        </div>
        {#if selectedAsset.description}
          <div class="col-span-2">
            <p class="text-muted-foreground">{m.sponsor_assets_preview_description()}</p>
            <p class="font-medium">{selectedAsset.description}</p>
          </div>
        {/if}
        {#if selectedAsset.usage}
          <div class="col-span-2">
            <p class="text-muted-foreground">{m.sponsor_assets_preview_usage()}</p>
            <p class="font-medium">{selectedAsset.usage}</p>
          </div>
        {/if}
      </div>

      <Dialog.Footer>
        <a
          href={selectedAsset.fileUrl}
          download={selectedAsset.name}
          class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Download class="mr-2 h-4 w-4" />
          {m.action_download()}
        </a>
      </Dialog.Footer>
    </div>
  </Dialog.Content>
{/if}
