/**
 * Comprehensive Chrome/Firefox Matomo Debugging Script
 * 
 * This script will help identify why Matomo tracking works in Safari
 * but fails in Chrome and Firefox. Run this in the browser console
 * on a DSF page to get detailed diagnostic information.
 */

console.log('=== CHROME/FIREFOX MATOMO DEBUGGING SCRIPT ===');
console.log('Browser:', navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                   navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                   navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown');

// 1. Check browser-specific features
console.log('\n=== BROWSER CAPABILITIES ===');
console.log('User Agent:', navigator.userAgent);
console.log('Cookies enabled:', navigator.cookieEnabled);
console.log('Do Not Track:', navigator.doNotTrack);
console.log('Language:', navigator.language);
console.log('Platform:', navigator.platform);
console.log('Online status:', navigator.onLine);

// Check for privacy/security features that might block tracking
console.log('\n=== PRIVACY/SECURITY FEATURES ===');
console.log('Third-party cookies blocked:', !document.cookie.includes('test=1') && 
  (() => {
    try {
      document.cookie = 'test=1';
      return !document.cookie.includes('test=1');
    } catch (e) {
      return true;
    }
  })());

// 2. Check _paq array state in detail
console.log('\n=== _PAQ ARRAY DETAILED ANALYSIS ===');
console.log('_paq exists:', typeof _paq !== 'undefined');
console.log('_paq type:', typeof _paq);
console.log('_paq is array:', Array.isArray(_paq));
console.log('_paq length:', _paq ? _paq.length : 'N/A');
console.log('_paq constructor:', _paq ? _paq.constructor.name : 'N/A');

if (_paq && Array.isArray(_paq)) {
  console.log('_paq contents:');
  _paq.forEach((item, index) => {
    console.log(`  [${index}]:`, item);
  });
  
  // Check for specific Matomo initialization calls
  const initCalls = {
    setTrackerUrl: _paq.filter(item => Array.isArray(item) && item[0] === 'setTrackerUrl'),
    setSiteId: _paq.filter(item => Array.isArray(item) && item[0] === 'setSiteId'),
    trackPageView: _paq.filter(item => Array.isArray(item) && item[0] === 'trackPageView'),
    setCustomUrl: _paq.filter(item => Array.isArray(item) && item[0] === 'setCustomUrl'),
    trackEvent: _paq.filter(item => Array.isArray(item) && item[0] === 'trackEvent')
  };
  
  console.log('\nMatomo initialization calls:');
  Object.keys(initCalls).forEach(key => {
    console.log(`  ${key}: ${initCalls[key].length} calls`);
    if (initCalls[key].length > 0) {
      console.log(`    First call:`, initCalls[key][0]);
    }
  });
} else {
  console.log('ERROR: _paq is not a proper array!');
  console.log('_paq value:', _paq);
}

// 3. Check drupalSettings configuration
console.log('\n=== DRUPAL SETTINGS ANALYSIS ===');
console.log('drupalSettings exists:', typeof drupalSettings !== 'undefined');

if (typeof drupalSettings !== 'undefined') {
  console.log('drupalSettings.matomo:', drupalSettings.matomo);
  console.log('drupalSettings.dsfAnalytics:', drupalSettings.dsfAnalytics);
  
  if (drupalSettings.dsfAnalytics) {
    console.log('DSF Analytics config:');
    console.log('  - matomo.enabled:', drupalSettings.dsfAnalytics.matomo.enabled);
    console.log('  - matomo.url:', drupalSettings.dsfAnalytics.matomo.url);
    console.log('  - matomo.siteId:', drupalSettings.dsfAnalytics.matomo.siteId);
    console.log('  - matomo.trackingMode:', drupalSettings.dsfAnalytics.matomo.trackingMode);
    console.log('  - debug.module_attached:', drupalSettings.dsfAnalytics.debug.module_attached);
    console.log('  - debug.is_dsf_page:', drupalSettings.dsfAnalytics.debug.is_dsf_page);
  }
}

// 4. Check for Matomo scripts and their loading state
console.log('\n=== MATOMO SCRIPTS ANALYSIS ===');
const matomoScripts = document.querySelectorAll('script[src*="matomo"], script[src*="analytics"]');
console.log('Found Matomo scripts:', matomoScripts.length);

matomoScripts.forEach((script, index) => {
  console.log(`Script ${index + 1}:`);
  console.log('  - src:', script.src);
  console.log('  - async:', script.async);
  console.log('  - defer:', script.defer);
  console.log('  - readyState:', script.readyState);
  console.log('  - loaded:', script.readyState === 'complete' || script.readyState === 'loaded');
});

// 5. Check for JavaScript errors
console.log('\n=== ERROR MONITORING ===');
let errorCount = 0;
const errorHandler = (e) => {
  errorCount++;
  console.log(`Error ${errorCount}:`, e.message, 'at', e.filename + ':' + e.lineno);
  console.log('  - Error details:', e);
};
window.addEventListener('error', errorHandler);

// 6. Test _paq functionality
console.log('\n=== _PAQ FUNCTIONALITY TEST ===');
if (_paq && Array.isArray(_paq)) {
  const initialLength = _paq.length;
  console.log('Initial _paq length:', initialLength);
  
  try {
    // Test basic push functionality
    _paq.push(['trackEvent', 'Debug', 'BrowserTest', navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Firefox']);
    console.log('✅ Successfully pushed test event to _paq');
    console.log('New _paq length:', _paq.length);
    console.log('Latest item:', _paq[_paq.length - 1]);
  } catch (e) {
    console.log('❌ Error pushing to _paq:', e.message);
  }
} else {
  console.log('❌ Cannot test _paq - not available as array');
}

// 7. Test Matomo server connectivity
console.log('\n=== MATOMO SERVER CONNECTIVITY TEST ===');
if (typeof drupalSettings !== 'undefined' && drupalSettings.dsfAnalytics && drupalSettings.dsfAnalytics.matomo) {
  const matomoUrl = drupalSettings.dsfAnalytics.matomo.url + 'matomo.php';
  console.log('Testing Matomo URL:', matomoUrl);
  
  // Test with fetch
  fetch(matomoUrl, {
    method: 'GET',
    mode: 'no-cors',
    cache: 'no-cache'
  })
  .then(response => {
    console.log('✅ Matomo server reachable via fetch:', response.status);
  })
  .catch(error => {
    console.log('❌ Matomo server unreachable via fetch:', error.message);
  });
  
  // Test with XMLHttpRequest
  const xhr = new XMLHttpRequest();
  xhr.open('GET', matomoUrl, true);
  xhr.onload = function() {
    console.log('✅ Matomo server reachable via XHR:', xhr.status);
  };
  xhr.onerror = function() {
    console.log('❌ Matomo server unreachable via XHR');
  };
  xhr.send();
  
  // Test with image request (how Matomo normally sends data)
  const img = new Image();
  img.onload = function() {
    console.log('✅ Matomo server reachable via image request');
  };
  img.onerror = function() {
    console.log('❌ Matomo server unreachable via image request');
  };
  img.src = matomoUrl + '?idsite=1&rec=1&url=' + encodeURIComponent(window.location.href) + '&rand=' + Math.random();
  
} else {
  console.log('❌ No Matomo configuration found for connectivity test');
}

// 8. Monitor network requests
console.log('\n=== NETWORK REQUEST MONITORING ===');
let requestCount = 0;
const originalFetch = window.fetch;
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalImageSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');

// Monitor fetch requests
window.fetch = function(...args) {
  const url = args[0];
  if (typeof url === 'string' && url.includes('matomo')) {
    requestCount++;
    console.log(`🌐 Fetch request #${requestCount} to Matomo:`, url);
    return originalFetch.apply(this, args)
      .then(response => {
        console.log(`📥 Fetch response #${requestCount}:`, response.status, response.statusText);
        return response;
      })
      .catch(error => {
        console.log(`❌ Fetch error #${requestCount}:`, error.message);
        throw error;
      });
  }
  return originalFetch.apply(this, args);
};

// Monitor XMLHttpRequest
XMLHttpRequest.prototype.open = function(method, url, ...args) {
  if (typeof url === 'string' && url.includes('matomo')) {
    requestCount++;
    console.log(`🌐 XHR request #${requestCount} to Matomo:`, url);
  }
  return originalXHROpen.apply(this, [method, url, ...args]);
};

// Monitor image requests
Object.defineProperty(HTMLImageElement.prototype, 'src', {
  get: function() {
    return originalImageSrc.get.call(this);
  },
  set: function(value) {
    if (typeof value === 'string' && value.includes('matomo')) {
      requestCount++;
      console.log(`🖼️ Image request #${requestCount} to Matomo:`, value);
    }
    return originalImageSrc.set.call(this, value);
  }
});

// 9. Check for browser extensions that might block tracking
console.log('\n=== BROWSER EXTENSION DETECTION ===');
// Check for common ad blockers
const adBlockerTests = [
  'adblock',
  'ublock',
  'ghostery',
  'privacy',
  'tracker'
];

let detectedExtensions = [];
adBlockerTests.forEach(test => {
  if (window[test] || document.querySelector(`[class*="${test}"]`) || document.querySelector(`[id*="${test}"]`)) {
    detectedExtensions.push(test);
  }
});

if (detectedExtensions.length > 0) {
  console.log('⚠️ Potential ad-blocking extensions detected:', detectedExtensions);
} else {
  console.log('✅ No obvious ad-blocking extensions detected');
}

// 10. Test manual Matomo tracking
console.log('\n=== MANUAL MATOMO TRACKING TEST ===');
if (_paq && Array.isArray(_paq)) {
  console.log('Testing manual page view tracking...');
  
  // Add page view tracking
  _paq.push(['setCustomUrl', window.location.href]);
  _paq.push(['trackPageView']);
  
  // Add custom event tracking
  _paq.push(['trackEvent', 'Debug', 'ManualTest', 'ChromeFirefoxDebug', 1]);
  
  console.log('✅ Added manual tracking calls');
  console.log('Current _paq length:', _paq.length);
  console.log('Latest 3 items:');
  for (let i = Math.max(0, _paq.length - 3); i < _paq.length; i++) {
    console.log(`  [${i}]:`, _paq[i]);
  }
} else {
  console.log('❌ Cannot add manual tracking - _paq not available');
}

// 11. Check for CSP (Content Security Policy) issues
console.log('\n=== CONTENT SECURITY POLICY CHECK ===');
const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
if (metaTags.length > 0) {
  console.log('⚠️ CSP meta tags found:', metaTags.length);
  metaTags.forEach((meta, index) => {
    console.log(`CSP ${index + 1}:`, meta.content);
  });
} else {
  console.log('✅ No CSP meta tags found');
}

// 12. Monitor for 10 seconds and provide summary
console.log('\n=== MONITORING FOR 10 SECONDS... ===');
setTimeout(() => {
  console.log('\n=== FINAL SUMMARY ===');
  console.log(`Browser: ${navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Firefox'}`);
  console.log(`Total Matomo requests made: ${requestCount}`);
  console.log(`JavaScript errors: ${errorCount}`);
  console.log(`_paq final length: ${_paq ? _paq.length : 'N/A'}`);
  console.log(`_paq is array: ${Array.isArray(_paq)}`);
  
  if (requestCount === 0) {
    console.log('❌ NO REQUESTS MADE - Tracking is not working');
    console.log('Possible causes:');
    console.log('  - _paq array not properly initialized');
    console.log('  - Matomo script not loaded');
    console.log('  - Browser blocking requests (ad blocker, privacy settings)');
    console.log('  - CSP blocking external requests');
    console.log('  - Network connectivity issues');
  } else {
    console.log('✅ REQUESTS MADE - Tracking appears to be working');
  }
  
  // Check if _paq array has grown (indicating events were added)
  const finalLength = _paq ? _paq.length : 0;
  if (finalLength > 0) {
    console.log('✅ _paq array has content - events are being queued');
  } else {
    console.log('❌ _paq array is empty - no events queued');
  }
  
}, 10000);

console.log('\n=== DEBUG SCRIPT COMPLETE ===');
console.log('Monitor the console for the next 10 seconds to see network activity and final summary.');
