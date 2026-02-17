<script lang="ts">
import { calculatePasswordStrength } from '$lib/features/auth/domain'
import * as m from '$lib/paraglide/messages'
import { cn } from '$lib/utils'

type Props = {
  password: string
  class?: string
}

const { password, class: className }: Props = $props()

const strength = $derived(calculatePasswordStrength(password))

const colorClasses: Record<number, string> = {
  0: 'bg-red-500',
  1: 'bg-orange-500',
  2: 'bg-yellow-500',
  3: 'bg-lime-500',
  4: 'bg-green-500'
}

const textColorClasses: Record<number, string> = {
  0: 'text-red-600 dark:text-red-400',
  1: 'text-orange-600 dark:text-orange-400',
  2: 'text-yellow-600 dark:text-yellow-400',
  3: 'text-lime-600 dark:text-lime-400',
  4: 'text-green-600 dark:text-green-400'
}

// Map labels to translation keys
const getLabelTranslation = (label: string): string => {
  const labelMap: Record<string, () => string> = {
    'Too short': m.password_strength_too_short,
    'Very weak': m.password_strength_very_weak,
    Weak: m.password_strength_weak,
    Fair: m.password_strength_fair,
    Good: m.password_strength_good,
    Strong: m.password_strength_strong
  }
  return labelMap[label]?.() ?? label
}

// Map suggestions to translation keys
const getSuggestionTranslation = (suggestion: string): string => {
  const suggestionMap: Record<string, () => string> = {
    'Enter a password': m.password_strength_enter,
    'Use at least 8 characters': m.password_strength_min_8,
    'Consider using 12+ characters': m.password_strength_min_12,
    'Mix uppercase and lowercase letters': m.password_strength_mix_case,
    'Add numbers': m.password_strength_add_numbers,
    'Add special characters (!@#$%^&*)': m.password_strength_add_special
  }
  return suggestionMap[suggestion]?.() ?? suggestion
}
</script>

<div class={cn('space-y-2', className)}>
  <!-- Strength bars -->
  <div class="flex gap-1">
    {#each [0, 1, 2, 3] as index}
      <div
        class={cn(
          'h-1.5 flex-1 rounded-full transition-colors duration-200',
          strength.score > index ? colorClasses[strength.score] : 'bg-muted'
        )}
      ></div>
    {/each}
  </div>

  <!-- Label and suggestions -->
  {#if password}
    <div class="space-y-1">
      <p class={cn('text-xs font-medium', textColorClasses[strength.score])}>
        {getLabelTranslation(strength.label)}
      </p>
      {#if strength.suggestions.length > 0}
        <ul class="text-xs text-muted-foreground">
          {#each strength.suggestions as suggestion}
            <li class="flex items-center gap-1">
              <span class="text-muted-foreground/60">-</span>
              {getSuggestionTranslation(suggestion)}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>
