/**
 * Debug Matomo initialization issues
 * Run this to see what's happening with _paq initialization
 */

console.log('=== MATOMO INITIALIZATION DEBUG ===');

// 1. Check if _paq exists and what it contains
console.log('1. _paq check:');
console.log('  - _paq exists:', typeof _paq !== 'undefined');
console.log('  - _paq type:', typeof _paq);
console.log('  - _paq is array:', Array.isArray(_paq));
console.log('  - _paq length:', _paq ? _paq.length : 'N/A');
console.log('  - _paq value:', _paq);

// 2. Check for Matomo global objects
console.log('\n2. Matomo global objects:');
console.log('  - window.Piwik:', typeof window.Piwik);
console.log('  - window.Matomo:', typeof window.Matomo);
console.log('  - window._paq:', typeof window._paq);

// 3. Check for Matomo scripts in DOM
console.log('\n3. Matomo scripts in DOM:');
const matomoScripts = document.querySelectorAll('script[src*="matomo"]');
console.log('  - Found scripts:', matomoScripts.length);
matomoScripts.forEach((script, index) => {
  console.log(`  - Script ${index + 1}:`, script.src);
  console.log(`    - Loaded:`, script.readyState || 'unknown');
  console.log(`    - Async:`, script.async);
  console.log(`    - Defer:`, script.defer);
});

// 4. Check drupalSettings
console.log('\n4. drupalSettings check:');
console.log('  - drupalSettings exists:', typeof drupalSettings !== 'undefined');
if (typeof drupalSettings !== 'undefined') {
  console.log('  - drupalSettings.matomo:', drupalSettings.matomo);
  console.log('  - drupalSettings.dsfAnalytics:', drupalSettings.dsfAnalytics);
}

// 5. Check for JavaScript errors
console.log('\n5. Error monitoring:');
let errorCount = 0;
window.addEventListener('error', (e) => {
  errorCount++;
  console.log(`  - Error ${errorCount}:`, e.message, 'at', e.filename + ':' + e.lineno);
});

// 6. Try to manually initialize _paq if it doesn't exist
if (typeof _paq === 'undefined' || !Array.isArray(_paq)) {
  console.log('\n6. Manually initializing _paq:');
  window._paq = [];
  console.log('  - Created _paq array');
  
  // Try to add basic Matomo configuration
  if (typeof drupalSettings !== 'undefined' && drupalSettings.matomo) {
    console.log('  - Adding Matomo configuration from drupalSettings');
    _paq.push(['setTrackerUrl', drupalSettings.matomo.url_https + 'matomo.php']);
    _paq.push(['setSiteId', drupalSettings.matomo.site_id]);
    _paq.push(['trackPageView']);
    console.log('  - Added basic tracking calls');
  }
}

// 7. Check if _paq is now populated
console.log('\n7. Final _paq state:');
console.log('  - _paq length:', _paq ? _paq.length : 'N/A');
console.log('  - _paq contents:', _paq);

// 8. Test a simple tracking call
console.log('\n8. Testing tracking call:');
if (_paq && Array.isArray(_paq)) {
  _paq.push(['trackEvent', 'Debug', 'Test', 'Browser Test']);
  console.log('  - Added test tracking call');
  console.log('  - New _paq length:', _paq.length);
} else {
  console.log('  - Cannot add tracking call - _paq not available');
}

console.log('\n=== END DEBUG ===');

