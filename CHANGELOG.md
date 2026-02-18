# Changelog

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté
- Documentation de sécurité (SECURITY.md)
- Code de conduite (CODE_OF_CONDUCT.md)
- Changelog (CHANGELOG.md)

## [1.0.0] - 2025-XX-XX

### Ajouté

#### Core / Foundations
- Configuration du projet SvelteKit avec TypeScript, Tailwind CSS, shadcn-svelte
- Configuration PocketBase 0.36+ avec Docker
- Authentification avec contrôle d'accès basé sur les rôles (speaker, organizer, reviewer, admin)
- Interface utilisateur : sidebar, header, toggle de thème (dark/light)
- Git hooks (Husky, commitlint) et CI/CD (GitHub Actions)
- Modèle de données de base : Organization, Event, Edition
- Assistant de configuration rapide (Organization → Event → Edition en un flux)

#### CFP (Call for Papers)
- Formulaire de soumission de talk avec catégories et formats
- Tableau de bord organisateur avec filtres, actions groupées et export CSV
- Système de review avec notes et commentaires
- Système de notifications (templates email)
- Paramètres CFP avec persistance en base de données (dates, catégories, formats)
- Paramètres d'édition (séparés du CFP)
- Tableau de bord avec statistiques et filtre d'édition

#### Planning
- Modèle de données : Session, Room, Slot, Track
- CRUD Rooms, Tracks, Slots avec gestion d'équipement
- Gestion des sessions : assigner des talks aux créneaux
- Assignations de staff : assigner des membres d'équipe aux salles
- Vue du planning avec switch (par salle / par track)
- Formulaire de session en modal (amélioration UX)
- Vue publique du planning
- Export : iCal, JSON, PDF

#### Billing / Ticketing
- Types de tickets et tarification
- Intégration Stripe
- Tickets QR code et check-in
- Gestion des commandes (créer, compléter, annuler, rembourser)
- Notifications email aux participants
- Liste des participants et tableau de bord de check-in
- Personnalisation visuelle des tickets (couleurs, logo, export PDF)
- Tour de contrôle de check-in (surveillance en temps réel du personnel sur le terrain)
- PWA Mobile Scanner avec synchronisation offline

#### CRM
- Modèle de contact unifié scoped par événement
- Sources de contacts : speaker, attendee, sponsor, manual, import
- Auto-synchronisation depuis les speakers CFP et les participants Billing
- Import CSV avec stratégies de fusion/skip/overwrite
- Export CSV avec sélection de champs
- Segments dynamiques avec évaluation basée sur des règles
- Campagnes email (créer, éditer, envoyer, test, planifier, annuler)
- Templates email avec interpolation de variables
- Gestion du consentement RGPD (marketing, partage de données, analytics)
- Mécanisme de désinscription en un clic

#### Budget
- Modèle de budget : catégories, transactions
- Tableau de bord budgétaire avec visualisation
- Gestion des devis et factures
- Remboursements speakers avec portail

#### Financial Journal
- Modèle de journal d'audit financier
- Enregistrement automatique de toutes les opérations financières
- Visualiseur de journal avec filtres et recherche
- Export du journal pour comptabilité (CSV/PDF)

#### Sponsoring
- Modèle sponsor : sponsors, packages, benefits
- Tableau de bord sponsor avec pipeline
- Configuration des packages de sponsoring
- Page publique des sponsors
- Portail sponsor
- Gestion des membres d'équipe par édition

#### API
- Endpoints REST API avec authentification Bearer token
- Gestion des clés API (créer, révoquer, rate limiting)
- Documentation OpenAPI 3.1 avec Swagger UI
- Webhooks sortants avec signature HMAC
- Widgets intégrables (planning, speakers, tickets)
- Interface admin pour les clés API et webhooks

#### Intégrations
- Intégration Discord (notifications webhook)

#### Mobile / PWA
- PWA Mobile Participants (agenda personnel, favoris)
- PWA Mobile Scanner avec synchronisation offline et tour de contrôle

### Modifié
- (À compléter avec les modifications futures)

### Déprécié
- (À compléter avec les dépréciations futures)

### Supprimé
- (À compléter avec les suppressions futures)

### Corrigé
- (À compléter avec les corrections futures)

### Sécurité
- (À compléter avec les corrections de sécurité futures)

---

## Format des Entrées

Chaque version doit lister les changements dans les catégories suivantes :

- **Ajouté** : pour les nouvelles fonctionnalités
- **Modifié** : pour les changements dans les fonctionnalités existantes
- **Déprécié** : pour les fonctionnalités qui seront bientôt supprimées
- **Supprimé** : pour les fonctionnalités supprimées
- **Corrigé** : pour les corrections de bugs
- **Sécurité** : pour les vulnérabilités corrigées

[Non publié]: https://github.com/delfour-co/open-event-orchestrator/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/delfour-co/open-event-orchestrator/releases/tag/v1.0.0
