#!/bin/bash

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")
cd "$PROJECT_ROOT"

echo "Running QA checks..."

# Check for PHP errors
echo "Checking recent PHP errors..."
ddev drush watchdog:show --severity=error --count=10

# Verify required modules
echo "Verifying required modules..."
ddev drush pm-list --type=module --status=enabled --core

# Check database updates
echo "Checking for pending database updates..."
ddev drush updatedb-status

# Verify file permissions
echo "Checking file permissions..."
find web/sites/default/files -type f -not -perm 644 -ls

# Test menu structure
echo "Checking menu structure..."
ddev drush menu:tree main

echo "QA analysis complete. Review any warnings above."
