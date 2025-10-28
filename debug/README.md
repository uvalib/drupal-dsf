# DSF Matomo Debug Scripts

Copy-paste these into the browser console on a DSF page.

- debug-chrome-matomo-detailed.js
  - Purpose: Deep Chrome diagnostic (env, scripts, _paq state, requests, errors, manual tests, summary).
  - Use when: Chrome-specific tracking issues or detailed single-browser analysis.

- debug-chrome-firefox-matomo.js
  - Purpose: Cross-browser (Chrome/Firefox) comprehensive diagnostic (capabilities, _paq calls, drupalSettings, scripts, CSP, network monitoring, summary).
  - Use when: Comparing behavior across Chrome and Firefox.

- debug-root-cause.js
  - Purpose: Root-cause workflow verifying official Matomo init, real _paq sequence, DSF conflicts, script order/types, CSP, and recommendations.
  - Use when: Need actionable root-cause hints and remediation steps.

- quick-matomo-diagnostic.js
  - Purpose: Lightweight first-pass checks (_paq sanity, DSF config, test event, script presence, quick network ping).
  - Use when: Quick triage before running comprehensive tools.

- debug-final-check.js
  - Purpose: Final verification that required _paq init calls exist, manual event push works, and requests are sent.
  - Use when: Confirming tracking works after changes.

Notes
- These scripts are read-only diagnostics; they do not persist changes.
- Refresh the page to restore any temporarily wrapped functions after use.
