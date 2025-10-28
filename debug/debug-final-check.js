/**
 * Final check to see if Matomo tracking is actually working
 * Run this to verify tracking is sending data
 */

console.log('=== FINAL MATOMO TRACKING CHECK ===');

// 1. Check _paq array state
console.log('1. _paq Array Check:');
console.log('  - _paq exists:', typeof _paq !== 'undefined');
console.log('  - _paq is array:', Array.isArray(_paq));
console.log('  - _paq length:', _paq ? _paq.length : 'N/A');
console.log('  - _paq contents:', _paq);

// 2. Check if Matomo is actually initialized
console.log('\n2. Matomo Initialization Check:');
const hasTrackerUrl = _paq && _paq.some(item => Array.isArray(item) && item[0] === 'setTrackerUrl');
const hasSiteId = _paq && _paq.some(item => Array.isArray(item) && item[0] === 'setSiteId');
const hasTrackPageView = _paq && _paq.some(item => Array.isArray(item) && item[0] === 'trackPageView');

console.log('  - Has setTrackerUrl:', hasTrackerUrl);
console.log('  - Has setSiteId:', hasSiteId);
console.log('  - Has trackPageView:', hasTrackPageView);

// 3. Check drupalSettings
console.log('\n3. drupalSettings Check:');
console.log('  - drupalSettings.dsfAnalytics:', drupalSettings.dsfAnalytics);
if (drupalSettings.dsfAnalytics) {
  console.log('  - matomo.enabled:', drupalSettings.dsfAnalytics.matomo.enabled);
  console.log('  - matomo.url:', drupalSettings.dsfAnalytics.matomo.url);
  console.log('  - matomo.siteId:', drupalSettings.dsfAnalytics.matomo.siteId);
}

// 4. Test adding a tracking call manually
console.log('\n4. Manual Tracking Test:');
if (_paq && Array.isArray(_paq)) {
  console.log('  - Adding test tracking call...');
  _paq.push(['trackEvent', 'Debug', 'Manual Test', 'Chrome Test']);
  console.log('  - New _paq length:', _paq.length);
  console.log('  - Latest _paq item:', _paq[_paq.length - 1]);
} else {
  console.log('  - ERROR: _paq is not available as array');
}

// 5. Monitor network requests
console.log('\n5. Network Request Monitoring:');
let requestCount = 0;
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  if (typeof url === 'string' && url.includes('matomo')) {
    requestCount++;
    console.log(`  - Network request #${requestCount} to Matomo:`, url);
    return originalFetch.apply(this, args)
      .then(response => {
        console.log(`  - Response #${requestCount}:`, response.status, response.statusText);
        return response;
      });
  }
  return originalFetch.apply(this, args);
};

// 6. Force a page view tracking
console.log('\n6. Force Page View Tracking:');
if (_paq && Array.isArray(_paq)) {
  _paq.push(['setCustomUrl', window.location.href]);
  _paq.push(['trackPageView']);
  console.log('  - Added page view tracking');
  console.log('  - Final _paq length:', _paq.length);
} else {
  console.log('  - ERROR: Cannot add page view tracking');
}

// 7. Check for any JavaScript errors
console.log('\n7. Error Check:');
let errorCount = 0;
window.addEventListener('error', (e) => {
  errorCount++;
  console.log(`  - Error ${errorCount}:`, e.message, 'at', e.filename + ':' + e.lineno);
});

console.log('\n=== Monitoring for 10 seconds... ===');
setTimeout(() => {
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total Matomo requests made: ${requestCount}`);
  console.log(`JavaScript errors: ${errorCount}`);
  console.log(`_paq final length: ${_paq ? _paq.length : 'N/A'}`);
  
  if (requestCount === 0) {
    console.log('❌ NO REQUESTS MADE - Tracking is not working');
  } else {
    console.log('✅ REQUESTS MADE - Tracking appears to be working');
  }
}, 10000);

console.log('=== END CHECK ===');

