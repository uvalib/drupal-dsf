#!/bin/bash

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")
cd "$PROJECT_ROOT"

echo "Analyzing facet structure..."

# Check taxonomy terms
echo "Checking taxonomy structure..."
ddev drush sqlq "SELECT COUNT(*) as count FROM taxonomy_term_field_data WHERE vid='facets'" -y

# Verify facet relationships
echo "Verifying facet relationships..."
ddev drush eval '\Drupal::service("entity_type.manager")->getStorage("taxonomy_term")->loadTree("facets");'

# Check for orphaned terms
echo "Checking for orphaned terms..."
ddev drush sqlq "SELECT tid FROM taxonomy_term_field_data WHERE vid='facets' AND tid NOT IN (SELECT entity_id FROM taxonomy_term__parent WHERE bundle='facets')"

echo "Analysis complete. Review any warnings above."
