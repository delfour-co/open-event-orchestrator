<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import {
  Building2,
  Calendar,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Rocket,
  X
} from 'lucide-svelte'

interface Organization {
  id: string
  name: string
  slug: string
}

interface Props {
  organizations: Organization[]
  onClose: () => void
  onSuccess?: (editionSlug: string) => void
}

const { organizations, onClose, onSuccess }: Props = $props()

type WizardStep = 'organization' | 'event' | 'edition'

// Extract initial values to avoid state_referenced_locally warning
const initCreateNewOrg = organizations.length === 0
const initSelectedOrgId = organizations[0]?.id || ''

let currentStep = $state<WizardStep>('organization')
let isSubmitting = $state(false)
let errorMessage = $state<string | null>(null)

// Organization step state
let createNewOrg = $state(initCreateNewOrg)
let selectedOrgId = $state<string>(initSelectedOrgId)
let newOrgName = $state('')
let newOrgSlug = $state('')
let newOrgDescription = $state('')

// Event step state
let eventName = $state('')
let eventSlug = $state('')
let eventDescription = $state('')

// Edition step state
let editionName = $state('')
let editionSlug = $state('')
let editionYear = $state(String(new Date().getFullYear()))
let editionStartDate = $state('')
let editionEndDate = $state('')
let editionVenue = $state('')
let editionCity = $state('')
let editionCountry = $state('')

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const handleOrgNameChange = (e: Event) => {
  const value = (e.target as HTMLInputElement).value
  newOrgName = value
  newOrgSlug = generateSlug(value)
}

const handleEventNameChange = (e: Event) => {
  const value = (e.target as HTMLInputElement).value
  eventName = value
  eventSlug = generateSlug(value)
}

const handleEditionNameChange = (e: Event) => {
  const value = (e.target as HTMLInputElement).value
  editionName = value
  editionSlug = generateSlug(value)
}

const canProceedFromOrg = $derived(
  createNewOrg ? newOrgName.length >= 2 && newOrgSlug.length >= 2 : selectedOrgId !== ''
)

const canProceedFromEvent = $derived(eventName.length >= 2 && eventSlug.length >= 2)

const canSubmit = $derived(
  editionName.length >= 2 &&
    editionSlug.length >= 2 &&
    Number.parseInt(editionYear) >= 2000 &&
    editionStartDate !== '' &&
    editionEndDate !== ''
)

const goToStep = (step: WizardStep) => {
  errorMessage = null
  currentStep = step
}

const goNext = () => {
  if (currentStep === 'organization' && canProceedFromOrg) {
    goToStep('event')
  } else if (currentStep === 'event' && canProceedFromEvent) {
    goToStep('edition')
  }
}

const goBack = () => {
  if (currentStep === 'event') {
    goToStep('organization')
  } else if (currentStep === 'edition') {
    goToStep('event')
  }
}

const steps: { key: WizardStep; label: string; icon: typeof Building2 }[] = [
  { key: 'organization', label: 'Organization', icon: Building2 },
  { key: 'event', label: 'Event', icon: CalendarDays },
  { key: 'edition', label: 'Edition', icon: Calendar }
]

const currentStepIndex = $derived(steps.findIndex((s) => s.key === currentStep))
</script>

<div class="fixed inset-0 z-50 bg-black/80 animate-in fade-in-0">
  <div
    class="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] border bg-background shadow-lg animate-in fade-in-0 zoom-in-95 sm:rounded-lg"
    role="dialog"
    aria-modal="true"
    aria-labelledby="wizard-title"
  >
    <Card.Root class="border-0">
      <Card.Header class="relative pb-4">
        <button
          type="button"
          onclick={onClose}
          class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          data-testid="wizard-close"
        >
          <X class="h-4 w-4" />
          <span class="sr-only">Close</span>
        </button>
        <Card.Title id="wizard-title" class="flex items-center gap-2">
          <Rocket class="h-5 w-5" />
          Quick Setup Wizard
        </Card.Title>
        <Card.Description>
          Create your organization, event, and first edition in just a few steps.
        </Card.Description>

        <!-- Step indicators -->
        <div class="mt-4 flex items-center justify-center gap-2">
          {#each steps as step, index}
            <div class="flex items-center">
              <button
                type="button"
                onclick={() => {
                  if (index < currentStepIndex) goToStep(step.key)
                }}
                disabled={index > currentStepIndex}
                class="flex items-center gap-2 rounded-full px-3 py-1 text-sm transition-colors {currentStep ===
                step.key
                  ? 'bg-primary text-primary-foreground'
                  : index < currentStepIndex
                    ? 'bg-primary/20 text-primary hover:bg-primary/30'
                    : 'bg-muted text-muted-foreground'}"
                data-testid="wizard-step-{step.key}"
              >
                {#if index < currentStepIndex}
                  <Check class="h-4 w-4" />
                {:else}
                  {@const Icon = step.icon}
                  <Icon class="h-4 w-4" />
                {/if}
                <span class="hidden sm:inline">{step.label}</span>
                <span class="sm:hidden">{index + 1}</span>
              </button>
              {#if index < steps.length - 1}
                <div class="mx-2 h-px w-8 bg-border"></div>
              {/if}
            </div>
          {/each}
        </div>
      </Card.Header>

      <Card.Content>
        {#if errorMessage}
          <div
            class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
          >
            {errorMessage}
          </div>
        {/if}

        <form
          method="POST"
          action="/admin?/quickSetup"
          use:enhance={() => {
            isSubmitting = true
            errorMessage = null
            return async ({ result }) => {
              isSubmitting = false
              if (result.type === 'success' && result.data) {
                const data = result.data as { editionSlug?: string }
                if (data.editionSlug) {
                  onSuccess?.(data.editionSlug)
                }
                onClose()
              } else if (result.type === 'failure' && result.data) {
                const data = result.data as { error?: string }
                errorMessage = data.error || 'An error occurred'
              }
            }
          }}
        >
          <!-- Hidden fields to submit all data -->
          <input type="hidden" name="createNewOrg" value={createNewOrg ? 'true' : 'false'} />
          <input type="hidden" name="selectedOrgId" value={selectedOrgId} />
          <input type="hidden" name="newOrgName" value={newOrgName} />
          <input type="hidden" name="newOrgSlug" value={newOrgSlug} />
          <input type="hidden" name="newOrgDescription" value={newOrgDescription} />
          <input type="hidden" name="eventName" value={eventName} />
          <input type="hidden" name="eventSlug" value={eventSlug} />
          <input type="hidden" name="eventDescription" value={eventDescription} />
          <input type="hidden" name="editionName" value={editionName} />
          <input type="hidden" name="editionSlug" value={editionSlug} />
          <input type="hidden" name="editionYear" value={editionYear} />
          <input type="hidden" name="editionStartDate" value={editionStartDate} />
          <input type="hidden" name="editionEndDate" value={editionEndDate} />
          <input type="hidden" name="editionVenue" value={editionVenue} />
          <input type="hidden" name="editionCity" value={editionCity} />
          <input type="hidden" name="editionCountry" value={editionCountry} />

          <!-- Step 1: Organization -->
          {#if currentStep === 'organization'}
            <div class="space-y-4" data-testid="wizard-step-organization-content">
              <div class="flex items-center gap-2 text-lg font-medium">
                <Building2 class="h-5 w-5" />
                Step 1: Organization
              </div>
              <p class="text-sm text-muted-foreground">
                Organizations group related events together. Choose an existing organization or
                create a new one.
              </p>

              {#if organizations.length > 0}
                <div class="flex gap-4">
                  <label class="flex items-center gap-2">
                    <input
                      type="radio"
                      name="orgChoice"
                      value="existing"
                      checked={!createNewOrg}
                      onchange={() => (createNewOrg = false)}
                    />
                    Use existing
                  </label>
                  <label class="flex items-center gap-2">
                    <input
                      type="radio"
                      name="orgChoice"
                      value="new"
                      checked={createNewOrg}
                      onchange={() => (createNewOrg = true)}
                    />
                    Create new
                  </label>
                </div>
              {/if}

              {#if !createNewOrg && organizations.length > 0}
                <div class="space-y-2">
                  <Label for="select-org">Select Organization</Label>
                  <select
                    id="select-org"
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    bind:value={selectedOrgId}
                    data-testid="wizard-select-org"
                  >
                    {#each organizations as org}
                      <option value={org.id}>{org.name}</option>
                    {/each}
                  </select>
                </div>
              {:else}
                <div class="space-y-4">
                  <div class="grid gap-4 md:grid-cols-2">
                    <div class="space-y-2">
                      <Label for="new-org-name">Organization Name</Label>
                      <Input
                        id="new-org-name"
                        placeholder="My Conference Org"
                        value={newOrgName}
                        oninput={handleOrgNameChange}
                        required={createNewOrg}
                        data-testid="wizard-org-name"
                      />
                    </div>
                    <div class="space-y-2">
                      <Label for="new-org-slug">Slug</Label>
                      <Input
                        id="new-org-slug"
                        placeholder="my-conference-org"
                        bind:value={newOrgSlug}
                        required={createNewOrg}
                        data-testid="wizard-org-slug"
                      />
                    </div>
                  </div>
                  <div class="space-y-2">
                    <Label for="new-org-desc">Description (optional)</Label>
                    <Textarea
                      id="new-org-desc"
                      placeholder="A brief description of the organization..."
                      bind:value={newOrgDescription}
                      data-testid="wizard-org-description"
                    />
                  </div>
                </div>
              {/if}
            </div>
          {/if}

          <!-- Step 2: Event -->
          {#if currentStep === 'event'}
            <div class="space-y-4" data-testid="wizard-step-event-content">
              <div class="flex items-center gap-2 text-lg font-medium">
                <CalendarDays class="h-5 w-5" />
                Step 2: Event
              </div>
              <p class="text-sm text-muted-foreground">
                Create a new event. Events can have multiple editions (yearly occurrences).
              </p>

              <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <Label for="event-name">Event Name</Label>
                  <Input
                    id="event-name"
                    placeholder="DevFest"
                    value={eventName}
                    oninput={handleEventNameChange}
                    required
                    data-testid="wizard-event-name"
                  />
                </div>
                <div class="space-y-2">
                  <Label for="event-slug">Slug</Label>
                  <Input
                    id="event-slug"
                    placeholder="devfest"
                    bind:value={eventSlug}
                    required
                    data-testid="wizard-event-slug"
                  />
                </div>
              </div>
              <div class="space-y-2">
                <Label for="event-desc">Description (optional)</Label>
                <Textarea
                  id="event-desc"
                  placeholder="The biggest developer festival..."
                  bind:value={eventDescription}
                  data-testid="wizard-event-description"
                />
              </div>
            </div>
          {/if}

          <!-- Step 3: Edition -->
          {#if currentStep === 'edition'}
            <div class="space-y-4" data-testid="wizard-step-edition-content">
              <div class="flex items-center gap-2 text-lg font-medium">
                <Calendar class="h-5 w-5" />
                Step 3: Edition
              </div>
              <p class="text-sm text-muted-foreground">
                Configure the first edition of your event with dates and venue information.
              </p>

              <div class="grid gap-4 md:grid-cols-3">
                <div class="space-y-2">
                  <Label for="edition-name">Edition Name</Label>
                  <Input
                    id="edition-name"
                    placeholder="{eventName || 'Event'} 2025"
                    value={editionName}
                    oninput={handleEditionNameChange}
                    required
                    data-testid="wizard-edition-name"
                  />
                </div>
                <div class="space-y-2">
                  <Label for="edition-slug">Slug</Label>
                  <Input
                    id="edition-slug"
                    placeholder="{eventSlug || 'event'}-2025"
                    bind:value={editionSlug}
                    required
                    data-testid="wizard-edition-slug"
                  />
                </div>
                <div class="space-y-2">
                  <Label for="edition-year">Year</Label>
                  <Input
                    id="edition-year"
                    type="number"
                    min="2000"
                    max="2100"
                    bind:value={editionYear}
                    required
                    data-testid="wizard-edition-year"
                  />
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <Label for="edition-start">Start Date</Label>
                  <Input
                    id="edition-start"
                    type="date"
                    bind:value={editionStartDate}
                    required
                    data-testid="wizard-edition-start-date"
                  />
                </div>
                <div class="space-y-2">
                  <Label for="edition-end">End Date</Label>
                  <Input
                    id="edition-end"
                    type="date"
                    bind:value={editionEndDate}
                    required
                    data-testid="wizard-edition-end-date"
                  />
                </div>
              </div>

              <div class="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                <MapPin class="h-4 w-4" />
                Venue Information (optional)
              </div>

              <div class="grid gap-4 md:grid-cols-3">
                <div class="space-y-2">
                  <Label for="edition-venue">Venue</Label>
                  <Input
                    id="edition-venue"
                    placeholder="Convention Center"
                    bind:value={editionVenue}
                    data-testid="wizard-edition-venue"
                  />
                </div>
                <div class="space-y-2">
                  <Label for="edition-city">City</Label>
                  <Input
                    id="edition-city"
                    placeholder="Paris"
                    bind:value={editionCity}
                    data-testid="wizard-edition-city"
                  />
                </div>
                <div class="space-y-2">
                  <Label for="edition-country">Country</Label>
                  <Input
                    id="edition-country"
                    placeholder="France"
                    bind:value={editionCountry}
                    data-testid="wizard-edition-country"
                  />
                </div>
              </div>
            </div>
          {/if}

          <Card.Footer class="mt-6 flex justify-between px-0">
            <div>
              {#if currentStep !== 'organization'}
                <Button type="button" variant="outline" onclick={goBack} data-testid="wizard-back">
                  <ChevronLeft class="mr-2 h-4 w-4" />
                  Back
                </Button>
              {:else}
                <Button type="button" variant="ghost" onclick={onClose}>Cancel</Button>
              {/if}
            </div>

            <div>
              {#if currentStep === 'edition'}
                <Button type="submit" disabled={!canSubmit || isSubmitting} data-testid="wizard-submit">
                  {#if isSubmitting}
                    Creating...
                  {:else}
                    <Check class="mr-2 h-4 w-4" />
                    Create Everything
                  {/if}
                </Button>
              {:else}
                <Button
                  type="button"
                  onclick={goNext}
                  disabled={currentStep === 'organization' ? !canProceedFromOrg : !canProceedFromEvent}
                  data-testid="wizard-next"
                >
                  Next
                  <ChevronRight class="ml-2 h-4 w-4" />
                </Button>
              {/if}
            </div>
          </Card.Footer>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
</div>
