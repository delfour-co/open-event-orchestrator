# Politique de Sécurité

## Versions Supportées

Nous fournissons des mises à jour de sécurité pour les versions suivantes :

| Version | Supportée          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Signaler une Vulnérabilité

Nous prenons la sécurité d'Open Event Orchestrator très au sérieux. Si vous découvrez une vulnérabilité de sécurité, nous apprécions votre aide pour la divulguer de manière responsable.

### Comment Signaler

**Ne pas** créer une issue publique GitHub pour les vulnérabilités de sécurité.

Au lieu de cela, veuillez signaler les vulnérabilités par email à :

**security@delfour.co**

Veuillez inclure les informations suivantes dans votre rapport :

- Type de vulnérabilité (ex: XSS, injection SQL, authentification, etc.)
- Emplacement du code affecté (fichier, ligne, fonction)
- Étapes pour reproduire la vulnérabilité
- Impact potentiel de la vulnérabilité
- Suggestions de correctif (si vous en avez)

### Processus de Signalement

1. **Réception** : Vous recevrez un accusé de réception dans les 48 heures
2. **Évaluation** : Notre équipe évaluera la vulnérabilité dans les 7 jours
3. **Correction** : Nous travaillerons sur un correctif et vous tiendrons informé
4. **Publication** : Une fois corrigée, nous publierons un avis de sécurité (si nécessaire)

### Politique de Divulgation Responsable

Nous suivons une politique de divulgation responsable :

- **Ne pas** divulguer publiquement la vulnérabilité avant qu'un correctif ne soit disponible
- Nous vous tiendrons informé de l'avancement de la correction
- Nous créditerons les chercheurs en sécurité dans nos avis de sécurité (si vous le souhaitez)
- Nous visons à publier un correctif dans les 90 jours suivant le signalement

### Récompenses

Actuellement, nous n'offrons pas de programme de récompenses pour les bugs (bug bounty). Cependant, nous apprécions grandement votre contribution et vous créditerons dans nos communications de sécurité.

### Zones d'Intérêt Particulier

Les domaines suivants sont particulièrement importants pour la sécurité :

- Authentification et autorisation
- Gestion des paiements (Stripe)
- Traitement des données personnelles (RGPD)
- Validation des entrées utilisateur
- Protection contre les injections (SQL, NoSQL, XSS)
- Gestion des fichiers uploadés
- API publique et webhooks

### Bonnes Pratiques de Sécurité

Si vous contribuez au projet, veuillez :

- Ne jamais commiter de secrets, clés API ou mots de passe
- Valider et nettoyer toutes les entrées utilisateur
- Utiliser des requêtes paramétrées pour les interactions avec la base de données
- Suivre les principes de moindre privilège pour les permissions
- Tester vos modifications pour les vulnérabilités courantes

### Historique des Vulnérabilités

Les vulnérabilités corrigées seront documentées dans les [notes de version](CHANGELOG.md) et, si nécessaire, dans des avis de sécurité dédiés.

## Contact

Pour toute question concernant la sécurité, contactez-nous à **security@delfour.co**.
