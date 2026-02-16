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
  <title>My Documents - {data.event.name}</title>
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
        Back to Portal
      </a>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">My Documents</h1>
          <p class="text-muted-foreground mt-1">
            Upload and manage your logos, visuals, and documents
          </p>
        </div>
        <Button onclick={() => (uploadDialogOpen = true)}>
          <Plus class="mr-2 h-4 w-4" />
          Upload Asset
        </Button>
      </div>
    </div>

    <!-- Success/Error Messages -->
    {#if form?.success}
      <div class="rounded-md border border-green-500 bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-400 mb-6">
        {#if form.action === 'upload'}
          Asset uploaded successfully!
        {:else if form.action === 'update'}
          Asset updated successfully!
        {:else if form.action === 'delete'}
          Asset deleted successfully!
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
                      title="Download"
                    >
                      <Download class="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      class="p-1.5 bg-background border rounded-md hover:bg-accent"
                      onclick={() => openEditDialog(asset)}
                      title="Edit"
                    >
                      <Edit class="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      class="p-1.5 bg-background border rounded-md hover:bg-destructive hover:text-destructive-foreground"
                      onclick={() => openDeleteDialog(asset)}
                      title="Delete"
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
          <h3 class="text-lg font-semibold mb-2">No assets uploaded yet</h3>
          <p class="text-muted-foreground text-center mb-4 max-w-md">
            Upload your logos, visuals, and documents to share with the event organizers.
          </p>
          <Button onclick={() => (uploadDialogOpen = true)}>
            <Plus class="mr-2 h-4 w-4" />
            Upload Your First Asset
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
      <Dialog.Title>Upload Asset</Dialog.Title>
      <Dialog.Description>
        Upload a logo, visual, or document. Max size: {MAX_FILE_SIZE_MB}MB.
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
        <Label for="category">Category</Label>
        <Select id="category" name="category" bind:value={selectedCategory}>
          {#each categories as cat}
            <option value={cat}>{getCategoryLabel(cat)}</option>
          {/each}
        </Select>
      </div>

      <div class="space-y-2">
        <Label for="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g., Company Logo 2024"
          required
        />
      </div>

      <div class="space-y-2">
        <Label for="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Brief description of this asset..."
          rows={2}
        />
      </div>

      <div class="space-y-2">
        <Label for="usage">Usage Instructions (optional)</Label>
        <Input
          id="usage"
          name="usage"
          placeholder="e.g., Use on white backgrounds only"
        />
      </div>

      <div class="space-y-2">
        <Label for="file">File</Label>
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
            Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
          </p>
        {/if}
      </div>

      {#if form?.error && form?.action === 'upload'}
        <p class="text-sm text-destructive">{form.error}</p>
      {/if}

      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={closeUploadDialog}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !selectedFile}>
          {#if isSubmitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {:else}
            <Upload class="mr-2 h-4 w-4" />
          {/if}
          Upload
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
{/if}

<!-- Edit Dialog -->
{#if editDialogOpen && selectedAsset}
  <Dialog.Content class="sm:max-w-md" onClose={closeEditDialog}>
    <Dialog.Header>
      <Dialog.Title>Edit Asset</Dialog.Title>
      <Dialog.Description>Update asset details</Dialog.Description>
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
        <Label for="edit-category">Category</Label>
        <Select id="edit-category" name="category" bind:value={editCategory}>
          {#each categories as cat}
            <option value={cat}>{getCategoryLabel(cat)}</option>
          {/each}
        </Select>
      </div>

      <div class="space-y-2">
        <Label for="edit-name">Name</Label>
        <Input
          id="edit-name"
          name="name"
          value={selectedAsset.name}
          required
        />
      </div>

      <div class="space-y-2">
        <Label for="edit-description">Description (optional)</Label>
        <Textarea
          id="edit-description"
          name="description"
          value={selectedAsset.description || ''}
          rows={2}
        />
      </div>

      <div class="space-y-2">
        <Label for="edit-usage">Usage Instructions (optional)</Label>
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
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {#if isSubmitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {/if}
          Save Changes
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
{/if}

<!-- Delete Confirmation Dialog -->
{#if deleteDialogOpen && selectedAsset}
  <Dialog.Content class="sm:max-w-md" onClose={closeDeleteDialog}>
    <Dialog.Header>
      <Dialog.Title>Delete Asset</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete "{selectedAsset.name}"? This action cannot be undone.
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
          Cancel
        </Button>
        <Button type="submit" variant="destructive" disabled={isSubmitting}>
          {#if isSubmitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {/if}
          Delete
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
            <p class="text-muted-foreground">Preview not available for this file type</p>
          </div>
        {/if}
      </div>

      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p class="text-muted-foreground">Category</p>
          <p class="font-medium">{getCategoryLabel(selectedAsset.category)}</p>
        </div>
        <div>
          <p class="text-muted-foreground">File Size</p>
          <p class="font-medium">{formatFileSize(selectedAsset.fileSize)}</p>
        </div>
        {#if selectedAsset.width && selectedAsset.height}
          <div>
            <p class="text-muted-foreground">Dimensions</p>
            <p class="font-medium">{formatDimensions(selectedAsset.width, selectedAsset.height)}</p>
          </div>
        {/if}
        <div>
          <p class="text-muted-foreground">Format</p>
          <p class="font-medium">{selectedAsset.mimeType}</p>
        </div>
        {#if selectedAsset.description}
          <div class="col-span-2">
            <p class="text-muted-foreground">Description</p>
            <p class="font-medium">{selectedAsset.description}</p>
          </div>
        {/if}
        {#if selectedAsset.usage}
          <div class="col-span-2">
            <p class="text-muted-foreground">Usage Instructions</p>
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
          Download
        </a>
      </Dialog.Footer>
    </div>
  </Dialog.Content>
{/if}
