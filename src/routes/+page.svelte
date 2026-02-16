<script lang="ts">
import { Button } from '$lib/components/ui/button'
import {
  ArrowRight,
  BarChart3,
  Calendar,
  ChartPie,
  Code2,
  Handshake,
  Smartphone,
  Ticket,
  Users,
  Users2,
  Wallet
} from 'lucide-svelte'

const features = [
  {
    icon: Calendar,
    title: 'Call for Papers',
    description: 'Manage speaker submissions, reviews, and notifications with multi-step workflows'
  },
  {
    icon: Users,
    title: 'Planning',
    description: 'Build your schedule with drag-and-drop, rooms, tracks, and speaker assignments'
  },
  {
    icon: Ticket,
    title: 'Ticketing',
    description:
      'Sell tickets via Stripe, manage registrations, and check-in attendees with QR codes'
  },
  {
    icon: BarChart3,
    title: 'CRM',
    description: 'Keep track of contacts, consent management, segments, and email campaigns'
  },
  {
    icon: Wallet,
    title: 'Budget',
    description: 'Track expenses, quotes, invoices, speaker reimbursements, and audit trails'
  },
  {
    icon: Handshake,
    title: 'Sponsoring',
    description: 'Manage sponsors, packages, pipeline status, and self-service sponsor portal'
  },
  {
    icon: ChartPie,
    title: 'Reporting',
    description: 'Real-time dashboards, KPIs, distribution charts, and configurable alerts'
  },
  {
    icon: Smartphone,
    title: 'Attendee App',
    description: 'Mobile-friendly schedule with personal favorites and session details'
  },
  {
    icon: Users2,
    title: 'Team Management',
    description: 'Manage staff, volunteers, and room assignments for your event'
  },
  {
    icon: Code2,
    title: 'API',
    description: 'Headless REST API for custom integrations, widgets, and websites'
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
    <img
      src="/img/oeo_illustrations-transparent.png"
      alt="Open Event Orchestrator - Orchestration visuelle"
      class="mb-8 max-h-64 w-auto object-contain sm:max-h-80"
    />
    <h1 class="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
      The open-source control plane for
      <span class="text-primary">events</span>
    </h1>
    <p class="mt-6 max-w-2xl text-lg text-muted-foreground">
      Open Event Orchestrator is an all-in-one platform for managing conferences, meetups, and
      community events. CFP, planning, ticketing, CRM, budget, sponsoring, and API — unified in one
      place.
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
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
