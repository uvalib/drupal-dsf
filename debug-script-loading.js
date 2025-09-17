/**
 * Debug Matomo Script Loading Issue
 * 
 * This script specifically addresses the async/defer script loading problem
 * identified in the Chrome diagnostic output.
 */

console.log('🔧 DEBUGGING MATOMO SCRIPT LOADING ISSUE');

// Check the current Matomo script
const matomoScript = document.querySelector('script[src*="matomo.js"]');
if (matomoScript) {
  console.log('Current Matomo script:');
  console.log('  - src:', matomoScript.src);
  console.log('  - async:', matomoScript.async);
  console.log('  - defer:', matomoScript.defer);
  console.log('  - readyState:', matomoScript.readyState);
  console.log('  - loaded:', matomoScript.readyState === 'complete' || matomoScript.readyState === 'loaded');
  
  // Check if script has loaded
  if (matomoScript.readyState === 'complete' || matomoScript.readyState === 'loaded') {
    console.log('✅ Script is loaded');
  } else {
    console.log('❌ Script is not loaded - this is the problem');
    
    // Try to force load the script
    console.log('🔧 Attempting to force load Matomo script...');
    
    // Create a new script element with different loading strategy
    const newScript = document.createElement('script');
    newScript.src = matomoScript.src;
    newScript.async = false; // Load synchronously instead
    newScript.defer = false;
    
    // Add load event listener
    newScript.onload = function() {
      console.log('✅ New Matomo script loaded successfully');
      
      // Check if _paq array gets processed
      setTimeout(() => {
        console.log('_paq length after script load:', _paq ? _paq.length : 'N/A');
        
        // Check if any requests were made
        let requestCount = 0;
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          const url = args[0];
          if (typeof url === 'string' && url.includes('matomo')) {
            requestCount++;
            console.log(`🌐 Matomo request #${requestCount}:`, url);
          }
          return originalFetch.apply(this, args);
        };
        
        // Monitor for 5 seconds
        setTimeout(() => {
          console.log(`Total Matomo requests made: ${requestCount}`);
          if (requestCount > 0) {
            console.log('✅ SUCCESS: Matomo script is now working!');
          } else {
            console.log('❌ Still no requests - script loading was not the issue');
          }
        }, 5000);
        
      }, 1000);
    };
    
    newScript.onerror = function() {
      console.log('❌ Failed to load Matomo script');
    };
    
    // Remove the old script and add the new one
    matomoScript.remove();
    document.head.appendChild(newScript);
  }
} else {
  console.log('❌ No Matomo script found');
}
