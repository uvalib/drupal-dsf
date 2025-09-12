/**
 * Matomo Debugging Script
 * Run this in the browser console on the staging site to diagnose Matomo issues
 */

console.log('=== MATOMO DEBUGGING SCRIPT ===');

// 1. Check drupalSettings
console.log('1. drupalSettings check:');
console.log('  - drupalSettings exists:', typeof drupalSettings !== 'undefined');
if (typeof drupalSettings !== 'undefined') {
  console.log('  - drupalSettings.dsfAnalytics:', drupalSettings.dsfAnalytics);
  console.log('  - drupalSettings.matomo:', drupalSettings.matomo);
} else {
  console.log('  - ERROR: drupalSettings not available');
}

// 2. Check _paq object
console.log('2. _paq object check:');
console.log('  - _paq exists:', typeof _paq !== 'undefined');
console.log('  - _paq type:', typeof _paq);
console.log('  - _paq is array:', Array.isArray(_paq));
console.log('  - _paq value:', _paq);
if (_paq && typeof _paq === 'object') {
  console.log('  - _paq length:', _paq.length);
  console.log('  - _paq contents:', _paq);
}

// 3. Check for Matomo scripts
console.log('3. Matomo scripts check:');
const matomoScripts = document.querySelectorAll('script[src*="matomo"], script[src*="analytics"]');
console.log('  - Found scripts:', matomoScripts.length);
matomoScripts.forEach((script, index) => {
  console.log(`  - Script ${index + 1}:`, script.src);
});

// 4. Check for Matomo global objects
console.log('4. Matomo global objects:');
console.log('  - window.Piwik:', typeof window.Piwik);
console.log('  - window.Matomo:', typeof window.Matomo);
console.log('  - window._paq:', typeof window._paq);

// 5. Test Matomo connectivity
console.log('5. Matomo connectivity test:');
const testUrl = 'https://analytics.lib.virginia.edu/matomo.php';
fetch(testUrl, { method: 'HEAD', mode: 'no-cors' })
  .then(() => console.log('  - Matomo server reachable'))
  .catch(error => console.log('  - Matomo server unreachable:', error));

// 6. Check for JavaScript errors
console.log('6. Error check:');
window.addEventListener('error', (e) => {
  console.log('  - JavaScript error:', e.message, 'at', e.filename + ':' + e.lineno);
});

console.log('=== END DEBUGGING SCRIPT ===');

