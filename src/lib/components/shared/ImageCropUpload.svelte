<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as m from '$lib/paraglide/messages'
import { Check, Trash2, Upload, X } from 'lucide-svelte'

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
let fileInput: HTMLInputElement
let hiddenFileInput: HTMLInputElement
let uploadForm: HTMLFormElement
let cropperImageEl: HTMLImageElement
let cropperInstance: unknown = null
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
    // Initialize cropperjs after the image element is rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => initCropper())
    })
  }
  reader.readAsDataURL(file)
  input.value = ''
}

async function initCropper(): Promise<void> {
  if (!cropperImageEl) return
  // Destroy previous instance
  if (cropperInstance) {
    ;(cropperInstance as { destroy: () => void }).destroy()
  }
  // Dynamic import to avoid SSR issues
  const { default: Cropper } = await import('cropperjs')
  cropperInstance = new Cropper(cropperImageEl, {
    aspectRatio,
    viewMode: 1,
    dragMode: 'move',
    autoCropArea: 1,
    background: false,
    guides: true,
    center: true,
    highlight: false,
    cropBoxMovable: true,
    cropBoxResizable: true,
    toggleDragModeOnDblclick: false
  })
}

async function confirmCrop(): Promise<void> {
  if (!cropperInstance) return
  isUploading = true

  try {
    const cropper = cropperInstance as {
      getCroppedCanvas: (options?: Record<string, unknown>) => HTMLCanvasElement
    }
    const canvas = cropper.getCroppedCanvas({
      maxWidth: 2048,
      maxHeight: 2048
    })

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
  if (cropperInstance) {
    ;(cropperInstance as { destroy: () => void }).destroy()
    cropperInstance = null
  }
  showCropper = false
  imageSrc = ''
}
</script>

<svelte:head>
  {#if showCropper}
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/2.0.0/cropper.min.css" />
  {/if}
</svelte:head>

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
      if (cropperInstance) {
        (cropperInstance as { destroy: () => void }).destroy()
        cropperInstance = null
      }
      showCropper = false
      imageSrc = ''
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

      <div class="relative w-full overflow-hidden rounded-md bg-black" style="max-height: 400px;">
        <img
          bind:this={cropperImageEl}
          src={imageSrc}
          alt="Crop preview"
          style="max-width: 100%; display: block;"
        />
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
