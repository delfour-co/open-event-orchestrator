<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as m from '$lib/paraglide/messages'
import { Loader2 } from 'lucide-svelte'
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

<Card.Root>
  <Card.Header>
    <Card.Title>{m.admin_org_settings_legal_title()}</Card.Title>
    <Card.Description>{m.admin_org_settings_legal_description()}</Card.Description>
  </Card.Header>
  <Card.Content>
    <form
      method="POST"
      action="?/updateLegal"
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
          <Label for="org-legal-name">{m.admin_org_settings_legal_name()}</Label>
          <Input
            id="org-legal-name"
            name="legalName"
            value={data.organization.legalName}
            placeholder="ACME SAS"
          />
        </div>
        <div class="space-y-2">
          <Label for="org-legal-form">{m.admin_org_settings_legal_form()}</Label>
          <Input
            id="org-legal-form"
            name="legalForm"
            value={data.organization.legalForm}
            placeholder="SAS"
          />
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <Label for="org-siret">{m.admin_org_settings_siret()}</Label>
          <Input
            id="org-siret"
            name="siret"
            value={data.organization.siret}
            placeholder="123 456 789 00012"
          />
        </div>
        <div class="space-y-2">
          <Label for="org-rcs-number">{m.admin_org_settings_rcs_number()}</Label>
          <Input
            id="org-rcs-number"
            name="rcsNumber"
            value={data.organization.rcsNumber}
            placeholder="Paris B 123 456 789"
          />
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <Label for="org-vat-number">{m.admin_org_settings_vat_number()}</Label>
          <Input
            id="org-vat-number"
            name="vatNumber"
            value={data.organization.vatNumber}
            placeholder="FR12345678901"
          />
        </div>
        <div class="space-y-2">
          <Label for="org-share-capital">{m.admin_org_settings_share_capital()}</Label>
          <Input
            id="org-share-capital"
            name="shareCapital"
            value={data.organization.shareCapital}
            placeholder="10 000 EUR"
          />
        </div>
      </div>

      <div class="space-y-2">
        <Label for="org-address">{m.admin_org_settings_address()}</Label>
        <Input
          id="org-address"
          name="address"
          value={data.organization.address}
          placeholder="123 rue de la Paix"
        />
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <div class="space-y-2">
          <Label for="org-postal-code">{m.admin_org_settings_postal_code()}</Label>
          <Input
            id="org-postal-code"
            name="postalCode"
            value={data.organization.postalCode}
            placeholder="75001"
          />
        </div>
        <div class="space-y-2">
          <Label for="org-city">{m.admin_org_settings_city()}</Label>
          <Input
            id="org-city"
            name="city"
            value={data.organization.city}
            placeholder="Paris"
          />
        </div>
        <div class="space-y-2">
          <Label for="org-country">{m.admin_org_settings_country()}</Label>
          <Input
            id="org-country"
            name="country"
            value={data.organization.country}
            placeholder="France"
          />
        </div>
      </div>

      <div class="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {#if isSubmitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            Saving...
          {:else}
            Save Legal Information
          {/if}
        </Button>
      </div>
    </form>
  </Card.Content>
</Card.Root>
