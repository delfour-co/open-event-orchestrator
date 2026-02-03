<script lang="ts">
import type { Snippet } from 'svelte'
import type { LayoutData } from './$types'

interface Props {
  data: LayoutData
  children: Snippet
}

let { data, children }: Props = $props()
</script>

<svelte:head>
  <title>CFP - {data.edition.name} | Open Event Orchestrator</title>
</svelte:head>

<div class="min-h-screen bg-muted/30">
  <!-- Header -->
  <header class="border-b bg-background">
    <div class="container mx-auto flex h-16 items-center justify-between px-4">
      <div class="flex items-center gap-4">
        <a href="/" class="text-xl font-bold">OEO</a>
        <span class="text-muted-foreground">/</span>
        <span class="font-medium">{data.edition.name}</span>
      </div>
      <nav class="flex items-center gap-4">
        <a href="/cfp/{data.edition.slug}" class="text-sm hover:underline">CFP Info</a>
        <a href="/cfp/{data.edition.slug}/submit" class="text-sm hover:underline">Submit</a>
      </nav>
    </div>
  </header>

  <!-- Content -->
  <main class="container mx-auto px-4 py-8">
    {@render children()}
  </main>

  <!-- Footer -->
  <footer class="border-t bg-background px-4 py-6">
    <div class="container mx-auto text-center text-sm text-muted-foreground">
      <p>Powered by Open Event Orchestrator</p>
    </div>
  </footer>
</div>
