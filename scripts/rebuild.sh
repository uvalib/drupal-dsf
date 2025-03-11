#!/bin/bash

set -e  # Exit on error

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")
cd "$PROJECT_ROOT"  # Ensure we're in project root

# Process flags
EMPTY=false
USE_LATEST=false
for arg in "$@"
do
    case $arg in
        --empty)
        EMPTY=true
        shift
        ;;
        --latest)
        USE_LATEST=true
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
    echo "Using update-db-from-remote.sh to fetch and import database"
    if [ "$USE_LATEST" = true ]; then
        "$SCRIPT_DIR/update-db-from-remote.sh" --latest
    else
        "$SCRIPT_DIR/update-db-from-remote.sh"
    fi
    if [ $? -ne 0 ]; then
        echo "Error: Database import failed"
        exit 1
    fi
fi

echo "Step 2: Running database updates..."
ddev drush updatedb -y || {
    echo "Error: Database updates failed"
    exit 1
}

echo "Step 3: Fixing permissions..."
"$SCRIPT_DIR/fix-permissions.sh" || {
    echo "Error: Permission fixes failed"
    exit 1
}

echo "Step 4: Rebuilding caches..."
ddev drush cr || {
    echo "Error: Cache rebuild failed"
    exit 1
}

echo "Step 5: Launching finder page..."
ddev launch /finder

echo "✓ Rebuild process completed"
