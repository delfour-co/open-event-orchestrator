<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as m from '$lib/paraglide/messages'
import { Building2, UserPlus } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()
</script>

<svelte:head>
  <title>{m.invitation_landing_title()}</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-muted/50 p-4">
  <Card.Root class="w-full max-w-md">
    <Card.Header class="text-center">
      <div
        class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
      >
        <Building2 class="h-8 w-8 text-primary" />
      </div>
      <Card.Title class="text-2xl">{m.invitation_landing_heading()}</Card.Title>
      <Card.Description>
        {m.invitation_landing_description({
          organization: data.organizationName,
          role: data.role
        })}
      </Card.Description>
    </Card.Header>
    <Card.Content class="space-y-4">
      <div class="rounded-lg border bg-muted/50 p-4 text-center">
        <p class="text-sm text-muted-foreground">{m.invitation_landing_invited_as()}</p>
        <p class="mt-1 text-lg font-semibold capitalize">{data.role}</p>
        <p class="text-sm text-muted-foreground">
          {m.invitation_landing_at_org({ organization: data.organizationName })}
        </p>
      </div>

      <div class="space-y-3">
        <a
          href="/auth/register?email={encodeURIComponent(data.email)}&redirect=/auth/invite/{data.token}"
          class="block"
        >
          <Button class="w-full" size="lg">
            <UserPlus class="mr-2 h-5 w-5" />
            {m.invitation_landing_create_account()}
          </Button>
        </a>
        <a href="/auth/login?redirect=/auth/invite/{data.token}" class="block">
          <Button variant="outline" class="w-full" size="lg">
            {m.invitation_landing_sign_in()}
          </Button>
        </a>
      </div>
    </Card.Content>
  </Card.Root>
</div>
