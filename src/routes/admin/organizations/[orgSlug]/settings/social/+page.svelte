<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as m from '$lib/paraglide/messages'
import { Globe, Loader2, Share2 } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isSubmitting = $state(false)
</script>

{#if form?.error}
  <div class="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
    {form.error}
  </div>
{/if}

{#if form?.success}
  <div class="rounded-md border border-green-500 bg-green-500/10 p-4 text-green-700 dark:text-green-400">
    {form.message}
  </div>
{/if}

<!-- Social Links Card -->
<Card.Root>
  <Card.Header>
    <Card.Title class="flex items-center gap-2">
      <Share2 class="h-5 w-5" />
      {m.admin_org_social_title()}
    </Card.Title>
    <Card.Description>{m.admin_org_social_description()}</Card.Description>
  </Card.Header>
  <Card.Content>
    <form
      method="POST"
      action="?/updateSocial"
      use:enhance={() => {
        isSubmitting = true
        return async ({ update }) => {
          isSubmitting = false
          await update()
          await invalidateAll()
        }
      }}
      class="space-y-4"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <Label for="org-twitter">{m.admin_org_social_twitter()}</Label>
          <Input
            id="org-twitter"
            name="twitter"
            type="url"
            value={data.organization.twitter}
            placeholder="https://x.com/yourorg"
          />
        </div>
        <div class="space-y-2">
          <Label for="org-linkedin">{m.admin_org_social_linkedin()}</Label>
          <Input
            id="org-linkedin"
            name="linkedin"
            type="url"
            value={data.organization.linkedin}
            placeholder="https://linkedin.com/company/yourorg"
          />
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <Label for="org-github">{m.admin_org_social_github()}</Label>
          <Input
            id="org-github"
            name="github"
            type="url"
            value={data.organization.github}
            placeholder="https://github.com/yourorg"
          />
        </div>
        <div class="space-y-2">
          <Label for="org-youtube">{m.admin_org_social_youtube()}</Label>
          <Input
            id="org-youtube"
            name="youtube"
            type="url"
            value={data.organization.youtube}
            placeholder="https://youtube.com/@yourorg"
          />
        </div>
      </div>

      <div class="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {#if isSubmitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            {m.admin_org_settings_saving()}
          {:else}
            {m.admin_org_settings_save()}
          {/if}
        </Button>
      </div>
    </form>
  </Card.Content>
</Card.Root>

<!-- Localization Card -->
<Card.Root>
  <Card.Header>
    <Card.Title class="flex items-center gap-2">
      <Globe class="h-5 w-5" />
      {m.admin_org_localization_title()}
    </Card.Title>
    <Card.Description>{m.admin_org_localization_description()}</Card.Description>
  </Card.Header>
  <Card.Content>
    <form
      method="POST"
      action="?/updateSocial"
      use:enhance={() => {
        isSubmitting = true
        return async ({ update }) => {
          isSubmitting = false
          await update()
          await invalidateAll()
        }
      }}
      class="space-y-4"
    >
      <!-- Hidden fields to preserve social links when only updating localization -->
      <input type="hidden" name="twitter" value={data.organization.twitter} />
      <input type="hidden" name="linkedin" value={data.organization.linkedin} />
      <input type="hidden" name="github" value={data.organization.github} />
      <input type="hidden" name="youtube" value={data.organization.youtube} />

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <Label for="org-timezone">{m.admin_org_localization_timezone()}</Label>
          <select
            id="org-timezone"
            name="timezone"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="" selected={!data.organization.timezone}>--</option>
            <option value="Europe/Paris" selected={data.organization.timezone === 'Europe/Paris'}>Europe/Paris</option>
            <option value="Europe/London" selected={data.organization.timezone === 'Europe/London'}>Europe/London</option>
            <option value="Europe/Berlin" selected={data.organization.timezone === 'Europe/Berlin'}>Europe/Berlin</option>
            <option value="Europe/Madrid" selected={data.organization.timezone === 'Europe/Madrid'}>Europe/Madrid</option>
            <option value="Europe/Rome" selected={data.organization.timezone === 'Europe/Rome'}>Europe/Rome</option>
            <option value="Europe/Brussels" selected={data.organization.timezone === 'Europe/Brussels'}>Europe/Brussels</option>
            <option value="Europe/Amsterdam" selected={data.organization.timezone === 'Europe/Amsterdam'}>Europe/Amsterdam</option>
            <option value="Europe/Zurich" selected={data.organization.timezone === 'Europe/Zurich'}>Europe/Zurich</option>
            <option value="America/New_York" selected={data.organization.timezone === 'America/New_York'}>America/New_York</option>
            <option value="America/Chicago" selected={data.organization.timezone === 'America/Chicago'}>America/Chicago</option>
            <option value="America/Denver" selected={data.organization.timezone === 'America/Denver'}>America/Denver</option>
            <option value="America/Los_Angeles" selected={data.organization.timezone === 'America/Los_Angeles'}>America/Los_Angeles</option>
            <option value="America/Toronto" selected={data.organization.timezone === 'America/Toronto'}>America/Toronto</option>
            <option value="America/Sao_Paulo" selected={data.organization.timezone === 'America/Sao_Paulo'}>America/Sao_Paulo</option>
            <option value="Asia/Tokyo" selected={data.organization.timezone === 'Asia/Tokyo'}>Asia/Tokyo</option>
            <option value="Asia/Shanghai" selected={data.organization.timezone === 'Asia/Shanghai'}>Asia/Shanghai</option>
            <option value="Asia/Singapore" selected={data.organization.timezone === 'Asia/Singapore'}>Asia/Singapore</option>
            <option value="Asia/Dubai" selected={data.organization.timezone === 'Asia/Dubai'}>Asia/Dubai</option>
            <option value="Australia/Sydney" selected={data.organization.timezone === 'Australia/Sydney'}>Australia/Sydney</option>
            <option value="Pacific/Auckland" selected={data.organization.timezone === 'Pacific/Auckland'}>Pacific/Auckland</option>
            <option value="UTC" selected={data.organization.timezone === 'UTC'}>UTC</option>
          </select>
        </div>
        <div class="space-y-2">
          <Label for="org-locale">{m.admin_org_localization_locale()}</Label>
          <select
            id="org-locale"
            name="defaultLocale"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="" selected={!data.organization.defaultLocale}>--</option>
            <option value="en" selected={data.organization.defaultLocale === 'en'}>English</option>
            <option value="fr" selected={data.organization.defaultLocale === 'fr'}>Français</option>
          </select>
        </div>
      </div>

      <div class="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {#if isSubmitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            {m.admin_org_settings_saving()}
          {:else}
            {m.admin_org_settings_save()}
          {/if}
        </Button>
      </div>
    </form>
  </Card.Content>
</Card.Root>
