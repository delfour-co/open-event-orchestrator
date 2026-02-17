<script lang="ts">
import { enhance } from '$app/forms'
import { AdminSubNav } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { getCrmNavItems } from '$lib/config'
import * as m from '$lib/paraglide/messages'
import { ArrowLeft, Download, FileText, Upload } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let csvText = $state('')
let strategy = $state('merge')
let isImporting = $state(false)
let isExporting = $state(false)

const basePath = `/admin/crm/${data.eventSlug}`

const EXPORT_FIELDS = $derived([
  { key: 'email', label: m.crm_export_field_email(), checked: true },
  { key: 'firstName', label: m.crm_export_field_first_name(), checked: true },
  { key: 'lastName', label: m.crm_export_field_last_name(), checked: true },
  { key: 'company', label: m.crm_export_field_company(), checked: true },
  { key: 'jobTitle', label: m.crm_export_field_job_title(), checked: true },
  { key: 'phone', label: m.crm_export_field_phone(), checked: true },
  { key: 'city', label: m.crm_export_field_city(), checked: true },
  { key: 'country', label: m.crm_export_field_country(), checked: true },
  { key: 'source', label: m.crm_export_field_source(), checked: true },
  { key: 'tags', label: m.crm_export_field_tags(), checked: true }
])

let exportFieldsState = $state<Array<{ key: string; label: string; checked: boolean }>>([])

// Initialize export fields state when EXPORT_FIELDS changes
$effect(() => {
  if (exportFieldsState.length === 0) {
    exportFieldsState = EXPORT_FIELDS.map((f) => ({ ...f }))
  }
})

const selectedExportFields = $derived(
  exportFieldsState
    .filter((f) => f.checked)
    .map((f) => f.key)
    .join(',')
)

function handleFileUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    csvText = event.target?.result as string
  }
  reader.readAsText(file)
}

// Preview data from CSV
const previewRows = $derived(() => {
  if (!csvText.trim()) return []
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < Math.min(lines.length, 6); i++) {
    const values = lines[i].split(',')
    const row: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j]?.trim() || ''
    }
    rows.push(row)
  }

  return rows
})

const previewHeaders = $derived(() => {
  if (!csvText.trim()) return []
  const lines = csvText.trim().split('\n')
  if (lines.length === 0) return []
  return lines[0].split(',').map((h) => h.trim())
})

function downloadCsv() {
  if (!form?.csvData) return
  const blob = new Blob([form.csvData as string], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'contacts-export.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<svelte:head>
	<title>{m.crm_import_page_title()}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center gap-4">
		<a href={basePath}>
			<Button variant="ghost" size="icon">
				<ArrowLeft class="h-5 w-5" />
			</Button>
		</a>
		<div>
			<h2 class="text-3xl font-bold tracking-tight">{data.eventName}</h2>
		</div>
	</div>

	<!-- Sub-navigation -->
	<AdminSubNav basePath="/admin/crm/{data.eventSlug}" items={getCrmNavItems(data.eventSlug)} />

	<!-- Success / Error messages -->
	{#if form?.success && form?.action === 'importContacts'}
		<div class="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
			<p class="font-medium">{m.crm_import_complete()}</p>
			<ul class="mt-2 list-inside list-disc space-y-1">
				<li>{m.crm_import_total_processed({ total: form.importResult?.total ?? 0 })}</li>
				<li>{m.crm_import_created({ created: form.importResult?.created ?? 0 })}</li>
				<li>{m.crm_import_updated({ updated: form.importResult?.updated ?? 0 })}</li>
				<li>{m.crm_import_skipped({ skipped: form.importResult?.skipped ?? 0 })}</li>
				{#if form.importResult?.errors && form.importResult.errors.length > 0}
					<li class="text-red-600">{m.crm_import_errors_count({ count: form.importResult.errors.length })}</li>
				{/if}
			</ul>
			{#if form.importResult?.errors && form.importResult.errors.length > 0}
				<div class="mt-3 space-y-1">
					<p class="font-medium text-red-600">{m.crm_import_errors_title()}</p>
					{#each form.importResult.errors as err}
						<p class="text-xs">{m.crm_import_error_row({ row: err.row, email: err.email, error: err.error })}</p>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	{#if form?.success && form?.action === 'exportContacts'}
		<div class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
			<div class="flex items-center justify-between">
				<span>{m.crm_export_ready()}</span>
				<Button variant="outline" size="sm" onclick={downloadCsv} class="gap-2">
					<Download class="h-4 w-4" />
					{m.crm_export_download()}
				</Button>
			</div>
		</div>
	{/if}

	{#if form?.error}
		<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
			{form.error}
		</div>
	{/if}

	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Import Section -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<Upload class="h-5 w-5" />
					{m.crm_import_title()}
				</Card.Title>
				<Card.Description>
					{m.crm_import_description()}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<form
					method="POST"
					action="?/importContacts"
					use:enhance={() => {
						isImporting = true
						return async ({ update }) => {
							isImporting = false
							await update()
						}
					}}
					class="space-y-4"
				>
					<!-- File upload -->
					<div class="space-y-2">
						<Label for="csv-file">{m.crm_import_upload_file()}</Label>
						<Input
							id="csv-file"
							type="file"
							accept=".csv"
							onchange={handleFileUpload}
						/>
					</div>

					<!-- Or paste CSV -->
					<div class="space-y-2">
						<Label for="csv-text">{m.crm_import_paste_csv()}</Label>
						<textarea
							id="csv-text"
							name="csvText"
							bind:value={csvText}
							class="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							placeholder={m.crm_import_csv_placeholder()}
						></textarea>
						<p class="text-xs text-muted-foreground">
							{m.crm_import_csv_help()}
						</p>
					</div>

					<!-- Preview -->
					{#if previewRows().length > 0}
						<div class="space-y-2">
							<Label>{m.crm_import_preview({ count: previewRows().length })}</Label>
							<div class="overflow-x-auto rounded-md border">
								<table class="w-full text-sm">
									<thead>
										<tr class="border-b bg-muted/50">
											{#each previewHeaders() as header}
												<th class="p-2 text-left text-xs font-medium">{header}</th>
											{/each}
										</tr>
									</thead>
									<tbody>
										{#each previewRows() as row}
											<tr class="border-b">
												{#each previewHeaders() as header}
													<td class="p-2 text-xs">{row[header] || ''}</td>
												{/each}
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/if}

					<!-- Duplicate Strategy -->
					<div class="space-y-2">
						<Label>{m.crm_import_strategy()}</Label>
						<div class="space-y-2">
							<label class="flex items-center gap-2">
								<input
									type="radio"
									name="strategy"
									value="skip"
									checked={strategy === 'skip'}
									onchange={() => (strategy = 'skip')}
									class="h-4 w-4"
								/>
								<span class="text-sm">{m.crm_import_strategy_skip()}</span>
							</label>
							<label class="flex items-center gap-2">
								<input
									type="radio"
									name="strategy"
									value="merge"
									checked={strategy === 'merge'}
									onchange={() => (strategy = 'merge')}
									class="h-4 w-4"
								/>
								<span class="text-sm">{m.crm_import_strategy_merge()}</span>
							</label>
							<label class="flex items-center gap-2">
								<input
									type="radio"
									name="strategy"
									value="overwrite"
									checked={strategy === 'overwrite'}
									onchange={() => (strategy = 'overwrite')}
									class="h-4 w-4"
								/>
								<span class="text-sm">{m.crm_import_strategy_overwrite()}</span>
							</label>
						</div>
					</div>

					<Button type="submit" disabled={isImporting || !csvText.trim()} class="w-full gap-2">
						<Upload class="h-4 w-4" />
						{isImporting ? m.crm_import_importing() : m.crm_import_button()}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>

		<!-- Export Section -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<Download class="h-5 w-5" />
					{m.crm_export_title()}
				</Card.Title>
				<Card.Description>
					{m.crm_export_description()}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<form
					method="POST"
					action="?/exportContacts"
					use:enhance={() => {
						isExporting = true
						return async ({ update }) => {
							isExporting = false
							await update()
						}
					}}
					class="space-y-4"
				>
					<input type="hidden" name="fields" value={selectedExportFields} />

					<div class="space-y-2">
						<Label>{m.crm_export_select_fields()}</Label>
						<div class="grid grid-cols-2 gap-2">
							{#each exportFieldsState as field, i}
								<label class="flex items-center gap-2">
									<input
										type="checkbox"
										bind:checked={exportFieldsState[i].checked}
										class="h-4 w-4 rounded border-gray-300"
									/>
									<span class="text-sm">{field.label}</span>
								</label>
							{/each}
						</div>
					</div>

					<Button type="submit" variant="outline" disabled={isExporting} class="w-full gap-2">
						<FileText class="h-4 w-4" />
						{isExporting ? m.crm_export_exporting() : m.crm_export_button()}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>
	</div>
</div>
