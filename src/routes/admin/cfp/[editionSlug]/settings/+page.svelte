<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { StatusBadge } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Checkbox } from '$lib/components/ui/checkbox'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import {
  CFP_FORM_FIELDS,
  type CfpFormFieldId,
  type FieldCondition,
  type FieldConditionRule
} from '$lib/features/cfp/domain/conditional-field'
import { FieldConditionRuleBuilder } from '$lib/features/cfp/ui'
import { ArrowLeft, ChevronDown, ChevronUp, Edit2, Loader2, Plus, Trash2 } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isSubmitting = $state(false)
let showNewCategory = $state(false)
let showNewFormat = $state(false)
let showNewConditionRule = $state(false)
let editingRuleId = $state<string | null>(null)

// Current rule being edited or created
let currentRule = $state<Omit<FieldConditionRule, 'id' | 'createdAt' | 'updatedAt'>>({
  editionId: data.edition.id,
  targetFieldId: 'duration',
  name: '',
  conditions: [{ fieldId: 'formatId', operator: 'equals', value: '' }],
  conditionLogic: 'AND',
  isActive: true,
  order: 0
})

function formatDateForInput(date: Date | null): string {
  if (!date) return ''
  return date.toISOString().split('T')[0]
}

function resetRuleForm() {
  currentRule = {
    editionId: data.edition.id,
    targetFieldId: 'duration',
    name: '',
    conditions: [{ fieldId: 'formatId', operator: 'equals', value: '' }],
    conditionLogic: 'AND',
    isActive: true,
    order: 0
  }
  editingRuleId = null
  showNewConditionRule = false
}

function startEditRule(rule: (typeof data.fieldConditionRules)[0]) {
  currentRule = {
    editionId: rule.editionId,
    targetFieldId: rule.targetFieldId,
    name: rule.name,
    conditions: rule.conditions as FieldCondition[],
    conditionLogic: rule.conditionLogic as 'AND' | 'OR',
    isActive: rule.isActive,
    order: rule.order
  }
  editingRuleId = rule.id
  showNewConditionRule = true
}

const statuses = ['draft', 'published', 'archived'] as const
</script>

<svelte:head>
  <title>CFP Settings - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center gap-4">
    <a href="/admin/cfp/{data.edition.slug}/submissions">
      <Button variant="ghost" size="icon">
        <ArrowLeft class="h-4 w-4" />
      </Button>
    </a>
    <div>
      <h2 class="text-3xl font-bold tracking-tight">CFP Settings</h2>
      <p class="text-muted-foreground">
        Configure the Call for Papers for {data.edition.name}
      </p>
    </div>
  </div>

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

  <!-- CFP Status Card -->
  <Card.Root>
    <Card.Header>
      <Card.Title>CFP Status</Card.Title>
      <Card.Description>
        Control whether this CFP is visible to speakers and accepting submissions
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="flex items-center gap-4">
        <span class="text-sm text-muted-foreground">Current status:</span>
        <StatusBadge status={data.edition.status} />
      </div>
      <div class="mt-4 flex items-center gap-2">
        <span class="mr-2 text-sm text-muted-foreground">Change to:</span>
        {#each statuses as status}
          <form
            method="POST"
            action="/admin/editions/{data.edition.slug}/settings?/updateStatus"
            use:enhance={() => {
              return async ({ update }) => {
                await update()
                await invalidateAll()
              }
            }}
            class="inline"
          >
            <input type="hidden" name="status" value={status} />
            <Button
              type="submit"
              variant={data.edition.status === status ? 'default' : 'outline'}
              size="sm"
              disabled={data.edition.status === status}
            >
              {status}
            </Button>
          </form>
        {/each}
      </div>
      <p class="mt-3 text-xs text-muted-foreground">
        <strong>Draft:</strong> CFP not visible, no submissions allowed.
        <strong>Published:</strong> CFP open for submissions.
        <strong>Archived:</strong> CFP closed, submissions preserved.
      </p>
    </Card.Content>
  </Card.Root>

  <!-- Submission Settings Card -->
  <Card.Root>
    <Card.Header>
      <Card.Title>Submission Settings</Card.Title>
      <Card.Description>Configure submission dates, limits, and form requirements</Card.Description>
    </Card.Header>
    <Card.Content>
      <form
        method="POST"
        action="?/updateSettings"
        use:enhance={() => {
          isSubmitting = true
          return async ({ update }) => {
            isSubmitting = false
            await update()
          }
        }}
        class="space-y-6"
      >
        <!-- Dates -->
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="cfpOpenDate">CFP Open Date</Label>
            <Input
              id="cfpOpenDate"
              name="cfpOpenDate"
              type="date"
              value={formatDateForInput(data.settings.cfpOpenDate)}
            />
            <p class="text-xs text-muted-foreground">When speakers can start submitting talks</p>
          </div>

          <div class="space-y-2">
            <Label for="cfpCloseDate">CFP Close Date</Label>
            <Input
              id="cfpCloseDate"
              name="cfpCloseDate"
              type="date"
              value={formatDateForInput(data.settings.cfpCloseDate)}
            />
            <p class="text-xs text-muted-foreground">Deadline for talk submissions</p>
          </div>
        </div>

        <!-- Introduction Text -->
        <div class="space-y-2">
          <Label for="introText">Introduction Text</Label>
          <Textarea
            id="introText"
            name="introText"
            rows={4}
            value={data.settings.introText}
            placeholder="Welcome message for speakers..."
          />
          <p class="text-xs text-muted-foreground">
            This text will be displayed on the CFP submission page
          </p>
        </div>

        <!-- Submission Limits -->
        <div class="space-y-2">
          <Label for="maxSubmissions">Max Submissions per Speaker</Label>
          <Input
            id="maxSubmissions"
            name="maxSubmissionsPerSpeaker"
            type="number"
            min="1"
            max="10"
            value={String(data.settings.maxSubmissionsPerSpeaker)}
            class="w-24"
          />
        </div>

        <!-- Form Options -->
        <div class="space-y-4">
          <h4 class="text-sm font-medium">Form Options</h4>

          <div class="space-y-3">
            <label class="flex items-center gap-3">
              <Checkbox checked={data.settings.requireAbstract} name="requireAbstract" />
              <span class="text-sm">Require abstract</span>
            </label>

            <label class="flex items-center gap-3">
              <Checkbox checked={data.settings.requireDescription} name="requireDescription" />
              <span class="text-sm">Require detailed description</span>
            </label>

            <label class="flex items-center gap-3">
              <Checkbox checked={data.settings.allowCoSpeakers} name="allowCoSpeakers" />
              <span class="text-sm">Allow co-speakers</span>
            </label>

            <label class="flex items-center gap-3">
              <Checkbox checked={data.settings.anonymousReview} name="anonymousReview" />
              <span class="text-sm">Anonymous review (hide speaker names from reviewers)</span>
            </label>

            {#if data.settings.anonymousReview}
              <label class="ml-6 flex items-center gap-3">
                <Checkbox
                  checked={data.settings.revealSpeakersAfterDecision}
                  name="revealSpeakersAfterDecision"
                />
                <span class="text-sm">Reveal speaker names after decision is made</span>
              </label>
              <p class="ml-6 text-xs text-muted-foreground">
                When enabled, reviewers will see speaker information once a talk is accepted or rejected
              </p>
            {/if}
          </div>
        </div>

        <!-- Review Mode -->
        <div class="space-y-4">
          <h4 class="text-sm font-medium">Review Mode</h4>
          <div class="space-y-3">
            <label class="flex items-start gap-3">
              <input
                type="radio"
                name="reviewMode"
                value="stars"
                checked={data.settings.reviewMode === 'stars'}
                class="mt-1"
              />
              <div>
                <span class="text-sm font-medium">Star Rating (1-5)</span>
                <p class="text-xs text-muted-foreground">
                  Classic rating scale from 1 to 5 stars
                </p>
              </div>
            </label>

            <label class="flex items-start gap-3">
              <input
                type="radio"
                name="reviewMode"
                value="yes_no"
                checked={data.settings.reviewMode === 'yes_no'}
                class="mt-1"
              />
              <div>
                <span class="text-sm font-medium">Yes / No</span>
                <p class="text-xs text-muted-foreground">
                  Simple binary decision - accept or reject
                </p>
              </div>
            </label>

            <label class="flex items-start gap-3">
              <input
                type="radio"
                name="reviewMode"
                value="comparative"
                checked={data.settings.reviewMode === 'comparative'}
                class="mt-1"
              />
              <div>
                <span class="text-sm font-medium">Comparative Ranking (1-100)</span>
                <p class="text-xs text-muted-foreground">
                  Rank talks relative to each other on a 0-100 scale
                </p>
              </div>
            </label>
          </div>
        </div>

        <div class="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {#if isSubmitting}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              Saving...
            {:else}
              Save Settings
            {/if}
          </Button>
        </div>
      </form>
    </Card.Content>
  </Card.Root>

  <!-- Categories Card -->
  <Card.Root>
    <Card.Header>
      <div class="flex items-center justify-between">
        <div>
          <Card.Title>Categories</Card.Title>
          <Card.Description>Topics and tracks for talk submissions</Card.Description>
        </div>
        <Button size="sm" variant="outline" onclick={() => (showNewCategory = !showNewCategory)}>
          <Plus class="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>
    </Card.Header>
    <Card.Content>
      {#if showNewCategory}
        <form
          method="POST"
          action="?/addCategory"
          use:enhance={() => {
            return async ({ update }) => {
              await update()
              showNewCategory = false
            }
          }}
          class="mb-4 rounded-md border bg-muted/50 p-4"
        >
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="space-y-2">
              <Label for="cat-name">Name</Label>
              <Input id="cat-name" name="name" placeholder="Web Development" required />
            </div>
            <div class="space-y-2">
              <Label for="cat-description">Description</Label>
              <Input
                id="cat-description"
                name="description"
                placeholder="Talks about web technologies"
              />
            </div>
            <div class="space-y-2">
              <Label for="cat-color">Color</Label>
              <Input id="cat-color" name="color" type="color" value="#6b7280" class="h-10 w-full" />
            </div>
          </div>
          <div class="mt-4 flex gap-2">
            <Button type="submit" size="sm">Add</Button>
            <Button type="button" variant="ghost" size="sm" onclick={() => (showNewCategory = false)}>
              Cancel
            </Button>
          </div>
        </form>
      {/if}

      {#if data.categories.length === 0}
        <p class="text-sm text-muted-foreground">
          No categories yet. Add categories so speakers can classify their talks.
        </p>
      {:else}
        <div class="space-y-2">
          {#each data.categories as category}
            <div class="flex items-center justify-between rounded-md border bg-background p-3">
              <div class="flex items-center gap-3">
                <div
                  class="h-4 w-4 rounded-full"
                  style="background-color: {category.color}"
                ></div>
                <div>
                  <p class="font-medium">{category.name}</p>
                  {#if category.description}
                    <p class="text-sm text-muted-foreground">{category.description}</p>
                  {/if}
                </div>
              </div>
              <form method="POST" action="?/deleteCategory" use:enhance>
                <input type="hidden" name="id" value={category.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-destructive hover:text-destructive"
                  onclick={(e) => {
                    if (!confirm('Delete this category?')) {
                      e.preventDefault()
                    }
                  }}
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </form>
            </div>
          {/each}
        </div>
      {/if}
    </Card.Content>
  </Card.Root>

  <!-- Formats Card -->
  <Card.Root>
    <Card.Header>
      <div class="flex items-center justify-between">
        <div>
          <Card.Title>Talk Formats</Card.Title>
          <Card.Description>Duration and types of talks accepted</Card.Description>
        </div>
        <Button size="sm" variant="outline" onclick={() => (showNewFormat = !showNewFormat)}>
          <Plus class="mr-2 h-4 w-4" />
          Add Format
        </Button>
      </div>
    </Card.Header>
    <Card.Content>
      {#if showNewFormat}
        <form
          method="POST"
          action="?/addFormat"
          use:enhance={() => {
            return async ({ update }) => {
              await update()
              showNewFormat = false
            }
          }}
          class="mb-4 rounded-md border bg-muted/50 p-4"
        >
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="space-y-2">
              <Label for="fmt-name">Name</Label>
              <Input id="fmt-name" name="name" placeholder="Conference Talk" required />
            </div>
            <div class="space-y-2">
              <Label for="fmt-duration">Duration (minutes)</Label>
              <Input
                id="fmt-duration"
                name="duration"
                type="number"
                min="5"
                max="480"
                placeholder="45"
                required
              />
            </div>
            <div class="space-y-2">
              <Label for="fmt-description">Description</Label>
              <Input
                id="fmt-description"
                name="description"
                placeholder="Standard conference session"
              />
            </div>
          </div>
          <div class="mt-4 flex gap-2">
            <Button type="submit" size="sm">Add</Button>
            <Button type="button" variant="ghost" size="sm" onclick={() => (showNewFormat = false)}>
              Cancel
            </Button>
          </div>
        </form>
      {/if}

      {#if data.formats.length === 0}
        <p class="text-sm text-muted-foreground">
          No formats yet. Add formats so speakers can choose the type of talk they want to give.
        </p>
      {:else}
        <div class="space-y-2">
          {#each data.formats as format}
            <div class="flex items-center justify-between rounded-md border bg-background p-3">
              <div>
                <p class="font-medium">{format.name}</p>
                <p class="text-sm text-muted-foreground">
                  {format.duration} minutes
                  {#if format.description}
                    - {format.description}
                  {/if}
                </p>
              </div>
              <form method="POST" action="?/deleteFormat" use:enhance>
                <input type="hidden" name="id" value={format.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-destructive hover:text-destructive"
                  onclick={(e) => {
                    if (!confirm('Delete this format?')) {
                      e.preventDefault()
                    }
                  }}
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </form>
            </div>
          {/each}
        </div>
      {/if}
    </Card.Content>
  </Card.Root>

  <!-- Conditional Fields Card -->
  <Card.Root>
    <Card.Header>
      <div class="flex items-center justify-between">
        <div>
          <Card.Title>Conditional Fields</Card.Title>
          <Card.Description>
            Show or hide form fields based on speaker selections
          </Card.Description>
        </div>
        <Button
          size="sm"
          variant="outline"
          onclick={() => {
            resetRuleForm()
            showNewConditionRule = !showNewConditionRule
          }}
        >
          <Plus class="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </div>
    </Card.Header>
    <Card.Content>
      {#if showNewConditionRule}
        <form
          method="POST"
          action={editingRuleId ? '?/updateConditionRule' : '?/addConditionRule'}
          use:enhance={() => {
            return async ({ update }) => {
              await update()
              resetRuleForm()
            }
          }}
          class="mb-4 rounded-md border bg-muted/50 p-4"
        >
          {#if editingRuleId}
            <input type="hidden" name="id" value={editingRuleId} />
          {/if}
          <input type="hidden" name="conditions" value={JSON.stringify(currentRule.conditions)} />
          <input type="hidden" name="conditionLogic" value={currentRule.conditionLogic} />
          {#if currentRule.isActive}
            <input type="hidden" name="isActive" value="true" />
          {/if}

          <FieldConditionRuleBuilder
            rule={currentRule}
            onUpdate={(r) => (currentRule = r)}
          />

          <!-- Hidden inputs for form submission -->
          <input type="hidden" name="name" value={currentRule.name} />
          <input type="hidden" name="targetFieldId" value={currentRule.targetFieldId} />

          <div class="mt-4 flex gap-2">
            <Button type="submit" size="sm">
              {editingRuleId ? 'Update Rule' : 'Add Rule'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onclick={resetRuleForm}>
              Cancel
            </Button>
          </div>
        </form>
      {/if}

      {#if data.fieldConditionRules.length === 0}
        <p class="text-sm text-muted-foreground">
          No conditional field rules yet. Add rules to show or hide fields based on the speaker's
          selections (e.g., show "Duration" only when format is "Workshop").
        </p>
      {:else}
        <div class="space-y-2">
          {#each data.fieldConditionRules as rule}
            <div
              class="flex items-center justify-between rounded-md border bg-background p-3"
              class:opacity-50={!rule.isActive}
            >
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <p class="font-medium">{rule.name}</p>
                  {#if !rule.isActive}
                    <span class="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Disabled
                    </span>
                  {/if}
                </div>
                <p class="text-sm text-muted-foreground">
                  Show "{CFP_FORM_FIELDS[rule.targetFieldId as CfpFormFieldId]?.label || rule.targetFieldId}"
                  when {rule.conditionLogic === 'AND' ? 'all' : 'any'} of {rule.conditions.length}
                  condition{rule.conditions.length !== 1 ? 's' : ''} {rule.conditions.length !== 1 ? 'are' : 'is'} met
                </p>
              </div>
              <div class="flex items-center gap-1">
                <!-- Toggle Active -->
                <form method="POST" action="?/toggleConditionRule" use:enhance>
                  <input type="hidden" name="id" value={rule.id} />
                  <input type="hidden" name="isActive" value={String(rule.isActive)} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    title={rule.isActive ? 'Disable rule' : 'Enable rule'}
                  >
                    {#if rule.isActive}
                      <ChevronDown class="h-4 w-4" />
                    {:else}
                      <ChevronUp class="h-4 w-4" />
                    {/if}
                  </Button>
                </form>
                <!-- Edit -->
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8"
                  onclick={() => startEditRule(rule)}
                >
                  <Edit2 class="h-4 w-4" />
                </Button>
                <!-- Delete -->
                <form method="POST" action="?/deleteConditionRule" use:enhance>
                  <input type="hidden" name="id" value={rule.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-destructive hover:text-destructive"
                    onclick={(e) => {
                      if (!confirm('Delete this rule?')) {
                        e.preventDefault()
                      }
                    }}
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </Card.Content>
  </Card.Root>

  <!-- Quick Links -->
  <Card.Root>
    <Card.Header>
      <Card.Title>Related Settings</Card.Title>
      <Card.Description>Manage other aspects of this edition</Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="flex gap-2">
        <a href="/admin/editions/{data.edition.slug}/settings">
          <Button variant="outline">Edition Settings</Button>
        </a>
        <a href="/admin/cfp/{data.edition.slug}/submissions">
          <Button variant="outline">View Submissions</Button>
        </a>
      </div>
    </Card.Content>
  </Card.Root>
</div>
