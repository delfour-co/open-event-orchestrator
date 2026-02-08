<script lang="ts">
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Check, ChevronDown, ChevronRight, Copy, ExternalLink, Key, Server } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

let expandedEndpoints = $state<Set<string>>(new Set())
let copiedPath = $state<string | null>(null)

const methodColors: Record<string, string> = {
  GET: 'bg-blue-500',
  POST: 'bg-green-500',
  PUT: 'bg-yellow-500',
  PATCH: 'bg-orange-500',
  DELETE: 'bg-red-500'
}

const toggleEndpoint = (id: string) => {
  const newSet = new Set(expandedEndpoints)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  expandedEndpoints = newSet
}

const copyToClipboard = async (text: string) => {
  await navigator.clipboard.writeText(text)
  copiedPath = text
  setTimeout(() => {
    copiedPath = null
  }, 2000)
}

const getStatusColor = (status: string) => {
  if (status.startsWith('2')) return 'text-green-600'
  if (status.startsWith('4')) return 'text-yellow-600'
  if (status.startsWith('5')) return 'text-red-600'
  return 'text-muted-foreground'
}
</script>

<svelte:head>
  <title>API Documentation - Open Event Orchestrator</title>
</svelte:head>

<div class="container mx-auto max-w-5xl py-8 px-4">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-4xl font-bold mb-2">{data.info.title}</h1>
    <p class="text-muted-foreground text-lg mb-4">{data.info.description}</p>
    <div class="flex items-center gap-4">
      <Badge variant="secondary">Version {data.info.version}</Badge>
      <a href="/api/v1/openapi.json" target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm">
          <ExternalLink class="mr-2 h-4 w-4" />
          OpenAPI Spec
        </Button>
      </a>
    </div>
  </div>

  <!-- Authentication -->
  <Card.Root class="mb-8">
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <Key class="h-5 w-5" />
        Authentication
      </Card.Title>
    </Card.Header>
    <Card.Content>
      <p class="text-muted-foreground mb-4">
        All API requests require a valid API key passed in the Authorization header.
      </p>
      <div class="bg-muted rounded-lg p-4 font-mono text-sm">
        <span class="text-muted-foreground">Authorization:</span> Bearer <span class="text-primary">oeo_live_your_api_key</span>
      </div>
      <p class="text-sm text-muted-foreground mt-4">
        Create API keys in the <a href="/admin/api/keys" class="text-primary hover:underline">Admin Panel</a>.
      </p>
    </Card.Content>
  </Card.Root>

  <!-- Base URL -->
  <Card.Root class="mb-8">
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <Server class="h-5 w-5" />
        Base URL
      </Card.Title>
    </Card.Header>
    <Card.Content>
      {#each data.servers || [] as server}
        <div class="bg-muted rounded-lg p-4 font-mono text-sm flex items-center justify-between">
          <span>{server.url}</span>
          <Button variant="ghost" size="sm" onclick={() => copyToClipboard(server.url)}>
            {#if copiedPath === server.url}
              <Check class="h-4 w-4 text-green-500" />
            {:else}
              <Copy class="h-4 w-4" />
            {/if}
          </Button>
        </div>
        {#if server.description}
          <p class="text-sm text-muted-foreground mt-2">{server.description}</p>
        {/if}
      {/each}
    </Card.Content>
  </Card.Root>

  <!-- Endpoints by Tag -->
  {#each Object.entries(data.endpointsByTag) as [tag, endpoints]}
    <div class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">{tag}</h2>
      <div class="space-y-3">
        {#each endpoints as endpoint}
          {@const endpointId = `${endpoint.method}-${endpoint.path}`}
          <Card.Root>
            <button
              class="w-full text-left"
              onclick={() => toggleEndpoint(endpointId)}
            >
              <Card.Header class="py-3">
                <div class="flex items-center gap-3">
                  <Badge class="{methodColors[endpoint.method]} text-white min-w-[60px] justify-center">
                    {endpoint.method}
                  </Badge>
                  <code class="text-sm font-mono flex-1">{endpoint.path}</code>
                  <span class="text-muted-foreground text-sm hidden md:block">{endpoint.summary}</span>
                  {#if expandedEndpoints.has(endpointId)}
                    <ChevronDown class="h-4 w-4 text-muted-foreground" />
                  {:else}
                    <ChevronRight class="h-4 w-4 text-muted-foreground" />
                  {/if}
                </div>
              </Card.Header>
            </button>

            {#if expandedEndpoints.has(endpointId)}
              <Card.Content class="pt-0 border-t">
                <div class="pt-4 space-y-4">
                  <!-- Summary & Description -->
                  <div>
                    <h4 class="font-medium mb-1">{endpoint.summary}</h4>
                    {#if endpoint.description}
                      <p class="text-sm text-muted-foreground">{endpoint.description}</p>
                    {/if}
                  </div>

                  <!-- Parameters -->
                  {#if endpoint.parameters && endpoint.parameters.length > 0}
                    <div>
                      <h4 class="font-medium mb-2">Parameters</h4>
                      <div class="bg-muted rounded-lg overflow-hidden">
                        <table class="w-full text-sm">
                          <thead class="bg-muted-foreground/10">
                            <tr>
                              <th class="text-left p-2 font-medium">Name</th>
                              <th class="text-left p-2 font-medium">In</th>
                              <th class="text-left p-2 font-medium">Type</th>
                              <th class="text-left p-2 font-medium">Required</th>
                              <th class="text-left p-2 font-medium">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {#each endpoint.parameters as param}
                              {@const p = param as { name: string; in: string; schema?: { type?: string }; required?: boolean; description?: string }}
                              <tr class="border-t border-muted-foreground/10">
                                <td class="p-2 font-mono text-primary">{p.name}</td>
                                <td class="p-2">{p.in}</td>
                                <td class="p-2 font-mono">{p.schema?.type || 'string'}</td>
                                <td class="p-2">{p.required ? 'Yes' : 'No'}</td>
                                <td class="p-2 text-muted-foreground">{p.description || '-'}</td>
                              </tr>
                            {/each}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  {/if}

                  <!-- Responses -->
                  {#if endpoint.responses}
                    <div>
                      <h4 class="font-medium mb-2">Responses</h4>
                      <div class="space-y-2">
                        {#each Object.entries(endpoint.responses) as [status, response]}
                          {@const res = response as { description?: string }}
                          <div class="flex items-start gap-3 p-2 bg-muted rounded-lg">
                            <Badge variant="outline" class={getStatusColor(status)}>
                              {status}
                            </Badge>
                            <span class="text-sm text-muted-foreground">{res.description || ''}</span>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}

                  <!-- Try it -->
                  <div class="pt-2">
                    <div class="bg-muted rounded-lg p-3">
                      <p class="text-xs text-muted-foreground mb-2">Example request:</p>
                      <code class="text-sm font-mono">
                        curl -H "Authorization: Bearer $API_KEY" {data.servers?.[0]?.url || ''}{endpoint.path}
                      </code>
                    </div>
                  </div>
                </div>
              </Card.Content>
            {/if}
          </Card.Root>
        {/each}
      </div>
    </div>
  {/each}
</div>
