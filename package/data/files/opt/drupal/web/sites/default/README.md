# Settings.php location change

This directory previously contained a copy of `settings.php` used during container builds.

We now maintain a single canonical `settings.php` in the repository at:

- `web/sites/default/settings.php`

The container image copies that canonical file directly (see `package/Dockerfile`).
All runtime differences are derived from environment variables (e.g., `MATOMO_URL`, `MATOMO_SITE_ID`, `MATOMO_API_TOKEN`, `DSF_MATOMO_ENABLED`, `DSF_DATA_MODE`, `DSF_TRACKING_MODE`).

Reason for change:
- Avoid duplication and drift between local and container configs
- Simplify maintenance by using env-var overrides for per-environment settings

If you are looking for `settings.php`, edit `web/sites/default/settings.php`.

## How to configure per environment

Settings are derived from environment variables provided to Drupal (PHP-FPM/Apache container). Below are examples.

### Local/ddev (optional)

```bash
# Typically disable tracking locally
export DSF_MATOMO_ENABLED=false
export DSF_DATA_MODE=mock
export DSF_TRACKING_MODE=DEBUG

# Optional if you want to test against analytics
export MATOMO_URL=https://analytics.lib.virginia.edu/
export MATOMO_SITE_ID=67   # dev site id
export MATOMO_API_TOKEN=... # only if needed for dashboard API
```

### Staging (dsf-dev)

Container environment (rendered from Terraform/Ansible):

```env
DSF_MATOMO_ENABLED="true"
DSF_DATA_MODE="real"
DSF_TRACKING_MODE="PROD"
MATOMO_URL="https://analytics.lib.virginia.edu/"
MATOMO_SITE_ID="67"
MATOMO_API_TOKEN="<fetched from Secrets Manager>"
```

Enable/disable Matomo in Terraform (staging):

```hcl
# dsf.library.virginia.edu/staging/variables.tf
variable "enable_matomo" {
  type    = bool
  default = true  # set to false to disable and skip token lookup
}
```

Create/update the secret (staging):

```bash
aws secretsmanager create-secret \
  --name staging/dsf-drupal/matomo/api_token \
  --secret-string 'YOUR_DSF_DEV_TOKEN'

# or update existing
aws secretsmanager put-secret-value \
  --secret-id staging/dsf-drupal/matomo/api_token \
  --secret-string 'YOUR_DSF_DEV_TOKEN'
```

### Production

Container environment (rendered from Terraform/Ansible):

```env
DSF_MATOMO_ENABLED="true"
DSF_DATA_MODE="real"
DSF_TRACKING_MODE="PROD"
MATOMO_URL="https://analytics.lib.virginia.edu/"
MATOMO_SITE_ID="66"
MATOMO_API_TOKEN="<fetched from Secrets Manager>"
```

Enable/disable Matomo in Terraform (production):

```hcl
# dsf.library.virginia.edu/production/variables.tf
variable "enable_matomo" {
  type    = bool
  default = true
}
```

Create/update the secret (production):

```bash
aws secretsmanager create-secret \
  --name production/dsf-drupal/matomo/api_token \
  --secret-string 'YOUR_PROD_TOKEN'

# or update existing
aws secretsmanager put-secret-value \
  --secret-id production/dsf-drupal/matomo/api_token \
  --secret-string 'YOUR_PROD_TOKEN'
```

Notes:
- If `enable_matomo=false`, deploy proceeds with safe defaults (no tracking; dashboard mock mode) and Ansible prints a warning.
- Changing env vars requires a cache clear to reflect immediately: `drush cr`.
