/**
 * Comprehensive Chrome Matomo Debugging Script
 * Run this in Chrome console to diagnose Matomo tracking issues
 */

console.log('🔍 CHROME MATOMO DEBUG - Starting comprehensive analysis...');

// 1. Check browser and basic environment
console.log('📊 Browser Info:', {
  userAgent: navigator.userAgent,
  isChrome: navigator.userAgent.includes('Chrome'),
  isFirefox: navigator.userAgent.includes('Firefox'),
  isSafari: navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome'),
  currentUrl: window.location.href,
  timestamp: new Date().toISOString()
});

// 2. Check for Matomo scripts in DOM
const matomoScripts = document.querySelectorAll('script[src*="matomo"]');
console.log('📜 Matomo Scripts Found:', {
  count: matomoScripts.length,
  scripts: Array.from(matomoScripts).map(script => ({
    src: script.src,
    async: script.async,
    defer: script.defer,
    readyState: script.readyState,
    loaded: script.readyState === 'complete' || script.readyState === 'loaded' || script.readyState === 'interactive'
  }))
});

// 3. Check _paq state
console.log('📦 _paq State:', {
  exists: typeof _paq !== 'undefined',
  type: typeof _paq,
  isArray: Array.isArray(_paq),
  length: _paq ? _paq.length : 'N/A',
  constructor: _paq ? _paq.constructor.name : 'N/A',
  firstFewItems: _paq ? _paq.slice(0, 5) : 'N/A'
});

// 4. Check Matomo global objects
console.log('🌐 Matomo Global Objects:', {
  Piwik: typeof window.Piwik,
  Matomo: typeof window.Matomo,
  piwik: typeof window.piwik,
  matomo: typeof window.matomo
});

// 5. Check Drupal settings
console.log('⚙️ Drupal Settings:', {
  drupalSettings: typeof drupalSettings !== 'undefined',
  matomoSettings: typeof drupalSettings !== 'undefined' ? drupalSettings.matomo : 'N/A',
  dsfAnalyticsSettings: typeof drupalSettings !== 'undefined' ? drupalSettings.dsfAnalytics : 'N/A'
});

// 6. Monitor network requests
let matomoRequestCount = 0;
const matomoRequests = [];

// Monitor fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  if (typeof url === 'string' && url.includes('matomo')) {
    matomoRequestCount++;
    matomoRequests.push({
      type: 'fetch',
      url: url,
      timestamp: new Date().toISOString()
    });
    console.log(`🌐 Matomo Fetch Request #${matomoRequestCount}:`, url);
  }
  return originalFetch.apply(this, args);
};

// Monitor XMLHttpRequest
const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url, ...args) {
  if (typeof url === 'string' && url.includes('matomo')) {
    matomoRequestCount++;
    matomoRequests.push({
      type: 'xhr',
      method: method,
      url: url,
      timestamp: new Date().toISOString()
    });
    console.log(`🌐 Matomo XHR Request #${matomoRequestCount}:`, method, url);
  }
  return originalXHROpen.apply(this, [method, url, ...args]);
};

// 7. Check if DSF Analytics module is loaded
console.log('🔧 DSF Analytics Module:', {
  DSFMatomoTracker: typeof window.DSFMatomoTracker,
  DSFWorkflowTracker: typeof window.DSFWorkflowTracker,
  DSFTracking: typeof window.DSFTracking
});

// 8. Test _paq processing
console.log('🧪 Testing _paq Processing...');
if (typeof _paq !== 'undefined' && Array.isArray(_paq)) {
  const initialLength = _paq.length;
  console.log(`Initial _paq length: ${initialLength}`);
  
  // Add a test event
  _paq.push(['trackEvent', 'Debug_Test', 'Chrome_Debug', 'Test_Event', 1]);
  console.log(`After adding test event: ${_paq.length}`);
  
  // Check if it gets processed
  setTimeout(() => {
    const finalLength = _paq.length;
    const wasProcessed = finalLength <= initialLength;
    console.log(`After 3 seconds: ${finalLength} (processed: ${wasProcessed})`);
    
    if (!wasProcessed) {
      console.warn('⚠️ _paq events are NOT being processed by Matomo!');
    } else {
      console.log('✅ _paq events are being processed by Matomo');
    }
  }, 3000);
} else {
  console.error('❌ _paq is not available or not an array');
}

// 9. Check for any JavaScript errors
let errorCount = 0;
const originalError = window.onerror;
window.onerror = function(message, source, lineno, colno, error) {
  errorCount++;
  console.error(`🚨 JavaScript Error #${errorCount}:`, {
    message: message,
    source: source,
    line: lineno,
    column: colno,
    error: error
  });
  if (originalError) {
    return originalError.apply(this, arguments);
  }
  return false;
};

// 10. Summary after 5 seconds
setTimeout(() => {
  console.log('📋 CHROME MATOMO DEBUG SUMMARY:');
  console.log('================================');
  console.log('Matomo Scripts:', matomoScripts.length);
  console.log('_paq Available:', typeof _paq !== 'undefined');
  console.log('_paq is Array:', Array.isArray(_paq));
  console.log('_paq Length:', _paq ? _paq.length : 'N/A');
  console.log('Matomo Requests Made:', matomoRequestCount);
  console.log('JavaScript Errors:', errorCount);
  console.log('DSF Analytics Loaded:', typeof window.DSFMatomoTracker !== 'undefined');
  
  if (matomoRequestCount === 0) {
    console.warn('⚠️ NO MATOMO REQUESTS DETECTED - This is the problem!');
  }
  
  if (matomoRequests.length > 0) {
    console.log('📡 Matomo Requests Details:', matomoRequests);
  }
  
  console.log('🔍 CHROME MATOMO DEBUG - Analysis complete');
}, 5000);

// 11. Manual test function
window.testMatomoTracking = function() {
  console.log('🧪 Manual Matomo Test...');
  
  if (typeof _paq !== 'undefined' && Array.isArray(_paq)) {
    const testEvent = ['trackEvent', 'Manual_Test', 'Chrome_Manual', 'Test_Event', 1];
    _paq.push(testEvent);
    console.log('✅ Test event added to _paq:', testEvent);
    console.log('Current _paq length:', _paq.length);
    
    // Check if it gets processed
    setTimeout(() => {
      console.log('_paq length after 2 seconds:', _paq.length);
    }, 2000);
  } else {
    console.error('❌ Cannot test - _paq not available');
  }
};

console.log('💡 Run testMatomoTracking() to manually test Matomo tracking');
console.log('🔍 CHROME MATOMO DEBUG - Script loaded, monitoring for 5 seconds...');
