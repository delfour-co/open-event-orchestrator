<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as m from '$lib/paraglide/messages'
import { CheckCircle, ExternalLink, Mail } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()
</script>

<svelte:head>
  <title>{m.sponsor_success_title({ eventName: data.eventName })}</title>
</svelte:head>

<div class="container mx-auto max-w-2xl px-4 py-16">
  <div class="text-center">
    <!-- Success Icon -->
    <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
      <CheckCircle class="h-10 w-10 text-green-600" />
    </div>

    <!-- Heading -->
    <h1 class="mt-6 text-3xl font-bold tracking-tight">
      {m.sponsor_success_heading()}
    </h1>
    <p class="mt-4 text-lg text-muted-foreground">
      {m.sponsor_success_thanks({ eventName: data.eventName })}
    </p>
  </div>

  {#if data.sponsorInfo}
    <Card.Root class="mt-8">
      <Card.Header>
        <Card.Title>{m.sponsor_success_details_title()}</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-4">
        <div class="grid gap-2 text-sm">
          <div class="flex justify-between">
            <span class="text-muted-foreground">{m.sponsor_success_company()}</span>
            <span class="font-medium">{data.sponsorInfo.companyName}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">{m.sponsor_success_package()}</span>
            <span class="font-medium">{data.sponsorInfo.packageName}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">{m.sponsor_success_edition()}</span>
            <span class="font-medium">{data.edition.name}</span>
          </div>
        </div>
      </Card.Content>
    </Card.Root>
  {/if}

  <Card.Root class="mt-6">
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <Mail class="h-5 w-5" />
        {m.sponsor_success_next_title()}
      </Card.Title>
    </Card.Header>
    <Card.Content>
      <ol class="space-y-4">
        <li class="flex gap-4">
          <span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            1
          </span>
          <div>
            <div class="font-medium">{m.sponsor_success_step1_title()}</div>
            <p class="text-sm text-muted-foreground">
              {#if data.sponsorInfo?.contactEmail}
                {m.sponsor_success_step1_description_with_email({ email: data.sponsorInfo.contactEmail })}
              {:else}
                {m.sponsor_success_step1_description()}
              {/if}
            </p>
          </div>
        </li>
        <li class="flex gap-4">
          <span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            2
          </span>
          <div>
            <div class="font-medium">{m.sponsor_success_step2_title()}</div>
            <p class="text-sm text-muted-foreground">
              {m.sponsor_success_step2_description()}
            </p>
          </div>
        </li>
        <li class="flex gap-4">
          <span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            3
          </span>
          <div>
            <div class="font-medium">{m.sponsor_success_step3_title()}</div>
            <p class="text-sm text-muted-foreground">
              {m.sponsor_success_step3_description()}
            </p>
          </div>
        </li>
      </ol>
    </Card.Content>
  </Card.Root>

  <div class="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
    <a href="/sponsor/{data.edition.slug}/packages">
      <Button variant="outline" class="gap-2">
        <ExternalLink class="h-4 w-4" />
        {m.sponsor_success_view_packages()}
      </Button>
    </a>
  </div>

  <div class="mt-8 text-center text-sm text-muted-foreground">
    <p>
      {m.sponsor_success_questions()}
    </p>
  </div>
</div>
