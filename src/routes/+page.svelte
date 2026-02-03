<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { ArrowRight, BarChart, Calendar, Ticket, Users } from 'lucide-svelte'

const features = [
  {
    icon: Calendar,
    title: 'Call for Papers',
    description: 'Manage speaker submissions with a powerful CFP system'
  },
  {
    icon: Users,
    title: 'Planning',
    description: 'Build your schedule with drag-and-drop simplicity'
  },
  {
    icon: Ticket,
    title: 'Ticketing',
    description: 'Sell tickets and manage registrations in one place'
  },
  {
    icon: BarChart,
    title: 'CRM',
    description: 'Keep track of your community across all events'
  }
]
</script>

<svelte:head>
  <title>Open Event Orchestrator - All-in-one Event Management</title>
</svelte:head>

<div class="flex min-h-screen flex-col">
  <!-- Header -->
  <header class="border-b">
    <div class="container mx-auto flex h-16 items-center justify-between px-4">
      <div class="flex items-center gap-2">
        <span class="text-xl font-bold">OEO</span>
      </div>
      <nav class="flex items-center gap-4">
        <a href="/auth/login">
          <Button variant="ghost">Sign in</Button>
        </a>
        <a href="/auth/register">
          <Button>Get started</Button>
        </a>
      </nav>
    </div>
  </header>

  <!-- Hero -->
  <section class="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
    <h1 class="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
      The open-source control plane for
      <span class="text-primary">events</span>
    </h1>
    <p class="mt-6 max-w-2xl text-lg text-muted-foreground">
      Open Event Orchestrator is an all-in-one platform for managing conferences, meetups, and
      community events. CFP, scheduling, ticketing, and CRM — unified in one place.
    </p>
    <div class="mt-10 flex flex-col gap-4 sm:flex-row">
      <a href="/auth/register">
        <Button size="lg" class="gap-2">
          Get started for free
          <ArrowRight class="h-4 w-4" />
        </Button>
      </a>
      <a href="https://github.com/delfour-co/open-event-orchestrator" target="_blank">
        <Button variant="outline" size="lg">View on GitHub</Button>
      </a>
    </div>
  </section>

  <!-- Features -->
  <section class="border-t bg-muted/50 px-4 py-24">
    <div class="container mx-auto">
      <h2 class="mb-12 text-center text-3xl font-bold">Everything you need to run great events</h2>
      <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {#each features as feature}
          <div class="rounded-lg border bg-background p-6">
            <feature.icon class="mb-4 h-10 w-10 text-primary" />
            <h3 class="mb-2 text-lg font-semibold">{feature.title}</h3>
            <p class="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t px-4 py-8">
    <div class="container mx-auto text-center text-sm text-muted-foreground">
      <p>Open Event Orchestrator is open-source software.</p>
    </div>
  </footer>
</div>
