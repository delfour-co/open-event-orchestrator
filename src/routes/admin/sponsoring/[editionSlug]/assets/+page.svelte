<script lang="ts">
import { AdminSubNav } from '$lib/components/shared'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import { getSponsoringNavItems } from '$lib/config'
import {
  ASSET_CATEGORY_LABELS,
  type SponsorAssetCategory,
  type SponsorAssetWithUrl,
  formatDimensions,
  formatFileSize,
  getCategoryLabel,
  isImageMimeType
} from '$lib/features/sponsoring/domain'
import { ArrowLeft, Download, FileArchive, FileImage, FileText, Image } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

let previewDialogOpen = $state(false)
let selectedAsset = $state<(SponsorAssetWithUrl & { sponsorName?: string }) | null>(null)
let selectedSponsorName = $state<string>('')
let activeTab = $state<'by-sponsor' | 'by-category'>('by-sponsor')

const categories = Object.keys(ASSET_CATEGORY_LABELS) as SponsorAssetCategory[]

function openPreview(asset: SponsorAssetWithUrl, sponsorName: string): void {
  selectedAsset = { ...asset, sponsorName }
  selectedSponsorName = sponsorName
  previewDialogOpen = true
}

function closePreviewDialog(): void {
  previewDialogOpen = false
  selectedAsset = null
}

function getLogoAssetsCount(): number {
  return (
    data.assetsByCategory.logo_color +
    data.assetsByCategory.logo_mono +
    data.assetsByCategory.logo_light +
    data.assetsByCategory.logo_dark
  )
}
</script>

<svelte:head>
  <title>Sponsor Assets - {data.edition.name}</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/admin/sponsoring/{data.edition.slug}">
        <Button variant="ghost" size="icon">
          <ArrowLeft class="h-5 w-5" />
        </Button>
      </a>
      <div>
        <h2 class="text-3xl font-bold tracking-tight">{data.edition.name}</h2>
        <p class="text-muted-foreground">
          View and download assets from confirmed sponsors
        </p>
      </div>
    </div>
    {#if data.totalAssets > 0}
      <a
        href="/api/admin/sponsoring/{data.edition.slug}/assets/download-all"
        class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <FileArchive class="mr-2 h-4 w-4" />
        Download All ({data.totalAssets})
      </a>
    {/if}
  </div>

  <!-- Sub-navigation -->
  <AdminSubNav basePath="/admin/sponsoring/{data.edition.slug}" items={getSponsoringNavItems(data.edition.slug)} />

  <!-- Stats -->
  <div class="grid gap-4 md:grid-cols-4 mb-8">
    <Card.Root>
      <Card.Content class="pt-6">
        <div class="flex items-center gap-2">
          <FileImage class="h-5 w-5 text-muted-foreground" />
          <div>
            <p class="text-2xl font-bold">{data.totalAssets}</p>
            <p class="text-sm text-muted-foreground">Total Assets</p>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="pt-6">
        <div class="flex items-center gap-2">
          <Image class="h-5 w-5 text-muted-foreground" />
          <div>
            <p class="text-2xl font-bold">{getLogoAssetsCount()}</p>
            <p class="text-sm text-muted-foreground">Logos</p>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="pt-6">
        <div class="flex items-center gap-2">
          <FileImage class="h-5 w-5 text-muted-foreground" />
          <div>
            <p class="text-2xl font-bold">{data.assetsByCategory.visual}</p>
            <p class="text-sm text-muted-foreground">Visuals</p>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="pt-6">
        <div class="flex items-center gap-2">
          <FileText class="h-5 w-5 text-muted-foreground" />
          <div>
            <p class="text-2xl font-bold">{data.assetsByCategory.document}</p>
            <p class="text-sm text-muted-foreground">Documents</p>
          </div>
        </div>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Tab Navigation -->
  <div class="mb-6 border-b">
    <nav class="-mb-px flex gap-4">
      <button
        type="button"
        class="py-2 px-1 border-b-2 text-sm font-medium {activeTab === 'by-sponsor' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
        onclick={() => (activeTab = 'by-sponsor')}
      >
        By Sponsor
      </button>
      <button
        type="button"
        class="py-2 px-1 border-b-2 text-sm font-medium {activeTab === 'by-category' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
        onclick={() => (activeTab = 'by-category')}
      >
        By Category
      </button>
    </nav>
  </div>

  <!-- By Sponsor Tab -->
  {#if activeTab === 'by-sponsor'}
    {#if data.sponsorAssets.length === 0}
      <Card.Root>
        <Card.Content class="flex flex-col items-center justify-center py-12">
          <FileImage class="h-12 w-12 text-muted-foreground mb-4" />
          <h3 class="text-lg font-semibold mb-2">No assets yet</h3>
          <p class="text-muted-foreground text-center max-w-md">
            Confirmed sponsors have not uploaded any assets yet.
          </p>
        </Card.Content>
      </Card.Root>
    {:else}
      <div class="space-y-6">
        {#each data.sponsorAssets as sponsorAsset}
          <Card.Root>
            <Card.Header>
              <div class="flex items-center gap-4">
                {#if sponsorAsset.sponsorLogo}
                  <img
                    src={sponsorAsset.sponsorLogo}
                    alt={sponsorAsset.sponsorName}
                    class="h-12 w-12 object-contain rounded border"
                  />
                {:else}
                  <div class="h-12 w-12 bg-muted rounded flex items-center justify-center">
                    <Image class="h-6 w-6 text-muted-foreground" />
                  </div>
                {/if}
                <div>
                  <Card.Title>{sponsorAsset.sponsorName}</Card.Title>
                  <Card.Description class="flex items-center gap-2">
                    {#if sponsorAsset.packageName}
                      <Badge variant="outline">{sponsorAsset.packageName}</Badge>
                    {/if}
                    <span>{sponsorAsset.assets.length} asset{sponsorAsset.assets.length !== 1 ? 's' : ''}</span>
                  </Card.Description>
                </div>
              </div>
            </Card.Header>
            <Card.Content>
              {#if sponsorAsset.assets.length === 0}
                <p class="text-sm text-muted-foreground">No assets uploaded yet</p>
              {:else}
                <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {#each sponsorAsset.assets as asset}
                    <div class="group relative border rounded-lg p-3 hover:border-primary transition-colors">
                      <button
                        type="button"
                        class="w-full aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden mb-2 cursor-pointer"
                        onclick={() => openPreview(asset, sponsorAsset.sponsorName)}
                      >
                        {#if asset.thumbUrl && isImageMimeType(asset.mimeType)}
                          <img
                            src={asset.thumbUrl}
                            alt={asset.name}
                            class="max-w-full max-h-full object-contain"
                          />
                        {:else if isImageMimeType(asset.mimeType)}
                          <Image class="h-8 w-8 text-muted-foreground" />
                        {:else}
                          <FileText class="h-8 w-8 text-muted-foreground" />
                        {/if}
                      </button>

                      <div class="space-y-0.5">
                        <p class="text-sm font-medium truncate">{asset.name}</p>
                        <p class="text-xs text-muted-foreground">
                          {getCategoryLabel(asset.category)}
                        </p>
                        <p class="text-xs text-muted-foreground">
                          {formatFileSize(asset.fileSize)}
                        </p>
                      </div>

                      <div class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={asset.fileUrl}
                          download={asset.name}
                          class="p-1.5 bg-background border rounded-md hover:bg-accent inline-flex"
                          title="Download"
                        >
                          <Download class="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    {/if}
  {/if}

  <!-- By Category Tab -->
  {#if activeTab === 'by-category'}
    <div class="space-y-6">
      {#each categories as category}
        {@const categoryAssets = data.sponsorAssets.flatMap((sa) =>
          sa.assets.filter((a) => a.category === category).map((a) => ({
            ...a,
            sponsorName: sa.sponsorName
          }))
        )}
        {#if categoryAssets.length > 0}
          <Card.Root>
            <Card.Header>
              <Card.Title class="flex items-center gap-2">
                {getCategoryLabel(category)}
                <Badge variant="secondary">{categoryAssets.length}</Badge>
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {#each categoryAssets as asset}
                  <div class="group relative border rounded-lg p-3 hover:border-primary transition-colors">
                    <button
                      type="button"
                      class="w-full aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden mb-2 cursor-pointer"
                      onclick={() => openPreview(asset, asset.sponsorName)}
                    >
                      {#if asset.thumbUrl && isImageMimeType(asset.mimeType)}
                        <img
                          src={asset.thumbUrl}
                          alt={asset.name}
                          class="max-w-full max-h-full object-contain"
                        />
                      {:else if isImageMimeType(asset.mimeType)}
                        <Image class="h-8 w-8 text-muted-foreground" />
                      {:else}
                        <FileText class="h-8 w-8 text-muted-foreground" />
                      {/if}
                    </button>

                    <div class="space-y-0.5">
                      <p class="text-sm font-medium truncate">{asset.name}</p>
                      <p class="text-xs text-muted-foreground">{asset.sponsorName}</p>
                      <p class="text-xs text-muted-foreground">{formatFileSize(asset.fileSize)}</p>
                    </div>

                    <div class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={asset.fileUrl}
                        download={asset.name}
                        class="p-1.5 bg-background border rounded-md hover:bg-accent inline-flex"
                        title="Download"
                      >
                        <Download class="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                {/each}
              </div>
            </Card.Content>
          </Card.Root>
        {/if}
      {/each}

      {#if data.totalAssets === 0}
        <Card.Root>
          <Card.Content class="flex flex-col items-center justify-center py-12">
            <FileImage class="h-12 w-12 text-muted-foreground mb-4" />
            <h3 class="text-lg font-semibold mb-2">No assets yet</h3>
            <p class="text-muted-foreground text-center max-w-md">
              Confirmed sponsors have not uploaded any assets yet.
            </p>
          </Card.Content>
        </Card.Root>
      {/if}
    </div>
  {/if}
</div>

<!-- Preview Dialog -->
{#if previewDialogOpen && selectedAsset}
  <Dialog.Content class="sm:max-w-3xl" onClose={closePreviewDialog}>
    <Dialog.Header>
      <Dialog.Title>{selectedAsset.name}</Dialog.Title>
      <Dialog.Description>{selectedSponsorName}</Dialog.Description>
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
