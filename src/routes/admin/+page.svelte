<script lang="ts">
import * as Card from '$lib/components/ui/card'
import { Calendar, Ticket, TrendingUp, Users } from 'lucide-svelte'

const stats = [
  { label: 'Events', value: '3', icon: Calendar, trend: '+1 this month' },
  { label: 'Speakers', value: '42', icon: Users, trend: '+12 pending' },
  { label: 'Tickets Sold', value: '156', icon: Ticket, trend: '+23 today' },
  { label: 'Revenue', value: '2,340', icon: TrendingUp, trend: '+15% vs last month' }
]
</script>

<svelte:head>
  <title>Dashboard - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h2 class="text-3xl font-bold tracking-tight">Dashboard</h2>
    <p class="text-muted-foreground">Welcome back! Here's an overview of your events.</p>
  </div>

  <!-- Stats Grid -->
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {#each stats as stat}
      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">{stat.label}</Card.Title>
          <stat.icon class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">{stat.value}</div>
          <p class="text-xs text-muted-foreground">{stat.trend}</p>
        </Card.Content>
      </Card.Root>
    {/each}
  </div>

  <!-- Recent Activity -->
  <div class="grid gap-4 md:grid-cols-2">
    <Card.Root>
      <Card.Header>
        <Card.Title>Recent Submissions</Card.Title>
        <Card.Description>Latest CFP submissions across all events</Card.Description>
      </Card.Header>
      <Card.Content>
        <p class="text-sm text-muted-foreground">No submissions yet.</p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>Upcoming Events</Card.Title>
        <Card.Description>Your next scheduled events</Card.Description>
      </Card.Header>
      <Card.Content>
        <p class="text-sm text-muted-foreground">No upcoming events.</p>
      </Card.Content>
    </Card.Root>
  </div>
</div>
