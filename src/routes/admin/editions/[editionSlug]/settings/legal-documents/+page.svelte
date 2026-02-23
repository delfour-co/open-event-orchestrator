<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Textarea } from '$lib/components/ui/textarea'
import * as m from '$lib/paraglide/messages'
import DOMPurify from 'dompurify'
import { ArrowLeft, Check, FileText, Loader2, Sparkles } from 'lucide-svelte'
import { marked } from 'marked'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

type DocField = 'termsOfSale' | 'codeOfConduct' | 'privacyPolicy'

interface DocConfig {
  field: DocField
  title: string
}

const documents: DocConfig[] = [
  { field: 'termsOfSale', title: m.legal_terms_of_sale() },
  { field: 'codeOfConduct', title: m.legal_code_of_conduct() },
  { field: 'privacyPolicy', title: m.legal_privacy_policy() }
]

let selectedDoc: DocField | null = $state(null)
let editorContent = $state('')
let isSaving = $state(false)

function selectDocument(field: DocField): void {
  selectedDoc = field
  editorContent = data.edition[field]
}

function backToList(): void {
  selectedDoc = null
  editorContent = ''
}

const previewHtml = $derived(
  selectedDoc ? DOMPurify.sanitize(marked.parse(editorContent) as string) : ''
)

function getExcerpt(content: string): string {
  if (!content) return ''
  const lines = content.split('\n').filter((l) => l.trim() && !l.startsWith('#'))
  return lines.slice(0, 2).join(' ').slice(0, 120) + (lines.join(' ').length > 120 ? '...' : '')
}

// Template generation

function formatDateLocalized(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const org = data.organization
const ed = data.edition
const eventName = ed.eventName
const editionDates = `${formatDateLocalized(ed.startDate)} - ${formatDateLocalized(ed.endDate)}`
const venueInfo = [ed.venue, ed.city].filter(Boolean).join(', ')
const orgIdentity = org.legalName || org.name || eventName
const orgAddress = [org.address, [org.postalCode, org.city].filter(Boolean).join(' '), org.country]
  .filter(Boolean)
  .join(', ')
const orgLegalLine = [
  org.legalForm,
  org.rcsNumber ? `RCS ${org.rcsNumber}` : '',
  org.shareCapital ? `Capital ${org.shareCapital}` : ''
]
  .filter(Boolean)
  .join(' - ')

function generateTemplate(field: DocField): string {
  if (field === 'termsOfSale') {
    return `# Conditions Generales de Vente

## Article 1 — Objet
Les presentes Conditions Generales de Vente regissent l'achat de billets pour **${eventName}**, edition **${ed.name}**, qui se tient du ${editionDates}${venueInfo ? ` a ${venueInfo}` : ''}.

L'evenement est organise par **${orgIdentity}**${orgAddress ? `, ${orgAddress}` : ''}.${orgLegalLine ? `\n${orgLegalLine}.` : ''}${org.siret ? `\nSIRET : ${org.siret}` : ''}${org.vatNumber ? ` — TVA : ${org.vatNumber}` : ''}

## Article 2 — Billets
- Les billets sont nominatifs et non cessibles.
- Un email de confirmation avec un QR code est envoye apres l'achat.
- Le billet doit etre presente (version numerique ou imprimee) a l'entree de l'evenement.

## Article 3 — Tarifs
- Tous les prix sont indiques TTC.
- L'organisateur se reserve le droit de modifier les tarifs a tout moment pour les ventes futures.

## Article 4 — Politique de remboursement
- Remboursement integral jusqu'a 30 jours avant l'evenement.
- Remboursement a 50% entre 30 et 7 jours avant l'evenement.
- Aucun remboursement dans les 7 jours precedant l'evenement.

## Article 5 — Annulation
En cas d'annulation de l'evenement par l'organisateur, un remboursement integral sera effectue.

## Article 6 — Responsabilite
L'organisateur ne saurait etre tenu responsable de la perte, du vol ou de la deterioration d'effets personnels durant l'evenement.

## Article 7 — Droit applicable
Les presentes conditions sont soumises au droit francais. Tout litige sera soumis aux tribunaux competents.`
  }

  if (field === 'codeOfConduct') {
    return `# Code de Conduite — ${eventName}

## Notre engagement
**${eventName}** s'engage a offrir une experience sans harcelement pour toutes et tous, quel que soit l'age, la taille, le handicap, l'origine ethnique, l'identite de genre, le niveau d'experience, la nationalite, l'apparence, la religion ou l'orientation sexuelle.

## Comportements attendus
- Etre respectueux et bienveillant envers les autres participants, speakers et organisateurs.
- S'abstenir de tout comportement degradant, discriminatoire ou harcelant.
- Respecter les espaces et le materiel mis a disposition.
- Alerter les organisateurs en cas de situation dangereuse ou de personne en difficulte.

## Comportements inacceptables
- Harcelement, intimidation ou discrimination sous toute forme.
- Commentaires ou plaisanteries offensants lies au genre, a l'orientation sexuelle, au handicap, a l'apparence, a la religion ou a l'origine.
- Contact physique inapproprie ou attention non desiree.
- Photographie ou enregistrement sans consentement.
- Perturbation deliberee des presentations ou des activites.

## Consequences
Toute personne a qui il est demande de cesser un comportement inacceptable doit s'y conformer immediatement. Les contrevenants pourront etre exclus de l'evenement sans remboursement.

## Signalement
Si vous etes temoin ou victime d'un comportement inacceptable, signalez-le immediatement au staff de l'evenement (identifiable par un badge organisateur)${org.website ? ` ou par email via le site ${org.website}` : ''}.`
  }

  return `# Politique de Confidentialite — ${eventName}

## Responsable du traitement
**${orgIdentity}**${orgAddress ? `, ${orgAddress}` : ''}.${org.siret ? `\nSIRET : ${org.siret}` : ''}${org.vatNumber ? ` — TVA : ${org.vatNumber}` : ''}

## Donnees collectees
- **Inscription** : nom, prenom, adresse email, entreprise (optionnel).
- **Paiement** : adresse de facturation, donnees de transaction (traitees de maniere securisee par notre prestataire de paiement).
- **Evenement** : scans de badges, presence aux sessions.

## Finalites
- Traitement des commandes de billets et emission des factures.
- Envoi de communications liees a l'evenement (programme, mises a jour, logistique).
- Amelioration des futures editions via des statistiques anonymisees.

## Base legale
- **Execution du contrat** : achat de billet, inscription.
- **Interet legitime** : organisation de l'evenement, securite des participants.

## Conservation
Les donnees personnelles sont conservees 3 ans apres l'evenement, sauf obligation legale de conservation plus longue (ex. factures : 10 ans).

## Vos droits
Conformement au RGPD, vous disposez d'un droit d'acces, de rectification, de suppression, de portabilite et d'opposition concernant vos donnees personnelles. Pour exercer vos droits, contactez-nous${org.website ? ` via ${org.website}` : ''}.

## Tiers
Les donnees peuvent etre partagees avec nos sous-traitants techniques : prestataire de paiement, service d'email, hebergeur. Aucune donnee n'est vendue a des tiers.

## Cookies
Le site utilise uniquement des cookies fonctionnels necessaires au bon fonctionnement du service.`
}

function fillTemplate(): void {
  if (!selectedDoc) return
  if (editorContent.trim() && !confirm(m.legal_generate_confirm())) return
  editorContent = generateTemplate(selectedDoc)
}

const selectedTitle = $derived(
  selectedDoc ? (documents.find((d) => d.field === selectedDoc)?.title ?? '') : ''
)
</script>

<svelte:head>
  <title>{m.legal_documents_title()} - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center gap-4">
    <a href="/admin/events">
      <Button variant="ghost" size="icon">
        <ArrowLeft class="h-4 w-4" />
      </Button>
    </a>
    <div>
      <h2 class="text-3xl font-bold tracking-tight">{data.edition.name}</h2>
      <p class="text-muted-foreground">{data.edition.eventName}</p>
    </div>
  </div>

  <!-- Tab Navigation -->
  <nav class="flex gap-1 rounded-lg border bg-muted/40 p-1">
    <a
      href="/admin/editions/{data.edition.slug}/settings"
      class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-background hover:shadow-sm"
    >
      {m.nav_settings()}
    </a>
    <a
      href="/admin/editions/{data.edition.slug}/team"
      class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-background hover:shadow-sm"
    >
      {m.admin_events_team_members()}
    </a>
    <span
      class="rounded-md px-3 py-1.5 text-sm font-medium bg-background shadow-sm"
    >
      {m.legal_documents_title()}
    </span>
  </nav>

  {#if !selectedDoc}
    <!-- Drive View -->

    {#if form?.success}
      <div
        class="rounded-md border border-green-500 bg-green-500/10 p-4 text-green-700 dark:text-green-400"
      >
        {m.legal_documents_saved()}
      </div>
    {/if}

    {#if form?.error}
      <div class="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
        {form.error}
      </div>
    {/if}

    <div class="grid gap-4 md:grid-cols-3">
      {#each documents as doc}
        {@const content = data.edition[doc.field]}
        {@const isConfigured = !!content.trim()}
        <button type="button" class="text-left" onclick={() => selectDocument(doc.field)}>
          <Card.Root
            class="h-full cursor-pointer transition-colors hover:border-primary/50 hover:bg-accent/50"
          >
            <Card.Header>
              <div class="flex items-start justify-between">
                <FileText class="h-8 w-8 text-muted-foreground" />
                {#if isConfigured}
                  <span
                    class="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400"
                  >
                    <Check class="h-3 w-3" />
                    {m.legal_status_configured()}
                  </span>
                {:else}
                  <span
                    class="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    {m.legal_status_not_configured()}
                  </span>
                {/if}
              </div>
              <Card.Title class="text-base">{doc.title}</Card.Title>
            </Card.Header>
            <Card.Content>
              {#if isConfigured}
                <p class="text-sm text-muted-foreground line-clamp-3">
                  {getExcerpt(content)}
                </p>
              {:else}
                <p class="text-sm italic text-muted-foreground">
                  {m.legal_documents_description()}
                </p>
              {/if}
            </Card.Content>
          </Card.Root>
        </button>
      {/each}
    </div>
  {:else}
    <!-- Editor View -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" onclick={backToList}>
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <div>
          <h2 class="text-2xl font-bold tracking-tight">{selectedTitle}</h2>
          <p class="text-sm text-muted-foreground">{m.legal_back_to_list()}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" onclick={fillTemplate}>
          <Sparkles class="mr-2 h-4 w-4" />
          {m.legal_generate_template()}
        </Button>
        <form
          method="POST"
          action="?/save"
          use:enhance={() => {
            isSaving = true
            return async ({ update }) => {
              isSaving = false
              await update()
              await invalidateAll()
            }
          }}
        >
          <input type="hidden" name="field" value={selectedDoc} />
          <input type="hidden" name="content" value={editorContent} />
          <Button type="submit" size="sm" disabled={isSaving}>
            {#if isSaving}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            {/if}
            {m.legal_save()}
          </Button>
        </form>
      </div>
    </div>

    <div class="grid min-h-[600px] gap-4 md:grid-cols-2">
      <!-- Editor -->
      <div class="flex flex-col gap-2">
        <span class="text-sm font-medium text-muted-foreground">{m.legal_editor()}</span>
        <Textarea
          class="h-full min-h-[560px] flex-1 resize-none font-mono text-sm"
          bind:value={editorContent}
          placeholder="# Title..."
        />
      </div>

      <!-- Preview -->
      <div class="flex flex-col gap-2">
        <span class="text-sm font-medium text-muted-foreground">{m.legal_preview()}</span>
        <div
          class="flex-1 overflow-y-auto rounded-md border bg-card p-4"
        >
          <div class="prose prose-sm dark:prose-invert max-w-none">
            {@html previewHtml}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
