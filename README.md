# Drupal Data Storage Finder (DSF)

A Drupal-based framework for discovering and exploring data storage resources.

## Quickstart

```bash
git clone git@github.com:uvalib/drupal-dsf.git
cd drupal-dsf
ddev start
./scripts/update-db-from-remote.sh
ddev drush cr
ddev launch
```

## Requirements

- [DDEV](https://ddev.readthedocs.io/en/stable/)
- Git
- Composer

## Development


### Local Development with DDEV

This project uses DDEV for local development. DDEV provides a consistent development environment using Docker containers.

Getting an error that the Bootstrap theme isn't installed when accessing your local Drupal site? Then install composer required items...
```
composer install
```

### Theme Development

The custom theme `uva_dsf_usdws` is located in `web/themes/custom/uva_dsf_usdws`. This theme is maintained in a separate GitHub repository and is included as a Composer dependency.

Theme development should be done in the theme's own repository at:
- Theme repository: [uvalib/uva_dsf_bs](https://github.com/uvalib/uva_dsf_bs)

Any theme changes should be committed and pushed to the theme repository, not to this project directly.

## Additional Resources

- [Drupal Documentation](https://www.drupal.org/documentation)
- [DDEV Documentation](https://ddev.readthedocs.io/en/stable/)
