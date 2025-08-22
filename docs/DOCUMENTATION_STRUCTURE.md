# DSF Documentation Structure

## Overview
This document outlines the organization of documentation across the DSF project after the analytics refactoring.

## Documentation Files by Category

### 📋 Main Project Documentation
- **`/README.md`** - Main project overview, installation, and development workflow
- **`/DSF-APPLICATION-CONTEXT.md`** - Comprehensive technical documentation including analytics integration
- **`/RELEASE_NOTES.md`** - Project changelog and version history

### 🔧 Technical Setup Guides
- **`/docs/REPOSITORY_ARCHITECTURE.md`** - Multi-repository architecture and development workflow
- **`/docs/paragraphs-setup.md`** - Drupal paragraphs configuration
- **`/docs/taxonomy-setup.md`** - Content taxonomy configuration
- **`/docs/content-creation.md`** - Content management guidelines

### 📊 Analytics Documentation
- **`/web/modules/custom/dsf_analytics/README.md`** - Complete DSF Analytics module documentation
- **`/docs/MATOMO_DEFENSIVE_PROGRAMMING.md`** - Technical details on conflict avoidance patterns
- **`/DEPLOYMENT_CHECKLIST.md`** - Step-by-step deployment verification guide
- **`/DEPLOYMENT_SUMMARY.md`** - Executive deployment readiness summary

### 🛠️ Development & Implementation
- **`/docs/example-implementations.md`** - Sample implementations and code examples
- **`/docs/TODO-uva.md`** - UVA-specific development tasks and customizations

### 🔒 Security & Operations
- **`/SAFE_EMAIL_IMPLEMENTATION.md`** - Email security implementation details
- **`/backups/README.backups.md`** - Database backup procedures

## Removed Files (Cleanup)
The following outdated files were removed during the analytics refactoring:

### From Theme Directory (`/web/themes/custom/uva_dsf_bs/`)
- ❌ `IMPLEMENTATION-SUMMARY.md` - Outdated analytics implementation summary
- ❌ `README-matomo-tracking.md` - Outdated theme-based tracking documentation

### From Root Directory
- ❌ `web/test-analytics.html` - Development test file
- ❌ `scripts/dsf-analytics.sh` - Obsolete analytics script

## Current Organization Principles

### ✅ Separation of Concerns
- **Module documentation** stays with the module (`/web/modules/custom/dsf_analytics/README.md`)
- **Theme documentation** removed (analytics moved to module)
- **Technical architecture** in main context document

### ✅ Single Source of Truth
- **DSF-APPLICATION-CONTEXT.md** is the comprehensive technical reference
- **Module README.md** provides detailed usage instructions
- **No duplicate documentation** across multiple files

### ✅ Clear File Naming
- `README.md` files for primary documentation
- `UPPERCASE.md` for important standalone documents
- Descriptive filenames that indicate content scope

## Quick Reference

| Need Information About... | Check This File |
|--------------------------|----------------|
| Project setup & installation | `/README.md` |
| Technical architecture & code | `/DSF-APPLICATION-CONTEXT.md` |
| Analytics dashboard usage | `/web/modules/custom/dsf_analytics/README.md` |
| Conflict avoidance patterns | `/docs/MATOMO_DEFENSIVE_PROGRAMMING.md` |
| Deployment procedures | `/DEPLOYMENT_CHECKLIST.md` |
| Deployment readiness | `/DEPLOYMENT_SUMMARY.md` |
| Content management | `/docs/content-creation.md` |
| Multi-repo development | `/docs/REPOSITORY_ARCHITECTURE.md` |

## Maintenance Notes

- Keep module documentation updated when functionality changes
- Update DSF-APPLICATION-CONTEXT.md for architectural changes
- Remove test/development files before production deployment
