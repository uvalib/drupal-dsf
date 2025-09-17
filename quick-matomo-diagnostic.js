/**
 * Quick Matomo Diagnostic Script
 * 
 * Run this in the browser console to quickly diagnose Matomo tracking issues.
 * This is a simplified version for quick troubleshooting.
 */

console.log('🔍 QUICK MATOMO DIAGNOSTIC');
console.log('Browser:', navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                   navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                   navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown');

// Quick checks
const checks = {
  '_paq exists': typeof _paq !== 'undefined',
  '_paq is array': Array.isArray(_paq),
  '_paq has content': _paq && _paq.length > 0,
  'drupalSettings exists': typeof drupalSettings !== 'undefined',
  'DSF Analytics config': typeof drupalSettings !== 'undefined' && !!drupalSettings.dsfAnalytics,
  'Matomo enabled': typeof drupalSettings !== 'undefined' && drupalSettings.dsfAnalytics && drupalSettings.dsfAnalytics.matomo && drupalSettings.dsfAnalytics.matomo.enabled,
  'Matomo URL configured': typeof drupalSettings !== 'undefined' && drupalSettings.dsfAnalytics && drupalSettings.dsfAnalytics.matomo && !!drupalSettings.dsfAnalytics.matomo.url,
  'Site ID configured': typeof drupalSettings !== 'undefined' && drupalSettings.dsfAnalytics && drupalSettings.dsfAnalytics.matomo && !!drupalSettings.dsfAnalytics.matomo.siteId
};

console.log('\n📋 QUICK CHECKS:');
Object.entries(checks).forEach(([check, result]) => {
  console.log(`${result ? '✅' : '❌'} ${check}: ${result}`);
});

// Show _paq contents if available
if (_paq && Array.isArray(_paq)) {
  console.log('\n📊 _PAQ CONTENTS:');
  console.log('Length:', _paq.length);
  if (_paq.length > 0) {
    console.log('First 3 items:');
    _paq.slice(0, 3).forEach((item, index) => {
      console.log(`  [${index}]:`, item);
    });
  }
} else {
  console.log('\n❌ _PAQ ISSUE:');
  console.log('_paq type:', typeof _paq);
  console.log('_paq value:', _paq);
}

// Show configuration if available
if (typeof drupalSettings !== 'undefined' && drupalSettings.dsfAnalytics) {
  console.log('\n⚙️ DSF ANALYTICS CONFIG:');
  console.log('Matomo URL:', drupalSettings.dsfAnalytics.matomo.url);
  console.log('Site ID:', drupalSettings.dsfAnalytics.matomo.siteId);
  console.log('Tracking Mode:', drupalSettings.dsfAnalytics.matomo.trackingMode);
  console.log('Module Attached:', drupalSettings.dsfAnalytics.debug.module_attached);
  console.log('Is DSF Page:', drupalSettings.dsfAnalytics.debug.is_dsf_page);
}

// Test a simple tracking call
console.log('\n🧪 TESTING TRACKING:');
if (_paq && Array.isArray(_paq)) {
  const initialLength = _paq.length;
  try {
    _paq.push(['trackEvent', 'Debug', 'QuickTest', 'Browser: ' + (navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Firefox')]);
    console.log('✅ Successfully added test event');
    console.log('_paq length changed from', initialLength, 'to', _paq.length);
  } catch (e) {
    console.log('❌ Error adding test event:', e.message);
  }
} else {
  console.log('❌ Cannot test tracking - _paq not available');
}

// Check for Matomo scripts
const matomoScripts = document.querySelectorAll('script[src*="matomo"]');
console.log('\n📜 MATOMO SCRIPTS:');
console.log('Found:', matomoScripts.length);
matomoScripts.forEach((script, index) => {
  console.log(`  ${index + 1}. ${script.src} (${script.readyState})`);
});

// Quick network test
console.log('\n🌐 NETWORK TEST:');
if (typeof drupalSettings !== 'undefined' && drupalSettings.dsfAnalytics && drupalSettings.dsfAnalytics.matomo) {
  const testUrl = drupalSettings.dsfAnalytics.matomo.url + 'matomo.php?idsite=1&rec=1&url=' + encodeURIComponent(window.location.href);
  console.log('Testing:', testUrl);
  
  const img = new Image();
  img.onload = () => console.log('✅ Matomo server reachable');
  img.onerror = () => console.log('❌ Matomo server unreachable');
  img.src = testUrl;
} else {
  console.log('❌ No Matomo URL configured for network test');
}

console.log('\n🏁 DIAGNOSTIC COMPLETE');
console.log('If you see ❌ marks above, those are the issues to investigate.');
