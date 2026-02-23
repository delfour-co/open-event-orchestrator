<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { ArrowLeft, Check, Loader2, Lock } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()
let isSubmitting = $state(false)

const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

const getFieldError = (field: string): string | undefined => {
  if (form?.errors && field in form.errors) {
    const errors = form.errors[field as keyof typeof form.errors]
    return Array.isArray(errors) ? errors[0] : errors
  }
  return undefined
}

const getValue = (field: string): string => {
  if (form?.values && field in form.values) {
    return form.values[field as keyof typeof form.values] || ''
  }
  return ''
}
</script>

<svelte:head>
  <title>Checkout - {data.package.name} Sponsorship</title>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-12">
  <!-- Header -->
  <div class="mb-8 flex items-center gap-4">
    <a href="/sponsor/{data.edition.slug}/packages">
      <Button variant="ghost" size="icon">
        <ArrowLeft class="h-5 w-5" />
      </Button>
    </a>
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Complete Your Sponsorship</h1>
      <p class="text-muted-foreground">{data.eventName}</p>
    </div>
  </div>

  {#if form?.error}
    <div
      class="mb-6 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive"
    >
      {form.error}
    </div>
  {/if}

  <div class="grid gap-8 lg:grid-cols-5">
    <!-- Form -->
    <div class="lg:col-span-3">
      <Card.Root>
        <Card.Header>
          <Card.Title>Company Information</Card.Title>
          <Card.Description>
            This information will be used for your sponsor profile and communications.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <form
            method="POST"
            use:enhance={() => {
              isSubmitting = true
              return async ({ update }) => {
                isSubmitting = false
                await update()
              }
            }}
            class="space-y-6"
          >
            <input type="hidden" name="packageId" value={data.package.id} />

            <!-- Company Name -->
            <div class="space-y-2">
              <Label for="companyName">Company Name *</Label>
              <Input
                id="companyName"
                name="companyName"
                required
                placeholder="Acme Corporation"
                value={getValue('companyName')}
                class={getFieldError('companyName') ? 'border-destructive' : ''}
              />
              {#if getFieldError('companyName')}
                <p class="text-sm text-destructive">{getFieldError('companyName')}</p>
              {/if}
            </div>

            <!-- Website -->
            <div class="space-y-2">
              <Label for="website">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                placeholder="https://example.com"
                value={getValue('website')}
                class={getFieldError('website') ? 'border-destructive' : ''}
              />
              {#if getFieldError('website')}
                <p class="text-sm text-destructive">{getFieldError('website')}</p>
              {/if}
            </div>

            <!-- Description -->
            <div class="space-y-2">
              <Label for="description">Company Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Tell us about your company..."
                rows={3}
                value={getValue('description')}
                class={getFieldError('description') ? 'border-destructive' : ''}
              />
              {#if getFieldError('description')}
                <p class="text-sm text-destructive">{getFieldError('description')}</p>
              {/if}
              <p class="text-xs text-muted-foreground">
                This will be displayed on the event website.
              </p>
            </div>

            <div class="border-t pt-6">
              <h3 class="mb-4 font-medium">Billing Information</h3>

              <!-- Legal Name -->
              <div class="mb-4 space-y-2">
                <Label for="legalName">Legal Name *</Label>
                <Input
                  id="legalName"
                  name="legalName"
                  required
                  placeholder="Acme Corporation SAS"
                  value={getValue('legalName')}
                  class={getFieldError('legalName') ? 'border-destructive' : ''}
                />
                {#if getFieldError('legalName')}
                  <p class="text-sm text-destructive">{getFieldError('legalName')}</p>
                {/if}
              </div>

              <div class="mb-4 grid gap-4 md:grid-cols-2">
                <!-- VAT Number -->
                <div class="space-y-2">
                  <Label for="vatNumber">VAT Number</Label>
                  <Input
                    id="vatNumber"
                    name="vatNumber"
                    placeholder="FR12345678901"
                    value={getValue('vatNumber')}
                    class={getFieldError('vatNumber') ? 'border-destructive' : ''}
                  />
                  {#if getFieldError('vatNumber')}
                    <p class="text-sm text-destructive">{getFieldError('vatNumber')}</p>
                  {/if}
                </div>

                <!-- SIRET -->
                <div class="space-y-2">
                  <Label for="siret">SIRET</Label>
                  <Input
                    id="siret"
                    name="siret"
                    placeholder="123 456 789 00012"
                    value={getValue('siret')}
                    class={getFieldError('siret') ? 'border-destructive' : ''}
                  />
                  {#if getFieldError('siret')}
                    <p class="text-sm text-destructive">{getFieldError('siret')}</p>
                  {/if}
                </div>
              </div>

              <!-- Billing Address -->
              <div class="mb-4 space-y-2">
                <Label for="billingAddress">Address *</Label>
                <Input
                  id="billingAddress"
                  name="billingAddress"
                  required
                  placeholder="123 Main Street"
                  value={getValue('billingAddress')}
                  class={getFieldError('billingAddress') ? 'border-destructive' : ''}
                />
                {#if getFieldError('billingAddress')}
                  <p class="text-sm text-destructive">{getFieldError('billingAddress')}</p>
                {/if}
              </div>

              <div class="mb-4 grid gap-4 md:grid-cols-3">
                <!-- Postal Code -->
                <div class="space-y-2">
                  <Label for="billingPostalCode">Postal Code *</Label>
                  <Input
                    id="billingPostalCode"
                    name="billingPostalCode"
                    required
                    placeholder="75001"
                    value={getValue('billingPostalCode')}
                    class={getFieldError('billingPostalCode') ? 'border-destructive' : ''}
                  />
                  {#if getFieldError('billingPostalCode')}
                    <p class="text-sm text-destructive">{getFieldError('billingPostalCode')}</p>
                  {/if}
                </div>

                <!-- City -->
                <div class="space-y-2">
                  <Label for="billingCity">City *</Label>
                  <Input
                    id="billingCity"
                    name="billingCity"
                    required
                    placeholder="Paris"
                    value={getValue('billingCity')}
                    class={getFieldError('billingCity') ? 'border-destructive' : ''}
                  />
                  {#if getFieldError('billingCity')}
                    <p class="text-sm text-destructive">{getFieldError('billingCity')}</p>
                  {/if}
                </div>

                <!-- Country -->
                <div class="space-y-2">
                  <Label for="billingCountry">Country *</Label>
                  <Input
                    id="billingCountry"
                    name="billingCountry"
                    required
                    placeholder="France"
                    value={getValue('billingCountry')}
                    class={getFieldError('billingCountry') ? 'border-destructive' : ''}
                  />
                  {#if getFieldError('billingCountry')}
                    <p class="text-sm text-destructive">{getFieldError('billingCountry')}</p>
                  {/if}
                </div>
              </div>

              <!-- PO Number -->
              <div class="space-y-2">
                <Label for="poNumber">Purchase Order Number</Label>
                <Input
                  id="poNumber"
                  name="poNumber"
                  placeholder="PO-2024-001"
                  value={getValue('poNumber')}
                  class={getFieldError('poNumber') ? 'border-destructive' : ''}
                />
                {#if getFieldError('poNumber')}
                  <p class="text-sm text-destructive">{getFieldError('poNumber')}</p>
                {/if}
                <p class="text-xs text-muted-foreground">
                  Optional — will appear on the invoice if provided.
                </p>
              </div>
            </div>

            <div class="border-t pt-6">
              <h3 class="mb-4 font-medium">Contact Person</h3>

              <!-- Contact Name -->
              <div class="mb-4 space-y-2">
                <Label for="contactName">Full Name *</Label>
                <Input
                  id="contactName"
                  name="contactName"
                  required
                  placeholder="John Doe"
                  value={getValue('contactName')}
                  class={getFieldError('contactName') ? 'border-destructive' : ''}
                />
                {#if getFieldError('contactName')}
                  <p class="text-sm text-destructive">{getFieldError('contactName')}</p>
                {/if}
              </div>

              <!-- Contact Email -->
              <div class="mb-4 space-y-2">
                <Label for="contactEmail">Email *</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={getValue('contactEmail')}
                  class={getFieldError('contactEmail') ? 'border-destructive' : ''}
                />
                {#if getFieldError('contactEmail')}
                  <p class="text-sm text-destructive">{getFieldError('contactEmail')}</p>
                {/if}
                <p class="text-xs text-muted-foreground">
                  Confirmation and portal access will be sent to this email.
                </p>
              </div>

              <!-- Contact Phone -->
              <div class="space-y-2">
                <Label for="contactPhone">Phone</Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={getValue('contactPhone')}
                  class={getFieldError('contactPhone') ? 'border-destructive' : ''}
                />
                {#if getFieldError('contactPhone')}
                  <p class="text-sm text-destructive">{getFieldError('contactPhone')}</p>
                {/if}
              </div>
            </div>

            <div class="pt-4">
              <Button
                type="submit"
                class="w-full gap-2"
                size="lg"
                disabled={isSubmitting}
              >
                {#if isSubmitting}
                  <Loader2 class="h-4 w-4 animate-spin" />
                  Processing...
                {:else}
                  <Lock class="h-4 w-4" />
                  Proceed to Payment
                {/if}
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Order Summary -->
    <div class="lg:col-span-2">
      <Card.Root>
        <Card.Header>
          <Card.Title>Order Summary</Card.Title>
        </Card.Header>
        <Card.Content class="space-y-6">
          <!-- Package Details -->
          <div>
            <div class="text-lg font-semibold">{data.package.name}</div>
            <div class="text-sm text-muted-foreground">Sponsorship Package</div>
          </div>

          {#if data.package.description}
            <p class="text-sm text-muted-foreground">{data.package.description}</p>
          {/if}

          <!-- Benefits -->
          {#if data.package.benefits.length > 0}
            <div class="space-y-2">
              <div class="text-sm font-medium">Included Benefits:</div>
              <ul class="space-y-1">
                {#each data.package.benefits.filter(b => b.included) as benefit}
                  <li class="flex items-center gap-2 text-sm">
                    <Check class="h-4 w-4 text-green-600" />
                    {benefit.name}
                  </li>
                {/each}
              </ul>
            </div>
          {/if}

          <!-- Availability -->
          {#if data.package.availableSlots !== null}
            <div class="text-sm text-amber-600">
              {data.package.availableSlots} spot{data.package.availableSlots > 1 ? 's' : ''} remaining
            </div>
          {/if}

          <div class="border-t pt-4">
            <div class="flex items-center justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(data.package.price, data.package.currency)}</span>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <div class="mt-4 rounded-lg bg-muted/50 p-4 text-sm">
        <p class="text-muted-foreground">
          By completing this purchase, you agree to become a sponsor of {data.eventName}.
          You will receive access to the sponsor portal where you can manage your profile and benefits.
        </p>
      </div>
    </div>
  </div>
</div>
