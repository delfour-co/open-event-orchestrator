<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as m from '$lib/paraglide/messages'
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
    title: () => m.landing_feature_cfp_title(),
    description: () => m.landing_feature_cfp_description()
  },
  {
    icon: Users,
    title: () => m.landing_feature_planning_title(),
    description: () => m.landing_feature_planning_description()
  },
  {
    icon: Ticket,
    title: () => m.landing_feature_ticketing_title(),
    description: () => m.landing_feature_ticketing_description()
  },
  {
    icon: BarChart3,
    title: () => m.landing_feature_crm_title(),
    description: () => m.landing_feature_crm_description()
  },
  {
    icon: Wallet,
    title: () => m.landing_feature_budget_title(),
    description: () => m.landing_feature_budget_description()
  },
  {
    icon: Handshake,
    title: () => m.landing_feature_sponsoring_title(),
    description: () => m.landing_feature_sponsoring_description()
  },
  {
    icon: ChartPie,
    title: () => m.landing_feature_reporting_title(),
    description: () => m.landing_feature_reporting_description()
  },
  {
    icon: Smartphone,
    title: () => m.landing_feature_app_title(),
    description: () => m.landing_feature_app_description()
  },
  {
    icon: Users2,
    title: () => m.landing_feature_team_title(),
    description: () => m.landing_feature_team_description()
  },
  {
    icon: Code2,
    title: () => m.landing_feature_api_title(),
    description: () => m.landing_feature_api_description()
  }
]
</script>

<svelte:head>
  <title>{m.landing_title()}</title>
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
          <Button variant="ghost">{m.common_sign_in()}</Button>
        </a>
        <a href="/auth/register">
          <Button>{m.common_get_started()}</Button>
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
      {m.landing_hero_title_prefix()}
      <span class="text-primary">{m.landing_hero_title_highlight()}</span>
    </h1>
    <p class="mt-6 max-w-2xl text-lg text-muted-foreground">
      {m.landing_hero_description()}
    </p>
    <div class="mt-10 flex flex-col gap-4 sm:flex-row">
      <a href="/auth/register">
        <Button size="lg" class="gap-2">
          {m.landing_get_started_free()}
          <ArrowRight class="h-4 w-4" />
        </Button>
      </a>
      <a href="https://github.com/delfour-co/open-event-orchestrator" target="_blank">
        <Button variant="outline" size="lg">{m.landing_view_github()}</Button>
      </a>
    </div>
  </section>

  <!-- Features -->
  <section class="border-t bg-muted/50 px-4 py-24">
    <div class="container mx-auto">
      <h2 class="mb-12 text-center text-3xl font-bold">{m.landing_features_title()}</h2>
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {#each features as feature}
          <div class="rounded-lg border bg-background p-6">
            <feature.icon class="mb-4 h-10 w-10 text-primary" />
            <h3 class="mb-2 text-lg font-semibold">{feature.title()}</h3>
            <p class="text-sm text-muted-foreground">{feature.description()}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t px-4 py-8">
    <div class="container mx-auto text-center text-sm text-muted-foreground">
      <p>{m.common_open_source()}</p>
    </div>
  </footer>
</div>
