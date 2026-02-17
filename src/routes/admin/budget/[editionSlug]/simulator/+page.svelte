<script lang="ts">
import { enhance } from '$app/forms'
import { AdminSubNav } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { getBudgetNavItems } from '$lib/config'
import {
  type CostItem,
  type SimulationResults,
  type TicketTypeEstimate,
  calculateSimulation
} from '$lib/features/budget/domain'
import {
  ArrowLeft,
  Calculator,
  Loader2,
  Plus,
  Save,
  Star,
  Ticket,
  Trash2,
  TrendingDown,
  TrendingUp,
  X
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

// Currency from event
const currency = data.currency || 'USD'

// Check if we have ticket types defined
const hasTicketTypes = data.ticketTypes && data.ticketTypes.length > 0

// Ticket type estimates (initialize from data)
let ticketEstimates = $state<TicketTypeEstimate[]>(
  hasTicketTypes
    ? data.ticketTypes.map((t) => ({
        ticketTypeId: t.id,
        name: t.name,
        price: t.price,
        expectedQuantity: 0
      }))
    : []
)

// Legacy mode for presets (used when no ticket types defined)
let legacyExpectedAttendeesStr = $state('100')
let legacyTicketPriceStr = $state('50')

let sponsorshipTargetStr = $state('5000')
let fixedCosts = $state<CostItem[]>([
  { name: 'Venue', amount: 2000 },
  { name: 'A/V Equipment', amount: 500 },
  { name: 'Marketing', amount: 300 }
])
let variableCostsPerAttendee = $state<CostItem[]>([
  { name: 'Catering', amount: 30 },
  { name: 'Badge & swag', amount: 5 }
])

// Derived values
const totalExpectedAttendees = $derived(
  hasTicketTypes
    ? ticketEstimates.reduce((sum, t) => sum + t.expectedQuantity, 0)
    : Number.parseFloat(legacyExpectedAttendeesStr) || 0
)
const totalTicketRevenue = $derived(
  hasTicketTypes
    ? ticketEstimates.reduce((sum, t) => sum + t.price * t.expectedQuantity, 0)
    : (Number.parseFloat(legacyExpectedAttendeesStr) || 0) *
        (Number.parseFloat(legacyTicketPriceStr) || 0)
)
const averageTicketPrice = $derived(
  totalExpectedAttendees > 0 ? totalTicketRevenue / totalExpectedAttendees : 0
)
const sponsorshipTarget = $derived(Number.parseFloat(sponsorshipTargetStr) || 0)

let results = $state<SimulationResults | null>(null)
let showSaveDialog = $state(false)
let isSubmitting = $state(false)
let scenarioName = $state('')
let scenarioDescription = $state('')
let scenarioIsBaseline = $state(false)

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function runSimulation() {
  if (hasTicketTypes) {
    results = calculateSimulation({
      ticketEstimates,
      sponsorshipTarget,
      fixedCosts,
      variableCostsPerAttendee
    })
  } else {
    results = calculateSimulation({
      expectedAttendees: Number.parseFloat(legacyExpectedAttendeesStr) || 0,
      ticketPrice: Number.parseFloat(legacyTicketPriceStr) || 0,
      sponsorshipTarget,
      fixedCosts,
      variableCostsPerAttendee
    })
  }
}

function addFixedCost() {
  fixedCosts = [...fixedCosts, { name: '', amount: 0 }]
}

function removeFixedCost(index: number) {
  fixedCosts = fixedCosts.filter((_, i) => i !== index)
}

function addVariableCost() {
  variableCostsPerAttendee = [...variableCostsPerAttendee, { name: '', amount: 0 }]
}

function removeVariableCost(index: number) {
  variableCostsPerAttendee = variableCostsPerAttendee.filter((_, i) => i !== index)
}

function loadPreset(preset: (typeof data.presets)[0]) {
  // Presets use legacy mode - distribute attendees across ticket types if available
  const presetAttendees = preset.expectedAttendees ?? 0
  const presetTicketPrice = preset.ticketPrice ?? 0

  if (hasTicketTypes && data.ticketTypes.length > 0) {
    // Distribute expected attendees proportionally across ticket types
    const perType = Math.floor(presetAttendees / data.ticketTypes.length)
    ticketEstimates = data.ticketTypes.map((t) => ({
      ticketTypeId: t.id,
      name: t.name,
      price: t.price,
      expectedQuantity: perType
    }))
  } else {
    legacyExpectedAttendeesStr = presetAttendees.toString()
    legacyTicketPriceStr = presetTicketPrice.toString()
  }
  sponsorshipTargetStr = preset.sponsorshipTarget.toString()
  fixedCosts = [...preset.fixedCosts]
  variableCostsPerAttendee = [...preset.variableCostsPerAttendee]
  runSimulation()
}

function loadScenario(scenario: (typeof data.scenarios)[0]) {
  // Check if scenario has ticket estimates
  if (scenario.parameters.ticketEstimates && scenario.parameters.ticketEstimates.length > 0) {
    ticketEstimates = [...scenario.parameters.ticketEstimates]
  } else if (hasTicketTypes) {
    // Legacy scenario with ticket types available - reset to defaults
    ticketEstimates = data.ticketTypes.map((t) => ({
      ticketTypeId: t.id,
      name: t.name,
      price: t.price,
      expectedQuantity: 0
    }))
    // Try to distribute legacy attendees
    const attendees = scenario.parameters.expectedAttendees || 0
    if (attendees > 0 && ticketEstimates.length > 0) {
      const perType = Math.floor(attendees / ticketEstimates.length)
      ticketEstimates = ticketEstimates.map((t) => ({ ...t, expectedQuantity: perType }))
    }
  } else {
    legacyExpectedAttendeesStr = (scenario.parameters.expectedAttendees || 0).toString()
    legacyTicketPriceStr = (scenario.parameters.ticketPrice || 0).toString()
  }
  sponsorshipTargetStr = scenario.parameters.sponsorshipTarget.toString()
  fixedCosts = [...scenario.parameters.fixedCosts]
  variableCostsPerAttendee = [...scenario.parameters.variableCostsPerAttendee]
  results = scenario.results || null
}

function openSaveDialog() {
  runSimulation()
  showSaveDialog = true
}

// Run initial simulation
$effect(() => {
  if (!results) {
    runSimulation()
  }
})

$effect(() => {
  if (form?.success && form?.savedScenarioId) {
    showSaveDialog = false
    scenarioName = ''
    scenarioDescription = ''
    scenarioIsBaseline = false
  }
})
</script>

<svelte:head>
  <title>Budget Simulator - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/admin/budget">
        <Button variant="ghost" size="icon">
          <ArrowLeft class="h-5 w-5" />
        </Button>
      </a>
      <div>
        <h2 class="text-3xl font-bold tracking-tight">{data.edition.name}</h2>
        <p class="text-muted-foreground">Budget Simulator</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <Button variant="outline" onclick={openSaveDialog} disabled={!results}>
        <Save class="mr-2 h-4 w-4" />
        Save Scenario
      </Button>
      <Button onclick={runSimulation}>
        <Calculator class="mr-2 h-4 w-4" />
        Simulate
      </Button>
    </div>
  </div>

  <!-- Sub-navigation -->
  <AdminSubNav basePath="/admin/budget/{data.edition.slug}" items={getBudgetNavItems(data.edition.slug)} />

  <div class="grid gap-6 lg:grid-cols-2">
    <!-- Input Form -->
    <div class="space-y-6">
      <!-- Presets -->
      {#if data.presets.length > 0}
        <Card.Root>
          <Card.Header>
            <Card.Title class="text-lg">Quick Presets</Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="flex flex-wrap gap-2">
              {#each data.presets as preset}
                <Button variant="outline" size="sm" onclick={() => loadPreset(preset)}>
                  {preset.name}
                </Button>
              {/each}
            </div>
          </Card.Content>
        </Card.Root>
      {/if}

      <!-- Revenue Parameters -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="text-lg flex items-center gap-2">
            <Ticket class="h-5 w-5" />
            Ticket Sales Estimates
          </Card.Title>
          {#if hasTicketTypes}
            <p class="text-sm text-muted-foreground">
              Enter expected sales for each ticket type
            </p>
          {/if}
        </Card.Header>
        <Card.Content class="space-y-4">
          {#if hasTicketTypes}
            <!-- Ticket type based inputs -->
            <div class="space-y-3">
              {#each ticketEstimates as estimate, index}
                <div class="flex items-center gap-3 rounded-lg border p-3">
                  <div class="flex-1">
                    <div class="font-medium">{estimate.name}</div>
                    <div class="text-sm text-muted-foreground">{formatAmount(estimate.price)} per ticket</div>
                  </div>
                  <div class="flex items-center gap-2">
                    <Label for="qty-{index}" class="sr-only">Expected quantity</Label>
                    <Input
                      id="qty-{index}"
                      type="number"
                      min="0"
                      class="w-24"
                      value={estimate.expectedQuantity.toString()}
                      oninput={(e) => {
                        estimate.expectedQuantity = parseInt((e.target as HTMLInputElement).value, 10) || 0
                        runSimulation()
                      }}
                    />
                    <span class="text-sm text-muted-foreground">tickets</span>
                  </div>
                </div>
              {/each}
            </div>
            <!-- Summary -->
            <div class="rounded-lg bg-muted p-3 space-y-1 text-sm">
              <div class="flex justify-between">
                <span>Total attendees:</span>
                <span class="font-medium">{totalExpectedAttendees}</span>
              </div>
              <div class="flex justify-between">
                <span>Total ticket revenue:</span>
                <span class="font-medium">{formatAmount(totalTicketRevenue)}</span>
              </div>
              <div class="flex justify-between text-muted-foreground">
                <span>Average ticket price:</span>
                <span>{formatAmount(averageTicketPrice)}</span>
              </div>
            </div>
          {:else}
            <!-- Legacy mode - no ticket types defined -->
            <div class="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground mb-4">
              <p>No ticket types defined for this edition.</p>
              <p>Using manual input mode.</p>
              <a href="/admin/billing/{data.edition.slug}/ticket-types" class="text-primary hover:underline">
                Configure ticket types
              </a>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <Label for="attendees">Expected Attendees</Label>
                <Input
                  id="attendees"
                  type="number"
                  min="0"
                  bind:value={legacyExpectedAttendeesStr}
                  onchange={runSimulation}
                />
              </div>
              <div class="space-y-2">
                <Label for="ticket-price">Ticket Price ({currency})</Label>
                <Input
                  id="ticket-price"
                  type="number"
                  min="0"
                  step="0.01"
                  bind:value={legacyTicketPriceStr}
                  onchange={runSimulation}
                />
              </div>
            </div>
          {/if}

          <!-- Sponsorship (always shown) -->
          <div class="pt-4 border-t">
            <div class="space-y-2">
              <Label for="sponsorship">Sponsorship Target ({currency})</Label>
              <Input
                id="sponsorship"
                type="number"
                min="0"
                step="0.01"
                bind:value={sponsorshipTargetStr}
                onchange={runSimulation}
              />
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Fixed Costs -->
      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between">
          <Card.Title class="text-lg">Fixed Costs</Card.Title>
          <Button variant="outline" size="sm" onclick={addFixedCost}>
            <Plus class="mr-1 h-3 w-3" />
            Add
          </Button>
        </Card.Header>
        <Card.Content class="space-y-3">
          {#each fixedCosts as cost, index}
            <div class="flex items-center gap-2">
              <Input
                placeholder="Cost name"
                bind:value={cost.name}
                class="flex-1"
              />
              <Input
                type="number"
                min="0"
                placeholder="Amount"
                value={cost.amount.toString()}
                oninput={(e) => { cost.amount = parseInt((e.target as HTMLInputElement).value, 10) || 0 }}
                class="w-32"
                onchange={runSimulation}
              />
              <Button variant="ghost" size="icon" onclick={() => removeFixedCost(index)}>
                <X class="h-4 w-4" />
              </Button>
            </div>
          {/each}
          {#if fixedCosts.length === 0}
            <p class="text-sm text-muted-foreground">No fixed costs added</p>
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Variable Costs -->
      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between">
          <Card.Title class="text-lg">Variable Costs (per attendee)</Card.Title>
          <Button variant="outline" size="sm" onclick={addVariableCost}>
            <Plus class="mr-1 h-3 w-3" />
            Add
          </Button>
        </Card.Header>
        <Card.Content class="space-y-3">
          {#each variableCostsPerAttendee as cost, index}
            <div class="flex items-center gap-2">
              <Input
                placeholder="Cost name"
                bind:value={cost.name}
                class="flex-1"
              />
              <Input
                type="number"
                min="0"
                placeholder="Amount"
                value={cost.amount.toString()}
                oninput={(e) => { cost.amount = parseInt((e.target as HTMLInputElement).value, 10) || 0 }}
                class="w-32"
                onchange={runSimulation}
              />
              <Button variant="ghost" size="icon" onclick={() => removeVariableCost(index)}>
                <X class="h-4 w-4" />
              </Button>
            </div>
          {/each}
          {#if variableCostsPerAttendee.length === 0}
            <p class="text-sm text-muted-foreground">No variable costs added</p>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Results -->
    <div class="space-y-6">
      {#if results}
        <!-- Key Metrics -->
        <div class="grid gap-4 md:grid-cols-2">
          <Card.Root class={results.netProfit >= 0 ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}>
            <Card.Header class="flex flex-row items-center justify-between pb-2">
              <Card.Title class="text-sm font-medium">Net Profit</Card.Title>
              {#if results.netProfit >= 0}
                <TrendingUp class="h-4 w-4 text-green-600" />
              {:else}
                <TrendingDown class="h-4 w-4 text-red-600" />
              {/if}
            </Card.Header>
            <Card.Content>
              <div class="text-2xl font-bold {results.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}">
                {formatAmount(results.netProfit)}
              </div>
              <p class="text-xs text-muted-foreground">
                {results.profitMargin.toFixed(1)}% margin
              </p>
            </Card.Content>
          </Card.Root>

          <Card.Root>
            <Card.Header class="flex flex-row items-center justify-between pb-2">
              <Card.Title class="text-sm font-medium">Break-even</Card.Title>
              <Calculator class="h-4 w-4 text-muted-foreground" />
            </Card.Header>
            <Card.Content>
              <div class="text-2xl font-bold">{results.breakEvenAttendees}</div>
              <p class="text-xs text-muted-foreground">
                attendees to break even
              </p>
            </Card.Content>
          </Card.Root>
        </div>

        <!-- Revenue Breakdown -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="text-lg">Revenue Breakdown</Card.Title>
          </Card.Header>
          <Card.Content class="space-y-4">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Ticket Revenue</span>
              <span class="font-medium">{formatAmount(results.ticketRevenue)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Sponsorship Revenue</span>
              <span class="font-medium">{formatAmount(results.sponsorshipRevenue)}</span>
            </div>
            <div class="border-t pt-2">
              <div class="flex justify-between">
                <span class="font-semibold">Total Revenue</span>
                <span class="font-bold text-green-600">{formatAmount(results.totalRevenue)}</span>
              </div>
            </div>
          </Card.Content>
        </Card.Root>

        <!-- Cost Breakdown -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="text-lg">Cost Breakdown</Card.Title>
          </Card.Header>
          <Card.Content class="space-y-4">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Fixed Costs</span>
              <span class="font-medium">{formatAmount(results.fixedCostsTotal)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Variable Costs ({totalExpectedAttendees} × {formatAmount(variableCostsPerAttendee.reduce((sum, c) => sum + c.amount, 0))})</span>
              <span class="font-medium">{formatAmount(results.variableCostsTotal)}</span>
            </div>
            <div class="border-t pt-2">
              <div class="flex justify-between">
                <span class="font-semibold">Total Costs</span>
                <span class="font-bold text-orange-600">{formatAmount(results.totalCosts)}</span>
              </div>
            </div>
          </Card.Content>
        </Card.Root>

        <!-- Summary -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="text-lg">Summary</Card.Title>
          </Card.Header>
          <Card.Content class="space-y-2 text-sm">
            {#if hasTicketTypes}
              <p>
                With <strong>{totalExpectedAttendees}</strong> attendees across {ticketEstimates.filter(t => t.expectedQuantity > 0).length} ticket types
                (avg. <strong>{formatAmount(averageTicketPrice)}</strong>/ticket)
                and <strong>{formatAmount(sponsorshipTarget)}</strong> in sponsorships:
              </p>
            {:else}
              <p>
                With <strong>{totalExpectedAttendees}</strong> attendees at <strong>{formatAmount(averageTicketPrice)}</strong> per ticket
                and <strong>{formatAmount(sponsorshipTarget)}</strong> in sponsorships:
              </p>
            {/if}
            <ul class="list-disc pl-5 space-y-1">
              <li>Total revenue: <strong>{formatAmount(results.totalRevenue)}</strong></li>
              <li>Total costs: <strong>{formatAmount(results.totalCosts)}</strong></li>
              <li>
                {results.netProfit >= 0 ? 'Profit' : 'Loss'}:
                <strong class={results.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatAmount(Math.abs(results.netProfit))}
                </strong>
              </li>
              <li>Break-even at <strong>{results.breakEvenAttendees}</strong> attendees (at avg. price)</li>
              <li>Or at <strong>{formatAmount(results.breakEvenTicketPrice)}</strong> avg. ticket price</li>
            </ul>
          </Card.Content>
        </Card.Root>
      {/if}

      <!-- Saved Scenarios -->
      {#if data.scenarios.length > 0}
        <Card.Root>
          <Card.Header>
            <Card.Title class="text-lg">Saved Scenarios</Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="space-y-2">
              {#each data.scenarios as scenario}
                <div class="flex items-center justify-between rounded-lg border p-3">
                  <div class="flex items-center gap-2">
                    {#if scenario.isBaseline}
                      <Star class="h-4 w-4 text-yellow-500" />
                    {/if}
                    <div>
                      <div class="font-medium">{scenario.name}</div>
                      {#if scenario.results}
                        <div class="text-xs text-muted-foreground">
                          {formatAmount(scenario.results.netProfit)} profit
                        </div>
                      {/if}
                    </div>
                  </div>
                  <div class="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onclick={() => loadScenario(scenario)}>
                      Load
                    </Button>
                    {#if !scenario.isBaseline}
                      <form method="POST" action="?/setBaseline" use:enhance>
                        <input type="hidden" name="scenarioId" value={scenario.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          <Star class="h-3 w-3" />
                        </Button>
                      </form>
                    {/if}
                    <form method="POST" action="?/deleteScenario" use:enhance>
                      <input type="hidden" name="id" value={scenario.id} />
                      <Button type="submit" variant="ghost" size="sm" class="text-destructive">
                        <Trash2 class="h-3 w-3" />
                      </Button>
                    </form>
                  </div>
                </div>
              {/each}
            </div>
          </Card.Content>
        </Card.Root>
      {/if}
    </div>
  </div>
</div>

<!-- Save Scenario Dialog -->
{#if showSaveDialog}
  <Dialog.Content class="max-w-md" onClose={() => showSaveDialog = false}>
      <Dialog.Header>
        <Dialog.Title>Save Scenario</Dialog.Title>
        <Dialog.Description>
          Save this simulation as a scenario for future reference.
        </Dialog.Description>
      </Dialog.Header>

      <form
        method="POST"
        action="?/saveScenario"
        use:enhance={() => {
          isSubmitting = true
          return async ({ update }) => {
            isSubmitting = false
            await update()
          }
        }}
        class="space-y-4"
      >
        <input type="hidden" name="parameters" value={JSON.stringify(
          hasTicketTypes
            ? {
                ticketEstimates,
                sponsorshipTarget,
                fixedCosts,
                variableCostsPerAttendee
              }
            : {
                expectedAttendees: parseFloat(legacyExpectedAttendeesStr) || 0,
                ticketPrice: parseFloat(legacyTicketPriceStr) || 0,
                sponsorshipTarget,
                fixedCosts,
                variableCostsPerAttendee
              }
        )} />

        <div class="space-y-2">
          <Label for="scenario-name">Name *</Label>
          <Input
            id="scenario-name"
            name="name"
            placeholder="e.g., Optimistic forecast"
            required
            bind:value={scenarioName}
          />
        </div>

        <div class="space-y-2">
          <Label for="scenario-description">Description</Label>
          <Textarea
            id="scenario-description"
            name="description"
            placeholder="Optional description..."
            bind:value={scenarioDescription}
          />
        </div>

        <div class="flex items-center gap-2">
          <input
            id="is-baseline"
            name="isBaseline"
            type="checkbox"
            bind:checked={scenarioIsBaseline}
            value="true"
            class="h-4 w-4 rounded border-gray-300"
          />
          <Label for="is-baseline" class="text-sm">Set as baseline scenario</Label>
        </div>

        {#if results}
          <div class="rounded-lg bg-muted p-3 text-sm">
            <p><strong>Summary:</strong></p>
            <p>{totalExpectedAttendees} attendees, {formatAmount(results.netProfit)} profit</p>
          </div>
        {/if}

        <Dialog.Footer>
          <Button type="button" variant="outline" onclick={() => showSaveDialog = false}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {#if isSubmitting}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            {/if}
            Save
          </Button>
        </Dialog.Footer>
      </form>
  </Dialog.Content>
{/if}
