<script lang="ts">
import { enhance } from '$app/forms'
import { AdminSubNav } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { getCrmNavItems } from '$lib/config'
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

const EXPORT_FIELDS = [
  { key: 'email', label: 'Email', checked: true },
  { key: 'firstName', label: 'First Name', checked: true },
  { key: 'lastName', label: 'Last Name', checked: true },
  { key: 'company', label: 'Company', checked: true },
  { key: 'jobTitle', label: 'Job Title', checked: true },
  { key: 'phone', label: 'Phone', checked: true },
  { key: 'city', label: 'City', checked: true },
  { key: 'country', label: 'Country', checked: true },
  { key: 'source', label: 'Source', checked: true },
  { key: 'tags', label: 'Tags', checked: true }
]

let exportFields = $state(EXPORT_FIELDS.map((f) => ({ ...f })))

const selectedExportFields = $derived(
  exportFields
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
	<title>Import / Export - CRM - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center gap-4">
		<a href={basePath}>
			<Button variant="ghost" size="icon">
				<ArrowLeft class="h-5 w-5" />
			</Button>
		</a>
		<div>
			<h2 class="text-3xl font-bold tracking-tight">Import / Export</h2>
			<p class="text-muted-foreground">
				Import contacts from CSV or export your contact database.
			</p>
		</div>
	</div>

	<!-- Sub-navigation -->
	<AdminSubNav basePath="/admin/crm/{data.eventSlug}" items={getCrmNavItems(data.eventSlug)} />

	<!-- Success / Error messages -->
	{#if form?.success && form?.action === 'importContacts'}
		<div class="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
			<p class="font-medium">Import Complete</p>
			<ul class="mt-2 list-inside list-disc space-y-1">
				<li>Total processed: {form.importResult?.total ?? 0}</li>
				<li>Created: {form.importResult?.created ?? 0}</li>
				<li>Updated: {form.importResult?.updated ?? 0}</li>
				<li>Skipped: {form.importResult?.skipped ?? 0}</li>
				{#if form.importResult?.errors && form.importResult.errors.length > 0}
					<li class="text-red-600">Errors: {form.importResult.errors.length}</li>
				{/if}
			</ul>
			{#if form.importResult?.errors && form.importResult.errors.length > 0}
				<div class="mt-3 space-y-1">
					<p class="font-medium text-red-600">Errors:</p>
					{#each form.importResult.errors as err}
						<p class="text-xs">Row {err.row} ({err.email}): {err.error}</p>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	{#if form?.success && form?.action === 'exportContacts'}
		<div class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
			<div class="flex items-center justify-between">
				<span>Export ready. Click to download.</span>
				<Button variant="outline" size="sm" onclick={downloadCsv} class="gap-2">
					<Download class="h-4 w-4" />
					Download CSV
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
					Import Contacts
				</Card.Title>
				<Card.Description>
					Upload a CSV file or paste CSV data to import contacts.
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
						<Label for="csv-file">Upload CSV File</Label>
						<Input
							id="csv-file"
							type="file"
							accept=".csv"
							onchange={handleFileUpload}
						/>
					</div>

					<!-- Or paste CSV -->
					<div class="space-y-2">
						<Label for="csv-text">Or Paste CSV Data</Label>
						<textarea
							id="csv-text"
							name="csvText"
							bind:value={csvText}
							class="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							placeholder="email,firstName,lastName,company,jobTitle,phone,city,country,tags
john@example.com,John,Doe,Acme Inc,Developer,+33612345678,Paris,France,vip"
						></textarea>
						<p class="text-xs text-muted-foreground">
							Required columns: email, firstName (or first_name), lastName (or last_name). Optional: company, jobTitle, phone, city, country, tags.
						</p>
					</div>

					<!-- Preview -->
					{#if previewRows().length > 0}
						<div class="space-y-2">
							<Label>Preview (first {previewRows().length} rows)</Label>
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
						<Label>Duplicate Strategy</Label>
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
								<span class="text-sm">Skip - Do not update existing contacts</span>
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
								<span class="text-sm">Merge - Only fill empty fields</span>
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
								<span class="text-sm">Overwrite - Replace all fields</span>
							</label>
						</div>
					</div>

					<Button type="submit" disabled={isImporting || !csvText.trim()} class="w-full gap-2">
						<Upload class="h-4 w-4" />
						{isImporting ? 'Importing...' : 'Import Contacts'}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>

		<!-- Export Section -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<Download class="h-5 w-5" />
					Export Contacts
				</Card.Title>
				<Card.Description>
					Export your contacts as a CSV file.
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
						<Label>Select Fields to Export</Label>
						<div class="grid grid-cols-2 gap-2">
							{#each exportFields as field, i}
								<label class="flex items-center gap-2">
									<input
										type="checkbox"
										bind:checked={exportFields[i].checked}
										class="h-4 w-4 rounded border-gray-300"
									/>
									<span class="text-sm">{field.label}</span>
								</label>
							{/each}
						</div>
					</div>

					<Button type="submit" variant="outline" disabled={isExporting} class="w-full gap-2">
						<FileText class="h-4 w-4" />
						{isExporting ? 'Exporting...' : 'Export All Contacts'}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>
	</div>
</div>
