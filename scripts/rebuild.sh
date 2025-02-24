#!/bin/bash

set -e  # Exit on error

# Process flags
EMPTY=false
for arg in "$@"
do
    case $arg in
        --empty)
        EMPTY=true
        shift
        ;;
    esac
done

echo "Step 1: Importing database..."
if [ "$EMPTY" = true ]; then
    echo "Using clean database (--empty flag)"
    ddev drush sql-drop -y
    ddev drush si standard --account-pass=admin --site-name="UVa Data Storage Finder" -y
else
    echo "Using existing database dump"
    ddev drush sql-drop -y
    gunzip -c dumps/dsf.sql.gz | ddev mysql
fi

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
