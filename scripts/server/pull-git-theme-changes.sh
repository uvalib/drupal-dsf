#!/bin/sh
#  This is script is run periodically to check if there are any github changes and pull them down, do a config-import and flush the cache
cd /opt/drupal/util/drupal-dsf/web/themes/custom/uva_dsf_uswds
git fetch
changes=`git diff --name-only origin/main| wc -l`

if [ $changes -gt 0 ]; then
        echo $changes changes detected.
        git pull 
        drush cr
fi
