# Repository Architecture

This document explains the multi-repository architecture used by the UVA Library Data Storage Finder project.

## Repository Overview

### Primary Repositories

1. **`uvalib/drupal-dsf`** (Main Application)
   - **Type**: Drupal application repository
   - **Purpose**: Main Drupal site with configuration, themes, and integration
   - **Contains**: Drupal core, site configuration, custom themes, deployment scripts
   - **Dependencies**: Pulls finder module via Composer

2. **`uvalib/CD-finder-uva`** (Finder Module)
   - **Type**: Drupal module repository
   - **Purpose**: Core finder functionality as a reusable Composer package
   - **Contains**: JavaScript, CSS, templates, PHP logic for finder functionality
   - **Integration**: Installed via Composer to `web/modules/custom/finder/`

### Dependency Management

The finder module is managed as a Composer dependency:

```json
{
  "repositories": [
    {
      "type": "git",
      "url": "https://github.com/uvalib/CD-finder-uva.git"
    }
  ],
  "require": {
    "uvalib/cd-finder-uva": "dev-master"
  },
  "extra": {
    "installer-paths": {
      "web/modules/custom/finder": ["uvalib/cd-finder-uva"]
    }
  }
}
```

## Development Workflow

### Feature Development

1. **Create matching branches** in both repositories
2. **Make changes** in the appropriate repository:
   - **Finder functionality**: Work in `uvalib/CD-finder-uva`
   - **Drupal configuration/themes**: Work in `uvalib/drupal-dsf`
3. **Update dependencies** in main app when needed:

   ```bash
   # Update composer.json to reference feature branch
   "uvalib/cd-finder-uva": "dev-feature/my-feature"
   
   # Update dependencies
   composer update uvalib/cd-finder-uva
   ```

### Deployment

- **Production**: Uses stable branches or tags from both repositories
- **Development**: Can reference feature branches for testing
- **Staging**: Typically uses latest stable with selected feature branches

## Benefits

- **Modularity**: Finder functionality is reusable across projects
- **Version Control**: Each component can be versioned independently
- **Collaboration**: Teams can work on different components simultaneously
- **Maintenance**: Updates to finder module automatically propagate to dependent projects

## Historical Context

The finder module is forked from Cornell University's original implementation and has been customized for UVA Library's specific needs while maintaining compatibility with the original architecture.
