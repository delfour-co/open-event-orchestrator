<script lang="ts">
import { browser } from '$app/environment'
import { Button } from '$lib/components/ui/button'
import * as m from '$lib/paraglide/messages'
import { CheckCircle2, Copy, Share2, X } from 'lucide-svelte'
import QRCode from 'qrcode'

interface Props {
  sessionTitle: string
  sessionUrl: string
}

const { sessionTitle, sessionUrl }: Props = $props()

let showSharePopover = $state(false)
let copied = $state(false)
let qrCodeDataUrl = $state<string | null>(null)
let isGeneratingQr = $state(false)
let triggerEl = $state<HTMLButtonElement | null>(null)
let popoverStyle = $state('')

async function handleShare(): Promise<void> {
  if (!browser) return

  if (navigator.share) {
    try {
      await navigator.share({
        title: sessionTitle,
        url: sessionUrl
      })
    } catch (err) {
      // User cancelled or share failed — ignore AbortError
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share failed:', err)
      }
    }
    return
  }

  // Fallback: show popover with copy + QR code
  showSharePopover = true
  if (triggerEl) {
    const rect = triggerEl.getBoundingClientRect()
    popoverStyle = `position:fixed;top:${rect.top}px;right:${window.innerWidth - rect.right}px;transform:translateY(-100%);`
  }
  if (!qrCodeDataUrl) {
    await generateQrCode()
  }
}

async function generateQrCode(): Promise<void> {
  isGeneratingQr = true
  try {
    qrCodeDataUrl = await QRCode.toDataURL(sessionUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    })
  } catch (err) {
    console.error('Failed to generate QR code:', err)
  } finally {
    isGeneratingQr = false
  }
}

async function copyToClipboard(): Promise<void> {
  if (!browser) return
  try {
    await navigator.clipboard.writeText(sessionUrl)
    copied = true
    setTimeout(() => {
      copied = false
    }, 2000)
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = sessionUrl
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied = true
    setTimeout(() => {
      copied = false
    }, 2000)
  }
}

function closePopover(): void {
  showSharePopover = false
}
</script>

<div class="relative">
  <button
    bind:this={triggerEl}
    type="button"
    class="rounded-full p-1.5 transition-colors hover:bg-muted"
    onclick={handleShare}
    aria-label={m.app_share_session()}
    data-testid="share-session-button"
  >
    <Share2
      class="h-4 w-4 text-muted-foreground hover:text-primary"
      aria-hidden="true"
    />
  </button>

  {#if showSharePopover}
    <!-- Backdrop -->
    <button
      type="button"
      class="fixed inset-0 z-40"
      onclick={closePopover}
      aria-label="Close"
      tabindex="-1"
    ></button>

    <!-- Popover -->
    <div
      class="z-50 w-64 rounded-lg border bg-card p-4 shadow-lg"
      style={popoverStyle}
      role="dialog"
      aria-label={m.app_share_session()}
    >
      <div class="mb-3 flex items-center justify-between">
        <h4 class="text-sm font-semibold">{m.app_share_session()}</h4>
        <button
          type="button"
          class="rounded-full p-1 hover:bg-muted"
          onclick={closePopover}
          aria-label="Close"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </div>

      <!-- Copy link -->
      <Button
        variant="outline"
        size="sm"
        class="mb-3 w-full justify-start gap-2 text-xs"
        onclick={copyToClipboard}
      >
        {#if copied}
          <CheckCircle2 class="h-3.5 w-3.5 text-green-600" />
          <span>{m.app_share_copied()}</span>
        {:else}
          <Copy class="h-3.5 w-3.5" />
          <span>{m.app_share_copy_link()}</span>
        {/if}
      </Button>

      <!-- QR Code -->
      <div class="text-center">
        <p class="mb-2 text-xs text-muted-foreground">{m.app_share_qr_code()}</p>
        {#if qrCodeDataUrl}
          <div class="inline-block rounded-lg bg-white p-2">
            <img
              src={qrCodeDataUrl}
              alt={m.app_share_qr_code()}
              class="h-40 w-40"
            />
          </div>
        {:else if isGeneratingQr}
          <div class="flex h-40 w-40 mx-auto items-center justify-center rounded-lg bg-muted">
            <span class="text-xs text-muted-foreground">...</span>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
