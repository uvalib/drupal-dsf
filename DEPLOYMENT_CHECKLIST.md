# DSF Analytics Module - Deployment Checklist

## Pre-Deployment Checks

### ✅ Development Environment
- [x] Module fully developed and tested
- [x] All files committed to git
- [x] Working in mock data mode  
- [x] Real data mode tested with valid token
- [x] Dashboard displays "no data available" when no events exist
- [x] All Drush commands working
- [x] Permissions system configured
- [x] WCAG 2.2 compliance verified

### ✅ Code Quality
- [x] Defensive programming patterns implemented
- [x] Comprehensive error handling
- [x] Logging implemented for debugging
- [x] Security best practices followed
- [x] No hardcoded credentials
- [x] Proper configuration management

## Deployment Steps

### 1. Pre-Deployment Configuration
```bash
# Check current status
ddev drush status

# Ensure the site is in maintenance mode for updates
ddev drush state:set system.maintenance_mode 1

# Clear all caches before deployment
ddev drush cr
```

### 2. Code Deployment
```bash
# Pull latest code from git
git pull origin main

# Verify files are in place
ls -la web/modules/custom/dsf_analytics/

# Check for any missing dependencies
composer install --no-dev --optimize-autoloader
```

### 3. Module Installation
```bash
# Enable the module
drush en dsf_analytics -y

# Verify module is enabled
drush pml | grep dsf_analytics

# Check permissions are set
drush user:role:list administrator
```

### 4. Configuration
```bash
# Module will work without API token - shows sample data until configured
# To enable real analytics data when ready:

# Configure API token (OPTIONAL - can be done later)
drush dsf-token YOUR_MATOMO_API_TOKEN

# Test API connection (only if token configured)
drush dsf-test

# Verify current status (works with or without token)
drush dsf-status
```

### 5. Matomo Module Configuration
Ensure the base Matomo module is configured:
- URL: `https://analytics.lib.virginia.edu` 
- Site ID: `66`
- Enable the Matomo module if not already active

### 6. Permissions Configuration
Grant permissions to appropriate roles:
- `access dsf analytics` - For viewing the dashboard
- `administer dsf analytics` - For configuration

### 7. Post-Deployment Testing
```bash
# Test dashboard access
curl -I https://yourdomain.com/admin/reports/dsf-analytics

# Test API endpoints
curl https://yourdomain.com/admin/reports/dsf-analytics/api/facet-stats

# Check logs for any errors
drush watchdog:show --type=dsf_analytics --count=10

# Test drush commands
drush dsf-status
drush dsf-data
drush dsf-test
```

### 8. Enable Site
```bash
# Take site out of maintenance mode
drush state:set system.maintenance_mode 0

# Final cache clear
drush cr
```

## Post-Deployment Verification

### Dashboard Access
- [ ] Dashboard loads at `/admin/reports/dsf-analytics`
- [ ] Settings page works at `/admin/config/system/dsf-analytics`
- [ ] Proper permissions are enforced
- [ ] Dashboard shows appropriate messages for current data mode

### Data Modes
- [ ] Mock mode displays sample data
- [ ] Real mode shows "no data available" message (expected initially)
- [ ] Real mode will show actual data once events are tracked

### API Endpoints
- [ ] `/admin/reports/dsf-analytics/api/facet-stats` returns JSON
- [ ] `/admin/reports/dsf-analytics/api/service-stats` returns JSON  
- [ ] `/admin/reports/dsf-analytics/api/investigation-stats` returns JSON
- [ ] All endpoints return proper error messages when appropriate

### Drush Commands
- [ ] `drush dsf-status` shows current configuration
- [ ] `drush dsf-data` can switch between modes
- [ ] `drush dsf-token` can set API tokens
- [ ] `drush dsf-test` validates API connection

## Expected Behavior After Deployment

### Initial State

- Module installed and enabled
- Dashboard accessible to administrators
- **Sample data displayed** if no API token configured (EXPECTED - not an error)
- Real data mode ready but showing "no data available" if API token is configured
- This is EXPECTED because the tracking events haven't been deployed yet

### Once DSF Application Goes Live
- Users interact with the Digital Service Finder
- Matomo begins collecting analytics events
- Dashboard will start showing real usage data:
  - Most/least popular search criteria
  - Service viewing patterns  
  - Investigation depth metrics

### Data Collection Timeline
- **Immediate**: Basic page views tracked by existing Matomo
- **After user interactions**: Facet selections, service views
- **Within 24-48 hours**: Meaningful analytics patterns emerge
- **Weekly**: Comprehensive usage insights available

## Troubleshooting

### Common Issues

1. **Dashboard shows sample data**
   - This is NORMAL behavior when no API token is configured
   - Configure token when ready: `drush dsf-token YOUR_TOKEN`
   - Or configure via admin interface

2. **"No API token configured"**
   - Run: `drush dsf-token YOUR_TOKEN`
   - Or configure via admin interface

3. **"Matomo module not configured"**
   - Configure base Matomo module first
   - Check URL and Site ID settings

4. **"No data available" in real mode**
   - This is expected initially when API token is configured
   - Data will appear as users interact with DSF

### Log Monitoring
```bash
# Watch for DSF Analytics logs
drush watchdog:tail --type=dsf_analytics

# Check for errors
drush watchdog:show --severity=Error --count=20
```

## Security Notes

- API tokens are stored securely in Drupal configuration
- No personal data is collected in analytics processing
- All external API calls use HTTPS
- Proper role-based access controls implemented
- CSRF protection on administrative forms

## Performance Notes

- Analytics data is cached to reduce API calls
- Dashboard loads asynchronously for better UX
- No impact on front-end DSF performance
- Background processing for data aggregation

---

**Deployment Date**: _______________
**Deployed By**: ___________________
**Git Commit**: ca26bf6
**Verification**: ___________________
