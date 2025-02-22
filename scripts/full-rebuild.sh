#!/bin/bash

set -e  # Exit on error

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Remove existing DDEV project
log "Removing existing DDEV project..."
ddev delete -O || true
ddev poweroff

# Clean up directories but preserve dumps
log "Cleaning up directories..."
rm -rf vendor web/core web/modules/contrib .ddev/db_snapshots

# Initialize DDEV project
log "Reinitializing DDEV project..."
ddev config --project-type=drupal9 --docroot=web --create-docroot
ddev start

# Install dependencies
log "Installing Composer dependencies..."
ddev composer install

# Run standard rebuild script
log "Running standard rebuild process..."
./scripts/rebuild.sh

log "Full rebuild completed successfully"
