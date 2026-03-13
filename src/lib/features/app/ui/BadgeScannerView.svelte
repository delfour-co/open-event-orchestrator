<script lang="ts">
import { browser } from '$app/environment'
import { Button } from '$lib/components/ui/button'
import { Card } from '$lib/components/ui/card'
import { contactsService, parseQrCodeData } from '$lib/features/app/services'
import type { ScannedContact } from '$lib/features/app/services'
import * as m from '$lib/paraglide/messages'
import { Camera, Download, Loader2, ScanLine, Trash2, User, X } from 'lucide-svelte'

interface Props {
  editionSlug: string
}

const { editionSlug }: Props = $props()

// Scanner state
let scannerActive = $state(false)
let isInitializing = $state(false)
let scanError = $state<string | null>(null)
let html5QrCode: unknown = null

// Scanned contact preview
let pendingContact = $state<Omit<ScannedContact, 'id' | 'scannedAt'> | null>(null)
let addSuccess = $state(false)
let addError = $state<string | null>(null)

// Contact list
let contacts = $state<ScannedContact[]>([])
let isLoading = $state(true)

// Delete confirmation
let deleteId = $state<string | null>(null)

// Load contacts on mount
let hasInitialized = false
$effect(() => {
  if (!browser || hasInitialized) return
  hasInitialized = true
  loadContacts()
})

async function loadContacts(): Promise<void> {
  isLoading = true
  try {
    contacts = await contactsService.getContacts(editionSlug)
  } catch {
    // Silently fail
  } finally {
    isLoading = false
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Scanner init requires sequential camera setup steps
async function startScanner(): Promise<void> {
  if (scannerActive || isInitializing) return

  isInitializing = true
  scanError = null
  pendingContact = null

  // Wait for DOM to update
  await new Promise((resolve) => setTimeout(resolve, 100))

  try {
    const { Html5Qrcode } = await import('html5-qrcode')

    const devices = await Html5Qrcode.getCameras()

    if (!devices || devices.length === 0) {
      throw new Error('No cameras found on this device')
    }

    html5QrCode = new Html5Qrcode('badge-scanner')

    // Prefer back camera
    const backCamera = devices.find(
      (d) =>
        d.label.toLowerCase().includes('back') ||
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
    )
    const cameraId = backCamera?.id || devices[0].id

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Camera initialization timed out')), 10000)
    })

    const startPromise = (
      html5QrCode as {
        start: (
          cameraId: string,
          config: { fps: number; qrbox: { width: number; height: number }; aspectRatio: number },
          onSuccess: (text: string) => void,
          onFailure: () => void
        ) => Promise<void>
      }
    ).start(
      cameraId,
      { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1.0 },
      handleScan,
      () => {
        /* ignore scan failures */
      }
    )

    await Promise.race([startPromise, timeoutPromise])

    scannerActive = true
    isInitializing = false
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)

    if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
      scanError = m.app_networking_camera_error()
    } else if (errorMessage.includes('not allowed in this document')) {
      scanError = m.app_networking_camera_error()
    } else if (errorMessage.includes('No cameras found')) {
      scanError = m.app_networking_camera_error()
    } else if (errorMessage.includes('timed out')) {
      scanError = m.app_networking_camera_error()
    } else {
      scanError = errorMessage
    }

    scannerActive = false
    isInitializing = false
  }
}

async function stopScanner(): Promise<void> {
  if (html5QrCode) {
    try {
      await (html5QrCode as { stop: () => Promise<void> }).stop()
    } catch {
      // Ignore stop errors
    }
    html5QrCode = null
    scannerActive = false
  }
}

let isResolving = $state(false)

async function resolveTicket(ticketNumber: string): Promise<void> {
  isResolving = true
  try {
    const response = await fetch('/api/tickets/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketNumber })
    })

    if (!response.ok) {
      const data = await response.json()
      scanError = data.error || m.app_networking_invalid_qr()
      setTimeout(() => {
        scanError = null
      }, 3000)
      return
    }

    const data = await response.json()
    if (data.success && data.contact) {
      pendingContact = {
        firstName: data.contact.firstName,
        lastName: data.contact.lastName,
        email: data.contact.email,
        editionSlug
      }
    } else {
      scanError = m.app_networking_invalid_qr()
      setTimeout(() => {
        scanError = null
      }, 3000)
    }
  } catch {
    scanError = m.app_networking_invalid_qr()
    setTimeout(() => {
      scanError = null
    }, 3000)
  } finally {
    isResolving = false
  }
}

async function handleScan(decodedText: string): Promise<void> {
  await stopScanner()

  const parsed = parseQrCodeData(decodedText, editionSlug)

  if (!parsed) {
    scanError = m.app_networking_invalid_qr()
    setTimeout(() => {
      scanError = null
    }, 3000)
    return
  }

  if (parsed.type === 'contact') {
    pendingContact = parsed.contact
  } else if (parsed.type === 'ticket') {
    await resolveTicket(parsed.ticketNumber)
  }
}

async function confirmAdd(): Promise<void> {
  if (!pendingContact) return

  addError = null
  try {
    await contactsService.addContact(pendingContact)
    pendingContact = null
    addSuccess = true
    await loadContacts()

    setTimeout(() => {
      addSuccess = false
    }, 2000)
  } catch (err) {
    console.error('Failed to add contact:', err)
    addError = err instanceof Error ? err.message : 'Failed to save contact'
    setTimeout(() => {
      addError = null
    }, 5000)
  }
}

function cancelAdd(): void {
  pendingContact = null
}

async function deleteContact(id: string): Promise<void> {
  try {
    await contactsService.deleteContact(id)
    deleteId = null
    await loadContacts()
  } catch {
    // Silently fail
  }
}

function exportContacts(): void {
  if (contacts.length === 0) return
  contactsService.exportToVCardFile(contacts)
}

function closeScanner(): void {
  stopScanner()
  pendingContact = null
  scanError = null
}
</script>

<div class="mx-auto max-w-2xl p-4 space-y-4">
  <h2 class="sr-only">{m.app_networking_contacts()}</h2>

  <!-- Scan Badge Button -->
  {#if isResolving}
    <Card class="p-6">
      <div class="flex flex-col items-center gap-4">
        <Loader2 class="h-8 w-8 animate-spin text-primary" />
        <p class="text-sm text-muted-foreground">{m.app_networking_resolving_badge()}</p>
      </div>
    </Card>
  {/if}

  {#if !scannerActive && !isInitializing && !pendingContact && !isResolving}
    <Card class="p-6">
      <div class="flex flex-col items-center gap-4">
        <div class="rounded-full bg-primary/10 p-4">
          <ScanLine class="h-8 w-8 text-primary" />
        </div>
        <div class="text-center">
          <h3 class="font-semibold">{m.app_networking_scan()}</h3>
          <p class="mt-1 text-sm text-muted-foreground">
            {m.app_networking_scan_prompt()}
          </p>
        </div>
        <Button onclick={startScanner} class="w-full max-w-xs">
          <Camera class="mr-2 h-4 w-4" />
          {m.app_networking_scan()}
        </Button>
      </div>
    </Card>
  {/if}

  <!-- Scanner Area -->
  {#if scannerActive || isInitializing}
    <Card class="overflow-hidden">
      <div class="relative bg-black" style="min-height: 300px;">
        <div id="badge-scanner" class="h-full w-full"></div>

        {#if isInitializing}
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-background">
            <Loader2 class="h-10 w-10 animate-spin text-primary" />
            <p class="mt-3 text-sm text-muted-foreground">{m.app_networking_initializing()}</p>
          </div>
        {/if}

        {#if scanError}
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-background p-6 text-center">
            <Camera class="h-12 w-12 text-muted-foreground" />
            <p class="mt-3 text-sm text-destructive">{scanError}</p>
            <Button variant="outline" class="mt-4" onclick={startScanner}>
              {m.app_networking_try_again()}
            </Button>
          </div>
        {/if}
      </div>
      <div class="flex justify-end p-2">
        <Button variant="ghost" size="sm" onclick={closeScanner}>
          <X class="mr-1 h-4 w-4" />
          {m.app_networking_close_scanner()}
        </Button>
      </div>
    </Card>
  {/if}

  <!-- Pending Contact Preview -->
  {#if pendingContact}
    <Card class="border-primary p-6">
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <div class="rounded-full bg-primary/10 p-2">
            <User class="h-5 w-5 text-primary" />
          </div>
          <div>
            <p class="font-semibold">{pendingContact.firstName} {pendingContact.lastName}</p>
            {#if pendingContact.company}
              <p class="text-sm text-muted-foreground">{pendingContact.company}</p>
            {/if}
          </div>
        </div>
        {#if pendingContact.email}
          <p class="text-sm">{pendingContact.email}</p>
        {/if}
        {#if pendingContact.title}
          <p class="text-sm text-muted-foreground">{pendingContact.title}</p>
        {/if}
        {#if pendingContact.phone}
          <p class="text-sm text-muted-foreground">{pendingContact.phone}</p>
        {/if}

        <div class="flex flex-col gap-2 pt-2 sm:flex-row">
          <Button onclick={confirmAdd} class="w-full sm:flex-1">
            {m.app_networking_add_contact()}
          </Button>
          <div class="flex gap-2">
            <Button variant="outline" onclick={cancelAdd} class="flex-1 sm:flex-initial">
              {m.app_networking_cancel()}
            </Button>
            <Button variant="outline" onclick={() => { cancelAdd(); startScanner(); }} class="flex-1 sm:flex-initial">
              {m.app_networking_scan_again()}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  {/if}

  <!-- Success Message -->
  {#if addSuccess}
    <div class="rounded-md bg-green-50 dark:bg-green-950 p-3 text-center text-sm text-green-800 dark:text-green-200">
      {m.app_networking_scanned()}
    </div>
  {/if}

  <!-- Error Message -->
  {#if addError}
    <div class="rounded-md border border-destructive bg-destructive/10 p-3 text-center text-sm text-destructive">
      {addError}
    </div>
  {/if}

  <!-- Contact List -->
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="font-semibold">{m.app_networking_contacts()} ({contacts.length})</h3>
      {#if contacts.length > 0}
        <Button variant="outline" size="sm" onclick={exportContacts}>
          <Download class="mr-1 h-4 w-4" />
          {m.app_networking_export()}
        </Button>
      {/if}
    </div>

    {#if isLoading}
      <div class="flex justify-center py-8">
        <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    {:else if contacts.length === 0}
      <Card class="p-8 text-center">
        <User class="mx-auto h-10 w-10 text-muted-foreground" />
        <p class="mt-3 text-sm text-muted-foreground">
          {m.app_networking_empty()}
        </p>
      </Card>
    {:else}
      {#each contacts as contact (contact.id)}
        <Card class="p-4">
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-3">
              <div class="mt-0.5 rounded-full bg-muted p-2">
                <User class="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p class="font-medium">{contact.firstName} {contact.lastName}</p>
                {#if contact.company}
                  <p class="text-sm text-muted-foreground">{contact.company}</p>
                {/if}
                <p class="text-sm text-muted-foreground">{contact.email}</p>
                {#if contact.title}
                  <p class="text-xs text-muted-foreground">{contact.title}</p>
                {/if}
                {#if contact.phone}
                  <p class="text-xs text-muted-foreground">{contact.phone}</p>
                {/if}
                <p class="mt-1 text-xs text-muted-foreground/60">
                  {new Date(contact.scannedAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div>
              {#if deleteId === contact.id}
                <div class="flex gap-1">
                  <Button variant="destructive" size="sm" onclick={() => deleteContact(contact.id)}>
                    {m.app_networking_confirm_delete()}
                  </Button>
                  <Button variant="ghost" size="sm" onclick={() => (deleteId = null)}>
                    <X class="h-4 w-4" />
                  </Button>
                </div>
              {:else}
                <Button variant="ghost" size="icon" onclick={() => (deleteId = contact.id)} aria-label={m.app_networking_delete_confirm()}>
                  <Trash2 class="h-4 w-4 text-muted-foreground" />
                </Button>
              {/if}
            </div>
          </div>
        </Card>
      {/each}
    {/if}
  </div>
</div>
