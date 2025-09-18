/**
 * @file
 * Modular Matomo tracking for DSF SPA - tracks user behavior without code disturbance
 * 
 * This module extends existing functionality to capture:
 * - Facet selection patterns (most/least popular criteria)
 * - Service viewing behavior (what services people look at)
 * - Service investigation depth (detailed views, comparisons)
 */

(function ($, Drupal, once) {
  'use strict';

  // Debug: Log that the script is loading
  console.log('DSF Analytics: matomo-tracking.js is loading...', {
    drupalSettingsAvailable: typeof drupalSettings !== 'undefined',
    drupalSettings: typeof drupalSettings !== 'undefined' ? drupalSettings : 'undefined',
    browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Safari'
  });

  // Get Matomo configuration from DSF Analytics module settings
  const MATOMO_CONFIG = {
    url: (drupalSettings.dsfAnalytics && drupalSettings.dsfAnalytics.matomo && drupalSettings.dsfAnalytics.matomo.url) || 
         (drupalSettings.matomo && drupalSettings.matomo.url_https) || 
         (drupalSettings.matomo && drupalSettings.matomo.url_http) || 
         'https://vah-analytics.lib.virginia.edu/',
    siteId: (drupalSettings.dsfAnalytics && drupalSettings.dsfAnalytics.matomo && drupalSettings.dsfAnalytics.matomo.siteId) || 
            (drupalSettings.matomo && drupalSettings.matomo.site_id) || 
            1,
    enabled: (drupalSettings.dsfAnalytics && drupalSettings.dsfAnalytics.matomo && drupalSettings.dsfAnalytics.matomo.enabled) || 
             (drupalSettings.matomo ? true : false),
    trackingMode: (drupalSettings.dsfAnalytics && drupalSettings.dsfAnalytics.matomo && drupalSettings.dsfAnalytics.matomo.trackingMode) || 'PROD',
    debug: (drupalSettings.dsfAnalytics && drupalSettings.dsfAnalytics.matomo && drupalSettings.dsfAnalytics.matomo.trackingMode === 'DEBUG') || false,
    labels: (drupalSettings.dsfAnalytics && drupalSettings.dsfAnalytics.labels) || null
  };

  // Enhanced debugging - always log configuration
  console.log('DSF Analytics: Configuration loaded', {
    config: MATOMO_CONFIG,
    drupalSettings: {
      dsfAnalytics: drupalSettings.dsfAnalytics,
      matomo: drupalSettings.matomo
    },
    currentUrl: window.location.href,
    currentPath: window.location.pathname,
    userAgent: navigator.userAgent,
    browser: getBrowserInfo()
  });

  // Debug: Log initial _paq state and check for Matomo scripts
  console.log('DSF Analytics: Initial _paq state', {
    _paqType: typeof _paq,
    _paqIsArray: Array.isArray(_paq),
    _paqValue: _paq,
    _paqConstructor: _paq ? _paq.constructor.name : 'N/A',
    browser: getBrowserInfo()
  });

  // Check for Matomo scripts in the DOM
  const matomoScripts = document.querySelectorAll('script[src*="matomo"], script[src*="analytics"]');
  console.log('DSF Analytics: Found Matomo scripts', {
    count: matomoScripts.length,
    scripts: Array.from(matomoScripts).map(s => s.src),
    browser: getBrowserInfo()
  });

  // Check if _paq has any properties that might give us a clue
  if (_paq && typeof _paq === 'object') {
    console.log('DSF Analytics: _paq object properties', {
      keys: Object.keys(_paq),
      values: Object.values(_paq),
      browser: getBrowserInfo()
    });
  }

  // Initialize _paq if not already done by Matomo module
  window._paq = window._paq || [];

  // Debug: Log final _paq state after our fix
  console.log('DSF Analytics: Final _paq state after fix', {
    _paqType: typeof _paq,
    _paqIsArray: Array.isArray(_paq),
    _paqLength: _paq ? _paq.length : 'N/A',
    browser: getBrowserInfo()
  });

  // Don't initialize Matomo - let the official module handle it
  // We just extend the existing tracking with our custom events

  // Test Matomo server connectivity
  if (MATOMO_CONFIG.enabled) {
    const testUrl = MATOMO_CONFIG.url + 'matomo.php';
    console.log('DSF Analytics: Testing Matomo connectivity to', testUrl, 'Browser:', getBrowserInfo());
    
    // Test with a simple fetch request
    fetch(testUrl, {
      method: 'GET',
      mode: 'no-cors' // This will always succeed but won't give us response details
    }).then(() => {
      console.log('DSF Analytics: Matomo server reachable (no-cors mode)', 'Browser:', getBrowserInfo());
    }).catch(error => {
      console.error('DSF Analytics: Matomo server unreachable', error, 'Browser:', getBrowserInfo());
    });
  }

  // Browser detection for debugging
  function getBrowserInfo() {
    const ua = navigator.userAgent;
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Safari') > -1) return 'Safari';
    if (ua.indexOf('Edge') > -1) return 'Edge';
    return 'Unknown';
  }

  // Initialize _paq if not already done by Matomo module
  window._paq = window._paq || [];

  /**
   * Check if Matomo is already initialized by the Drupal module
   */
  function isMatomoAlreadyInitialized() {
    console.log('DSF Analytics: Checking if Matomo already initialized...');
    
    // Check for existing Matomo script
    const matomoScript = document.querySelector('script[src*="matomo.js"]');
    console.log('DSF Analytics: Matomo script found:', !!matomoScript);
    if (matomoScript) {
      return true;
    }
    
    // Check if _paq already has tracking calls
    console.log('DSF Analytics: _paq exists:', !!window._paq, 'length:', window._paq ? window._paq.length : 0);
    if (window._paq && window._paq.length > 0) {
      // Look for common Matomo initialization calls
      for (let i = 0; i < window._paq.length; i++) {
        if (Array.isArray(window._paq[i]) && 
            (window._paq[i][0] === 'setTrackerUrl' || window._paq[i][0] === 'setSiteId')) {
          console.log('DSF Analytics: Found Matomo initialization in _paq:', window._paq[i]);
          return true;
        }
      }
    }
    
    // Check for Matomo global variables
    console.log('DSF Analytics: Piwik exists:', !!window.Piwik, 'Matomo exists:', !!window.Matomo);
    if (window.Piwik || window.Matomo) {
      return true;
    }
    
    console.log('DSF Analytics: Matomo not initialized, will initialize');
    return false;
  }

  /**
   * DSF Matomo Tracking Module
   */
  Drupal.behaviors.dsfMatomoTracking = {
    attach: function (context, settings) {
      console.log('DSF Analytics: Behavior attach called', {
        context: context,
        settings: settings,
        matomoConfig: MATOMO_CONFIG,
        drupalSettings: drupalSettings
      });

      if (!MATOMO_CONFIG.enabled) {
        console.log('DSF Analytics: Tracking disabled - no drupalSettings.matomo found or not enabled');
        return;
      }

      // Check if we should initialize or extend existing Matomo
      const matomoAlreadyInitialized = isMatomoAlreadyInitialized();
      console.log('DSF Analytics: isMatomoAlreadyInitialized() returned:', matomoAlreadyInitialized);
      
      // ALWAYS check if Matomo script is properly loaded, regardless of initialization status
      // This is crucial for fixing the Chrome/Firefox async/defer issue
      this.ensureMatomoScriptLoaded();
      
      if (matomoAlreadyInitialized) {
        console.log('DSF Analytics: Matomo already initialized, extending existing tracking');
        // Don't re-initialize, just attach our custom event listeners
        this.attachTrackingListeners(context);
        return;
      }

      // Initialize Matomo only once and only if not already done
      if (!window.dsfMatomoInitialized) {
        if (MATOMO_CONFIG.debug) {
          console.log('DSF initializing Matomo tracking (no existing tracker found)');
        }
        this.initializeMatomo();
        window.dsfMatomoInitialized = true;
      }

      // Attach event listeners for DSF-specific tracking
      this.attachTrackingListeners(context);
      
      // Initialize workflow tracking on first load
      if (!window.dsfWorkflowInitialized) {
        window.DSFWorkflowTracker.init();
        window.dsfWorkflowInitialized = true;
      }
    },

    /**
     * Initialize Matomo tracking code (only if not already initialized)
     */
    initializeMatomo: function () {
      // Don't initialize - let the official Matomo module handle this
      console.log('DSF Analytics: Skipping Matomo initialization - using official module');
      
      // Script loading check is now handled in the main attach function
    },

    /**
     * Ensure Matomo script is properly loaded and working
     * This addresses the Chrome/Firefox async script loading issue
     */
    ensureMatomoScriptLoaded: function() {
      const self = this;
      
      // Check if Matomo script is loaded and working
      const matomoScript = document.querySelector('script[src*="matomo.js"]');
      if (!matomoScript) {
        console.log('DSF Analytics: No Matomo script found');
        return;
      }
      
      // Check if script is loaded
      const isLoaded = matomoScript.readyState === 'complete' || 
                      matomoScript.readyState === 'loaded' ||
                      matomoScript.readyState === 'interactive';
      
      console.log('DSF Analytics: Matomo script loading check', {
        src: matomoScript.src,
        async: matomoScript.async,
        defer: matomoScript.defer,
        readyState: matomoScript.readyState,
        isLoaded: isLoaded,
        browser: getBrowserInfo()
      });
      
      // Check if both async and defer are set (this causes issues in Chrome/Firefox)
      if (matomoScript.async && matomoScript.defer) {
        console.log('DSF Analytics: ⚠️ Script has both async and defer - this causes issues in Chrome/Firefox');
        console.log('DSF Analytics: Attempting to fix by reloading script without both attributes');
        self.fixAsyncDeferScript(matomoScript);
        return;
      }
      
      if (isLoaded) {
        console.log('DSF Analytics: Matomo script is loaded');
        // Check if it's actually working by monitoring for requests
        this.monitorMatomoRequests();
      } else {
        console.log('DSF Analytics: Matomo script not loaded, waiting...');
        
        // Wait for script to load
        const checkInterval = setInterval(() => {
          const nowLoaded = matomoScript.readyState === 'complete' || 
                           matomoScript.readyState === 'loaded' ||
                           matomoScript.readyState === 'interactive';
          
          if (nowLoaded) {
            clearInterval(checkInterval);
            console.log('DSF Analytics: Matomo script loaded after waiting');
            self.monitorMatomoRequests();
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          console.log('DSF Analytics: Matomo script failed to load, attempting fallback');
          self.fallbackMatomoLoading();
        }, 5000);
      }
    },

    /**
     * Fix the async/defer script loading issue by reloading the script
     */
    fixAsyncDeferScript: function(originalScript) {
      console.log('DSF Analytics: Fixing async/defer script loading issue...');
      
      // Create a new script element with only async (no defer)
      const newScript = document.createElement('script');
      newScript.src = originalScript.src;
      newScript.async = true;
      newScript.defer = false;
      
      newScript.onload = function() {
        console.log('DSF Analytics: ✅ Fixed Matomo script loaded successfully');
        
        // Force Matomo to process any queued _paq events
        if (_paq && _paq.length > 0) {
          console.log(`DSF Analytics: Processing ${_paq.length} queued events after script fix`);
          
          // Force Matomo to process the queue
          if (window.Piwik && typeof window.Piwik.getAsyncTracker === 'function') {
            try {
              const tracker = window.Piwik.getAsyncTracker();
              if (tracker) {
                // Force process the queue
                tracker.trackPageView();
                console.log('DSF Analytics: Forced Matomo to process queued events');
              }
            } catch (e) {
              console.log('DSF Analytics: Error forcing Matomo to process queue:', e);
            }
          }
        }
        
        // Monitor for actual requests
        this.monitorMatomoRequests();
      }.bind(this);
      
      newScript.onerror = function() {
        console.log('DSF Analytics: ❌ Fixed Matomo script failed to load');
        this.fallbackMatomoLoading();
      }.bind(this);
      
      // Replace the old script
      originalScript.remove();
      document.head.appendChild(newScript);
    },

    /**
     * Monitor Matomo requests to verify it's working
     */
    monitorMatomoRequests: function() {
      let requestCount = 0;
      const startTime = Date.now();
      
      // Monitor fetch requests
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const url = args[0];
        if (typeof url === 'string' && url.includes('matomo')) {
          requestCount++;
          console.log(`DSF Analytics: Matomo request #${requestCount}:`, url);
        }
        return originalFetch.apply(this, args);
      };
      
      // Monitor XMLHttpRequest
      const originalXHROpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url, ...args) {
        if (typeof url === 'string' && url.includes('matomo')) {
          requestCount++;
          console.log(`DSF Analytics: Matomo XHR request #${requestCount}:`, url);
        }
        return originalXHROpen.apply(this, [method, url, ...args]);
      };
      
      // Check after 3 seconds
      setTimeout(() => {
        if (requestCount > 0) {
          console.log(`DSF Analytics: ✅ Matomo is working - ${requestCount} requests made`);
        } else {
          console.log('DSF Analytics: ❌ Matomo not working - no requests made');
          console.log('DSF Analytics: _paq length:', _paq ? _paq.length : 'N/A');
          console.log('DSF Analytics: _paq contents:', _paq);
        }
      }, 3000);
    },

    /**
     * Fallback Matomo loading for when async script fails
     */
    fallbackMatomoLoading: function() {
      console.log('DSF Analytics: Attempting fallback Matomo loading...');
      
      const matomoScript = document.querySelector('script[src*="matomo.js"]');
      if (!matomoScript) return;
      
      // Create a new script element with synchronous loading
      const newScript = document.createElement('script');
      newScript.src = matomoScript.src;
      newScript.async = false;
      newScript.defer = false;
      
      newScript.onload = function() {
        console.log('DSF Analytics: ✅ Fallback Matomo script loaded successfully');
        
        // Process any queued _paq events
        if (_paq && _paq.length > 0) {
          console.log(`DSF Analytics: Processing ${_paq.length} queued events`);
        }
      };
      
      newScript.onerror = function() {
        console.log('DSF Analytics: ❌ Fallback Matomo script failed to load');
      };
      
      // Replace the old script
      matomoScript.remove();
      document.head.appendChild(newScript);
    },

    /**
     * Attach tracking listeners to existing events
     */
    attachTrackingListeners: function (context) {
      const self = this;
      
      console.log('DSF Analytics: attachTrackingListeners called', {
        context: context,
        contextLength: context.length,
        contextType: context.constructor.name
      });

      // Fix _paq array conversion AFTER Matomo has initialized
      // Use setTimeout to ensure this runs after all other scripts
      setTimeout(() => {
        if (typeof _paq !== 'undefined' && !Array.isArray(_paq)) {
          console.log('DSF Analytics: Converting _paq from object to array (after Matomo init)', {
            originalType: typeof _paq,
            originalValue: _paq,
            browser: getBrowserInfo()
          });
          
          // If it's an object with a push function, it might be a Matomo tracker object
          if (_paq && typeof _paq.push === 'function') {
            // Create a new array and copy any existing tracking calls
            const newPaq = [];
            // Try to preserve any existing tracking calls
            if (_paq.length !== undefined) {
              for (let i = 0; i < _paq.length; i++) {
                if (Array.isArray(_paq[i])) {
                  newPaq.push(_paq[i]);
                }
              }
            }
            window._paq = newPaq;
          } else {
            // Fallback: create empty array
            window._paq = [];
          }
          
        console.log('DSF Analytics: _paq converted to array (after Matomo init)', {
          newType: typeof _paq,
          newIsArray: Array.isArray(_paq),
          newLength: _paq.length,
          browser: getBrowserInfo()
        });
        
        // Force Matomo to process the _paq array if it hasn't started
        if (window.Piwik && typeof window.Piwik.getAsyncTracker === 'function') {
          console.log('DSF Analytics: Forcing Matomo to process _paq array');
          try {
            const tracker = window.Piwik.getAsyncTracker();
            if (tracker) {
              tracker.trackPageView();
              console.log('DSF Analytics: Forced Matomo page view tracking');
            }
          } catch (e) {
            console.log('DSF Analytics: Error forcing Matomo tracking:', e);
          }
        }
      }
    }, 100); // 100ms delay to ensure Matomo has finished initializing

      // Track facet selections (criteria popularity)
      const facetElements = once('matomo-facet-tracking', '.facet', context);
      console.log('DSF Analytics: Found facet elements:', facetElements.length);
      facetElements.forEach(function(element) {
        $(element).on('change', function() {
          const facetElement = $(this);
          const facetType = facetElement.attr('name') || facetElement.closest('.facet-group').data('facet-type') || 'unknown';
          // Prefer human-readable label when value is a boolean/"on"
          const inputId = facetElement.attr('id');
          const explicitLabel = inputId ? $(`label[for="${inputId}"]`).text().trim() : '';
          const surroundingLabel = facetElement.closest('label').text().trim();
          const optionText = facetElement.is('option') ? facetElement.text().trim() : '';
          const rawValue = facetElement.val();
          const facetValue = explicitLabel || surroundingLabel || optionText || (typeof rawValue === 'string' ? rawValue : (rawValue ? String(rawValue) : '')) || facetElement.text().trim();
          const isChecked = facetElement.is(':checked') || facetElement.is(':selected');

          self.trackFacetSelection(facetType, facetValue, isChecked);
        });
      });

      // Track service card interactions (what services people look at)
      const serviceElements = once('matomo-service-tracking', '.service-panel, .cardcheckbox', context);
      console.log('DSF Analytics: Found service elements:', serviceElements.length);
      serviceElements.forEach(function(element) {
        $(element).on('click change', function(e) {
          const serviceElement = $(this);
          const servicePanel = serviceElement.closest('.service-panel');
          const serviceId = servicePanel.attr('service') || servicePanel.data('service-id') || servicePanel.find('[data-service-id]').data('service-id');
          
          // Try multiple selectors for service name
          let serviceName = servicePanel.find('.service-title').text().trim() ||
                           servicePanel.find('.card-title').text().trim() ||
                           servicePanel.find('h3').text().trim() ||
                           servicePanel.find('h4').text().trim() ||
                           servicePanel.find('.title').text().trim() ||
                           servicePanel.find('[class*="title"]').text().trim() ||
                           servicePanel.find('a').text().trim() ||
                           'Unknown Service';
          
          console.log('DSF Analytics: Service interaction detected', {
            serviceId: serviceId,
            serviceName: serviceName,
            element: serviceElement[0],
            panelHtml: servicePanel.html() ? servicePanel.html().substring(0, 200) : 'No HTML content'
          });
          
          const actionType = e.type === 'change' ? 'selection' : 'view';

          self.trackServiceInteraction(serviceId, serviceName, actionType);
        });
      });

      // Track detailed service investigations
      const detailsElements = once('matomo-details-tracking', '.btn-details, .service-details-link', context);
      detailsElements.forEach(function(element) {
        $(element).on('click', function() {
          const detailsButton = $(this);
          const serviceCard = detailsButton.closest('.service-card');
          const serviceId = serviceCard.data('service-id') || serviceCard.find('[data-service-id]').data('service-id');
          const serviceName = serviceCard.find('.service-title, .card-title').text().trim();

          self.trackServiceInvestigation(serviceId, serviceName, 'details_view');
        });
      });

      // Track comparison interactions
      const compareElements = once('matomo-compare-tracking', '.manualcheckbox, .compare-checkbox', context);
      compareElements.forEach(function(element) {
        $(element).on('change', function() {
          const compareElement = $(this);
          const serviceCard = compareElement.closest('.service-card');
          const serviceId = serviceCard.data('service-id') || serviceCard.find('[data-service-id]').data('service-id');
          const serviceName = serviceCard.find('.service-title, .card-title').text().trim();
          const isSelected = compareElement.is(':checked');

          self.trackServiceInvestigation(serviceId, serviceName, isSelected ? 'added_to_comparison' : 'removed_from_comparison');
        });
      });

      // Track search and filter application events
      const documentElements = once('matomo-search-tracking', document, context);
      documentElements.forEach(function(element) {
        $(element).on('dsf:searchExecuted dsf:filtersApplied', function(e, data) {
          self.trackSearchEvent(e.type, data);
        });
      });

      // Track result interactions
      const resultElements = once('matomo-results-tracking', '.results-container', context);
      resultElements.forEach(function(element) {
        $(element).on('click', '.service-link, .service-title-link', function() {
          const linkElement = $(this);
          const serviceId = linkElement.data('service-id') || linkElement.closest('.service-item').data('service-id');
          const serviceName = linkElement.text().trim();

          self.trackServiceInteraction(serviceId, serviceName, 'external_link_click');
        });
      });
      
      // Set up a MutationObserver to watch for dynamically loaded content
      if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(function(mutations) {
          let shouldReattach = false;
          mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
              // Check if any new elements match our selectors
              mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                  if (node.matches && (node.matches('.facet') || node.matches('.service-card') || node.matches('.cardcheckbox'))) {
                    shouldReattach = true;
                  }
                  // Also check children
                  if (node.querySelector && (node.querySelector('.facet') || node.querySelector('.service-card') || node.querySelector('.cardcheckbox'))) {
                    shouldReattach = true;
                  }
                }
              });
            }
          });
          
          if (shouldReattach) {
            console.log('DSF Analytics: New content detected, re-attaching listeners');
            // Re-attach listeners to the document to catch new elements
            self.attachTrackingListeners(document);
          }
        });
        
        // Start observing
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        console.log('DSF Analytics: MutationObserver set up to watch for new content');
      }
    },

    /**
     * Safely push tracking events to Matomo
     */
    safeTrack: function(trackingData, description) {
      console.log('DSF Analytics: safeTrack called', {
        trackingData,
        description,
        matomoConfig: MATOMO_CONFIG,
        _paqAvailable: !!window._paq,
        browser: getBrowserInfo()
      });

      if (!window._paq) {
        console.warn('DSF Analytics: _paq not available for', description, 'Browser:', getBrowserInfo());
        return false;
      }

      if (!MATOMO_CONFIG.enabled) {
        console.log('DSF Analytics: Tracking disabled for', description);
        return false;
      }

      // Simple check - if _paq is not an array, something is wrong
      if (!Array.isArray(window._paq)) {
        console.warn('DSF Analytics: _paq is not an array, skipping tracking', {
          _paqType: typeof window._paq,
          _paqValue: window._paq,
          browser: getBrowserInfo()
        });
        return false;
      }

      try {
        const initialLength = _paq ? _paq.length : 0;
        
        console.log('DSF Analytics: About to push to _paq', {
          _paqType: typeof _paq,
          _paqIsArray: Array.isArray(_paq),
          _paqLength: initialLength,
          trackingData,
          browser: getBrowserInfo()
        });
        
        _paq.push(trackingData);
        
        console.log('DSF Analytics: Pushed to _paq, new length:', _paq ? _paq.length : 'N/A', {
          trackingData,
          browser: getBrowserInfo()
        });
        
        // Check if the event was processed by Matomo
        setTimeout(function() {
          const currentLength = _paq ? _paq.length : 0;
          const wasProcessed = currentLength <= initialLength;
          
          console.log('DSF Analytics: _paq state after 2 seconds', {
            _paqType: typeof _paq,
            _paqIsArray: Array.isArray(_paq),
            _paqLength: currentLength,
            initialLength: initialLength,
            wasProcessed: wasProcessed,
            description,
            browser: getBrowserInfo()
          });
          
          if (!wasProcessed) {
            console.warn('DSF Analytics: ⚠️ Event may not have been processed by Matomo - _paq length increased from', initialLength, 'to', currentLength);
          } else {
            console.log('DSF Analytics: ✅ Event appears to have been processed by Matomo');
          }
        }, 2000);
        
        console.log('DSF Analytics: Event queued for Matomo:', description, {
          trackingData,
          matomoUrl: MATOMO_CONFIG.url,
          siteId: MATOMO_CONFIG.siteId,
          browser: getBrowserInfo()
        });
        return true;
      } catch (error) {
        console.error('DSF Analytics: Tracking error in', getBrowserInfo(), ':', error, trackingData);
        return false;
      }
    },

    /**
     * Track facet selection events
     */
    trackFacetSelection: function (facetType, facetValue, isSelected) {
      if (!MATOMO_CONFIG.enabled) return;

      console.log('DSF Analytics: trackFacetSelection called with raw data', {
        facetType,
        facetValue,
        isSelected,
        matomoConfig: MATOMO_CONFIG
      });

      // Clean up facet type to be more readable
      const cleanFacetType = this.cleanFacetType(facetType);
      const cleanFacetValue = this.cleanFacetValue(facetValue);
      
      const action = isSelected ? 'Selected' : 'Deselected';
      const eventData = [
        'trackEvent',
        'DSF_Facets',
        `${action}_${cleanFacetType}`,
        cleanFacetValue,
        isSelected ? 1 : 0
      ];

      if (this.safeTrack(eventData, 'facet selection')) {
        // Set custom dimensions for detailed analysis (if supported)
        this.safeTrack(['setCustomDimension', 1, cleanFacetType], 'facet type dimension');
        this.safeTrack(['setCustomDimension', 2, cleanFacetValue], 'facet value dimension');
      }
    },

    /**
     * Clean up facet type to be more readable using dynamic labels
     */
    cleanFacetType: function(facetType) {
      if (!facetType || facetType === 'unknown') return 'Unknown_Facet';
      
      console.log('DSF Analytics: cleanFacetType called', {
        facetType,
        labelsAvailable: !!MATOMO_CONFIG.labels,
        facetTypesAvailable: !!(MATOMO_CONFIG.labels && MATOMO_CONFIG.labels.facetTypes),
        allLabels: MATOMO_CONFIG.labels
      });
      
      // Use dynamic labels from Drupal if available
      if (MATOMO_CONFIG.labels && MATOMO_CONFIG.labels.facetTypes) {
        const dynamicLabel = MATOMO_CONFIG.labels.facetTypes[facetType];
        console.log('DSF Analytics: Looking for dynamic label', { facetType, dynamicLabel });
        if (dynamicLabel) {
          const cleaned = dynamicLabel.replace(/[-_]/g, '_').replace(/\b\w/g, l => l.toUpperCase());
          console.log('DSF Analytics: Using dynamic label', { original: facetType, dynamic: dynamicLabel, cleaned });
          return cleaned;
        }
      }
      
      // Fallback to basic cleaning if no dynamic labels
      const fallback = facetType.replace(/[-_]/g, '_').replace(/facet/i, 'Facet').replace(/\b\w/g, l => l.toUpperCase());
      console.log('DSF Analytics: Using fallback cleaning', { original: facetType, fallback });
      return fallback;
    },

    /**
     * Clean up facet value to be more readable
     */
    cleanFacetValue: function(facetValue) {
      if (!facetValue) return 'Unknown_Value';
      
      // Clean up common values
      return facetValue
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
    },

    /**
     * Track service interaction events
     */
    trackServiceInteraction: function (serviceId, serviceName, actionType) {
      if (!MATOMO_CONFIG.enabled) return;

      console.log('DSF Analytics: trackServiceInteraction called', {
        serviceId,
        serviceName,
        actionType,
        labels: MATOMO_CONFIG.labels
      });

      // Prefer dynamic service name by ID if available
      let resolvedServiceName = serviceName;
      if (serviceId && MATOMO_CONFIG.labels && MATOMO_CONFIG.labels.serviceNames && MATOMO_CONFIG.labels.serviceNames[String(serviceId)]) {
        resolvedServiceName = MATOMO_CONFIG.labels.serviceNames[String(serviceId)];
        console.log('DSF Analytics: Resolved service name by ID', { serviceId, original: serviceName, resolved: resolvedServiceName });
      } else {
        console.log('DSF Analytics: No dynamic label found for service', { serviceId, serviceName, availableLabels: MATOMO_CONFIG.labels && MATOMO_CONFIG.labels.serviceNames });
      }

      // Clean up service data to be more readable
      const cleanServiceName = this.cleanServiceName(resolvedServiceName);
      const cleanActionType = this.cleanActionType(actionType);
      
      const eventData = [
        'trackEvent',
        'DSF_Services',
        `Service_${cleanActionType}`,
        cleanServiceName,
        1
      ];

      if (this.safeTrack(eventData, 'service interaction')) {
        // Set custom dimensions for service analysis
        this.safeTrack(['setCustomDimension', 3, `${cleanServiceName} (ID: ${serviceId})`], 'service info dimension');
      }
    },

    /**
     * Clean up service name to be more readable using dynamic labels
     */
    cleanServiceName: function(serviceName) {
      if (!serviceName || serviceName === 'Unknown Service') return 'Unknown_Service';
      
      console.log('DSF Analytics: cleanServiceName called', {
        serviceName,
        labelsAvailable: !!MATOMO_CONFIG.labels,
        serviceNamesAvailable: !!(MATOMO_CONFIG.labels && MATOMO_CONFIG.labels.serviceNames),
        serviceNames: MATOMO_CONFIG.labels && MATOMO_CONFIG.labels.serviceNames
      });
      
      // Use dynamic labels from Drupal if available
      if (MATOMO_CONFIG.labels && MATOMO_CONFIG.labels.serviceNames) {
        // Try to find service by name first
        for (const serviceId in MATOMO_CONFIG.labels.serviceNames) {
          if (MATOMO_CONFIG.labels.serviceNames.hasOwnProperty(serviceId)) {
            const dynamicName = MATOMO_CONFIG.labels.serviceNames[serviceId];
            if (dynamicName === serviceName) {
              const cleaned = dynamicName.replace(/[-_]/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }).trim();
              console.log('DSF Analytics: Using dynamic service name', { original: serviceName, dynamic: dynamicName, cleaned });
              return cleaned;
            }
          }
        }
      }
      
      // Fallback to basic cleaning
      const fallback = serviceName
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, function(l) { return l.toUpperCase(); })
        .trim();
      console.log('DSF Analytics: Using fallback service name cleaning', { original: serviceName, fallback });
      return fallback;
    },

    /**
     * Clean up action type to be more readable
     */
    cleanActionType: function(actionType) {
      if (!actionType) return 'Unknown_Action';
      
      const actionTypeMap = {
        'selection': 'Selection',
        'view': 'View',
        'click': 'Click',
        'hover': 'Hover',
        'focus': 'Focus'
      };
      
      return actionTypeMap[actionType] || actionType.replace(/[-_]/g, '_').replace(/\b\w/g, l => l.toUpperCase());
    },

    /**
     * Track detailed service investigation events
     */
    trackServiceInvestigation: function (serviceId, serviceName, investigationType) {
      console.log('DSF Analytics: trackServiceInvestigation called', {
        serviceId,
        serviceName,
        investigationType,
        matomoConfig: MATOMO_CONFIG,
        _paqAvailable: !!window._paq
      });

      if (!MATOMO_CONFIG.enabled) {
        console.log('DSF Analytics: Service investigation tracking disabled');
        return;
      }

      // Clean up investigation data
      const cleanServiceName = this.cleanServiceName(serviceName);
      const cleanInvestigationType = this.cleanInvestigationType(investigationType);

      _paq.push([
        'trackEvent',
        'DSF_Service_Investigation',
        cleanInvestigationType,
        cleanServiceName,
        1
      ]);

      // Track investigation depth
      _paq.push(['setCustomDimension', 4, cleanInvestigationType]);

      console.log(`DSF Analytics: Tracked service investigation: ${cleanInvestigationType} on ${cleanServiceName} (${serviceId})`);
    },

    /**
     * Clean up investigation type to be more readable using dynamic labels
     */
    cleanInvestigationType: function(investigationType) {
      if (!investigationType) return 'Unknown_Investigation';
      
      // Use dynamic labels from Drupal if available
      if (MATOMO_CONFIG.labels && MATOMO_CONFIG.labels.investigationTypes) {
        const dynamicLabel = MATOMO_CONFIG.labels.investigationTypes[investigationType];
        if (dynamicLabel) {
          return dynamicLabel.replace(/[-_]/g, '_').replace(/\b\w/g, l => l.toUpperCase());
        }
      }
      
      // Fallback to basic cleaning
      return investigationType.replace(/[-_]/g, '_').replace(/\b\w/g, l => l.toUpperCase());
    },

    /**
     * Track search and filter events
     */
    trackSearchEvent: function (eventType, data) {
      console.log('DSF Analytics: trackSearchEvent called', {
        eventType,
        data,
        matomoConfig: MATOMO_CONFIG,
        _paqAvailable: !!window._paq
      });

      if (!MATOMO_CONFIG.enabled) {
        console.log('DSF Analytics: Search event tracking disabled');
        return;
      }

      const searchData = data || {};
      const searchTerms = searchData.query || 'no_query';
      const filterCount = searchData.activeFilters || 0;
      const resultCount = searchData.resultCount || 0;

      _paq.push([
        'trackEvent',
        'DSF_Search',
        eventType,
        `Query: ${searchTerms} | Filters: ${filterCount} | Results: ${resultCount}`,
        resultCount
      ]);

      console.log(`DSF Analytics: Tracked search event: ${eventType} with ${resultCount} results`);
    },

    /**
     * Track custom events (for future extensibility)
     */
    trackCustomEvent: function (category, action, name, value) {
      if (!MATOMO_CONFIG.enabled) return;

      _paq.push([
        'trackEvent',
        category,
        action,
        name,
        value
      ]);

      console.log(`Tracked custom event: ${category} > ${action} > ${name} (${value})`);
    },

    /**
     * Track workflow progression through DSF stages
     */
    trackWorkflowStage: function (stage, data) {
      if (!MATOMO_CONFIG.enabled) return;

      const stageData = data || {};
      let eventName = stage;
      let eventValue = 1;

      switch (stage) {
        case 'questions_started':
          eventName = 'Questions Phase Started';
          eventValue = stageData.totalQuestions || 1;
          break;
        case 'questions_completed':
          eventName = `Questions Completed (${stageData.answeredCount}/${stageData.totalQuestions})`;
          eventValue = stageData.answeredCount || 1;
          break;
        case 'results_reviewed':
          eventName = `Results Reviewed (${stageData.resultCount} services)`;
          eventValue = stageData.resultCount || 0;
          break;
        case 'selection_phase':
          eventName = `Service Selection (${stageData.selectedCount} chosen)`;
          eventValue = stageData.selectedCount || 0;
          break;
        case 'comparison_started':
          eventName = `Comparison Started (${stageData.serviceCount} services)`;
          eventValue = stageData.serviceCount || 0;
          break;
        case 'investigation_deep':
          eventName = `Deep Investigation (${stageData.investigatedCount} services)`;
          eventValue = stageData.investigatedCount || 0;
          break;
        case 'findings_recorded':
          eventName = `Findings Recorded (${stageData.recordMethod})`;
          eventValue = stageData.itemsRecorded || 1;
          break;
        case 'workflow_completed':
          eventName = `Workflow Completed (${stageData.totalDuration}s)`;
          eventValue = stageData.totalDuration || 1;
          break;
      }

      _paq.push([
        'trackEvent',
        'DSF_Workflow',
        stage,
        eventName,
        eventValue
      ]);

      // Set custom dimension for workflow stage tracking
      _paq.push(['setCustomDimension', 5, stage]);

      console.log(`Tracked workflow stage: ${stage} - ${eventName}`);
    },

    /**
     * Track session-level selection behavior
     */
    trackSelectionSession: function (sessionData) {
      if (!MATOMO_CONFIG.enabled) return;

      const servicesSelected = sessionData.selectedServices || [];
      const selectionTime = sessionData.timeSpent || 0;
      const selectionMethod = sessionData.method || 'individual'; // 'individual', 'batch', 'filtered'

      _paq.push([
        'trackEvent',
        'DSF_Selection_Session',
        'Multi_Service_Selection',
        `${servicesSelected.length} services | ${selectionMethod} | ${selectionTime}s`,
        servicesSelected.length
      ]);

      // Track selection patterns
      if (servicesSelected.length > 1) {
        _paq.push([
          'trackEvent',
          'DSF_Selection_Session',
          'Selection_Pattern',
          `Services: ${servicesSelected.join(', ')}`,
          servicesSelected.length
        ]);
      }

      console.log(`Tracked selection session: ${servicesSelected.length} services selected via ${selectionMethod}`);
    },

    /**
     * Track comparison session analysis
     */
    trackComparisonSession: function (comparisonData) {
      if (!MATOMO_CONFIG.enabled) return;

      const servicesCompared = comparisonData.services || [];
      const comparisonDuration = comparisonData.duration || 0;
      const criteriaFocused = comparisonData.criteriaViewed || [];
      const outcome = comparisonData.outcome || 'abandoned'; // 'completed', 'abandoned', 'narrowed'

      _paq.push([
        'trackEvent',
        'DSF_Comparison_Session',
        'Comparison_Analysis',
        `${servicesCompared.length} services | ${outcome} | ${comparisonDuration}s`,
        comparisonDuration
      ]);

      // Track comparison effectiveness
      if (criteriaFocused.length > 0) {
        _paq.push([
          'trackEvent',
          'DSF_Comparison_Session',
          'Criteria_Focus',
          `Focused on: ${criteriaFocused.join(', ')}`,
          criteriaFocused.length
        ]);
      }

      console.log(`Tracked comparison session: ${servicesCompared.length} services compared, outcome: ${outcome}`);
    },

    /**
     * Track investigation depth and research intensity
     */
    trackInvestigationSession: function (investigationData) {
      if (!MATOMO_CONFIG.enabled) return;

      const serviceId = investigationData.serviceId;
      const serviceName = investigationData.serviceName;
      const actionsPerformed = investigationData.actions || []; // ['details_viewed', 'documentation_opened', 'external_links_followed']
      const timeSpent = investigationData.timeSpent || 0;
      const investigationDepth = investigationData.depth || 'surface'; // 'surface', 'moderate', 'deep'

      _paq.push([
        'trackEvent',
        'DSF_Investigation_Session',
        'Investigation_Depth',
        `${serviceName} | ${investigationDepth} | ${actionsPerformed.length} actions | ${timeSpent}s`,
        timeSpent
      ]);

      // Track specific investigation actions
      actionsPerformed.forEach(action => {
        _paq.push([
          'trackEvent',
          'DSF_Investigation_Session',
          'Investigation_Action',
          `${serviceName} | ${action}`,
          1
        ]);
      });

      console.log(`Tracked investigation session: ${serviceName} - ${investigationDepth} investigation with ${actionsPerformed.length} actions`);
    },

    /**
     * Track findings recording and saving behavior
     */
    trackFindingsRecording: function (recordingData) {
      if (!MATOMO_CONFIG.enabled) return;

      const method = recordingData.method || 'unknown'; // 'bookmark', 'print', 'email', 'export', 'notes'
      const itemsRecorded = recordingData.items || [];
      const recordingContext = recordingData.context || 'general'; // 'comparison', 'investigation', 'results'

      _paq.push([
        'trackEvent',
        'DSF_Findings_Recording',
        'Record_Method',
        `${method} | ${itemsRecorded.length} items | ${recordingContext}`,
        itemsRecorded.length
      ]);

      // Track what types of information are being saved
      if (itemsRecorded.length > 0) {
        _paq.push([
          'trackEvent',
          'DSF_Findings_Recording',
          'Content_Saved',
          `Items: ${itemsRecorded.join(', ')} | Method: ${method}`,
          itemsRecorded.length
        ]);
      }

      console.log(`Tracked findings recording: ${method} used to save ${itemsRecorded.length} items from ${recordingContext}`);
    },

    /**
     * Track accessibility and usability interactions
     */
    trackAccessibilityUsage: function (feature, context) {
      if (!MATOMO_CONFIG.enabled) return;

      _paq.push([
        'trackEvent',
        'DSF_Accessibility',
        'Feature_Used',
        `${feature} | ${context}`,
        1
      ]);

      console.log(`Tracked accessibility feature: ${feature} in ${context}`);
    },

    /**
     * Track error conditions and user frustration indicators
     */
    trackUserFrustration: function (indicator, details) {
      if (!MATOMO_CONFIG.enabled) return;

      _paq.push([
        'trackEvent',
        'DSF_User_Experience',
        'Frustration_Indicator',
        `${indicator} | ${details}`,
        1
      ]);

      console.log(`Tracked frustration indicator: ${indicator} - ${details}`);
    },

    /**
     * Track performance and technical issues
     */
    trackPerformanceIssue: function (issueType, metrics) {
      if (!MATOMO_CONFIG.enabled) return;

      _paq.push([
        'trackEvent',
        'DSF_Performance',
        'Issue_Detected',
        `${issueType} | ${JSON.stringify(metrics)}`,
        metrics.value || 1
      ]);

      console.log(`Tracked performance issue: ${issueType}`, metrics);
    }
  };

  // Make DSF Matomo Tracker available globally
  window.DSFMatomoTracker = Drupal.behaviors.dsfMatomoTracking;

  /**
   * DSF Workflow Session Manager
   * Tracks the complete user journey through the DSF process
   */
  window.DSFWorkflowTracker = {
    session: {
      startTime: Date.now(),
      currentStage: 'landing',
      questionsAnswered: 0,
      totalQuestions: 0,
      servicesViewed: [],
      servicesSelected: [],
      servicesCompared: [],
      servicesInvestigated: [],
      findingsRecorded: [],
      stageTransitions: []
    },

    /**
     * Initialize workflow tracking
     */
    init: function() {
      this.session.startTime = Date.now();
      this.trackStageTransition('landing');
      
      // Set up automatic workflow detection
      this.setupWorkflowDetection();
    },

    /**
     * Track transition between workflow stages
     */
    trackStageTransition: function(newStage) {
      const previousStage = this.session.currentStage;
      const transitionTime = Date.now();
      
      this.session.stageTransitions.push({
        from: previousStage,
        to: newStage,
        timestamp: transitionTime
      });
      
      this.session.currentStage = newStage;
      
      // Track the workflow stage
      window.DSFMatomoTracker.trackWorkflowStage(newStage, this.getStageData(newStage));
    },

    /**
     * Get relevant data for current stage
     */
    getStageData: function(stage) {
      switch(stage) {
        case 'questions_started':
          return { totalQuestions: this.session.totalQuestions };
        case 'questions_completed':
          return { 
            answeredCount: this.session.questionsAnswered,
            totalQuestions: this.session.totalQuestions 
          };
        case 'results_reviewed':
          return { resultCount: this.session.servicesViewed.length };
        case 'selection_phase':
          return { selectedCount: this.session.servicesSelected.length };
        case 'comparison_started':
          return { serviceCount: this.session.servicesCompared.length };
        case 'investigation_deep':
          return { investigatedCount: this.session.servicesInvestigated.length };
        case 'findings_recorded':
          return { 
            itemsRecorded: this.session.findingsRecorded.length,
            recordMethod: 'multiple' 
          };
        case 'workflow_completed':
          return { 
            totalDuration: Math.round((Date.now() - this.session.startTime) / 1000) 
          };
        default:
          return {};
      }
    },

    /**
     * Setup chart viewing tracking
     */
    setupChartViewingTracking: function() {
      const self = this;
      let chartViewingStartTime = null;
      let chartViewingDuration = 0;
      let chartInView = false;
      let chartViewingTimer = null;
      let lastChartViewingEvent = 0;
      
      // Function to check if chart is in viewport
      function isChartInView() {
        const chartElements = document.querySelectorAll('.comparison-chart, .chart-container, .visualization, [data-chart], .results-chart');
        if (chartElements.length === 0) return false;
        
        for (let element of chartElements) {
          const rect = element.getBoundingClientRect();
          const windowHeight = window.innerHeight || document.documentElement.clientHeight;
          const windowWidth = window.innerWidth || document.documentElement.clientWidth;
          
          // Check if element is visible and in viewport
          if (rect.top < windowHeight && rect.bottom > 0 && 
              rect.left < windowWidth && rect.right > 0 &&
              rect.height > 0 && rect.width > 0) {
            return true;
          }
        }
        return false;
      }
      
      // Function to start tracking chart viewing
      function startChartViewing() {
        if (!chartInView) {
          chartInView = true;
          chartViewingStartTime = Date.now();
          console.log('DSF Analytics: Chart viewing started');
          
          // Track chart view start
          window.DSFMatomoTracker.trackCustomEvent('DSF_Chart_Viewing', 'Chart_View_Started', 'User scrolled to comparison chart', 1);
        }
      }
      
      // Function to stop tracking chart viewing
      function stopChartViewing() {
        if (chartInView) {
          chartInView = false;
          if (chartViewingStartTime) {
            chartViewingDuration = Date.now() - chartViewingStartTime;
            console.log('DSF Analytics: Chart viewing ended, duration:', chartViewingDuration + 'ms');
            
            // Track chart view duration
            window.DSFMatomoTracker.trackCustomEvent('DSF_Chart_Viewing', 'Chart_View_Ended', 
              `Duration: ${Math.round(chartViewingDuration / 1000)}s`, Math.round(chartViewingDuration / 1000));
            
            chartViewingStartTime = null;
          }
        }
      }
      
      // Function to track ongoing chart engagement
      function trackChartEngagement() {
        if (chartInView) {
          const now = Date.now();
          // Only track engagement every 5 seconds to avoid spam
          if (now - lastChartViewingEvent > 5000) {
            lastChartViewingEvent = now;
            const currentDuration = now - chartViewingStartTime;
            
            // Track different engagement levels
            if (currentDuration > 30000) { // 30+ seconds
              window.DSFMatomoTracker.trackCustomEvent('DSF_Chart_Viewing', 'Chart_Deep_Engagement', 
                `Extended viewing: ${Math.round(currentDuration / 1000)}s`, Math.round(currentDuration / 1000));
            } else if (currentDuration > 10000) { // 10+ seconds
              window.DSFMatomoTracker.trackCustomEvent('DSF_Chart_Viewing', 'Chart_Moderate_Engagement', 
                `Moderate viewing: ${Math.round(currentDuration / 1000)}s`, Math.round(currentDuration / 1000));
            }
          }
        }
      }
      
      // Scroll event handler
      function handleScroll() {
        const chartVisible = isChartInView();
        
        if (chartVisible && !chartInView) {
          startChartViewing();
        } else if (!chartVisible && chartInView) {
          stopChartViewing();
        }
        
        // Track ongoing engagement while chart is in view
        if (chartVisible) {
          trackChartEngagement();
        }
      }
      
      // Throttled scroll handler (max once per 100ms)
      let scrollTimeout;
      $(window).on('scroll', function() {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(handleScroll, 100);
      });
      
      // Also check on page load and resize
      $(document).ready(function() {
        handleScroll();
      });
      
      $(window).on('resize', function() {
        handleScroll();
      });
      
      // Track when user interacts with chart elements
      $(document).on('click hover focus', '.comparison-chart, .chart-container, .visualization, [data-chart], .results-chart', function() {
        if (chartInView) {
          window.DSFMatomoTracker.trackCustomEvent('DSF_Chart_Viewing', 'Chart_Interaction', 
            'User interacted with chart element', 1);
        }
      });
      
      // Track chart zoom/pan if supported
      $(document).on('wheel', '.comparison-chart, .chart-container, .visualization, [data-chart], .results-chart', function(e) {
        if (chartInView) {
          window.DSFMatomoTracker.trackCustomEvent('DSF_Chart_Viewing', 'Chart_Zoom_Pan', 
            'User zoomed/panned chart', 1);
        }
      });
      
      // Track when user scrolls away from chart after viewing
      $(window).on('beforeunload', function() {
        if (chartInView) {
          stopChartViewing();
        }
      });
    },

    /**
     * Setup automatic workflow stage detection
     */
    setupWorkflowDetection: function() {
      const self = this;
      
      // Detect when user starts answering questions
      $(document).on('change', '.facet input, .facet select', function() {
        if (self.session.currentStage === 'landing') {
          self.trackStageTransition('questions_started');
        }
        
        self.session.questionsAnswered++;
        
        // Check if questions phase is complete (heuristic: 3+ criteria selected)
        if (self.session.questionsAnswered >= 3 && self.session.currentStage === 'questions_started') {
          self.trackStageTransition('questions_completed');
        }
      });

      // Detect when results are being reviewed
      $(document).on('click', '.service-card', function() {
        const serviceId = $(this).data('service-id');
        if (serviceId && !self.session.servicesViewed.includes(serviceId)) {
          self.session.servicesViewed.push(serviceId);
          
          if (self.session.currentStage === 'questions_completed') {
            self.trackStageTransition('results_reviewed');
          }
        }
      });

      // Detect service selection phase
      $(document).on('change', '.cardcheckbox, .service-checkbox', function() {
        const serviceId = $(this).closest('.service-card').data('service-id');
        const isSelected = $(this).is(':checked');
        
        if (isSelected && serviceId) {
          if (!self.session.servicesSelected.includes(serviceId)) {
            self.session.servicesSelected.push(serviceId);
          }
          
          if (self.session.currentStage === 'results_reviewed') {
            self.trackStageTransition('selection_phase');
          }
        } else if (!isSelected && serviceId) {
          const index = self.session.servicesSelected.indexOf(serviceId);
          if (index > -1) {
            self.session.servicesSelected.splice(index, 1);
          }
        }
      });

      // Detect comparison phase
      $(document).on('change', '.compare-checkbox', function() {
        const serviceId = $(this).closest('.service-card').data('service-id');
        const isSelected = $(this).is(':checked');
        
        if (isSelected && serviceId) {
          if (!self.session.servicesCompared.includes(serviceId)) {
            self.session.servicesCompared.push(serviceId);
          }
          
          if (self.session.servicesCompared.length >= 2 && self.session.currentStage === 'selection_phase') {
            self.trackStageTransition('comparison_started');
          }
        }
      });

      // Detect deep investigation phase
      $(document).on('click', '.btn-details, .service-details-link', function() {
        const serviceId = $(this).closest('.service-card').data('service-id');
        if (serviceId && !self.session.servicesInvestigated.includes(serviceId)) {
          self.session.servicesInvestigated.push(serviceId);
          
          if (self.session.servicesInvestigated.length >= 1 && 
              ['comparison_started', 'selection_phase'].includes(self.session.currentStage)) {
            self.trackStageTransition('investigation_deep');
          }
        }
      });

      // Detect findings recording
      $(document).on('click', '.btn-print, .btn-export, .btn-bookmark, .btn-share', function() {
        const action = $(this).text().toLowerCase();
        self.session.findingsRecorded.push(action);
        
        if (self.session.currentStage === 'investigation_deep') {
          self.trackStageTransition('findings_recorded');
        }
      });

      // Track workflow completion (heuristic: external link clicked after investigation)
      $(document).on('click', '.service-link, .external-link', function() {
        if (self.session.currentStage === 'investigation_deep' || 
            self.session.currentStage === 'findings_recorded') {
          self.trackStageTransition('workflow_completed');
        }
      });

      // Track chart viewing behavior
      this.setupChartViewingTracking();

      // Track additional UI interactions that affect user workflow
      
      // Clear Filters button - indicates user is refining search
      $(document).on('click', '.btn-clear-filters', function() {
        window.DSFMatomoTracker.trackCustomEvent('DSF_Interface', 'Clear_Filters', 'User reset all filters', 1);
      });

      // Select All / Clear Selections buttons - batch operations
      $(document).on('click', '.btn-select-all, .selectall-button', function() {
        window.DSFMatomoTracker.trackCustomEvent('DSF_Interface', 'Select_All', 'Batch select all services', 1);
        // This might trigger selection phase
        if (self.session.currentStage === 'results_reviewed') {
          self.trackStageTransition('selection_phase');
        }
      });

      $(document).on('click', '.btn-select-none, .clear-button', function() {
        window.DSFMatomoTracker.trackCustomEvent('DSF_Interface', 'Clear_Selections', 'Batch clear selections', 1);
      });

      // Compare Results button - explicit comparison trigger
      $(document).on('click', '.jump_button, .btn-compare', function() {
        const selectedCount = $('.cardcheckbox:checked, .service-checkbox:checked').length;
        window.DSFMatomoTracker.trackCustomEvent('DSF_Interface', 'Compare_Button_Clicked', `${selectedCount} services selected`, selectedCount);
        
        if (selectedCount >= 2 && self.session.currentStage === 'selection_phase') {
          self.trackStageTransition('comparison_started');
        }
      });

      // Feedback link - user seeking help
      $(document).on('click', 'a[href*="feedback"]', function() {
        window.DSFMatomoTracker.trackCustomEvent('DSF_Help', 'Feedback_Link', 'User clicked feedback link', 1);
      });

      // Navigation and header links
      $(document).on('click', '.navbar-brand', function() {
        window.DSFMatomoTracker.trackCustomEvent('DSF_Navigation', 'Home_Logo_Click', 'Return to library homepage', 1);
      });

      // Admin/analytics links (for staff usage tracking)
      $(document).on('click', 'a[href*="dsf-analytics"]', function() {
        window.DSFMatomoTracker.trackCustomEvent('DSF_Admin', 'Analytics_Dashboard', 'Staff accessed analytics', 1);
      });

      $(document).on('click', 'a[href*="dsf-analytics-settings"]', function() {
        window.DSFMatomoTracker.trackCustomEvent('DSF_Admin', 'Analytics_Settings', 'Staff accessed settings', 1);
      });

      // Track keyboard navigation (accessibility)
      $(document).on('keydown', function(e) {
        if (e.key === 'Tab') {
          // Track heavy keyboard navigation (accessibility usage)
          if (!self.keyboardNavCount) self.keyboardNavCount = 0;
          self.keyboardNavCount++;
          
          // Report after significant keyboard usage
          if (self.keyboardNavCount === 20) {
            window.DSFMatomoTracker.trackAccessibilityUsage('Keyboard_Navigation', 'Heavy_Tab_Usage');
          }
        }
      });

      // Track mobile/touch interactions
      $(document).on('touchstart', '.service-card, .facet, button', function() {
        if (!self.touchInteractionTracked) {
          window.DSFMatomoTracker.trackCustomEvent('DSF_Device', 'Touch_Interaction', 'Mobile/tablet usage detected', 1);
          self.touchInteractionTracked = true;
        }
      });

      // Track rapid filter changes (potential frustration)
      let filterChangeCount = 0;
      let filterChangeTimer = null;
      
      $(document).on('change', '.facet input, .facet select', function() {
        filterChangeCount++;
        
        // Reset timer
        if (filterChangeTimer) clearTimeout(filterChangeTimer);
        
        filterChangeTimer = setTimeout(function() {
          if (filterChangeCount >= 5) {
            window.DSFMatomoTracker.trackUserFrustration('Rapid_Filter_Changes', `${filterChangeCount} changes in 30 seconds`);
          }
          filterChangeCount = 0;
        }, 30000); // 30 second window
      });

      // Track back button usage (potential navigation issues)
      $(window).on('popstate', function() {
        window.DSFMatomoTracker.trackUserFrustration('Back_Button_Usage', 'User used browser back button');
      });

      // Track long page dwell time without interaction (potential confusion)
      let dwellTimer = null;
      let hasInteracted = false;
      
      $(document).on('click change scroll', function() {
        hasInteracted = true;
        if (dwellTimer) clearTimeout(dwellTimer);
        
        // Reset dwell tracking after interaction
        dwellTimer = setTimeout(function() {
          if (!hasInteracted) {
            window.DSFMatomoTracker.trackUserFrustration('Long_Dwell_No_Interaction', 'User inactive for 3+ minutes');
          }
          hasInteracted = false;
        }, 180000); // 3 minutes
      });

      // Track JavaScript errors that might affect user experience
      window.addEventListener('error', function(e) {
        window.DSFMatomoTracker.trackPerformanceIssue('JavaScript_Error', {
          message: e.message,
          filename: e.filename,
          line: e.lineno,
          value: 1
        });
      });

      // Track slow performance (if Performance API available)
      if (window.performance && window.performance.timing) {
        $(window).on('load', function() {
          const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
          
          if (loadTime > 5000) { // Slow load (5+ seconds)
            window.DSFMatomoTracker.trackPerformanceIssue('Slow_Page_Load', {
              loadTime: loadTime,
              value: Math.round(loadTime / 1000)
            });
          }
        });
      }
    },

    /**
     * Manual workflow stage setting (for explicit stage transitions)
     */
    setStage: function(stage) {
      this.trackStageTransition(stage);
    },

    /**
     * Get current workflow summary
     */
    getWorkflowSummary: function() {
      return {
        duration: Math.round((Date.now() - this.session.startTime) / 1000),
        currentStage: this.session.currentStage,
        questionsAnswered: this.session.questionsAnswered,
        servicesViewed: this.session.servicesViewed.length,
        servicesSelected: this.session.servicesSelected.length,
        servicesCompared: this.session.servicesCompared.length,
        servicesInvestigated: this.session.servicesInvestigated.length,
        findingsRecorded: this.session.findingsRecorded.length,
        stageTransitions: this.session.stageTransitions
      };
    }
  };

  /**
   * Enhanced URL tracking for SPA navigation
   * Extends existing browser history management
   */
  Drupal.behaviors.dsfMatomoSpaTracking = {
    attach: function (context, settings) {
      if (!MATOMO_CONFIG.enabled) return;

      // Track virtual page views when URL changes (SPA behavior)
      const originalUpdateBrowserUrl = window.updateBrowserUrl;
      if (typeof originalUpdateBrowserUrl === 'function') {
        window.updateBrowserUrl = function(params) {
          // Call original function
          const result = originalUpdateBrowserUrl.apply(this, arguments);
          
          // Track as virtual page view
          const currentUrl = window.location.pathname + window.location.search;
          _paq.push(['setCustomUrl', currentUrl]);
          _paq.push(['trackPageView']);
          
          console.log(`Tracked SPA navigation: ${currentUrl}`);
          return result;
        };
      }
    }
  };

  /**
   * Utility functions for external tracking calls
   */
  window.DSFTracking = {
    /**
     * Track goal conversion (e.g., when user finds relevant service)
     */
    trackGoal: function(goalId, customRevenue) {
      if (!MATOMO_CONFIG.enabled) return;
      _paq.push(['trackGoal', goalId, customRevenue]);
    },

    /**
     * Track custom dimension
     */
    setCustomDimension: function(index, value) {
      if (!MATOMO_CONFIG.enabled) return;
      _paq.push(['setCustomDimension', index, value]);
    },

    /**
     * Get current tracked data for debugging
     */
    getTrackingData: function() {
      return {
        enabled: MATOMO_CONFIG.enabled,
        siteId: MATOMO_CONFIG.siteId,
        url: MATOMO_CONFIG.url,
        paqQueue: _paq
      };
    }
  };

})(jQuery, Drupal, once);
