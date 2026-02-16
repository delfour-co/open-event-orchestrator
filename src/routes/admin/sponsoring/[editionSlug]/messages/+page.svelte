<script lang="ts">
import { Badge } from '$lib/components/ui/badge'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { getStatusBadgeVariant, getStatusLabel } from '$lib/features/sponsoring/domain'
import { ArrowRight, Building2, MessageSquare, Search } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

let searchQuery = $state('')

const filteredConversations = $derived(
  data.conversations.filter((c) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    const sponsorName = c.editionSponsor.sponsor?.name?.toLowerCase() || ''
    return sponsorName.includes(query)
  })
)
</script>

<svelte:head>
	<title>Sponsor Messages - {data.edition.name}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold tracking-tight flex items-center gap-3">
			<MessageSquare class="h-8 w-8" />
			Sponsor Messages
		</h1>
		<p class="text-muted-foreground mt-1">
			{data.edition.name} - Communicate with your sponsors
		</p>
	</div>

	<!-- Stats -->
	<div class="grid gap-4 md:grid-cols-3 mb-6">
		<Card.Root>
			<Card.Content class="pt-6">
				<div class="flex items-center gap-4">
					<div class="p-3 rounded-full bg-primary/10">
						<MessageSquare class="h-5 w-5 text-primary" />
					</div>
					<div>
						<p class="text-2xl font-bold">{data.conversations.length}</p>
						<p class="text-sm text-muted-foreground">Total Conversations</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="{data.totalUnread > 0 ? 'border-orange-500' : ''}">
			<Card.Content class="pt-6">
				<div class="flex items-center gap-4">
					<div class="p-3 rounded-full {data.totalUnread > 0 ? 'bg-orange-500/10' : 'bg-muted'}">
						<MessageSquare class="h-5 w-5 {data.totalUnread > 0 ? 'text-orange-500' : 'text-muted-foreground'}" />
					</div>
					<div>
						<p class="text-2xl font-bold">{data.totalUnread}</p>
						<p class="text-sm text-muted-foreground">Unread Messages</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Content class="pt-6">
				<div class="flex items-center gap-4">
					<div class="p-3 rounded-full bg-muted">
						<Building2 class="h-5 w-5 text-muted-foreground" />
					</div>
					<div>
						<p class="text-2xl font-bold">
							{data.conversations.filter((c) => c.unreadCount > 0).length}
						</p>
						<p class="text-sm text-muted-foreground">Active Conversations</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Search -->
	<div class="relative mb-6">
		<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
		<Input
			type="text"
			placeholder="Search sponsors..."
			class="pl-10"
			bind:value={searchQuery}
		/>
	</div>

	<!-- Conversation List -->
	<div class="space-y-2">
		{#if filteredConversations.length === 0}
			<Card.Root>
				<Card.Content class="py-8 text-center text-muted-foreground">
					{#if searchQuery}
						<p>No sponsors found matching "{searchQuery}"</p>
					{:else}
						<p>No sponsors added to this edition yet</p>
					{/if}
				</Card.Content>
			</Card.Root>
		{:else}
			{#each filteredConversations as conversation (conversation.editionSponsor.id)}
				{@const sponsor = conversation.editionSponsor.sponsor}
				{@const pkg = conversation.editionSponsor.package}
				<a
					href="/admin/sponsoring/{data.edition.slug}/messages/{conversation.editionSponsor.id}"
					class="block"
				>
					<Card.Root class="hover:bg-muted/50 transition-colors {conversation.unreadCount > 0 ? 'border-primary' : ''}">
						<Card.Content class="py-4">
							<div class="flex items-center gap-4">
								<!-- Logo -->
								<div class="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
									{#if sponsor?.logoUrl}
										<img
											src={sponsor.logoUrl}
											alt={sponsor.name}
											class="h-full w-full object-contain"
										/>
									{:else}
										<Building2 class="h-6 w-6 text-muted-foreground" />
									{/if}
								</div>

								<!-- Info -->
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-1">
										<h3 class="font-semibold truncate">{sponsor?.name || 'Unknown Sponsor'}</h3>
										{#if conversation.unreadCount > 0}
											<Badge variant="default" class="shrink-0">
												{conversation.unreadCount} new
											</Badge>
										{/if}
									</div>
									<div class="flex items-center gap-2 text-sm text-muted-foreground">
										<Badge variant={getStatusBadgeVariant(conversation.editionSponsor.status)}>
											{getStatusLabel(conversation.editionSponsor.status)}
										</Badge>
										{#if pkg}
											<span class="truncate">{pkg.name}</span>
										{/if}
									</div>
								</div>

								<!-- Arrow -->
								<ArrowRight class="h-5 w-5 text-muted-foreground shrink-0" />
							</div>
						</Card.Content>
					</Card.Root>
				</a>
			{/each}
		{/if}
	</div>
</div>
