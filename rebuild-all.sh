#!/bin/bash
set -e

# Verify we're in a DDEV environment
if ! command -v ddev >/dev/null 2>&1; then
    echo "❌ DDEV is not installed or not in PATH"
    exit 1
fi

if [ ! -f ".ddev/config.yaml" ]; then
    echo "❌ Not in a DDEV project directory"
    exit 1
fi

# Ensure DDEV project is running
ddev status | grep running >/dev/null || {
    echo "Starting DDEV project..."
    ddev start
}

echo "Starting complete rebuild process..."

# Add error handling function
handle_error() {
    echo "Error occurred in rebuild script"
    echo "Line: $1"
    echo "Exit code: $2"
    # Print last 50 watchdog messages with expanded details
    ddev drush watchdog:show 
    # Print detailed status
    ddev drush status
    # Print field list
    ddev drush field:info
}

trap 'handle_error ${LINENO} $?' ERR

# Add verbose output for debugging
export DRUSH_VERBOSE=1
export DRUSH_DEBUG=1

# Function to check if last command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo "✅ $1 completed successfully"
    else
        echo "❌ Error during $1"
        exit 1
    fi
}

# Function to ensure system module and core services are available
ensure_system_module() {
    echo "Ensuring DDEV and Drupal are properly configured..."
    ddev exec composer clear-cache
    ddev composer dump-autoload
    ddev exec drush cr
    ddev exec drush en -y system
    ddev exec php web/core/scripts/rebuild-module-cache.php
    check_status "System module and registry rebuild"
}

# Verify database connection before proceeding
echo "Verifying database connection..."
ddev exec drush sql:query "SELECT 1" >/dev/null 2>&1 || {
    echo "❌ Database connection failed. Attempting to restart DDEV..."
    ddev restart
    sleep 5
    ddev exec drush sql:query "SELECT 1" >/dev/null 2>&1 || {
        echo "❌ Database connection still failed after restart"
        exit 1
    }
}

ensure_system_module

# 1. Clear and uninstall modules
echo "Disabling modules..."
ddev drush pmu finder -y || {
    echo "Module uninstall failed, attempting recovery..."
    ensure_system_module
    ddev drush pmu finder -y
}
check_status "Module uninstall"

# 2. Clear configurations
echo "Clearing configurations..."
./clear-config.sh
check_status "Configuration cleanup"

# 3. Clean up fields
echo "Cleaning up fields..."
./clean-fields.sh
check_status "Field cleanup"

# 4. Remove duplicate content
echo "Cleaning up duplicate content..."
./clean-duplicates.sh
check_status "Duplicate cleanup"

# 5. Rebuild taxonomy structure
echo "Rebuilding taxonomy..."
./rebuild-taxonomy.sh
check_status "Taxonomy rebuild"

# 6. Rebuild module configuration
echo "Rebuilding module..."
./rebuild-module.sh
check_status "Module rebuild"

# 7. Fix facet relationships
echo "Fixing facet relationships..."
./fix-taxonomy-relationships.sh
check_status "Facet relationship fixes"

# 8. Clear all caches
echo "Clearing caches..."
ddev drush cr
check_status "Cache clear"

# 9. Enable module
echo "Enabling finder module..."
ddev drush en -y finder
check_status "Module enable"

# 10. Verify content
echo "Verifying content..."
ddev drush dcer taxonomy_term facets --folder=web/modules/custom/finder/content
check_status "Content export verification"

echo "✨ Rebuild process completed successfully"
echo "You may want to run analyze scripts to verify the rebuild:"
echo "  ./analyze-facet-structure.sh"
echo "  ./analyze-qa.sh"
