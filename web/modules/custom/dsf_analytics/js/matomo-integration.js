/**
 * @file
 * Integration layer for DSF Matomo tracking - hooks into existing events without modifying core files
 * 
 * This file extends the existing DSF application with minimal code disturbance
 * by listening for jQuery events and DOM changes to trigger tracking.
 */

(function ($, Drupal, once) {
  'use strict';

  /**
   * Integration layer for existing DSF events
   */
  Drupal.behaviors.dsfMatomoIntegration = {
    attach: function (context, settings) {
      // Check if tracking is available (either via Matomo module or our config)
      const trackingAvailable = this.isTrackingAvailable();
      
      if (!trackingAvailable) {
        if (typeof console !== 'undefined' && console.log) {
          console.log('DSF Matomo integration: No tracking available, skipping event bindings');
        }
        return;
      }

      // Check if our tracking module is available
      if (!Drupal.behaviors.dsfMatomoTracking) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('DSF Matomo integration: dsfMatomoTracking behavior not found');
        }
        return;
      }

      // Set up event listeners with conflict avoidance
      this.attachEventListeners(context);
    },

    /**
     * Check if tracking is available and configured
     */
    isTrackingAvailable: function() {
      return (
        // Check DSF Analytics module configuration first
        (typeof drupalSettings !== 'undefined' && 
         drupalSettings.dsfAnalytics && 
         drupalSettings.dsfAnalytics.matomo && 
         drupalSettings.dsfAnalytics.matomo.enabled) ||
        // Fallback to standard Matomo module
        (typeof drupalSettings !== 'undefined' && 
         drupalSettings.matomo && 
         drupalSettings.matomo.site_id) ||
        // Check for manual configurations
        typeof _paq !== 'undefined' || 
        (typeof window.MATOMO_CONFIG !== 'undefined' && window.MATOMO_CONFIG.enabled)
      );
    },

    /**
     * Attach event listeners with namespace to avoid conflicts
     */
    attachEventListeners: function(context) {

      // Hook into existing facet change events using event delegation with namespace
      $(document).off('change.dsfMatomo').on('change.dsfMatomo', '.facet input[type="checkbox"], .facet input[type="radio"], .facet select', function() {
        try {
          const $facet = $(this);
          const facetType = $facet.attr('name') || $facet.closest('.facet').data('facet-type') || 'unknown';
          const facetValue = $facet.val() || $facet.text().trim();
          const isSelected = $facet.is(':checked') || $facet.is(':selected');
          
          // Call the tracking function from matomo-tracking.js
          if (Drupal.behaviors.dsfMatomoTracking && 
              typeof Drupal.behaviors.dsfMatomoTracking.trackFacetSelection === 'function') {
            Drupal.behaviors.dsfMatomoTracking.trackFacetSelection(facetType, facetValue, isSelected);
          }
        } catch (error) {
          console.error('DSF Matomo facet tracking error:', error);
        }
      });

      // Hook into service card selection events with namespace
      $(document).off('change.dsfMatomo').on('change.dsfMatomo', '.cardcheckbox', function() {
        try {
          const $checkbox = $(this);
          const $servicePanel = $checkbox.closest('.service-panel, .service-card');
          const serviceId = $servicePanel.attr('service') || 
                           $servicePanel.data('service-id') || 
                           $servicePanel.find('[data-service-id]').data('service-id') ||
                           'unknown';
          const serviceName = $servicePanel.find('.card-title, .service-title').text().trim() || 'Unknown Service';
          
          if (Drupal.behaviors.dsfMatomoTracking && 
              typeof Drupal.behaviors.dsfMatomoTracking.trackServiceInteraction === 'function') {
            Drupal.behaviors.dsfMatomoTracking.trackServiceInteraction(serviceId, serviceName, 'selection');
          }
        } catch (error) {
          console.error('DSF Matomo service selection tracking error:', error);
        }
      });

      // Hook into comparison checkbox events (manual checkboxes) with namespace
      $(document).off('change.dsfMatomo').on('change.dsfMatomo', '.manualcheckbox', function() {
        try {
          const $checkbox = $(this);
          const serviceId = $checkbox.attr('service') || 'unknown';
          const serviceName = $checkbox.closest('label').text().trim() || 'Unknown Service';
          const isSelected = $checkbox.is(':checked');
          
          if (Drupal.behaviors.dsfMatomoTracking &&
              typeof Drupal.behaviors.dsfMatomoTracking.trackServiceInvestigation === 'function') {
            Drupal.behaviors.dsfMatomoTracking.trackServiceInvestigation(
              serviceId, 
              serviceName, 
              isSelected ? 'added_to_comparison' : 'removed_from_comparison'
            );
          }
        } catch (error) {
          console.error('DSF Matomo manual checkbox tracking error:', error);
        }
      });

      // Hook into external service link clicks with namespace
      $(document).off('click.dsfMatomo').on('click.dsfMatomo', '.service-link, a[href*="http"]', function() {
        try {
          const $link = $(this);
          const $servicePanel = $link.closest('.service-panel, .service-card');
          
          if ($servicePanel.length) {
            const serviceId = $servicePanel.attr('service') || 
                             $servicePanel.data('service-id') || 
                             'unknown';
            const serviceName = $link.text().trim() || 
                               $servicePanel.find('.card-title, .service-title').text().trim() ||
                               'Unknown Service';
            
            if (Drupal.behaviors.dsfMatomoTracking &&
                typeof Drupal.behaviors.dsfMatomoTracking.trackServiceInvestigation === 'function') {
              Drupal.behaviors.dsfMatomoTracking.trackServiceInvestigation(serviceId, serviceName, 'external_link_click');
            }
          }
        } catch (error) {
          console.error('DSF Matomo external link tracking error:', error);
        }
      });

      // Hook into clear filters and select all events with namespace
      $(document).off('click.dsfMatomo').on('click.dsfMatomo', '.btn-clear-filters, .clear-button', function() {
        try {
          if (Drupal.behaviors.dsfMatomoTracking &&
              typeof Drupal.behaviors.dsfMatomoTracking.trackCustomEvent === 'function') {
            Drupal.behaviors.dsfMatomoTracking.trackCustomEvent('DSF_Actions', 'clear_filters', 'filters_cleared', 1);
          }
        } catch (error) {
          console.error('DSF Matomo clear filters tracking error:', error);
        }
      });

      $(document).off('click.dsfMatomo').on('click.dsfMatomo', '.btn-select-all, .selectall-button', function() {
        try {
          if (Drupal.behaviors.dsfMatomoTracking &&
              typeof Drupal.behaviors.dsfMatomoTracking.trackCustomEvent === 'function') {
            Drupal.behaviors.dsfMatomoTracking.trackCustomEvent('DSF_Actions', 'select_all', 'all_services_selected', 1);
          }
        } catch (error) {
          console.error('DSF Matomo select all tracking error:', error);
        }
      });

      // Track when comparison chart becomes visible (indicates deep engagement) with error handling
      let observer;
      try {
        observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            try {
              if (mutation.target.id === 'container34' && $(mutation.target).is(':visible')) {
                if (Drupal.behaviors.dsfMatomoTracking &&
                    typeof Drupal.behaviors.dsfMatomoTracking.trackCustomEvent === 'function') {
                  Drupal.behaviors.dsfMatomoTracking.trackCustomEvent('DSF_Engagement', 'comparison_chart_viewed', 'deep_engagement', 1);
                }
              }
            } catch (error) {
              console.error('DSF Matomo mutation observer tracking error:', error);
            }
          });
        });

        // Start observing the comparison container with error handling
        const comparisonContainer = document.getElementById('container34');
        if (comparisonContainer && observer) {
          observer.observe(comparisonContainer, { 
            attributes: true, 
            attributeFilter: ['style', 'class'] 
          });
        }
      } catch (error) {
        console.error('DSF Matomo observer initialization error:', error);
      }
    }
  };

  /**
   * Helper function to count active filters for search tracking
   * Uses defensive programming to handle various filter structures
   */
  function getActiveFiltersCount() {
    try {
      return $('.facet input:checked, .facet select option:selected').filter(function() {
        const value = $(this).val();
        return value !== '' && value !== null && value !== undefined;
      }).length;
    } catch (error) {
      console.error('DSF Matomo getActiveFiltersCount error:', error);
      return 0;
    }
  }

  /**
   * Enhanced tracking for evaluate_services function calls
   * Uses a proxy pattern to wrap the existing function without modifying it
   */
  Drupal.behaviors.dsfMatomoServiceEvaluation = {
    attach: function (context, settings) {
      try {
        // Check if Matomo tracking is already initialized to avoid conflicts
        if (this.isMatomoAlreadyInitialized && this.isMatomoAlreadyInitialized()) {
          console.log('DSF Matomo: Service evaluation tracking deferred due to existing Matomo initialization');
          return;
        }

        // Check if tracking is available using DSF Analytics module settings
        const trackingAvailable = (
          // Check DSF Analytics module configuration first
          (typeof drupalSettings !== 'undefined' && 
           drupalSettings.dsfAnalytics && 
           drupalSettings.dsfAnalytics.matomo && 
           drupalSettings.dsfAnalytics.matomo.enabled) ||
          // Fallback to standard Matomo module or manual setup
          typeof _paq !== 'undefined' || 
          (typeof MATOMO_CONFIG !== 'undefined' && MATOMO_CONFIG.enabled) ||
          (drupalSettings && drupalSettings.matomo && drupalSettings.matomo.site_id)
        );
        
        if (!trackingAvailable) return;

        // Only attach once with namespace
        if (window.dsfEvaluateServicesTracked) return;
        window.dsfEvaluateServicesTracked = true;

        // If evaluate_services exists, wrap it with tracking
        if (typeof window.evaluate_services === 'function') {
          const originalEvaluateServices = window.evaluate_services;
          
          window.evaluate_services = function() {
            try {
              // Call original function
              const result = originalEvaluateServices.apply(this, arguments);
              
              // Add tracking after service evaluation with error handling
              setTimeout(function() {
                try {
                  const visibleServices = $('.service-panel:visible, .service-card:visible').length;
                  const selectedServices = $('.cardcheckbox:checked').length;
                  const activeFilters = getActiveFiltersCount();
                  
                  if (Drupal.behaviors.dsfMatomoTracking &&
                      typeof Drupal.behaviors.dsfMatomoTracking.trackSearchEvent === 'function') {
                    Drupal.behaviors.dsfMatomoTracking.trackSearchEvent('dsf:filtersApplied', {
                      activeFilters: activeFilters,
                      resultCount: visibleServices,
                      selectedServices: selectedServices
                    });
                  }
                } catch (trackingError) {
                  console.error('DSF Matomo service evaluation tracking error:', trackingError);
                }
              }, 100);
              
              return result;
            } catch (error) {
              console.error('DSF Matomo evaluate_services wrapper error:', error);
              // Fall back to original function if wrapper fails
              return originalEvaluateServices.apply(this, arguments);
            }
          };
        }
      } catch (error) {
        console.error('DSF Matomo service evaluation behavior initialization error:', error);
      }
    }
  };

})(jQuery, Drupal, once);
