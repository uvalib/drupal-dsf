#!/bin/bash

set -e  # Exit on error

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Fixing core permissions..."

# Enable core modules that might be disabled
ddev drush en -y system
ddev drush en -y user

# Reset anonymous user permissions
ddev drush sql-query "DELETE FROM config WHERE name LIKE 'user.role.anonymous'"
ddev drush cim -y --partial --source=core/modules/user/config/install/

# Rebuild caches and registry
ddev drush cr

# Set basic permissions
ddev drush role-add-perm anonymous 'access content'
ddev drush role-add-perm authenticated 'access content'

log "✓ Core permissions fixed"
