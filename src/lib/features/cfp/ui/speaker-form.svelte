<script lang="ts">
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'

interface SpeakerFormData {
  firstName?: string
  lastName?: string
  email?: string
  bio?: string
  company?: string
  jobTitle?: string
  city?: string
  country?: string
  twitter?: string
  github?: string
  linkedin?: string
}

interface Props {
  speaker: SpeakerFormData
  errors?: Record<string, string>
}

let { speaker = $bindable({}), errors = {} }: Props = $props()
</script>

<div class="space-y-6">
  <h2 class="text-xl font-semibold">Speaker Profile</h2>

  <div class="grid gap-4 md:grid-cols-2">
    <div class="space-y-2">
      <Label for="firstName">First Name *</Label>
      <Input
        id="firstName"
        name="firstName"
        bind:value={speaker.firstName}
        placeholder="John"
        required
        class={errors.firstName ? 'border-destructive' : ''}
      />
      {#if errors.firstName}
        <p class="text-sm text-destructive">{errors.firstName}</p>
      {/if}
    </div>

    <div class="space-y-2">
      <Label for="lastName">Last Name *</Label>
      <Input
        id="lastName"
        name="lastName"
        bind:value={speaker.lastName}
        placeholder="Doe"
        required
        class={errors.lastName ? 'border-destructive' : ''}
      />
      {#if errors.lastName}
        <p class="text-sm text-destructive">{errors.lastName}</p>
      {/if}
    </div>
  </div>

  <div class="space-y-2">
    <Label for="email">Email *</Label>
    <Input
      id="email"
      name="email"
      type="email"
      bind:value={speaker.email}
      placeholder="john@example.com"
      required
      class={errors.email ? 'border-destructive' : ''}
    />
    {#if errors.email}
      <p class="text-sm text-destructive">{errors.email}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="bio">Bio</Label>
    <Textarea
      id="bio"
      name="bio"
      bind:value={speaker.bio}
      placeholder="Tell us about yourself..."
      rows={4}
      class={errors.bio ? 'border-destructive' : ''}
    />
    <p class="text-sm text-muted-foreground">
      {speaker.bio?.length ?? 0}/2000 characters
    </p>
    {#if errors.bio}
      <p class="text-sm text-destructive">{errors.bio}</p>
    {/if}
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    <div class="space-y-2">
      <Label for="company">Company</Label>
      <Input id="company" name="company" bind:value={speaker.company} placeholder="Acme Corp" />
    </div>

    <div class="space-y-2">
      <Label for="jobTitle">Job Title</Label>
      <Input
        id="jobTitle"
        name="jobTitle"
        bind:value={speaker.jobTitle}
        placeholder="Senior Developer"
      />
    </div>
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    <div class="space-y-2">
      <Label for="city">City</Label>
      <Input id="city" name="city" bind:value={speaker.city} placeholder="Paris" />
    </div>

    <div class="space-y-2">
      <Label for="country">Country</Label>
      <Input id="country" name="country" bind:value={speaker.country} placeholder="France" />
    </div>
  </div>

  <div class="space-y-4">
    <h3 class="text-lg font-medium">Social Links</h3>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <Label for="twitter">Twitter</Label>
        <Input id="twitter" name="twitter" bind:value={speaker.twitter} placeholder="@johndoe" />
      </div>

      <div class="space-y-2">
        <Label for="github">GitHub</Label>
        <Input id="github" name="github" bind:value={speaker.github} placeholder="johndoe" />
      </div>
    </div>

    <div class="space-y-2">
      <Label for="linkedin">LinkedIn</Label>
      <Input
        id="linkedin"
        name="linkedin"
        type="url"
        bind:value={speaker.linkedin}
        placeholder="https://linkedin.com/in/johndoe"
      />
    </div>
  </div>
</div>
