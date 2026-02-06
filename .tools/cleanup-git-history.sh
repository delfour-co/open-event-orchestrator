#!/usr/bin/env bash
#
# git-clean-history.sh
#
# Script de nettoyage d'historique Git :
#  - Remappe certains auteurs vers un auteur unique
#  - Uniformise le nom + email de tous les commits
#  - Supprime les lignes "Co-Authored-By:" des messages de commit
#
# Utilisation :
#   ./scripts/git-clean-history.sh               # sur le repo courant
#   ./scripts/git-clean-history.sh /chemin/vers/repo
#
# Personnalisation via variables d'environnement :
#   TARGET_NAME="Autre Nom" TARGET_EMAIL="autre@mail" REMAPPED_AUTHORS="Claude,claude.ai" ./scripts/git-clean-history.sh
#   AUTO_PUSH=1 ./scripts/git-clean-history.sh  # Push automatique sans confirmation
#

set -euo pipefail

########################################
# Config par défaut (surchageables via env)
########################################

TARGET_NAME="${TARGET_NAME:-Kevin Delfour}"
TARGET_EMAIL="${TARGET_EMAIL:-kevin@delfour.co}"
# Auteurs qui seront remappés vers TARGET_NAME/TARGET_EMAIL
REMAPPED_AUTHORS="${REMAPPED_AUTHORS:-Claude,claude.ai}"

REPO_PATH="${1:-.}"

########################################
# Helpers
########################################

log()  { printf "\033[0;33m[git-clean-history]\033[0m %b\n" "$*"; }
ok()   { printf "\033[0;32m[git-clean-history]\033[0m %b\n" "$*"; }
err()  { printf "\033[0;31m[git-clean-history]\033[0m %b\n" "$*" >&2; }

########################################
# 1. Aller dans le repo
########################################

cd "$REPO_PATH"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  err "Ce répertoire n'est pas un dépôt Git : $REPO_PATH"
  exit 1
fi

########################################
# 2. Vérifier que la copie de travail est propre
########################################

if [[ -n "$(git status --porcelain)" ]]; then
  err "La copie de travail n'est pas propre (fichiers modifiés/non suivis)."
  err "Commite ou stash tes changements avant de lancer ce script."
  exit 1
fi

########################################
# 3. Vérifier git-filter-repo
########################################

if ! command -v git-filter-repo >/dev/null 2>&1; then
  err "git-filter-repo n'est pas installé."
  err "Installe-le par exemple avec :"
  err "  pip install git-filter-repo"
  exit 1
fi

########################################
# 4. Afficher le plan
########################################

log "Réécriture de l'historique Git dans : $(pwd)"
log "Auteur cible   : $TARGET_NAME"
log "Email cible    : $TARGET_EMAIL"
log "Auteurs remappés vers cet auteur : $REMAPPED_AUTHORS"
log "Les lignes 'Co-Authored-By:' seront supprimées des messages de commit."
echo

########################################
# 5. Sauvegarder les remotes
########################################

log "Sauvegarde des remotes..."
REMOTES_BACKUP=$(mktemp)
git remote -v > "$REMOTES_BACKUP" 2>/dev/null || true
ok "Remotes sauvegardés."

########################################
# 6. Créer une branche de backup
########################################

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_BRANCH="backup/pre-rewrite-$TIMESTAMP"

log "Création d'une branche de backup : $BACKUP_BRANCH"
git branch "$BACKUP_BRANCH"
ok  "Branche de backup créée."

########################################
# 7. Lancer git-filter-repo
########################################

log "Lancement de git-filter-repo (réécriture complète des commits, branches et tags)..."

git filter-repo --force --commit-callback '
import re
import os

target_name  = os.environ.get("TARGET_NAME",  "Kevin Delfour").encode()
target_email = os.environ.get("TARGET_EMAIL", "kevin@delfour.co").encode()
remapped_raw = os.environ.get("REMAPPED_AUTHORS", "Claude,claude.ai")

if remapped_raw.strip():
    remapped = [a.strip().encode() for a in remapped_raw.split(",")]
else:
    remapped = []

# 1) Remappe certains auteurs/committers vers l auteur cible
if commit.author_name in remapped:
    commit.author_name = target_name
if commit.committer_name in remapped:
    commit.committer_name = target_name

# 2) Uniformise tous les emails sur TARGET_EMAIL
commit.author_email = target_email
commit.committer_email = target_email

# 3) Supprime toutes les lignes Co-Authored-By (case-insensitive)
lines = commit.message.split(b"\n")
lines = [l for l in lines if not re.match(br"^[Cc]o-[Aa]uthored-[Bb]y:", l)]
commit.message = b"\n".join(lines)
'

ok "Réécriture de l'historique terminée."

########################################
# 8. Restaurer les remotes
########################################

log "Restauration des remotes..."
if [[ -s "$REMOTES_BACKUP" ]]; then
  # Extraire les noms de remotes uniques (git remote -v affiche chaque remote deux fois)
  declare -A remotes_map
  while IFS= read -r line; do
    if [[ -z "$line" ]]; then
      continue
    fi
    # Format: remote_name    url (fetch) ou remote_name    url (push)
    remote_name=$(echo "$line" | awk '{print $1}')
    remote_url=$(echo "$line" | awk '{print $2}')
    
    if [[ -n "$remote_name" && -n "$remote_url" ]]; then
      # Utiliser seulement la première occurrence (fetch) pour éviter les doublons
      if [[ -z "${remotes_map[$remote_name]:-}" ]]; then
        remotes_map[$remote_name]=$remote_url
      fi
    fi
  done < "$REMOTES_BACKUP"
  
  # Restaurer chaque remote
  for remote_name in "${!remotes_map[@]}"; do
    remote_url="${remotes_map[$remote_name]}"
    if ! git remote get-url "$remote_name" >/dev/null 2>&1; then
      git remote add "$remote_name" "$remote_url"
      log "  Remote '$remote_name' restauré : $remote_url"
    else
      # Le remote existe déjà, vérifier si l'URL est correcte
      existing_url=$(git remote get-url "$remote_name")
      if [[ "$existing_url" != "$remote_url" ]]; then
        git remote set-url "$remote_name" "$remote_url"
        log "  Remote '$remote_name' mis à jour : $remote_url"
      fi
    fi
  done
  
  rm -f "$REMOTES_BACKUP"
  ok "Remotes restaurés."
else
  log "Aucun remote à restaurer."
fi

########################################
# 9. Vérifier l'historique réécrit
########################################

echo
log "Vérification de l'historique réécrit..."
log "Aperçu des commits (auteurs) :"
git log --format="%h %an <%ae>" | head -n 10
echo

########################################
# 10. Push automatique vers le dépôt distant
########################################

# Détecter la branche courante
CURRENT_BRANCH=$(git branch --show-current)
if [[ -z "$CURRENT_BRANCH" ]]; then
  err "Impossible de détecter la branche courante."
  exit 1
fi

# Détecter le remote principal (origin par défaut, sinon le premier remote)
PRIMARY_REMOTE="origin"
if ! git remote get-url "$PRIMARY_REMOTE" >/dev/null 2>&1; then
  # Essayer de trouver un autre remote
  FIRST_REMOTE=$(git remote | head -n 1)
  if [[ -n "$FIRST_REMOTE" ]]; then
    PRIMARY_REMOTE="$FIRST_REMOTE"
    log "Remote 'origin' non trouvé, utilisation de '$PRIMARY_REMOTE'"
  else
    log "Aucun remote configuré. Le push sera ignoré."
    PRIMARY_REMOTE=""
  fi
fi

if [[ -n "$PRIMARY_REMOTE" ]]; then
  # Demander confirmation sauf si AUTO_PUSH=1
  AUTO_PUSH="${AUTO_PUSH:-0}"
  
  if [[ "$AUTO_PUSH" != "1" ]]; then
    echo
    log "⚠️  ATTENTION : L'historique va être poussé avec --force sur $PRIMARY_REMOTE/$CURRENT_BRANCH"
    log "Cela réécrira l'historique sur le dépôt distant."
    echo
    read -p "Voulez-vous continuer ? (oui/non) " -r
    echo
    if [[ ! $REPLY =~ ^[Oo][Uu][Ii]$ ]]; then
      log "Push annulé par l'utilisateur."
      echo
      log "Pour pousser manuellement plus tard :"
      echo "  git push $PRIMARY_REMOTE $CURRENT_BRANCH --force"
      echo "  git push $PRIMARY_REMOTE --tags --force"
      echo
      log "Si quelque chose ne va pas, tu peux revenir sur la branche de backup :"
      echo "  git checkout $BACKUP_BRANCH"
      ok "Done."
      exit 0
    fi
  fi
  
  log "Push de la branche $CURRENT_BRANCH vers $PRIMARY_REMOTE..."
  if git push "$PRIMARY_REMOTE" "$CURRENT_BRANCH" --force; then
    ok "Branche $CURRENT_BRANCH poussée avec succès."
  else
    err "Échec du push de la branche $CURRENT_BRANCH."
    exit 1
  fi
  
  log "Push des tags vers $PRIMARY_REMOTE..."
  if git push "$PRIMARY_REMOTE" --tags --force; then
    ok "Tags poussés avec succès."
  else
    log "Aucun tag à pousser ou échec du push des tags (non bloquant)."
  fi
  
  echo
  ok "✅ Historique réécrit et poussé avec succès sur $PRIMARY_REMOTE/$CURRENT_BRANCH"
else
  echo
  log "Aucun remote configuré. Pour pousser manuellement :"
  echo "  git remote add origin <url>"
  echo "  git push origin $CURRENT_BRANCH --force"
  echo "  git push origin --tags --force"
fi

echo
log "Si quelque chose ne va pas, tu peux revenir sur la branche de backup :"
echo "  git checkout $BACKUP_BRANCH"
ok "Done."
