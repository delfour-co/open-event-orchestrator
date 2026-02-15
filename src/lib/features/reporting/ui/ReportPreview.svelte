<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { cn } from '$lib/utils'
import { Eye, FileText, Send } from 'lucide-svelte'
import type { ReportConfig } from '../domain/report-config'
import { getScheduleDescription } from '../domain/report-config'

interface Props {
  config: ReportConfig
  htmlContent?: string
  textContent?: string
  onSendTest?: (email: string) => Promise<void>
  isLoading?: boolean
}

const { config, htmlContent, textContent, onSendTest, isLoading = false }: Props = $props()

let testEmail = $state('')
let sendingTest = $state(false)
let testResult = $state<{ success: boolean; message: string } | null>(null)
let previewTab = $state<'html' | 'text'>('html')

async function handleSendTest() {
  if (!onSendTest || !testEmail) return

  sendingTest = true
  testResult = null

  try {
    await onSendTest(testEmail)
    testResult = { success: true, message: 'Test email sent successfully!' }
  } catch (error) {
    testResult = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send test email'
    }
  } finally {
    sendingTest = false
  }
}

const scheduleDescription = $derived(getScheduleDescription(config))
</script>

<div class="space-y-6">
  <!-- Report Info -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <Eye class="h-5 w-5" />
        Report Preview
      </Card.Title>
      <Card.Description>
        Preview how the report will look when sent to recipients
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <p class="text-sm text-muted-foreground">Report Name</p>
            <p class="font-medium">{config.name}</p>
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Schedule</p>
            <p class="font-medium">{scheduleDescription}</p>
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Recipients</p>
            <p class="font-medium">{config.recipients.length} recipient(s)</p>
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Sections</p>
            <p class="font-medium">{config.sections.join(', ')}</p>
          </div>
          {#if config.nextScheduledAt}
            <div>
              <p class="text-sm text-muted-foreground">Next Scheduled</p>
              <p class="font-medium">
                {config.nextScheduledAt.toLocaleString()}
              </p>
            </div>
          {/if}
          {#if config.lastSentAt}
            <div>
              <p class="text-sm text-muted-foreground">Last Sent</p>
              <p class="font-medium">
                {config.lastSentAt.toLocaleString()}
              </p>
            </div>
          {/if}
        </div>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Preview Tabs -->
  {#if htmlContent || textContent}
    <Card.Root>
      <Card.Content class="pt-6">
        <div class="flex gap-2 border-b">
          <button
            onclick={() => (previewTab = 'html')}
            class={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              previewTab === 'html'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Eye class="h-4 w-4" />
            HTML Preview
          </button>
          <button
            onclick={() => (previewTab = 'text')}
            class={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              previewTab === 'text'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <FileText class="h-4 w-4" />
            Plain Text
          </button>
        </div>

        <div class="mt-4">
          {#if previewTab === 'html'}
            {#if htmlContent}
              <div class="rounded-lg border bg-white">
                <iframe
                  srcdoc={htmlContent}
                  title="HTML Preview"
                  class="h-[500px] w-full rounded-lg"
                  sandbox="allow-same-origin"
                />
              </div>
            {:else}
              <p class="text-muted-foreground">No HTML content available</p>
            {/if}
          {:else}
            {#if textContent}
              <pre class="max-h-[500px] overflow-auto rounded-lg bg-muted p-4 text-sm">{textContent}</pre>
            {:else}
              <p class="text-muted-foreground">No text content available</p>
            {/if}
          {/if}
        </div>
      </Card.Content>
    </Card.Root>
  {/if}

  <!-- Send Test -->
  {#if onSendTest}
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <Send class="h-5 w-5" />
          Send Test Email
        </Card.Title>
        <Card.Description>
          Send a test report to verify the configuration
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="flex gap-3">
          <div class="flex-1 space-y-2">
            <Label for="testEmail">Test Email Address</Label>
            <Input
              id="testEmail"
              type="email"
              bind:value={testEmail}
              placeholder="your@email.com"
            />
          </div>
          <div class="flex items-end">
            <Button
              onclick={handleSendTest}
              disabled={!testEmail || sendingTest || isLoading}
            >
              <Send class="mr-2 h-4 w-4" />
              {sendingTest ? 'Sending...' : 'Send Test'}
            </Button>
          </div>
        </div>

        {#if testResult}
          <div
            class={`mt-4 rounded-md p-3 text-sm ${
              testResult.success
                ? 'border border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200'
                : 'border border-destructive bg-destructive/10 text-destructive'
            }`}
          >
            {testResult.message}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  {/if}
</div>
