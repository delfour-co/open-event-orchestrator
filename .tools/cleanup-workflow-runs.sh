#!/bin/bash
# Script pour supprimer tous les workflow runs d'un dépôt GitHub

set -e

REPO="delfour-co/open-event-orchestrator"
TOTAL_DELETED=0

echo "🧹 Nettoyage de l'historique des workflows pour $REPO"
echo ""

# Récupérer tous les workflows
echo "📋 Récupération de la liste des workflows..."
WORKFLOWS=$(gh api "repos/$REPO/actions/workflows" --jq '.workflows[] | "\(.id)|\(.name)"')

if [ -z "$WORKFLOWS" ]; then
    echo "ℹ️  Aucun workflow trouvé."
    exit 0
fi

# Pour chaque workflow
while IFS='|' read -r workflow_id workflow_name; do
    echo ""
    echo "🔍 Traitement du workflow: $workflow_name (ID: $workflow_id)"
    
    # Récupérer tous les runs pour ce workflow (avec pagination)
    PAGE=1
    PER_PAGE=100
    
    while true; do
        RUNS=$(gh api "repos/$REPO/actions/workflows/$workflow_id/runs?per_page=$PER_PAGE&page=$PAGE" --jq '.workflow_runs[] | "\(.id)|\(.status)|\(.conclusion)"' 2>/dev/null || echo "")
        
        if [ -z "$RUNS" ]; then
            break
        fi
        
        # Supprimer chaque run
        while IFS='|' read -r run_id status conclusion; do
            echo "  🗑️  Suppression du run #$run_id (status: $status, conclusion: ${conclusion:-N/A})"
            
            if gh api -X DELETE "repos/$REPO/actions/runs/$run_id" 2>/dev/null; then
                TOTAL_DELETED=$((TOTAL_DELETED + 1))
                echo "     ✅ Supprimé"
            else
                echo "     ❌ Échec de la suppression"
            fi
        done <<< "$RUNS"
        
        # Vérifier s'il y a plus de pages
        TOTAL_COUNT=$(gh api "repos/$REPO/actions/workflows/$workflow_id/runs?per_page=$PER_PAGE&page=$PAGE" --jq '.total_count' 2>/dev/null || echo "0")
        CURRENT_COUNT=$((PAGE * PER_PAGE))
        
        if [ "$CURRENT_COUNT" -ge "$TOTAL_COUNT" ]; then
            break
        fi
        
        PAGE=$((PAGE + 1))
    done
    
done <<< "$WORKFLOWS"

echo ""
echo "✅ Nettoyage terminé!"
echo "📊 Total de runs supprimés: $TOTAL_DELETED"
