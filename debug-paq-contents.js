/**
 * Debug _paq array contents
 * Run this in the browser console to see what's actually being sent to Matomo
 */

console.log('=== _PAQ ARRAY ANALYSIS ===');
console.log('Total _paq items:', _paq.length);

// Show first 10 items
console.log('First 10 _paq items:');
for (let i = 0; i < Math.min(10, _paq.length); i++) {
  console.log(`[${i}]:`, _paq[i]);
}

// Look for specific tracking calls
console.log('\n=== TRACKING CALL ANALYSIS ===');

const trackingCalls = {
  setTrackerUrl: [],
  setSiteId: [],
  trackPageView: [],
  setCustomUrl: [],
  trackGoal: [],
  setCustomDimension: [],
  other: []
};

_paq.forEach((item, index) => {
  if (Array.isArray(item) && item.length > 0) {
    const command = item[0];
    switch (command) {
      case 'setTrackerUrl':
        trackingCalls.setTrackerUrl.push({ index, item });
        break;
      case 'setSiteId':
        trackingCalls.setSiteId.push({ index, item });
        break;
      case 'trackPageView':
        trackingCalls.trackPageView.push({ index, item });
        break;
      case 'setCustomUrl':
        trackingCalls.setCustomUrl.push({ index, item });
        break;
      case 'trackGoal':
        trackingCalls.trackGoal.push({ index, item });
        break;
      case 'setCustomDimension':
        trackingCalls.setCustomDimension.push({ index, item });
        break;
      default:
        trackingCalls.other.push({ index, item });
    }
  }
});

// Display analysis
Object.keys(trackingCalls).forEach(key => {
  const calls = trackingCalls[key];
  console.log(`\n${key.toUpperCase()}: ${calls.length} calls`);
  calls.slice(0, 3).forEach(call => {
    console.log(`  [${call.index}]:`, call.item);
  });
  if (calls.length > 3) {
    console.log(`  ... and ${calls.length - 3} more`);
  }
});

// Check for site ID consistency
console.log('\n=== SITE ID ANALYSIS ===');
const siteIds = trackingCalls.setSiteId.map(call => call.item[1]);
const uniqueSiteIds = [...new Set(siteIds)];
console.log('Site IDs found:', uniqueSiteIds);
console.log('Expected site ID: 67');

// Check for tracker URL consistency
console.log('\n=== TRACKER URL ANALYSIS ===');
const trackerUrls = trackingCalls.setTrackerUrl.map(call => call.item[1]);
const uniqueUrls = [...new Set(trackerUrls)];
console.log('Tracker URLs found:', uniqueUrls);
console.log('Expected URL: https://analytics.lib.virginia.edu/matomo.php');

console.log('\n=== SUMMARY ===');
console.log('Total tracking calls:', _paq.length);
console.log('Page views:', trackingCalls.trackPageView.length);
console.log('Custom dimensions:', trackingCalls.setCustomDimension.length);
console.log('Goals:', trackingCalls.trackGoal.length);
console.log('Other calls:', trackingCalls.other.length);

