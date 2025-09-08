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
      _paq.push(['setCustomDimension', 6, stage]);

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
