# DSF Analytics Dashboard

A comprehensive analytics dashboard module for the Digital Service Finder (DSF) application, providing real-time insights into user behavior and service usage patterns through Matomo API integration.

## Overview

The DSF Analytics module transforms raw Matomo analytics data into actionable insights for understanding how users interact with the Digital Service Finder. It provides a user-friendly dashboard with real-time data processing and comprehensive command-line management tools.

## Features

### 📊 Real-Time Analytics Dashboard
- **Most/Least Popular Search Criteria** - Track which facets users select most/least frequently
- **Service Popularity Rankings** - Understand which services get the most views and engagement
- **Investigation Depth Analysis** - Measure how deeply users explore service details
- **Service Comparison Patterns** - Analyze multi-service evaluation behavior

### 🔄 Flexible Data Sources
- **Real Mode**: Live data from Matomo API (`analytics.lib.virginia.edu`)
- **Mock Mode**: Sample data for development and testing
- **Easy Toggle**: Switch between modes via admin interface or drush commands

### ♿ Accessibility & Compliance
- **WCAG 2.2 Level AA** compliant throughout the dashboard
- Proper ARIA labels and semantic HTML structure
- Keyboard navigation support for all interactive elements
- Screen reader compatible with descriptive text

### 🛠️ Command-Line Management
Complete drush command suite for configuration and testing:
- Status checking with live API validation
- Token management with real-time verification
- Data mode switching with safety checks
- API connection testing and troubleshooting

## Installation

### Prerequisites
- Drupal 9.x or 10.x
- `drupal/matomo` module installed and configured
- Valid Matomo API token (for real data mode)

### Install Steps

1. **Enable the module**:
   ```bash
   ddev drush en dsf_analytics -y
   ```

2. **Configure Matomo module** (if not already done):
   ```bash
   # Configure via admin interface at /admin/config/system/matomo
   # Or via drush:
   ddev drush config:set matomo.settings site_id 66
   ddev drush config:set matomo.settings url_https "https://analytics.lib.virginia.edu"
   ```

3. **Set permissions**:
   - `access dsf analytics` - View dashboard and data
   - `administer dsf analytics` - Configure settings and API tokens

4. **Configure API token** (for real data):
   ```bash
   ddev drush dsf-token YOUR_MATOMO_API_TOKEN
   ```

## Usage

### Dashboard Access

Navigate to `/admin/reports/dsf-analytics` to view the analytics dashboard.

### Command-Line Interface

#### Check System Status
```bash
# Quick status check
ddev drush dsf-status

# Detailed status with API validation
ddev drush dsf-analytics:status
```

#### Data Mode Management
```bash
# Show current mode and help
ddev drush dsf-data

# Switch to real Matomo data
ddev drush dsf-data real

# Switch to sample data for testing
ddev drush dsf-data mock
```

#### API Token Management
```bash
# Set and validate token
ddev drush dsf-token YOUR_API_TOKEN

# Set token without validation (development)
ddev drush dsf-token YOUR_API_TOKEN --force
```

#### API Testing
```bash
# Test API connection
ddev drush dsf-test

# Test data retrieval
ddev drush dsf-test-data
```

### Admin Configuration

Access the settings page at `/admin/config/system/dsf-analytics` to:
- Toggle between real and mock data modes
- Configure API tokens through the web interface
- View current system status and validation

## Architecture

### Module Structure
```
dsf_analytics/
├── README.md                                    # This file
├── dsf_analytics.info.yml                      # Module definition
├── dsf_analytics.module                        # Hook implementations
├── dsf_analytics.routing.yml                   # URL routing
├── dsf_analytics.permissions.yml               # Permission definitions
├── dsf_analytics.libraries.yml                 # CSS/JS library definitions
├── drush.services.yml                          # Drush command registration
├── config/
│   └── schema/
│       └── dsf_analytics.schema.yml            # Configuration schema
├── src/
│   ├── Controller/
│   │   ├── AnalyticsDashboardController.php    # Dashboard page controller
│   │   └── AnalyticsApiController.php          # Real-time API endpoints
│   ├── Commands/
│   │   └── DsfAnalyticsCommands.php            # Drush command implementation
│   └── Form/
│       └── DsfAnalyticsSettingsForm.php        # Admin configuration form
├── templates/
│   └── dsf-analytics-dashboard.html.twig       # Dashboard template
├── css/
│   └── analytics-dashboard.css                 # Dashboard styling
└── js/
    └── analytics-dashboard.js                  # Interactive functionality
```

### API Endpoints

The module provides real-time API endpoints for dashboard data:

```
GET /admin/reports/dsf-analytics/api/facet-stats
GET /admin/reports/dsf-analytics/api/service-stats
GET /admin/reports/dsf-analytics/api/investigation-stats
```

### Configuration

Configuration is stored in `dsf_analytics.settings`:

```yaml
use_real_data: boolean     # Enable/disable live API calls
api_token: string         # Matomo API authentication token
```

Additional settings are inherited from the Matomo module:
- `matomo.settings.site_id` - Matomo site ID
- `matomo.settings.url_https` - Matomo API URL

## Data Processing

### How It Works

1. **Raw Data Collection**: Connects to Matomo API at `analytics.lib.virginia.edu`
2. **URL Parameter Analysis**: Extracts search criteria from page URLs
3. **Facet Mapping**: Maps URL parameters to human-readable facet names
4. **Service Metrics**: Analyzes service page views and engagement patterns
5. **Real-Time Processing**: Processes and caches data for dashboard display

### Facet Analysis
- Extracts URL parameters like `?facets=1,2,3` from page views
- Maps parameter IDs to facet names (e.g., "Data Sensitivity", "Access Type")
- Calculates selection frequency and identifies usage trends

### Service Metrics
- Tracks service page views (`/services/*` URLs)
- Measures detail page engagement (multiple views per session)
- Identifies most/least popular services by interaction count

## Development

### Local Development Setup

1. **Enable development mode**:
   ```bash
   ddev drush dsf-data mock
   ```

2. **Test with sample data**:
   The module includes comprehensive mock data for development and testing.

3. **Debug mode**:
   ```javascript
   // In browser console
   MATOMO_CONFIG.debug = true;
   ```

### Testing

```bash
# Test all functionality
ddev drush dsf-test        # Test API connection
ddev drush dsf-test-data   # Test data retrieval
ddev drush dsf-status      # Validate configuration
```

### Adding New Metrics

1. **Extend API Controller**: Add new methods to `AnalyticsApiController.php`
2. **Add API Routes**: Define new endpoints in `dsf_analytics.routing.yml`
3. **Update Template**: Add display sections to the dashboard template
4. **Update JavaScript**: Add data fetching logic to `analytics-dashboard.js`

## Troubleshooting

### Common Issues

#### "No API token configured"
```bash
# Solution: Set a valid Matomo API token
ddev drush dsf-token YOUR_TOKEN
```

#### "Matomo module not configured"
```bash
# Solution: Configure the Matomo module first
ddev drush config:set matomo.settings site_id 66
ddev drush config:set matomo.settings url_https "https://analytics.lib.virginia.edu"
```

#### "Token validation failed"
```bash
# Check network connectivity and token validity
ddev drush dsf-test

# Force set token if validation unavailable
ddev drush dsf-token YOUR_TOKEN --force
```

#### Dashboard shows "No data available"
1. Check data mode: `ddev drush dsf-status`
2. Verify API token: `ddev drush dsf-test`
3. Check recent analytics data: `ddev drush dsf-test-data`

### Debug Information

Enable verbose logging and debug information:

```bash
# Check system status
ddev drush dsf-status

# View detailed logs
ddev drush watchdog:show --type=dsf_analytics

# Test API connectivity
ddev drush dsf-test
```

## Security & Privacy

### Data Protection
- No personal data collection in analytics processing
- API tokens are stored securely in Drupal configuration
- All external API calls use secure HTTPS connections
- CSRF protection on all administrative forms

### Access Control
- Role-based permissions for viewing vs. administration
- Admin-only access to sensitive configuration options
- Secure API token validation and storage

## License

This module is part of the UVA Library Digital Service Finder application.

## Support

For questions, issues, or contributions, contact the UVA Library development team.

---

**Version**: 1.0  
**Drupal Compatibility**: 9.x, 10.x  
**Last Updated**: August 2025
