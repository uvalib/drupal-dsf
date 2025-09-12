/**
 * Debug CORS issue with Matomo
 * Run this to test different request methods
 */

console.log('=== CORS DEBUGGING ===');

// Test 1: Image request (how Matomo normally works)
console.log('Test 1: Image request');
const img = new Image();
img.onload = () => console.log('Image request succeeded');
img.onerror = (e) => console.log('Image request failed:', e);
img.src = 'https://analytics.lib.virginia.edu/matomo.php?idsite=67&rec=1&url=' + encodeURIComponent(window.location.href) + '&rand=' + Math.random();

// Test 2: Form submission (alternative method)
console.log('Test 2: Form submission');
const form = document.createElement('form');
form.method = 'POST';
form.action = 'https://analytics.lib.virginia.edu/matomo.php';
form.target = '_blank';
form.style.display = 'none';

const data = {
  idsite: '67',
  rec: '1',
  url: window.location.href,
  action_name: 'Test Page',
  rand: Math.random()
};

Object.keys(data).forEach(key => {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = key;
  input.value = data[key];
  form.appendChild(input);
});

document.body.appendChild(form);
form.submit();
document.body.removeChild(form);

// Test 3: Fetch with proper CORS headers
console.log('Test 3: Fetch with CORS');
fetch('https://analytics.lib.virginia.edu/matomo.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams(data),
  mode: 'cors',
  credentials: 'include'
})
.then(response => {
  console.log('CORS fetch response:', response.status, response.statusText);
  return response.text();
})
.then(text => {
  console.log('CORS fetch response body:', text.substring(0, 100));
})
.catch(error => {
  console.log('CORS fetch error:', error);
});

// Test 4: Check if _paq is actually sending requests
console.log('Test 4: Monitor _paq requests');
const originalPush = _paq.push;
let pushCount = 0;
_paq.push = function(...args) {
  pushCount++;
  console.log(`_paq.push #${pushCount}:`, args);
  return originalPush.apply(this, args);
};

// Test 5: Check network requests in real-time
console.log('Test 5: Network monitoring');
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.name.includes('matomo')) {
      console.log('Network request to Matomo:', entry.name, entry.responseStatus);
    }
  });
});
observer.observe({ entryTypes: ['resource'] });

console.log('=== All tests initiated ===');

