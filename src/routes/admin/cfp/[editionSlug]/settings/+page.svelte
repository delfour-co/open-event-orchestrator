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
import * as m from '$lib/paraglide/messages'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Edit2,
  ExternalLink,
  Loader2,
  Plus,
  Trash2
} from 'lucide-svelte'
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
  <title>{m.cfp_settings_title()} - {data.edition.name} - {m.common_app_name()}</title>
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
      <h2 class="text-3xl font-bold tracking-tight">{m.cfp_settings_title()}</h2>
      <p class="text-muted-foreground">
        {m.cfp_settings_description({ name: data.edition.name })}
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
      <Card.Title>{m.cfp_settings_status_title()}</Card.Title>
      <Card.Description>
        {m.cfp_settings_status_description()}
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="flex items-center gap-4">
        <span class="text-sm text-muted-foreground">{m.cfp_settings_current_status()}</span>
        <StatusBadge status={data.edition.status} />
      </div>
      <div class="mt-4 flex items-center gap-2">
        <span class="mr-2 text-sm text-muted-foreground">{m.cfp_settings_change_to()}</span>
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
        <strong>{m.status_draft()}:</strong> {m.cfp_settings_status_draft_hint()}
        <strong>{m.status_published()}:</strong> {m.cfp_settings_status_published_hint()}
        <strong>{m.status_archived()}:</strong> {m.cfp_settings_status_archived_hint()}
      </p>
    </Card.Content>
  </Card.Root>

  <!-- Submission Settings Card -->
  <Card.Root>
    <Card.Header>
      <Card.Title>{m.cfp_settings_submission_title()}</Card.Title>
      <Card.Description>{m.cfp_settings_submission_description()}</Card.Description>
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
            <Label for="cfpOpenDate">{m.cfp_settings_open_date()}</Label>
            <Input
              id="cfpOpenDate"
              name="cfpOpenDate"
              type="date"
              value={formatDateForInput(data.settings.cfpOpenDate)}
            />
            <p class="text-xs text-muted-foreground">{m.cfp_settings_open_date_hint()}</p>
          </div>

          <div class="space-y-2">
            <Label for="cfpCloseDate">{m.cfp_settings_close_date()}</Label>
            <Input
              id="cfpCloseDate"
              name="cfpCloseDate"
              type="date"
              value={formatDateForInput(data.settings.cfpCloseDate)}
            />
            <p class="text-xs text-muted-foreground">{m.cfp_settings_close_date_hint()}</p>
          </div>
        </div>

        <!-- Introduction Text -->
        <div class="space-y-2">
          <Label for="introText">{m.cfp_settings_intro_text()}</Label>
          <Textarea
            id="introText"
            name="introText"
            rows={4}
            value={data.settings.introText}
            placeholder={m.cfp_settings_intro_placeholder()}
          />
          <p class="text-xs text-muted-foreground">
            {m.cfp_settings_intro_hint()}
          </p>
        </div>

        <!-- Submission Limits -->
        <div class="space-y-2">
          <Label for="maxSubmissions">{m.cfp_settings_max_submissions()}</Label>
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
          <h4 class="text-sm font-medium">{m.cfp_settings_form_options()}</h4>

          <div class="space-y-3">
            <label class="flex items-center gap-3">
              <Checkbox checked={data.settings.requireAbstract} name="requireAbstract" />
              <span class="text-sm">{m.cfp_settings_require_abstract()}</span>
            </label>

            <label class="flex items-center gap-3">
              <Checkbox checked={data.settings.requireDescription} name="requireDescription" />
              <span class="text-sm">{m.cfp_settings_require_description()}</span>
            </label>

            <label class="flex items-center gap-3">
              <Checkbox checked={data.settings.allowCoSpeakers} name="allowCoSpeakers" />
              <span class="text-sm">{m.cfp_settings_allow_cospeakers()}</span>
            </label>

            <label class="flex items-center gap-3">
              <Checkbox checked={data.settings.anonymousReview} name="anonymousReview" />
              <span class="text-sm">{m.cfp_settings_anonymous_review()}</span>
            </label>

            {#if data.settings.anonymousReview}
              <label class="ml-6 flex items-center gap-3">
                <Checkbox
                  checked={data.settings.revealSpeakersAfterDecision}
                  name="revealSpeakersAfterDecision"
                />
                <span class="text-sm">{m.cfp_settings_reveal_after_decision()}</span>
              </label>
              <p class="ml-6 text-xs text-muted-foreground">
                {m.cfp_settings_reveal_hint()}
              </p>
            {/if}
          </div>
        </div>

        <!-- Review Mode -->
        <div class="space-y-4">
          <h4 class="text-sm font-medium">{m.cfp_settings_review_mode()}</h4>
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
                <span class="text-sm font-medium">{m.cfp_settings_review_stars()}</span>
                <p class="text-xs text-muted-foreground">
                  {m.cfp_settings_review_stars_hint()}
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
                <span class="text-sm font-medium">{m.cfp_settings_review_yes_no()}</span>
                <p class="text-xs text-muted-foreground">
                  {m.cfp_settings_review_yes_no_hint()}
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
                <span class="text-sm font-medium">{m.cfp_settings_review_comparative()}</span>
                <p class="text-xs text-muted-foreground">
                  {m.cfp_settings_review_comparative_hint()}
                </p>
              </div>
            </label>
          </div>
        </div>

        <div class="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {#if isSubmitting}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              {m.cfp_settings_saving()}
            {:else}
              {m.cfp_settings_save()}
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
          <Card.Title>{m.cfp_categories_title()}</Card.Title>
          <Card.Description>{m.cfp_categories_description()}</Card.Description>
        </div>
        <Button size="sm" variant="outline" onclick={() => (showNewCategory = !showNewCategory)}>
          <Plus class="mr-2 h-4 w-4" />
          {m.cfp_categories_add()}
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
              <Label for="cat-name">{m.cfp_categories_name()}</Label>
              <Input id="cat-name" name="name" placeholder={m.cfp_categories_name_placeholder()} required />
            </div>
            <div class="space-y-2">
              <Label for="cat-description">{m.cfp_categories_category_description()}</Label>
              <Input
                id="cat-description"
                name="description"
                placeholder={m.cfp_categories_description_placeholder()}
              />
            </div>
            <div class="space-y-2">
              <Label for="cat-color">{m.cfp_categories_color()}</Label>
              <Input id="cat-color" name="color" type="color" value="#6b7280" class="h-10 w-full" />
            </div>
          </div>
          <div class="mt-4 flex gap-2">
            <Button type="submit" size="sm">{m.action_add()}</Button>
            <Button type="button" variant="ghost" size="sm" onclick={() => (showNewCategory = false)}>
              {m.action_cancel()}
            </Button>
          </div>
        </form>
      {/if}

      {#if data.categories.length === 0}
        <p class="text-sm text-muted-foreground">
          {m.cfp_categories_empty()}
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
                    if (!confirm(m.cfp_categories_delete_confirm())) {
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
          <Card.Title>{m.cfp_formats_title()}</Card.Title>
          <Card.Description>{m.cfp_formats_description()}</Card.Description>
        </div>
        <Button size="sm" variant="outline" onclick={() => (showNewFormat = !showNewFormat)}>
          <Plus class="mr-2 h-4 w-4" />
          {m.cfp_formats_add()}
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
              <Label for="fmt-name">{m.cfp_formats_name()}</Label>
              <Input id="fmt-name" name="name" placeholder={m.cfp_formats_name_placeholder()} required />
            </div>
            <div class="space-y-2">
              <Label for="fmt-duration">{m.cfp_formats_duration()}</Label>
              <Input
                id="fmt-duration"
                name="duration"
                type="number"
                min="5"
                max="480"
                placeholder={m.cfp_formats_duration_placeholder()}
                required
              />
            </div>
            <div class="space-y-2">
              <Label for="fmt-description">{m.cfp_formats_format_description()}</Label>
              <Input
                id="fmt-description"
                name="description"
                placeholder={m.cfp_formats_description_placeholder()}
              />
            </div>
          </div>
          <div class="mt-4 flex gap-2">
            <Button type="submit" size="sm">{m.action_add()}</Button>
            <Button type="button" variant="ghost" size="sm" onclick={() => (showNewFormat = false)}>
              {m.action_cancel()}
            </Button>
          </div>
        </form>
      {/if}

      {#if data.formats.length === 0}
        <p class="text-sm text-muted-foreground">
          {m.cfp_formats_empty()}
        </p>
      {:else}
        <div class="space-y-2">
          {#each data.formats as format}
            <div class="flex items-center justify-between rounded-md border bg-background p-3">
              <div>
                <p class="font-medium">{format.name}</p>
                <p class="text-sm text-muted-foreground">
                  {m.cfp_formats_minutes({ duration: format.duration })}
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
                    if (!confirm(m.cfp_formats_delete_confirm())) {
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
          <Card.Title>{m.cfp_conditional_title()}</Card.Title>
          <Card.Description>
            {m.cfp_conditional_description()}
          </Card.Description>
        </div>
        <div class="flex gap-2">
          <a href="/cfp/{data.edition.slug}/submit" target="_blank" rel="noopener">
            <Button size="sm" variant="ghost">
              <ExternalLink class="mr-2 h-4 w-4" />
              {m.cfp_conditional_preview_form()}
            </Button>
          </a>
          <Button
            size="sm"
            variant="outline"
            onclick={() => {
              resetRuleForm()
              showNewConditionRule = !showNewConditionRule
            }}
          >
            <Plus class="mr-2 h-4 w-4" />
            {m.cfp_conditional_add_rule()}
          </Button>
        </div>
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
              {editingRuleId ? m.cfp_conditional_update_rule() : m.cfp_conditional_add_rule()}
            </Button>
            <Button type="button" variant="ghost" size="sm" onclick={resetRuleForm}>
              {m.action_cancel()}
            </Button>
          </div>
        </form>
      {/if}

      {#if data.fieldConditionRules.length === 0}
        <p class="text-sm text-muted-foreground">
          {m.cfp_conditional_empty()}
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
                      {m.cfp_conditional_disabled()}
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
                    title={rule.isActive ? m.cfp_conditional_disable() : m.cfp_conditional_enable()}
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
                      if (!confirm(m.cfp_conditional_delete_confirm())) {
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
      <Card.Title>{m.cfp_related_title()}</Card.Title>
      <Card.Description>{m.cfp_related_description()}</Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="flex gap-2">
        <a href="/admin/editions/{data.edition.slug}/settings">
          <Button variant="outline">{m.cfp_related_edition_settings()}</Button>
        </a>
        <a href="/admin/cfp/{data.edition.slug}/submissions">
          <Button variant="outline">{m.cfp_related_view_submissions()}</Button>
        </a>
      </div>
    </Card.Content>
  </Card.Root>
</div>
