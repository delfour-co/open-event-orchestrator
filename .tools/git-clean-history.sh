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
# 5. Créer une branche de backup
########################################

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_BRANCH="backup/pre-rewrite-$TIMESTAMP"

log "Création d'une branche de backup : $BACKUP_BRANCH"
git branch "$BACKUP_BRANCH"
ok  "Branche de backup créée."

########################################
# 6. Lancer git-filter-repo
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
# 7. Rappel pour le push
########################################

echo
log "Étapes suivantes recommandées :"
echo "  1) Vérifier rapidement le log :"
echo "       git log --format=\"%h %an <%ae>\" | head -n 20"
echo "  2) Vérifier quelques messages de commit :"
echo "       git log -n 5"
echo "  3) Pousser l'historique réécrit sur le remote (ATTENTION : force) :"
echo "       git push origin --force --tags"
echo
log "Si quelque chose ne va pas, tu peux revenir sur la branche de backup :"
echo "       git checkout $BACKUP_BRANCH"
ok "Done."
