/**
 * Root Cause Analysis for Chrome/Firefox Matomo Tracking Issue
 * 
 * This script identifies the REAL underlying problem instead of applying band-aid fixes.
 * Run this in Chrome/Firefox browser console on a DSF page.
 */

console.log('🔍 ROOT CAUSE ANALYSIS - Chrome/Firefox Matomo Issue');
console.log('Browser:', navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                   navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                   navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown');

// 1. Check if official Matomo module is properly initialized
console.log('\n=== OFFICIAL MATOMO MODULE ANALYSIS ===');

// Check if the official Matomo module's script is loaded
const officialMatomoScript = document.querySelector('script[src*="matomo.js"]');
console.log('Official Matomo script found:', !!officialMatomoScript);
if (officialMatomoScript) {
  console.log('Script src:', officialMatomoScript.src);
  console.log('Script async:', officialMatomoScript.async);
  console.log('Script defer:', officialMatomoScript.defer);
  console.log('Script readyState:', officialMatomoScript.readyState);
}

// Check if the official Matomo module's inline script is present
const matomoInlineScripts = document.querySelectorAll('script');
let matomoInlineScript = null;
matomoInlineScripts.forEach(script => {
  if (script.innerHTML && script.innerHTML.includes('var _paq = _paq || []')) {
    matomoInlineScript = script;
  }
});

console.log('Matomo inline script found:', !!matomoInlineScript);
if (matomoInlineScript) {
  console.log('Inline script content preview:', matomoInlineScript.innerHTML.substring(0, 200) + '...');
}

// 2. Check the REAL _paq initialization sequence
console.log('\n=== _PAQ INITIALIZATION SEQUENCE ===');

// Check what the official Matomo module should have done
console.log('Expected _paq initialization from official module:');
console.log('  - Should be: var _paq = _paq || [];');
console.log('  - Should add: setSiteId, setTrackerUrl, trackPageView');

// Check current _paq state
console.log('\nCurrent _paq state:');
console.log('  - _paq exists:', typeof _paq !== 'undefined');
console.log('  - _paq type:', typeof _paq);
console.log('  - _paq is array:', Array.isArray(_paq));
console.log('  - _paq length:', _paq ? _paq.length : 'N/A');

if (_paq && Array.isArray(_paq)) {
  console.log('  - _paq contents:');
  _paq.forEach((item, index) => {
    console.log(`    [${index}]:`, item);
  });
  
  // Check for official Matomo initialization calls
  const hasSetSiteId = _paq.some(item => Array.isArray(item) && item[0] === 'setSiteId');
  const hasSetTrackerUrl = _paq.some(item => Array.isArray(item) && item[0] === 'setTrackerUrl');
  const hasTrackPageView = _paq.some(item => Array.isArray(item) && item[0] === 'trackPageView');
  
  console.log('\nOfficial Matomo initialization calls:');
  console.log('  - setSiteId:', hasSetSiteId);
  console.log('  - setTrackerUrl:', hasSetTrackerUrl);
  console.log('  - trackPageView:', hasTrackPageView);
  
  if (!hasSetSiteId || !hasSetTrackerUrl || !hasTrackPageView) {
    console.log('❌ OFFICIAL MATOMO MODULE NOT PROPERLY INITIALIZED');
  } else {
    console.log('✅ Official Matomo module appears to be initialized');
  }
} else {
  console.log('❌ _paq is not a proper array - this is the root cause!');
}

// 3. Check DSF Analytics module interference
console.log('\n=== DSF ANALYTICS MODULE INTERFERENCE ===');

// Check if DSF Analytics is trying to "fix" _paq
const dsfAnalyticsScript = document.querySelector('script[src*="matomo-tracking.js"]');
console.log('DSF Analytics script found:', !!dsfAnalyticsScript);
if (dsfAnalyticsScript) {
  console.log('DSF Analytics script src:', dsfAnalyticsScript.src);
}

// Check if DSF Analytics configuration is present
if (typeof drupalSettings !== 'undefined' && drupalSettings.dsfAnalytics) {
  console.log('DSF Analytics configuration found:');
  console.log('  - matomo.enabled:', drupalSettings.dsfAnalytics.matomo.enabled);
  console.log('  - matomo.url:', drupalSettings.dsfAnalytics.matomo.url);
  console.log('  - matomo.siteId:', drupalSettings.dsfAnalytics.matomo.siteId);
  
  // Check if DSF Analytics is duplicating official Matomo configuration
  if (drupalSettings.matomo && drupalSettings.dsfAnalytics.matomo) {
    console.log('\n⚠️ POTENTIAL CONFLICT DETECTED:');
    console.log('Both official Matomo module and DSF Analytics are configured');
    console.log('Official Matomo config:', drupalSettings.matomo);
    console.log('DSF Analytics config:', drupalSettings.dsfAnalytics.matomo);
  }
} else {
  console.log('DSF Analytics configuration not found');
}

// 4. Check script loading order
console.log('\n=== SCRIPT LOADING ORDER ===');

// Get all scripts and check their loading order
const allScripts = Array.from(document.querySelectorAll('script[src]'));
const matomoRelatedScripts = allScripts.filter(script => 
  script.src.includes('matomo') || 
  script.src.includes('analytics') ||
  script.src.includes('dsf_analytics')
);

console.log('Matomo-related scripts in loading order:');
matomoRelatedScripts.forEach((script, index) => {
  console.log(`  ${index + 1}. ${script.src}`);
  console.log(`     - Async: ${script.async}`);
  console.log(`     - Defer: ${script.defer}`);
  console.log(`     - ReadyState: ${script.readyState}`);
});

// 5. Check for browser-specific script loading issues
console.log('\n=== BROWSER-SPECIFIC SCRIPT LOADING ===');

// Check if scripts are loaded synchronously vs asynchronously
const asyncScripts = matomoRelatedScripts.filter(s => s.async);
const deferScripts = matomoRelatedScripts.filter(s => s.defer);
const syncScripts = matomoRelatedScripts.filter(s => !s.async && !s.defer);

console.log('Script loading types:');
console.log('  - Async scripts:', asyncScripts.length);
console.log('  - Defer scripts:', deferScripts.length);
console.log('  - Sync scripts:', syncScripts.length);

if (asyncScripts.length > 0) {
  console.log('⚠️ ASYNC SCRIPTS DETECTED - This can cause initialization order issues');
  console.log('Async scripts:', asyncScripts.map(s => s.src));
}

// 6. Check for JavaScript errors that might prevent initialization
console.log('\n=== JAVASCRIPT ERROR CHECK ===');

let errorCount = 0;
const errorHandler = (e) => {
  errorCount++;
  console.log(`Error ${errorCount}:`, e.message, 'at', e.filename + ':' + e.lineno);
  if (e.filename && e.filename.includes('matomo')) {
    console.log('❌ MATOMO-RELATED ERROR DETECTED');
  }
};
window.addEventListener('error', errorHandler);

// 7. Test the REAL issue: Can we manually initialize _paq properly?
console.log('\n=== MANUAL INITIALIZATION TEST ===');

// Clear any existing _paq to test clean initialization
const originalPaq = window._paq;
window._paq = undefined;

// Try to initialize _paq the way the official Matomo module should
console.log('Testing clean _paq initialization...');
try {
  // This is what the official Matomo module should do
  window._paq = window._paq || [];
  
  // Add basic Matomo configuration (simulating official module)
  if (typeof drupalSettings !== 'undefined' && drupalSettings.matomo) {
    const matomoUrl = drupalSettings.matomo.url_https || drupalSettings.matomo.url_http;
    const siteId = drupalSettings.matomo.site_id;
    
    window._paq.push(['setSiteId', siteId]);
    window._paq.push(['setTrackerUrl', matomoUrl + 'matomo.php']);
    window._paq.push(['trackPageView']);
    
    console.log('✅ Manual initialization successful');
    console.log('_paq length after manual init:', window._paq.length);
    console.log('_paq contents:', window._paq);
  } else {
    console.log('❌ No official Matomo configuration found for manual test');
  }
} catch (e) {
  console.log('❌ Manual initialization failed:', e.message);
}

// Restore original _paq
window._paq = originalPaq;

// 8. Check for Content Security Policy issues
console.log('\n=== CONTENT SECURITY POLICY CHECK ===');

const cspMetaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
if (cspMetaTags.length > 0) {
  console.log('⚠️ CSP meta tags found:', cspMetaTags.length);
  cspMetaTags.forEach((meta, index) => {
    console.log(`CSP ${index + 1}:`, meta.content);
    if (meta.content.includes('script-src') && !meta.content.includes('unsafe-inline')) {
      console.log('❌ CSP may be blocking inline Matomo scripts');
    }
  });
} else {
  console.log('✅ No CSP meta tags found');
}

// 9. Final diagnosis
console.log('\n=== FINAL DIAGNOSIS ===');

setTimeout(() => {
  console.log('\n🏁 ROOT CAUSE ANALYSIS COMPLETE');
  
  // Determine the most likely root cause
  const issues = [];
  
  if (!officialMatomoScript) {
    issues.push('Official Matomo script not loaded');
  }
  
  if (!matomoInlineScript) {
    issues.push('Official Matomo inline script not present');
  }
  
  if (!Array.isArray(_paq)) {
    issues.push('_paq is not properly initialized as array');
  }
  
  if (typeof drupalSettings !== 'undefined' && drupalSettings.dsfAnalytics && drupalSettings.matomo) {
    issues.push('Potential conflict between official Matomo module and DSF Analytics');
  }
  
  if (asyncScripts.length > 0) {
    issues.push('Async script loading may cause initialization order issues');
  }
  
  if (errorCount > 0) {
    issues.push(`${errorCount} JavaScript errors detected`);
  }
  
  if (issues.length === 0) {
    console.log('✅ No obvious issues detected - problem may be elsewhere');
  } else {
    console.log('❌ ROOT CAUSES IDENTIFIED:');
    issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }
  
  console.log('\n💡 RECOMMENDED SOLUTIONS:');
  if (issues.includes('Official Matomo script not loaded')) {
    console.log('  - Check if official Matomo module is enabled and configured');
    console.log('  - Verify Matomo module configuration at /admin/config/system/matomo');
  }
  
  if (issues.includes('Potential conflict between official Matomo module and DSF Analytics')) {
    console.log('  - Remove DSF Analytics _paq initialization fixes');
    console.log('  - Let official Matomo module handle _paq initialization');
    console.log('  - Use DSF Analytics only for custom event tracking');
  }
  
  if (issues.includes('Async script loading may cause initialization order issues')) {
    console.log('  - Ensure Matomo scripts load synchronously');
    console.log('  - Check script dependencies in libraries.yml');
  }
  
}, 2000);

console.log('\n🔍 Analysis running... Check back in 2 seconds for final diagnosis.');
