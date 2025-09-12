/**
 * Advanced Matomo Request Debugging Script
 * Run this in Chrome/Firefox console to debug why requests aren't reaching Matomo
 */

console.log('=== MATOMO REQUEST DEBUGGING ===');

// 1. Check if requests are being made
const originalFetch = window.fetch;
const originalXMLHttpRequest = window.XMLHttpRequest;

let requestCount = 0;
let blockedRequests = [];

// Intercept fetch requests
window.fetch = function(...args) {
  requestCount++;
  const url = args[0];
  if (typeof url === 'string' && url.includes('matomo')) {
    console.log('FETCH REQUEST to Matomo:', url);
    return originalFetch.apply(this, args)
      .then(response => {
        console.log('FETCH RESPONSE from Matomo:', response.status, response.statusText);
        return response;
      })
      .catch(error => {
        console.log('FETCH ERROR from Matomo:', error);
        blockedRequests.push({ type: 'fetch', url, error: error.message });
        return Promise.reject(error);
      });
  }
  return originalFetch.apply(this, args);
};

// Intercept XMLHttpRequest
const originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url, ...args) {
  if (typeof url === 'string' && url.includes('matomo')) {
    console.log('XHR REQUEST to Matomo:', method, url);
    this.addEventListener('load', function() {
      console.log('XHR RESPONSE from Matomo:', this.status, this.statusText);
    });
    this.addEventListener('error', function() {
      console.log('XHR ERROR from Matomo:', this.status, this.statusText);
      blockedRequests.push({ type: 'xhr', url, status: this.status });
    });
  }
  return originalOpen.apply(this, [method, url, ...args]);
};

// 2. Check for ad blockers
console.log('Checking for ad blockers...');
const adBlockTests = [
  'https://google-analytics.com/analytics.js',
  'https://www.google-analytics.com/analytics.js',
  'https://googletagmanager.com/gtag/js',
  'https://www.googletagmanager.com/gtag/js'
];

adBlockTests.forEach(url => {
  fetch(url, { mode: 'no-cors' })
    .then(() => console.log('Ad blocker test passed for:', url))
    .catch(() => console.log('Ad blocker may be blocking:', url));
});

// 3. Test direct Matomo request
console.log('Testing direct Matomo request...');
const testData = new URLSearchParams({
  idsite: '67',
  rec: '1',
  url: window.location.href,
  action_name: 'Test Page',
  rand: Math.random()
});

fetch('https://analytics.lib.virginia.edu/matomo.php', {
  method: 'POST',
  body: testData,
  mode: 'cors',
  credentials: 'include'
})
.then(response => {
  console.log('Direct Matomo test - Status:', response.status);
  return response.text();
})
.then(text => {
  console.log('Direct Matomo test - Response:', text.substring(0, 200));
})
.catch(error => {
  console.log('Direct Matomo test - Error:', error);
  blockedRequests.push({ type: 'direct', error: error.message });
});

// 4. Check _paq array contents
console.log('Current _paq array:', _paq);
console.log('_paq length:', _paq ? _paq.length : 'undefined');

// 5. Monitor for blocked requests
setTimeout(() => {
  console.log('=== REQUEST SUMMARY ===');
  console.log('Total requests made:', requestCount);
  console.log('Blocked requests:', blockedRequests);
  
  if (blockedRequests.length > 0) {
    console.log('ISSUE: Some requests were blocked!');
    console.log('This could be due to:');
    console.log('- Ad blockers (uBlock Origin, AdBlock Plus, etc.)');
    console.log('- Browser privacy settings');
    console.log('- Corporate firewall/proxy');
    console.log('- Content Security Policy');
  } else {
    console.log('No blocked requests detected');
  }
}, 5000);

console.log('=== Monitoring requests for 5 seconds... ===');

