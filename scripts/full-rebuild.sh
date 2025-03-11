#!/bin/bash

set -e  # Exit on error

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")
cd "$PROJECT_ROOT"  # Ensure we're in project root

# Add error handling function
handle_error() {
    log "Error occurred in rebuild script"
    log "Line: $1"
    log "Exit code: $2"
}

trap 'handle_error ${LINENO} $?' ERR

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Check for uncommitted changes
log "Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    log "Warning: You have uncommitted changes:"
    git status --short
    read -p "Do you want to continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Aborting rebuild due to uncommitted changes"
        exit 1
    fi
fi

# Parse arguments
BACKUP=false
while getopts "bh" opt; do
    case $opt in
        b) BACKUP=true ;;
        h)
            echo "Usage: $0 [-b] [-h]"
            echo "  -b  Create a database backup before rebuilding"
            echo "  -h  Show this help message"
            exit 0
            ;;
    esac
done

# Backup database if requested
if [ "$BACKUP" = true ]; then
    log "Creating database backup..."
    ddev export-db --file="$PROJECT_ROOT/database/dumps/pre-rebuild-$(date +%Y%m%d-%H%M%S).sql.gz" || true
fi

# Remove existing DDEV project
log "Removing existing DDEV project..."
ddev delete -O || true
ddev poweroff

# Clean up directories but preserve dumps and custom code
log "Cleaning up directories..."
rm -rf \
    vendor \
    web/core \
    web/modules/contrib \
    web/themes/contrib \
    web/profiles/contrib \
    .ddev/db_snapshots

# Start DDEV
log "Starting DDEV..."
ddev start

# Install dependencies
log "Installing Composer dependencies..."
ddev composer install --prefer-dist
if [ $? -ne 0 ]; then
    log "ERROR: Composer install failed"
    exit 1
fi

# Enhanced module cleanup before rebuild
log "Preparing modules..."
ddev drush pmu finder -y || true
ddev exec drush cr
ddev exec drush en -y system
ddev exec php web/core/scripts/rebuild-module-cache.php

# Run standard rebuild script
log "Running standard rebuild process..."
"$SCRIPT_DIR/rebuild.sh"
if [ $? -ne 0 ]; then
    log "ERROR: Rebuild failed"
    exit 1
fi

# Module rebuild steps
log "Rebuilding module structure..."
ddev drush en -y finder
ddev drush cr

# Verify content
log "Verifying content..."
ddev drush dcer taxonomy_term facets --folder=web/modules/custom/finder/content

log "✓ Full rebuild completed successfully"
log "You may want to run analyze scripts to verify the rebuild:"
log "  ./analyze-facet-structure.sh"
log "  ./analyze-qa.sh"
