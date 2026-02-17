<script lang="ts">
import { browser } from '$app/environment'
import { Button } from '$lib/components/ui/button'
import * as m from '$lib/paraglide/messages.js'
import { type Locale, getLocale, locales, setLocale } from '$lib/paraglide/runtime.js'
import { Globe } from 'lucide-svelte'

// Language display names - using translation functions
const getLanguageName = (locale: Locale): string => {
  const names: Record<Locale, () => string> = {
    en: () => m.language_english(),
    fr: () => m.language_french()
  }
  return names[locale]()
}

// Language flags/short codes
const languageCodes: Record<Locale, string> = {
  en: 'EN',
  fr: 'FR'
}

let currentLocale = $state<Locale>(browser ? getLocale() : 'en')
let isOpen = $state(false)

function handleLocaleChange(locale: Locale): void {
  setLocale(locale, { reload: true })
  currentLocale = locale
  isOpen = false
}

function toggleDropdown(): void {
  isOpen = !isOpen
}

function closeDropdown(): void {
  isOpen = false
}
</script>

<div class="relative">
  <Button
    variant="ghost"
    size="icon"
    onclick={toggleDropdown}
    aria-label={m.language_selector_label()}
    aria-expanded={isOpen}
    aria-haspopup="listbox"
  >
    <Globe class="h-5 w-5" />
    <span class="sr-only">{m.language_selector_label()}</span>
  </Button>

  {#if isOpen}
    <div
      class="absolute right-0 top-full z-50 mt-1 min-w-32 rounded-md border bg-popover p-1 shadow-md"
      role="listbox"
      aria-label={m.language_selector_label()}
    >
      {#each locales as locale}
        <button
          type="button"
          role="option"
          aria-selected={locale === currentLocale}
          class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground {locale === currentLocale ? 'bg-accent/50' : ''}"
          onclick={() => handleLocaleChange(locale)}
          data-sveltekit-reload
        >
          <span class="font-mono text-xs text-muted-foreground">{languageCodes[locale]}</span>
          <span>{getLanguageName(locale)}</span>
          {#if locale === currentLocale}
            <span class="ml-auto text-xs">*</span>
          {/if}
        </button>
      {/each}
    </div>
    <!-- Backdrop to close dropdown when clicking outside -->
    <button
      type="button"
      class="fixed inset-0 z-40"
      onclick={closeDropdown}
      aria-label={m.header_close_language_menu()}
    ></button>
  {/if}
</div>
