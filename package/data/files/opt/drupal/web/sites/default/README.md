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
