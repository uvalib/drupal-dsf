#!/bin/bash

set -e  # Exit on error

# Export all content referenced by the finder module
ddev drush dcer node --folder=web/modules/custom/uva_dsf_content/content
ddev drush dcer taxonomy_term --folder=web/modules/custom/uva_dsf_content/content
ddev drush dcer paragraph --folder=web/modules/custom/uva_dsf_content/content

echo "Content exported to web/modules/custom/uva_dsf_content/content/"
