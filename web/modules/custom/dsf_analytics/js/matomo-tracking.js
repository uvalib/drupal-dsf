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

  // Get Matomo configuration from DSF Analytics module settings
  const MATOMO_CONFIG = {
    url: drupalSettings.dsfAnalytics?.matomo?.url || 
         drupalSettings.matomo?.url_https || 
         drupalSettings.matomo?.url_http || 
         'https://vah-analytics.lib.virginia.edu/',
    siteId: drupalSettings.dsfAnalytics?.matomo?.siteId || 
            drupalSettings.matomo?.site_id || 
            1,
    enabled: drupalSettings.dsfAnalytics?.matomo?.enabled || 
             (drupalSettings.matomo ? true : false),
    trackingMode: drupalSettings.dsfAnalytics?.matomo?.trackingMode || 'PROD',
    debug: drupalSettings.dsfAnalytics?.matomo?.trackingMode === 'DEBUG' || false
  };

  // Initialize _paq if not already done by Matomo module
  window._paq = window._paq || [];

  /**
   * Check if Matomo is already initialized by the Drupal module
   */
  function isMatomoAlreadyInitialized() {
    // Check for existing Matomo script
    if (document.querySelector('script[src*="matomo.js"]')) {
      return true;
    }
    
    // Check if _paq already has tracking calls
    if (window._paq && window._paq.length > 0) {
      // Look for common Matomo initialization calls
      for (let i = 0; i < window._paq.length; i++) {
        if (Array.isArray(window._paq[i]) && 
            (window._paq[i][0] === 'setTrackerUrl' || window._paq[i][0] === 'setSiteId')) {
          return true;
        }
      }
    }
    
    // Check for Matomo global variables
    if (window.Piwik || window.Matomo) {
      return true;
    }
    
    return false;
  }

  /**
   * DSF Matomo Tracking Module
   */
  Drupal.behaviors.dsfMatomoTracking = {
    attach: function (context, settings) {
      if (!MATOMO_CONFIG.enabled) {
        if (MATOMO_CONFIG.debug) {
          console.log('DSF Matomo tracking disabled (no drupalSettings.matomo found)');
        }
        return;
      }

      // Check if we should initialize or extend existing Matomo
      if (isMatomoAlreadyInitialized()) {
        if (MATOMO_CONFIG.debug) {
          console.log('DSF extending existing Matomo tracking (Drupal module detected)');
        }
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
    },

    /**
     * Initialize Matomo tracking code (only if not already initialized)
     */
    initializeMatomo: function () {
      // Double-check we're not duplicating existing initialization
      if (isMatomoAlreadyInitialized()) {
        if (MATOMO_CONFIG.debug) {
          console.log('DSF skipping Matomo initialization (already active)');
        }
        return;
      }

      // Initialize basic tracking
      _paq.push(['trackPageView']);
      _paq.push(['enableLinkTracking']);
      
      // Load Matomo script only if not already loaded
      if (!document.querySelector('script[src*="matomo.js"]')) {
        (function() {
          var u = MATOMO_CONFIG.url;
          _paq.push(['setTrackerUrl', u + 'matomo.php']);
          _paq.push(['setSiteId', MATOMO_CONFIG.siteId]);
          var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];
          g.type = 'text/javascript'; g.async = true; g.defer = true; g.src = u + 'matomo.js';
          s.parentNode.insertBefore(g, s);
        })();
      } else {
        // Script already loaded, just set tracker settings
        _paq.push(['setTrackerUrl', MATOMO_CONFIG.url + 'matomo.php']);
        _paq.push(['setSiteId', MATOMO_CONFIG.siteId]);
      }

      if (MATOMO_CONFIG.debug) {
        console.log('DSF Matomo tracking initialized with site ID:', MATOMO_CONFIG.siteId);
      }
    },

    /**
     * Attach tracking listeners to existing events
     */
    attachTrackingListeners: function (context) {
      const self = this;

      // Track facet selections (criteria popularity)
      const facetElements = once('matomo-facet-tracking', '.facet', context);
      facetElements.forEach(function(element) {
        $(element).on('change', function() {
          const facetElement = $(this);
          const facetType = facetElement.attr('name') || facetElement.closest('.facet-group').data('facet-type') || 'unknown';
          const facetValue = facetElement.val() || facetElement.text().trim();
          const isChecked = facetElement.is(':checked') || facetElement.is(':selected');

          self.trackFacetSelection(facetType, facetValue, isChecked);
        });
      });

      // Track service card interactions (what services people look at)
      const serviceElements = once('matomo-service-tracking', '.service-card, .cardcheckbox', context);
      serviceElements.forEach(function(element) {
        $(element).on('click change', function(e) {
          const serviceElement = $(this);
          const serviceCard = serviceElement.closest('.service-card');
          const serviceId = serviceCard.data('service-id') || serviceCard.find('[data-service-id]').data('service-id');
          const serviceName = serviceCard.find('.service-title, .card-title').text().trim();
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
    },

    /**
     * Safely push tracking events to Matomo
     */
    safeTrack: function(trackingData, description) {
      if (!window._paq) {
        if (MATOMO_CONFIG.debug) {
          console.warn('DSF Matomo: _paq not available for', description);
        }
        return false;
      }

      try {
        _paq.push(trackingData);
        if (MATOMO_CONFIG.debug) {
          console.log('DSF Matomo tracked:', description, trackingData);
        }
        return true;
      } catch (error) {
        console.error('DSF Matomo tracking error:', error, trackingData);
        return false;
      }
    },

    /**
     * Track facet selection events
     */
    trackFacetSelection: function (facetType, facetValue, isSelected) {
      if (!MATOMO_CONFIG.enabled) return;

      const action = isSelected ? 'Selected' : 'Deselected';
      const eventData = [
        'trackEvent',
        'DSF_Facets',
        `${action}_${facetType}`,
        facetValue,
        isSelected ? 1 : 0
      ];

      if (this.safeTrack(eventData, 'facet selection')) {
        // Set custom dimensions for detailed analysis (if supported)
        this.safeTrack(['setCustomDimension', 1, facetType], 'facet type dimension');
        this.safeTrack(['setCustomDimension', 2, facetValue], 'facet value dimension');
      }
    },

    /**
     * Track service interaction events
     */
    trackServiceInteraction: function (serviceId, serviceName, actionType) {
      if (!MATOMO_CONFIG.enabled) return;

      const eventData = [
        'trackEvent',
        'DSF_Services',
        `Service_${actionType}`,
        `${serviceName} (${serviceId})`,
        1
      ];

      if (this.safeTrack(eventData, 'service interaction')) {
        // Set custom dimensions for service analysis
        this.safeTrack(['setCustomDimension', 3, serviceId], 'service ID dimension');
        this.safeTrack(['setCustomDimension', 4, serviceName], 'service name dimension');
      }
    },

    /**
     * Track detailed service investigation events
     */
    trackServiceInvestigation: function (serviceId, serviceName, investigationType) {
      _paq.push([
        'trackEvent',
        'DSF_Service_Investigation',
        investigationType,
        `${serviceName} (ID: ${serviceId})`,
        1
      ]);

      // Track investigation depth
      _paq.push(['setCustomDimension', 5, investigationType]);

      console.log(`Tracked service investigation: ${investigationType} on ${serviceName} (${serviceId})`);
    },

    /**
     * Track search and filter events
     */
    trackSearchEvent: function (eventType, data) {
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

      console.log(`Tracked search event: ${eventType} with ${resultCount} results`);
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
