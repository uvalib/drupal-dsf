#!/bin/bash

set -e  # Exit on error

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting Drupal 10 upgrade..."

# Create backup
backup_file="dumps/pre-d10-upgrade-$(date +%Y%m%d).sql.gz"
ddev export-db --file=$backup_file
log "✓ Backup created"

# Update core packages first
log "Updating Drupal core..."
if ddev composer require 'drupal/core:^10.0' 'drupal/core-recommended:^10.0' 'drupal/core-composer-scaffold:^10.0' 'drupal/core-project-message:^10.0' --with-all-dependencies --no-update --ignore-platform-reqs; then
    log "✓ Core requirements updated"
else
    log "✗ Core requirement update failed"
    exit 1
fi

# Install deprecated modules first
log "Installing deprecated modules..."
if ddev composer require drupal/classy:^1.0 drupal/stable:^2.0 drupal/ckeditor:^1.0 drupal/color:^1.0 drupal/quickedit:^1.0 drupal/rdf:^2.0 drupal/mysql:^1.1 --no-update; then
    log "✓ Deprecated modules added to composer.json"
else
    log "✗ Failed to add deprecated modules"
    exit 1
fi

# Now update all dependencies
log "Updating dependencies..."
if ddev composer update --with-all-dependencies --ignore-platform-reqs; then
    log "✓ Dependencies updated"
else
    log "✗ Dependency update failed"
    exit 1
fi

# Run database updates
if ddev drush updatedb -y; then
    log "✓ Database updated"
else
    log "✗ Database update failed"
    exit 1
fi

# Deploy hooks
if ddev drush deploy:hook -y; then
    log "✓ Deploy hooks completed"
else
    log "✗ Deploy hooks failed"
    exit 1
fi

# Enable required modules
log "Enabling required modules..."
ddev drush en -y ckeditor color quickedit rdf mysql

# Clear caches
ddev drush cr
log "✓ Caches rebuilt"

# Check status
ddev drush status --fields=drupal-version,php-version
log "✓ Upgrade to Drupal 10 complete"
