#!/bin/bash
ddev stop \
  && ddev start \
  && ddev drush site:install standard --account-pass=admin --site-name=\"Digital Storage Finder\"  -y \
  && ddev drush en -y finder \
  && ddev launch /finder
