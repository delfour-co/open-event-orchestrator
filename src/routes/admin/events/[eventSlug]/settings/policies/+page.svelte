<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as m from '$lib/paraglide/messages'
import { Loader2, Mail, Shield } from 'lucide-svelte'
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

<!-- Policies & Contact Card -->
<Card.Root>
  <Card.Header>
    <Card.Title class="flex items-center gap-2">
      <Shield class="h-5 w-5" />
      {m.admin_event_policies_title()}
    </Card.Title>
    <Card.Description>{m.admin_event_policies_description()}</Card.Description>
  </Card.Header>
  <Card.Content>
    <form
      method="POST"
      action="?/updatePolicies"
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
      <div class="space-y-2">
        <Label for="event-contact-email">
          <span class="flex items-center gap-1">
            <Mail class="h-4 w-4" />
            {m.admin_event_policies_contact_email()}
          </span>
        </Label>
        <Input
          id="event-contact-email"
          name="contactEmail"
          type="email"
          value={data.event.contactEmail}
          placeholder="contact@myevent.com"
        />
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <Label for="event-coc-url">{m.admin_event_policies_coc_url()}</Label>
          <Input
            id="event-coc-url"
            name="codeOfConductUrl"
            type="url"
            value={data.event.codeOfConductUrl}
            placeholder="https://myevent.com/code-of-conduct"
          />
        </div>
        <div class="space-y-2">
          <Label for="event-privacy-url">{m.admin_event_policies_privacy_url()}</Label>
          <Input
            id="event-privacy-url"
            name="privacyPolicyUrl"
            type="url"
            value={data.event.privacyPolicyUrl}
            placeholder="https://myevent.com/privacy"
          />
        </div>
      </div>

      <div class="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {#if isSubmitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            Saving...
          {:else}
            Save Policies
          {/if}
        </Button>
      </div>
    </form>
  </Card.Content>
</Card.Root>
