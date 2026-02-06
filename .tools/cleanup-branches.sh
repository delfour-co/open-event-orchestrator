#!/usr/bin/env bash
#
# cleanup-branches.sh
#
# Script de nettoyage des branches Git locales et des worktrees :
#  - Supprime les branches locales mergées
#  - Supprime les branches locales obsolètes (optionnel)
#  - Nettoie les worktrees Git
#  - Nettoie les références distantes obsolètes (optionnel)
#
# Utilisation :
#   ./.tools/cleanup-branches.sh                    # Mode interactif
#   ./.tools/cleanup-branches.sh --all              # Nettoie tout (branches mergées + obsolètes)
#   ./.tools/cleanup-branches.sh --merged-only      # Nettoie seulement les branches mergées
#   ./.tools/cleanup-branches.sh --worktrees-only   # Nettoie seulement les worktrees
#   ./.tools/cleanup-branches.sh --force            # Pas de confirmation
#

set -euo pipefail

########################################
# Configuration
########################################

# Branches à protéger (ne jamais supprimer)
PROTECTED_BRANCHES=("main" "master" "develop" "dev")

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

########################################
# Helpers
########################################

log()  { printf "${YELLOW}[cleanup-branches]${NC} %b\n" "$*"; }
ok()   { printf "${GREEN}[cleanup-branches]${NC} %b\n" "$*"; }
err()  { printf "${RED}[cleanup-branches]${NC} %b\n" "$*" >&2; }
info() { printf "${BLUE}[cleanup-branches]${NC} %b\n" "$*"; }

########################################
# Parsing des arguments
########################################

REPO_PATH="."
CLEAN_MERGED=true
CLEAN_STALE=false
CLEAN_WORKTREES=true
CLEAN_REMOTE_REFS=false
FORCE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --all)
      CLEAN_MERGED=true
      CLEAN_STALE=true
      CLEAN_WORKTREES=true
      CLEAN_REMOTE_REFS=true
      shift
      ;;
    --merged-only)
      CLEAN_MERGED=true
      CLEAN_STALE=false
      CLEAN_WORKTREES=false
      CLEAN_REMOTE_REFS=false
      shift
      ;;
    --stale-only)
      CLEAN_MERGED=false
      CLEAN_STALE=true
      CLEAN_WORKTREES=false
      CLEAN_REMOTE_REFS=false
      shift
      ;;
    --worktrees-only)
      CLEAN_MERGED=false
      CLEAN_STALE=false
      CLEAN_WORKTREES=true
      CLEAN_REMOTE_REFS=false
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS] [REPO_PATH]"
      echo ""
      echo "Options:"
      echo "  --all              Nettoie tout (branches mergées + obsolètes + worktrees + refs distantes)"
      echo "  --merged-only      Nettoie seulement les branches mergées"
      echo "  --stale-only       Nettoie seulement les branches obsolètes"
      echo "  --worktrees-only   Nettoie seulement les worktrees"
      echo "  --force            Pas de confirmation interactive"
      echo "  --help, -h         Affiche cette aide"
      echo ""
      echo "REPO_PATH: Chemin vers le dépôt Git (par défaut: répertoire courant)"
      exit 0
      ;;
    -*)
      err "Option inconnue: $1"
      err "Utilisez --help pour voir les options disponibles"
      exit 1
      ;;
    *)
      # Argument qui n'est pas une option = chemin du dépôt
      REPO_PATH="$1"
      shift
      ;;
  esac
done

########################################
# Vérifications initiales
########################################

cd "$REPO_PATH"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  err "Ce répertoire n'est pas un dépôt Git : $(pwd)"
  exit 1
fi

# Vérifier que la copie de travail est propre
if [[ -n "$(git status --porcelain)" ]]; then
  err "La copie de travail n'est pas propre (fichiers modifiés/non suivis)."
  err "Commite ou stash tes changements avant de lancer ce script."
  exit 1
fi

CURRENT_BRANCH=$(git branch --show-current)
if [[ -z "$CURRENT_BRANCH" ]]; then
  err "Impossible de détecter la branche courante."
  exit 1
fi

########################################
# Fonctions utilitaires
########################################

is_protected() {
  local branch="$1"
  for protected in "${PROTECTED_BRANCHES[@]}"; do
    if [[ "$branch" == "$protected" ]]; then
      return 0
    fi
  done
  return 1
}

confirm() {
  if [[ "$FORCE" == "true" ]]; then
    return 0
  fi
  
  local message="$1"
  echo -n "$message (oui/non) "
  read -r
  if [[ $REPLY =~ ^[Oo][Uu][Ii]$ ]]; then
    return 0
  fi
  return 1
}

########################################
# 1. Nettoyage des branches mergées
########################################

clean_merged_branches() {
  log "Recherche des branches mergées..."
  
  # Récupérer les dernières informations distantes
  git fetch --prune --quiet 2>/dev/null || true
  
  # Trouver les branches mergées dans la branche courante
  local merged_branches
  merged_branches=$(git branch --merged "$CURRENT_BRANCH" --format='%(refname:short)' | grep -v "^$CURRENT_BRANCH$" || true)
  
  if [[ -z "$merged_branches" ]]; then
    info "Aucune branche mergée à nettoyer."
    return 0
  fi
  
  # Filtrer les branches protégées
  local to_delete=()
  while IFS= read -r branch; do
    if [[ -n "$branch" ]] && ! is_protected "$branch"; then
      to_delete+=("$branch")
    fi
  done <<< "$merged_branches"
  
  if [[ ${#to_delete[@]} -eq 0 ]]; then
    info "Aucune branche mergée à supprimer (toutes sont protégées)."
    return 0
  fi
  
  echo
  info "Branches mergées trouvées (${#to_delete[@]}) :"
  for branch in "${to_delete[@]}"; do
    echo "  - $branch"
  done
  echo
  
  if confirm "Voulez-vous supprimer ces branches mergées ?"; then
    local deleted=0
    local failed=0
    for branch in "${to_delete[@]}"; do
      if git branch -d "$branch" 2>/dev/null; then
        ok "  ✓ Branche '$branch' supprimée"
        deleted=$((deleted + 1))
      else
        err "  ✗ Échec de la suppression de '$branch'"
        failed=$((failed + 1))
      fi
    done
    echo
    ok "Branches mergées supprimées : $deleted"
    if [[ $failed -gt 0 ]]; then
      err "Échecs : $failed (peut-être des branches non complètement mergées)"
    fi
  else
    log "Suppression des branches mergées annulée."
  fi
}

########################################
# 2. Nettoyage des branches obsolètes
########################################

clean_stale_branches() {
  log "Recherche des branches obsolètes..."
  
  # Récupérer les dernières informations distantes
  git fetch --prune --quiet 2>/dev/null || true
  
  # Trouver les branches locales qui n'ont pas de tracking distant
  # ou dont la branche distante a été supprimée
  local stale_branches=()
  
  while IFS= read -r branch; do
    if [[ -z "$branch" ]] || [[ "$branch" == "$CURRENT_BRANCH" ]]; then
      continue
    fi
    
    if is_protected "$branch"; then
      continue
    fi
    
    # Vérifier si la branche a un tracking distant
    local tracking=$(git config --get "branch.$branch.remote" 2>/dev/null || echo "")
    if [[ -z "$tracking" ]]; then
      # Pas de tracking, considérer comme obsolète si demandé explicitement
      stale_branches+=("$branch")
    else
      # Vérifier si la branche distante existe encore
      local remote_branch=$(git config --get "branch.$branch.merge" | sed 's|refs/heads/||' 2>/dev/null || echo "")
      if [[ -n "$remote_branch" ]]; then
        local remote_name=$(git config --get "branch.$branch.remote")
        if ! git ls-remote --exit-code --heads "$remote_name" "$remote_branch" >/dev/null 2>&1; then
          stale_branches+=("$branch")
        fi
      fi
    fi
  done < <(git branch --format='%(refname:short)')
  
  if [[ ${#stale_branches[@]} -eq 0 ]]; then
    info "Aucune branche obsolète trouvée."
    return 0
  fi
  
  echo
  info "Branches obsolètes trouvées (${#stale_branches[@]}) :"
  for branch in "${stale_branches[@]}"; do
    echo "  - $branch"
  done
  echo
  
  if confirm "Voulez-vous supprimer ces branches obsolètes ?"; then
    local deleted=0
    local failed=0
    for branch in "${stale_branches[@]}"; do
      if git branch -D "$branch" 2>/dev/null; then
        ok "  ✓ Branche '$branch' supprimée"
        deleted=$((deleted + 1))
      else
        err "  ✗ Échec de la suppression de '$branch'"
        failed=$((failed + 1))
      fi
    done
    echo
    ok "Branches obsolètes supprimées : $deleted"
    if [[ $failed -gt 0 ]]; then
      err "Échecs : $failed"
    fi
  else
    log "Suppression des branches obsolètes annulée."
  fi
}

########################################
# 3. Nettoyage des worktrees
########################################

clean_worktrees() {
  log "Recherche des worktrees..."
  
  if ! git worktree list >/dev/null 2>&1; then
    info "Aucun worktree configuré."
    return 0
  fi
  
  local worktrees
  worktrees=$(git worktree list --porcelain 2>/dev/null | grep -E "^worktree " | sed 's/^worktree //' || true)
  
  if [[ -z "$worktrees" ]]; then
    info "Aucun worktree trouvé."
    return 0
  fi
  
  # Compter les worktrees (en excluant le worktree principal)
  local worktree_count=0
  local worktree_list=()
  while IFS= read -r path; do
    if [[ -n "$path" ]] && [[ "$path" != "$(pwd)" ]]; then
      worktree_list+=("$path")
      worktree_count=$((worktree_count + 1))
    fi
  done <<< "$worktrees"
  
  if [[ $worktree_count -eq 0 ]]; then
    info "Aucun worktree supplémentaire à nettoyer."
    return 0
  fi
  
  echo
  info "Worktrees trouvés ($worktree_count) :"
  for path in "${worktree_list[@]}"; do
    local branch=$(git worktree list | grep "$path" | awk '{print $NF}' || echo "?")
    echo "  - $path (branche: $branch)"
  done
  echo
  
  if confirm "Voulez-vous supprimer ces worktrees ?"; then
    local deleted=0
    local failed=0
    for path in "${worktree_list[@]}"; do
      if git worktree remove "$path" --force 2>/dev/null; then
        ok "  ✓ Worktree '$path' supprimé"
        deleted=$((deleted + 1))
      else
        err "  ✗ Échec de la suppression du worktree '$path'"
        failed=$((failed + 1))
      fi
    done
    echo
    ok "Worktrees supprimés : $deleted"
    if [[ $failed -gt 0 ]]; then
      err "Échecs : $failed"
    fi
  else
    log "Suppression des worktrees annulée."
  fi
}

########################################
# 4. Nettoyage des références distantes obsolètes
########################################

clean_remote_refs() {
  log "Nettoyage des références distantes obsolètes..."
  
  # Récupérer et nettoyer les références distantes
  if git fetch --prune --quiet 2>/dev/null; then
    ok "Références distantes obsolètes nettoyées."
  else
    log "Aucune référence distante à nettoyer ou erreur lors du fetch."
  fi
}

########################################
# Exécution principale
########################################

echo
log "Nettoyage des branches Git et worktrees"
log "Branche courante : $CURRENT_BRANCH"
log "Répertoire : $(pwd)"
echo

TOTAL_DELETED=0

if [[ "$CLEAN_MERGED" == "true" ]]; then
  clean_merged_branches
  echo
fi

if [[ "$CLEAN_STALE" == "true" ]]; then
  clean_stale_branches
  echo
fi

if [[ "$CLEAN_WORKTREES" == "true" ]]; then
  clean_worktrees
  echo
fi

if [[ "$CLEAN_REMOTE_REFS" == "true" ]]; then
  clean_remote_refs
  echo
fi

ok "✅ Nettoyage terminé !"
echo
log "Branches restantes :"
git branch --format='  %(refname:short)' | head -20
if [[ $(git branch | wc -l) -gt 20 ]]; then
  info "  ... ($(git branch | wc -l) branches au total)"
fi
