<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as m from '$lib/paraglide/messages'
import { Check, Trash2, Upload, X, ZoomIn } from 'lucide-svelte'
import Cropper from 'svelte-easy-crop'
import type { CropArea } from 'svelte-easy-crop'

interface Props {
  action: string
  aspectRatio?: number
  label?: string
  removeLabel?: string
  accept?: string
  maxSizeMB?: number
  name?: string
  currentImageUrl?: string | null
  removeAction?: string | null
}

const {
  action,
  aspectRatio = 1,
  label = 'Upload',
  removeLabel = 'Remove',
  accept = 'image/jpeg,image/png,image/webp',
  maxSizeMB = 2,
  name = 'file',
  currentImageUrl = null,
  removeAction = null
}: Props = $props()

let showCropper = $state(false)
let imageSrc = $state('')
let crop = $state({ x: 0, y: 0 })
let zoom = $state(1)
let croppedAreaPixels = $state<CropArea | null>(null)
let fileInput: HTMLInputElement
let hiddenFileInput: HTMLInputElement
let uploadForm: HTMLFormElement
let isUploading = $state(false)

function onFileSelect(e: Event): void {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (file.size > maxSizeMB * 1024 * 1024) {
    alert(m.image_crop_too_large({ max: String(maxSizeMB) }))
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    imageSrc = reader.result as string
    showCropper = true
  }
  reader.readAsDataURL(file)

  // Reset input so same file can be re-selected
  input.value = ''
}

function onCropComplete(detail: { percent: CropArea; pixels: CropArea }): void {
  croppedAreaPixels = detail.pixels
}

async function confirmCrop(): Promise<void> {
  if (!croppedAreaPixels || !imageSrc) return
  isUploading = true

  try {
    const image = new Image()
    image.src = imageSrc
    await new Promise((resolve) => {
      image.onload = resolve
    })

    const canvas = document.createElement('canvas')
    canvas.width = croppedAreaPixels.width
    canvas.height = croppedAreaPixels.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    )

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b)
          else reject(new Error('Failed to create blob'))
        },
        'image/jpeg',
        0.9
      )
    })

    const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' })
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)
    hiddenFileInput.files = dataTransfer.files

    uploadForm.requestSubmit()
  } catch (err) {
    console.error('Crop upload failed:', err)
    isUploading = false
    showCropper = false
    imageSrc = ''
  }
}

function cancelCrop(): void {
  showCropper = false
  imageSrc = ''
  crop = { x: 0, y: 0 }
  zoom = 1
}
</script>

<!-- Hidden form for SvelteKit form action submission -->
<form
  bind:this={uploadForm}
  method="POST"
  action={action}
  enctype="multipart/form-data"
  use:enhance={() => {
    isUploading = true
    return async ({ update }) => {
      isUploading = false
      showCropper = false
      imageSrc = ''
      crop = { x: 0, y: 0 }
      zoom = 1
      await update()
      await invalidateAll()
    }
  }}
  class="hidden"
>
  <input bind:this={hiddenFileInput} type="file" {name} />
</form>

<div class="flex items-center gap-4">
  {#if currentImageUrl}
    <img src={currentImageUrl} alt="" class="h-16 w-16 rounded-md border object-contain" />
  {/if}

  <div class="flex gap-2">
    <input
      bind:this={fileInput}
      type="file"
      {accept}
      class="hidden"
      onchange={onFileSelect}
    />
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isUploading}
      onclick={() => fileInput.click()}
    >
      <Upload class="mr-2 h-4 w-4" />
      {isUploading ? m.image_crop_uploading() : label}
    </Button>

    {#if currentImageUrl && removeAction}
      <form
        method="POST"
        action={removeAction}
        use:enhance={() => {
          return async ({ update }) => {
            await update()
            await invalidateAll()
          }
        }}
      >
        <Button type="submit" variant="ghost" size="sm" class="text-destructive">
          <Trash2 class="mr-2 h-4 w-4" />
          {removeLabel}
        </Button>
      </form>
    {/if}
  </div>
</div>

<!-- Crop Modal -->
{#if showCropper}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
    <div class="w-full max-w-lg rounded-lg bg-background p-4 shadow-xl">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold">{m.image_crop_title()}</h3>
        <Button variant="ghost" size="icon" onclick={cancelCrop}>
          <X class="h-4 w-4" />
        </Button>
      </div>

      <div class="relative h-80 w-full overflow-hidden rounded-md bg-black">
        <Cropper
          image={imageSrc}
          bind:crop
          bind:zoom
          aspect={aspectRatio}
          oncropcomplete={onCropComplete}
        />
      </div>

      <div class="mt-4 flex items-center gap-4">
        <ZoomIn class="h-4 w-4 text-muted-foreground" />
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          bind:value={zoom}
          class="flex-1"
        />
        <span class="text-sm text-muted-foreground">{zoom.toFixed(1)}x</span>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onclick={cancelCrop}>{m.image_crop_cancel()}</Button>
        <Button onclick={confirmCrop} disabled={isUploading}>
          <Check class="mr-2 h-4 w-4" />
          {isUploading ? m.image_crop_uploading() : m.image_crop_apply()}
        </Button>
      </div>
    </div>
  </div>
{/if}
