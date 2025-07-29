# Drupal Data Storage Finder (DSF)

A Drupal-based framework for discovering and exploring data storage resources at the University of Virginia Library.

## Repository Architecture

This is a **main application repository** that integrates multiple components:

- **Main Drupal Application**: This repository (`uvalib/drupal-dsf`) contains the Drupal site configuration, themes, and overall application structure
- **Finder Module**: The core finder functionality is maintained in a separate repository (`uvalib/CD-finder-uva`) and pulled in as a Composer dependency
- **Theme**: The custom Bootstrap theme (`uva_dsf_bs`) is also maintained separately

### Finder Module Integration

The finder module is automatically installed via Composer from:

- **Repository**: `https://github.com/uvalib/CD-finder-uva.git`
- **Installation Path**: `web/modules/custom/finder/`
- **Composer Package**: `uvalib/cd-finder-uva`

The finder module is forked from the original Cornell University implementation and customized for UVA Library's needs.

## Development Workflow

### Working with Multiple Repositories

This project uses a multi-repository architecture. When developing features that involve the finder module:

1. **Make changes in the finder module**: Work directly in `web/modules/custom/finder/` (this is a git repository)
2. **Create feature branches in both repositories**: Maintain synchronized branches between `drupal-dsf` and `cd-finder-uva`
3. **Update composer dependencies**: Reference the appropriate branch in `composer.json`

```bash
# Example: Working with a feature branch
# 1. Create feature branch in finder module
cd web/modules/custom/finder
git checkout -b feature/my-new-feature

# 2. Make changes and commit
git add .
git commit -m "Add new feature"
git push origin feature/my-new-feature

# 3. Update composer.json in main repository to reference feature branch
cd ../../../..
# Edit composer.json: "uvalib/cd-finder-uva": "dev-feature/my-new-feature"
composer update uvalib/cd-finder-uva
```

### Development Environment

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

Getting an error that the Bootstrap theme isn't installed when accessing your local Drupal site? Then install composer required items:

```bash
composer install
```

### Theme Development

The custom theme `uva_dsf_bs` is located in `web/themes/custom/uva_dsf_bs`. This theme is maintained in a separate GitHub repository and is included as a Composer dependency.

Theme development should be done in the theme's own repository at:

- Theme repository: [uvalib/uva_dsf_bs](https://github.com/uvalib/uva_dsf_bs)

Any theme changes should be committed and pushed to the theme repository, not to this project directly.

## Additional Resources

- [Finder Module Documentation](web/modules/custom/finder/README.md) - Detailed setup and configuration guide
- [Drupal Documentation](https://www.drupal.org/documentation)
- [DDEV Documentation](https://ddev.readthedocs.io/en/stable/)
