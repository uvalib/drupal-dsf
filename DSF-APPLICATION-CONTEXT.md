# DSF Application Context Guide

## Project Overview

**Application Name**: Data Storage Finder (DSF)  
**Type**: Single Page Application (SPA) built on Drupal  
**Primary Purpose**: Help users find appropriate data storage solutions based on their specific criteria and requirements  
**Architecture**: jQuery-based SPA with Mustache.js templating, REST API backend, Bootstrap 4 UI  
**Development Environment**: DDEV (Docker-based local development)  

## Analytics Integration (NEW - August 2025)

### DSF Analytics Dashboard Module
**Location**: `/web/modules/custom/dsf_analytics/`  
**Purpose**: Comprehensive analytics dashboard providing insights into user behavior patterns  
**Integration**: Real-time Matomo API integration with defensive programming patterns  

#### Key Components
```
dsf_analytics/
├── src/Controller/AnalyticsApiController.php     - REST API endpoints for dashboard data
├── src/Controller/AnalyticsDashboardController.php - Dashboard page controller  
├── src/Commands/DsfAnalyticsCommands.php         - Drush management commands
├── src/Form/AnalyticsSettingsForm.php            - Admin configuration interface
├── js/analytics-dashboard.js                     - Dashboard interactivity
├── js/matomo-tracking.js                         - Core tracking functionality
├── js/matomo-integration.js                      - Event delegation and conflict avoidance
├── templates/dsf-analytics-dashboard.html.twig   - WCAG 2.2 compliant dashboard
└── css/analytics-dashboard.css                   - Accessible styling
```

#### Analytics Data Captured
1. **Facet Selection Patterns**: Most/least popular search criteria
2. **Service Viewing Behavior**: Which services get the most attention
3. **Investigation Depth**: Detail views, comparisons, external link clicks
4. **User Engagement**: Search patterns and conversion metrics

#### Access Points
- **Dashboard**: `/admin/reports/dsf-analytics` (administrators only)
- **Settings**: `/admin/config/system/dsf-analytics` (configuration)
- **API Endpoints**: Real-time JSON data for dashboard
- **Drush Commands**: `dsf-status`, `dsf-data`, `dsf-token`, `dsf-test`

#### Data Modes
- **Mock Mode**: Sample data for development and testing
- **Real Mode**: Live Matomo API integration (analytics.lib.virginia.edu, Site ID: 66)

#### Defensive Programming Features
- Event delegation to avoid modifying core DSF code
- Conflict detection with existing Matomo module
- Graceful degradation when tracking unavailable
- Comprehensive error handling and logging
- Namespaced event handlers to prevent conflicts

## Critical File Locations & Architecture

### Core Application Files
```
/web/modules/custom/finder/js/app.js (877 lines)
├── Main SPA logic and event handling
├── Facet management and service filtering
├── Comparison chart functionality
├── REST API integration (/rest/facettree, /rest/servicelist, /rest/finder_settings)
└── URL parameter synchronization

/web/themes/custom/uva_dsf_bs/js/results-actions.js
├── URL management and browser history
├── Share/print functionality  
├── Persistent link generation
└── Integration with main app.js
```

### Theme & Styling
```
/web/themes/custom/uva_dsf_bs/
├── uva_dsf_bs.libraries.yml (library definitions)
├── uva_dsf_bs.theme (hook implementations)
├── css/ (Bootstrap 4 + custom styles)
├── js/ (jQuery, Mustache, tracking modules)
└── templates/ (Twig templates)
```

### REST API Endpoints
```
/rest/finder_settings    - Page configuration (titles, headers, text)
/rest/facettree         - Available search criteria/facets  
/rest/servicelist       - Available storage services with metadata
/rest/sendemail         - Email functionality (legacy)
```

## Application Flow & User Journey

### 1. Initial Load
1. **Settings Load**: `/rest/finder_settings` populates page headers and text
2. **Facets Load**: `/rest/facettree` builds search criteria interface
3. **Services Load**: `/rest/servicelist` creates service cards and comparison chart
4. **URL Parameters**: Restore state from shareable URLs

### 2. User Interaction Patterns
```
Search Criteria Selection → Service Filtering → Service Selection → Comparison Chart
     ↓                          ↓                    ↓                 ↓
Facet checkboxes         Service cards         Service checkboxes  Detailed comparison
(.facet input)           (.service-panel)      (.cardcheckbox)     (#comparisonchart)
     ↓                          ↓                    ↓                 ↓
evaluate_services()      Update visibility     Update comparison   Manual selection
                                              (.manualcheckbox)
```

### 3. Key Event Handlers & Functions
```javascript
// Main event handlers in app.js
$('.facet input').on('change') → evaluate_services() → filter service visibility
$('.cardcheckbox').on('change') → update service selection → populate comparison
$('.manualcheckbox').on('change') → show/hide services in comparison chart
$('.btn-clear-filters') → reset all selections
$('.btn-select-all') → select all visible services

// Core functions
evaluate_services()      - Filters services based on selected facets
updateEmptyStateMessage() - Manages comparison chart visibility
find_facet(id)          - Utility to locate facets by ID
```

## Data Structures & State Management

### Facets (Search Criteria)
```javascript
questionlist = [
  {
    id: "question_id",
    question: "Question text",
    control_type: "checkbox|radio|select",
    description: "Help text",
    choices: [
      {
        id: "facet_id", 
        text: "Display text",
        selected: boolean,
        checked: "checked"|""
      }
    ]
  }
]
```

### Services
```javascript
servicelist = [
  {
    id: "service_id",
    title: "Service Name", 
    checked: "checked"|"",
    facet_matches: ["facet_id1", "facet_id2"], // Which facets this service matches
    field_data: {
      field_name: {
        label: "Field Label",
        value: "Field Value", 
        weight: number // For sorting
      }
    }
  }
]
```

### Global State Variables
```javascript
// Critical global variables in app.js
questionlist = []        // All available facets/questions
servicelist = []         // All available services
readfacets = []         // Raw facet data from API
services = []           // Raw service data from API
servicehelp = {}        // Help text service data
visible_classes = []    // Currently visible service classes in comparison
facetsselected = []     // Selected facet IDs from URL params
```

## URL Parameter System

### Structure
```
?facets=1,2,3&services=101,102,103&timestamp=1234567890
```

### Functions
```javascript
// In results-actions.js
findGetParameter(name)     - Extract URL parameter value
updateBrowserUrl()         - Sync current state to URL
createShareableUrl()       - Generate persistent share links
updatePersistentLink()     - Update share link display
```

## Matomo Analytics & Dashboard System

### DSF Analytics Module (`dsf_analytics`)

**Status**: Production-ready custom Drupal module  
**Location**: `/web/modules/custom/dsf_analytics/`  
**Purpose**: Comprehensive analytics dashboard for DSF with real Matomo API integration  
**Configuration**: Admin interface at `/admin/config/system/dsf-analytics`  

### Drupal Matomo Module Integration

**Module**: `drupal/matomo` (version 1.25+)  
**Status**: Installed and enabled in production  
**Configuration**: Managed via Drupal admin interface  

The application uses the official Drupal Matomo module for base tracking, with our custom SPA tracking extending its functionality.

### Analytics Dashboard Features

**Dashboard URL**: `/admin/reports/dsf-analytics`  
**Permissions**: 
- `access dsf analytics` - View dashboard and data
- `administer dsf analytics` - Configure settings and API tokens

#### Real-Time Data Sources
- **Most/Least Popular Search Criteria** - Tracks facet selection patterns
- **Service Popularity Rankings** - Service viewing and interaction metrics  
- **Investigation Depth Analysis** - User engagement with service details
- **Service Comparison Patterns** - Multi-service evaluation behavior

#### Data Modes
- **Real Mode**: Live data from Matomo API (`analytics.lib.virginia.edu`)
- **Mock Mode**: Sample data for development and testing
- **Toggle**: Configurable via admin interface or drush commands

### Drush Command Suite

```bash
# Check system status with live API validation
ddev drush dsf-status
ddev drush dsf-analytics:status

# Configure data mode
ddev drush dsf-data               # Show current mode + help
ddev drush dsf-data real          # Switch to live API data  
ddev drush dsf-data mock          # Switch to sample data

# API token management
ddev drush dsf-token YOUR_TOKEN   # Set and validate API token
ddev drush dsf-token TOKEN --force # Set without validation

# API testing and validation
ddev drush dsf-test               # Test API connection
ddev drush dsf-test-data          # Test data retrieval
```

### Analytics Module Architecture

```
dsf_analytics/
├── src/
│   ├── Controller/
│   │   ├── AnalyticsDashboardController.php  # Dashboard page controller
│   │   └── AnalyticsApiController.php        # Real-time API endpoints
│   ├── Commands/DsfAnalyticsCommands.php     # Drush command suite
│   └── Form/AnalyticsSettingsForm.php        # Admin configuration
├── config/schema/dsf_analytics.schema.yml    # Configuration definitions
├── templates/dsf-analytics-dashboard.html.twig # Dashboard template
├── css/analytics-dashboard.css               # Dashboard styling
├── js/analytics-dashboard.js                 # Interactive functionality
└── dsf_analytics.routing.yml                 # URL routing definitions
```

### API Endpoints

```
# Real-time analytics data (admin-only)
GET /admin/reports/dsf-analytics/api/facet-stats
GET /admin/reports/dsf-analytics/api/service-stats  
GET /admin/reports/dsf-analytics/api/investigation-stats
```

### Configuration Schema

```yaml
# dsf_analytics.settings configuration
use_real_data: boolean        # Enable/disable live API calls
api_token: string            # Matomo API authentication token
matomo_site_id: integer      # Site ID (inherited from matomo module)
matomo_url: string           # API URL (inherited from matomo module)
```

### Getting Matomo Configuration

```bash
# Check current Matomo module configuration
ddev drush config:get matomo.settings

# View specific settings
ddev drush config:get matomo.settings site_id
ddev drush config:get matomo.settings url_http
ddev drush config:get matomo.settings url_https

# Check DSF Analytics configuration
ddev drush config:get dsf_analytics.settings
```

### Matomo Settings Integration

The Matomo module provides settings via `drupalSettings.matomo` that our tracking code should leverage:

```javascript
// Available in drupalSettings.matomo
{
  "site_id": "1",
  "url_http": "https://vah-analytics.lib.virginia.edu/",
  "url_https": "https://vah-analytics.lib.virginia.edu/",
  "enabled": true
}
```

### Custom SPA Tracking Architecture

```
Drupal Matomo Module → Base page tracking + _paq array initialization
         ↓
matomo-tracking.js → Core SPA tracking functions (leverages existing _paq)
         ↓  
matomo-integration.js → Non-invasive event hooks into DSF interactions
         ↓
DSF Analytics Module → Admin dashboard for viewing tracked data
```

### Dashboard Data Processing

The analytics dashboard processes raw Matomo data to provide DSF-specific insights:

#### Facet Analysis
- Extracts URL parameters from page views to identify facet selections
- Maps URL parameters to human-readable facet names
- Calculates selection frequency and identifies trends

#### Service Metrics  
- Tracks service page views and detail page engagement
- Identifies most/least popular services by view count
- Measures service investigation depth (multiple page views per session)

#### Real-Time API Integration
- Direct connection to Matomo API at `analytics.lib.virginia.edu`
- Site ID: 66 (UVA DSF production)
- Authenticated API calls with configurable tokens
- Real-time data processing and caching

### Key Tracking Events

```javascript
// Facet selections
DSF_Facets → Selected_[facet_type] / Deselected_[facet_type]

// Service interactions  
DSF_Services → Service_selection, Service_view, Service_external_link_click

// Deep investigation
DSF_Service_Investigation → added_to_comparison, details_view, external_link_click

// User actions
DSF_Actions → clear_filters, select_all
DSF_Engagement → comparison_chart_viewed
```

### Analytics Dashboard Features

#### Accessibility Compliance
- **WCAG 2.2 Level AA** compliance throughout the dashboard
- Proper ARIA labels and roles for screen readers
- Semantic HTML structure with appropriate headings
- Color contrast ratios meet accessibility standards
- Keyboard navigation support for all interactive elements

#### Real-Time Data Validation
- Live API token validation with detailed error reporting
- Connection status indicators with clear success/failure states
- Graceful fallback to mock data when API is unavailable
- Comprehensive error handling with actionable user guidance

#### Administrative Interface
- **Settings Page**: `/admin/config/system/dsf-analytics`
- **Dashboard**: `/admin/reports/dsf-analytics` 
- **Role-based Access**: Separate permissions for viewing vs. administration
- **Data Mode Toggle**: Easy switching between real and mock data

#### Performance Optimizations
- Asynchronous data loading with loading states
- Cached API responses to minimize external calls
- Efficient data processing for large analytics datasets
- Responsive design for desktop and mobile admin access

### Recent Improvements & Code Cleanup

#### DSF Analytics Module Enhancements (August 2025)
- **Comprehensive Code Review**: Systematic cleanup of extraneous files and inconsistencies
- **Configuration Consistency**: Fixed naming inconsistencies between schema and implementation
- **Route Optimization**: Removed duplicate API routes, streamlined endpoint architecture
- **UX Improvements**: Enhanced `drush dsf-data` command to show status by default instead of changing settings
- **Theme Separation**: Moved analytics dashboard from theme to proper Drupal module structure
- **Documentation Updates**: Comprehensive updates to reflect current architecture

#### Command Interface Improvements
```bash
# Before: accidentally changed mode to mock
drush dsf-data  # (dangerous - changed settings)

# After: safely shows status and help
drush dsf-data  # Shows current mode + available options
```

#### File Cleanup Summary
- **Removed**: Redundant shell script (`scripts/dsf-analytics.sh`)
- **Removed**: Duplicate theme files (CSS, JS, templates moved to module)
- **Fixed**: Configuration schema naming consistency (`api_token` vs `matomo_token`)
- **Cleaned**: Unused CSS classes (badge styles)
- **Updated**: Documentation to reflect current implementation

#### Production-Ready Status
- ✅ **Real API Integration**: Live connection to `analytics.lib.virginia.edu`
- ✅ **Comprehensive Error Handling**: Graceful fallbacks and detailed error messages
- ✅ **Accessibility Compliance**: WCAG 2.2 Level AA throughout
- ✅ **Security Validation**: API token validation with real-time testing
- ✅ **Performance Optimization**: Cached responses and efficient data processing
- ✅ **Clean Architecture**: Single source of truth, no duplicate implementations

## Development Environment Setup

### Local Development (DDEV)
```bash
# Start environment
ddev start

# Access application
https://drupal-dsf.ddev.site

# Update database from production
./scripts/update-db-from-remote.sh prod

# Update database from dev environment
./scripts/update-db-from-remote.sh dev

# Use latest local backup (faster)
./scripts/update-db-from-remote.sh --latest

# Clear cache
ddev drush cr

# Install/update composer dependencies
ddev composer install

# Enable modules
ddev drush en module_name -y

# SSH into container
ddev ssh
```

### Available DDEV Tasks
```bash
ddev xdebug on    # Enable Xdebug for debugging
ddev xdebug off   # Disable Xdebug  
```

## Common Development Patterns

### Adding New Facets
1. Add facet definition to Drupal admin
2. Facet appears automatically in `/rest/facettree`
3. No code changes needed - app.js handles dynamically

### Adding New Services
1. Create service node in Drupal
2. Configure field mappings
3. Service appears in `/rest/servicelist`
4. Add field definitions to comparison chart template

### Modifying UI Text
1. Update via Drupal admin interface
2. Text pulls from `/rest/finder_settings`
3. Changes appear immediately without code deployment

### Debugging JavaScript Issues
```javascript
// Enable debug mode in browser console
MATOMO_CONFIG.debug = true;

// Key debugging points
console.log(questionlist);  // Check facet loading
console.log(servicelist);   // Check service loading  
console.log(visible_classes); // Check service filtering
$('.cardcheckbox:checked').length; // Count selected services
```

## Performance Considerations

### Lazy Loading
- Services only render comparison chart when selected
- Mustache templates compiled once, reused
- Event delegation for dynamic content

### Critical Rendering Path
1. jQuery & dependencies load first
2. App.js loads and initializes
3. REST API calls happen asynchronously
4. Mustache templates render as data arrives

### Memory Management
- Large servicelist array cached globally
- DOM manipulation minimized via show()/hide()
- Event handlers use delegation to avoid memory leaks

## Security & Privacy

### Data Handling
- No personal data collection in analytics
- CSRF tokens required for email functionality
- URL parameters sanitized on input

### Matomo Compliance
- Configurable tracking enable/disable
- Environment-aware (can disable in development)
- No PII in tracked events

## Integration Points

### Drupal Integration
```php
// Theme hooks in uva_dsf_bs.theme
hook_page_attachments()    - Add drupalSettings for JS
hook_preprocess_page()     - Attach libraries conditionally
```

### Database Management

### Production Database Sync

**Script Location**: `scripts/update-db-from-remote.sh`  
**Purpose**: Download and import database from remote environments  
**Environments**: `prod` (production), `dev` (development)  

```bash
# Download and import production database
./scripts/update-db-from-remote.sh prod

# Download and import dev database  
./scripts/update-db-from-remote.sh dev

# Use most recent local backup (faster for repeated testing)
./scripts/update-db-from-remote.sh --latest

# Download only, skip import (for backup purposes)
./scripts/update-db-from-remote.sh -n prod
```

### Script Functionality

1. **Remote Connection**: Connects to production/dev servers via SSH
2. **Database Export**: Uses `drush sql-dump` to create backup
3. **Validation**: Checks SQL syntax and file integrity  
4. **Compression**: Saves as gzipped SQL files in `backups/` directory
5. **Import**: Automatically imports into local DDEV database
6. **Cache Clear**: Runs `drush cr` after successful import

### Backup Storage

```
backups/
├── dh-backup-prod-20250822-143022.sql.gz
├── dh-backup-dev-20250821-091533.sql.gz
└── README.backups.md
```

**Important**: Always sync database before testing new features to ensure local environment matches production data and configuration.

## External Dependencies

### Drupal Modules

```
drupal/matomo ^1.25     - Analytics tracking integration
// ... other dependencies from composer.json
```
```
jQuery 3.x              - DOM manipulation & AJAX
Mustache.js            - Client-side templating
Bootstrap 4.x          - UI framework & responsive grid
Matomo Analytics       - User behavior tracking
```

## Troubleshooting Common Issues

### Services Not Filtering
1. Check `evaluate_services()` function execution
2. Verify facet IDs match service `facet_matches` arrays
3. Ensure CSS classes `.service-panel` exist
4. Check browser console for JavaScript errors

### Comparison Chart Empty
1. Verify services are selected (`.cardcheckbox:checked`)
2. Check manual checkboxes are enabled (`.manualcheckbox`)
3. Ensure `updateEmptyStateMessage()` logic is correct
4. Verify `visible_classes` array population

### URL Parameters Not Working
1. Check `findGetParameter()` function in results-actions.js
2. Verify URL format matches expected pattern
3. Ensure `updateBrowserUrl()` is called after state changes
4. Check browser history API compatibility

### Tracking Not Working
1. Verify Matomo configuration in drupalSettings
2. Check `MATOMO_CONFIG.enabled` is true
3. Ensure tracking libraries load in correct order
4. Check browser console for _paq initialization

## Key Architectural Decisions

### Why SPA Instead of Traditional Drupal Pages
- Real-time filtering without page reloads
- Better user experience for complex multi-criteria search
- Client-side state management for shareable URLs
- Reduced server load for filtering operations

### Why jQuery Over Modern Frameworks
- Existing Drupal ecosystem compatibility
- Lower learning curve for Drupal developers
- Mature, stable, well-documented
- Smaller bundle size for this use case

### Why Mustache.js Templating
- Logic-less templates prevent complex client-side business logic
- Server-side rendering compatibility if needed
- Lightweight and fast
- Good security properties (prevents XSS)

## Future Enhancement Opportunities

### Potential Improvements
1. **Progressive Web App**: Add service worker for offline capability
2. **Advanced Filtering**: Add range sliders, multi-select combos
3. **Accessibility**: Enhanced ARIA labels, keyboard navigation
4. **Performance**: Virtual scrolling for large service lists
5. **Analytics**: A/B testing, heatmaps, conversion funnels

### Technical Debt Considerations
1. **jQuery Dependency**: Consider migration path to vanilla JS or modern framework
2. **Global Variables**: Refactor to module pattern for better encapsulation
3. **Monolithic app.js**: Split into focused modules
4. **REST API**: Consider GraphQL for more efficient data fetching

## Analytics Module Deployment Status (August 2025)

### 🎯 Current State

- **Development**: Complete (23 files, 3,760+ lines of code)
- **Git Status**: Committed and ready for deployment (commits ca26bf6, 0d473cc)
- **Testing**: Fully tested in development environment
- **Documentation**: Complete with deployment guides

### 🚀 Deployment Readiness

- ✅ Module passes all quality checks
- ✅ Defensive programming prevents conflicts
- ✅ Comprehensive error handling implemented
- ✅ WCAG 2.2 accessibility compliance verified
- ✅ Security best practices followed
- ✅ Performance optimizations in place

### 📋 Next Steps for Production

1. **Deploy code** to production environment
2. **Enable module**: `drush en dsf_analytics -y`
3. **Configure API token**: `drush dsf-token YOUR_TOKEN`
4. **Verify integration**: `drush dsf-status`
5. **Monitor data collection** as users interact with DSF

### 📊 Expected Analytics Timeline

- **Immediate**: Module active, showing "no data available" (expected)
- **24-48 hours**: Initial usage patterns emerge
- **1 week**: Meaningful insights available
- **1 month**: Comprehensive user behavior analysis

This context guide provides the foundation needed to understand, maintain, and enhance the DSF application effectively.
