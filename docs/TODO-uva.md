# Finder Module Setup Tasks

## 1. Taxonomy Setup
- [ ] Create Control Type taxonomy terms (see docs/taxonomy-setup.md)
- [ ] Create Facets taxonomy hierarchy (see docs/taxonomy-setup.md)
- [ ] Review example patterns (see docs/example-implementations.md)

## 2. Service Paragraphs Configuration
- [ ] Configure fields (see docs/paragraphs-setup.md)

## 3. Content Creation
- [ ] Create Services (see docs/content-creation.md)

## 4. System Configuration
- [ ] Configure SMTP module for mail functionality
- [ ] Remove sidebar blocks (optional)
- [ ] Test access at /finder
- [ ] Review additional settings at /admin/config/content/finder

## 5. Upgrade Path
- [ ] Evaluate Drupal 9.x compatibility
  - Review deprecated code usage
  - Update dependencies
  - Test module functionality
- [ ] Plan Drupal 10.x upgrade
  - Ensure all dependencies have D10 versions
  - Address any compatibility warnings
  - Update composer requirements

## Notes
- Implementation should start with a simple example before scaling to full complexity
- Changing questions/answers after services are entered requires editing each service
- Installation works only at root site level (not in subdirectories)
