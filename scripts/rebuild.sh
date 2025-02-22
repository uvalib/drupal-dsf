#!/bin/bash

set -e  # Exit on error

echo "Step 1: Importing database from dumps/dsf.sql.gz..."
ddev import-db --file=dumps/dsf.sql.gz
ddev drush updatedb -y

echo "Step 2: Fixing permissions..."
./scripts/fix-permissions.sh

echo "Step 3: Enabling content module..."
ddev drush en -y uva_dsf_content

echo "Step 4: Rebuilding caches..."
ddev drush cr 

echo "Step 5: Launching finder page..."
ddev launch /finder

echo "✓ Rebuild process completed"
