/**
 * Debug browser-specific differences in Matomo tracking
 * Run this in both Safari and Chrome to compare what's being sent
 */

console.log('=== BROWSER DIFFERENCES DEBUG ===');
console.log('User Agent:', navigator.userAgent);
console.log('Browser:', navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                   navigator.userAgent.includes('Safari') ? 'Safari' : 
                   navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Unknown');

// 1. Check what's in _paq array
console.log('\n=== _PAQ ARRAY ANALYSIS ===');
console.log('_paq length:', _paq.length);
console.log('First 5 _paq items:');
for (let i = 0; i < Math.min(5, _paq.length); i++) {
  console.log(`[${i}]:`, _paq[i]);
}

// 2. Check for specific tracking calls
const trackingCalls = {
  setTrackerUrl: _paq.filter(item => Array.isArray(item) && item[0] === 'setTrackerUrl'),
  setSiteId: _paq.filter(item => Array.isArray(item) && item[0] === 'setSiteId'),
  trackPageView: _paq.filter(item => Array.isArray(item) && item[0] === 'trackPageView'),
  setCustomUrl: _paq.filter(item => Array.isArray(item) && item[0] === 'setCustomUrl'),
  setCustomDimension: _paq.filter(item => Array.isArray(item) && item[0] === 'setCustomDimension')
};

console.log('\n=== TRACKING CALLS BREAKDOWN ===');
Object.keys(trackingCalls).forEach(key => {
  console.log(`${key}: ${trackingCalls[key].length} calls`);
  if (trackingCalls[key].length > 0) {
    console.log('  First call:', trackingCalls[key][0]);
  }
});

// 3. Check for duplicate calls
console.log('\n=== DUPLICATE ANALYSIS ===');
const duplicates = {};
_paq.forEach((item, index) => {
  const key = JSON.stringify(item);
  if (duplicates[key]) {
    duplicates[key].count++;
    duplicates[key].indices.push(index);
  } else {
    duplicates[key] = { count: 1, indices: [index] };
  }
});

const duplicateCalls = Object.entries(duplicates).filter(([key, data]) => data.count > 1);
console.log('Duplicate calls found:', duplicateCalls.length);
duplicateCalls.slice(0, 3).forEach(([key, data]) => {
  console.log(`  ${data.count}x:`, JSON.parse(key), 'at indices:', data.indices);
});

// 4. Test a simple tracking call
console.log('\n=== SIMPLE TRACKING TEST ===');
const testData = {
  idsite: '67',
  rec: '1',
  url: window.location.href,
  action_name: 'Browser Test - ' + (navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Safari'),
  rand: Math.random(),
  ua: navigator.userAgent
};

console.log('Sending test data:', testData);

// Send via image request (like Matomo normally does)
const img = new Image();
img.onload = () => {
  console.log('Test image request succeeded');
};
img.onerror = (e) => {
  console.log('Test image request failed:', e);
};
img.src = 'https://analytics.lib.virginia.edu/matomo.php?' + new URLSearchParams(testData).toString();

// 5. Check for any browser-specific headers or data
console.log('\n=== BROWSER-SPECIFIC DATA ===');
console.log('Cookies enabled:', navigator.cookieEnabled);
console.log('Do Not Track:', navigator.doNotTrack);
console.log('Language:', navigator.language);
console.log('Platform:', navigator.platform);
console.log('Screen resolution:', screen.width + 'x' + screen.height);
console.log('Color depth:', screen.colorDepth);

// 6. Monitor actual network requests
console.log('\n=== NETWORK REQUEST MONITORING ===');
const originalFetch = window.fetch;
let requestCount = 0;
window.fetch = function(...args) {
  const url = args[0];
  if (typeof url === 'string' && url.includes('matomo')) {
    requestCount++;
    console.log(`Network request #${requestCount} to Matomo:`, url);
    return originalFetch.apply(this, args)
      .then(response => {
        console.log(`Network response #${requestCount}:`, response.status, response.statusText);
        return response;
      });
  }
  return originalFetch.apply(this, args);
};

console.log('Monitoring network requests for 10 seconds...');
setTimeout(() => {
  console.log(`Total Matomo requests made: ${requestCount}`);
}, 10000);

console.log('\n=== END DEBUG ===');

