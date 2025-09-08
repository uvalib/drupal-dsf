/**
 * @file
 * DSF Analytics Dashboard - displays human-readable Matomo data
 * 
 * This module provides a simple interface to view key DSF usage statistics
 * directly from Matomo data in an admin dashboard.
 * 
 * PERFORMANCE & INITIALIZATION IMPROVEMENTS:
 * - Global initialization flags prevent duplicate script execution
 * - Comprehensive event handler cleanup with namespaced events
 * - Robust error handling with inline development error display
 * - API timeout and failure handling to prevent infinite loops
 * - Loading state management for tables and KPI metrics
 * - Global reset function for development debugging
 * - Script deduplication protection against DrupalDialogEvent conflicts
 */

// Prevent script conflicts and duplicate declarations
(function() {
  'use strict';
  
  // Check if our analytics is already loaded to prevent conflicts
  if (window.dsfAnalyticsScriptLoaded) {
    console.warn('DSF Analytics script already loaded, skipping duplicate execution');
    return;
  }
  
  // Mark script as loaded to prevent conflicts
  window.dsfAnalyticsScriptLoaded = true;
  
  // Protect against DrupalDialogEvent conflicts
  if (typeof window.DrupalDialogEvent !== 'undefined') {
    console.warn('DrupalDialogEvent already defined, using existing definition');
  }
})();

// Debug: Confirm JavaScript is loading
console.log('DSF Analytics Dashboard JavaScript loaded');
console.log('jQuery available:', typeof jQuery !== 'undefined');
console.log('Drupal available:', typeof Drupal !== 'undefined');

// Create global DSFAnalytics object for template button handlers
// This needs to be available immediately, outside the jQuery wrapper
window.DSFAnalytics = {
  scheduleReport: function() {
    console.log('Schedule report functionality called');
    alert('Schedule Reports feature coming soon!');
  },
  
  shareReport: function() {
    console.log('Share report functionality called');
    alert('Share Dashboard feature coming soon!');
  },
  
  refreshDashboard: function() {
    console.log('Refreshing dashboard data');
    // Use jQuery to trigger Drupal behavior re-initialization
    if (typeof Drupal !== 'undefined' && Drupal.behaviors && Drupal.behaviors.dsfAnalyticsDashboard) {
      Drupal.behaviors.dsfAnalyticsDashboard.attach(document, drupalSettings);
    }
    
    if (typeof jQuery !== 'undefined') {
      jQuery('#last-refresh-time').text(new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }));
    }
    
    // Show feedback to user
    const button = event && event.target ? event.target : null;
    if (button) {
      const originalText = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Refreshing...';
      button.disabled = true;
      
      setTimeout(function() {
        button.innerHTML = originalText;
        button.disabled = false;
        if (typeof announceToScreenReader === 'function') {
          announceToScreenReader('Dashboard data refreshed successfully');
        }
      }, 1500);
    }
  },
  
  toggleAutoRefresh: function() {
    if (typeof jQuery === 'undefined') {
      console.error('jQuery not available for toggleAutoRefresh');
      
      // Display inline error in UI for development
      const errorObj = new Error('jQuery not available for toggleAutoRefresh');
      errorObj.stack = 'Function: DSFAnalytics.toggleAutoRefresh()\nContext: jQuery dependency missing\nRequired for: Auto-refresh functionality';
      // Note: Can't use displayInlineError since jQuery isn't available, but include error context
      if (typeof displayInlineError === 'function') {
        displayInlineError('auto-refresh-container', errorObj, 'Auto-Refresh Dependency Error');
      }
      
      return;
    }
    
    const button = jQuery('#auto-refresh-toggle');
    const isEnabled = button.text().includes('Enable');
    
    if (isEnabled) {
      // Enable auto-refresh
      button.html('<i class="fas fa-pause mr-1"></i>Disable Auto-Refresh');
      window.dsfAutoRefreshInterval = setInterval(function() {
        window.DSFAnalytics.refreshDashboard();
      }, 300000); // Refresh every 5 minutes
      if (typeof announceToScreenReader === 'function') {
        announceToScreenReader('Auto-refresh enabled - data will update every 5 minutes');
      }
    } else {
      // Disable auto-refresh
      button.html('<i class="fas fa-play mr-1"></i>Enable Auto-Refresh');
      if (window.dsfAutoRefreshInterval) {
        clearInterval(window.dsfAutoRefreshInterval);
        window.dsfAutoRefreshInterval = null;
      }
      if (typeof announceToScreenReader === 'function') {
        announceToScreenReader('Auto-refresh disabled');
      }
    }
  }
};

console.log('DSFAnalytics object created:', window.DSFAnalytics);

// Global cleanup function to reset all initialization flags
window.resetDSFAnalytics = function() {
  console.log('Resetting DSF Analytics global state...');
  window.dsfAnalyticsInitialized = false;
  window.dsfTablesInitialized = false;
  window.dsfTablesLoading = false;
  window.dsfKPILoading = false;
  
  // Clear any intervals
  if (window.dsfAutoRefreshInterval) {
    clearInterval(window.dsfAutoRefreshInterval);
    window.dsfAutoRefreshInterval = null;
  }
  
  // Remove all DSF event handlers
  if (typeof jQuery !== 'undefined') {
    jQuery(document).off('.dsfAnalytics');
    jQuery(document).off('.dsfTables');
  }
  
  // Reset KPI error tracking
  window.kpiErrors = {};
  
  // Remove initialization markers from DOM
  if (typeof jQuery !== 'undefined') {
    jQuery('.dsf-analytics-dashboard').removeClass('dsf-initialized');
  }
  
  console.log('DSF Analytics global state reset completed');
};

// Global function to check KPI status
window.checkKPIStatus = function() {
  console.log('Checking KPI status...');
  if (typeof jQuery !== 'undefined') {
    jQuery(document).ready(function() {
      console.log('Current KPI errors:', window.kpiErrors);
      // Try to call the update function if available
      if (typeof window.updateKPISummaryIndicator === 'function') {
        window.updateKPISummaryIndicator();
      } else {
        console.log('updateKPISummaryIndicator function not available in global scope');
      }
    });
  }
};

// Global function to simulate KPI errors for testing
window.simulateKPIErrors = function() {
  console.log('Simulating KPI errors for testing...');
  window.kpiErrors['unique-users'] = true;
  window.kpiErrors['total-sessions'] = true;
  window.kpiErrors['services-investigated'] = false;
  window.kpiErrors['service-selections'] = false;
  
  console.log('Set KPI errors to:', window.kpiErrors);
  
  if (typeof window.updateKPISummaryIndicator === 'function') {
    window.updateKPISummaryIndicator();
    console.log('Error indicators should now be visible');
  } else {
    console.log('updateKPISummaryIndicator function not available');
  }
};

// Force add error indicator for testing - bypasses all checks
window.forceErrorIndicator = function() {
  console.log('Forcing error indicator display per section...');
  
  const kpiSummary = jQuery('.kpi-summary');
  console.log('Found .kpi-summary elements for force test:', kpiSummary.length);
  
  // Remove existing indicators
  jQuery('.kpi-error-indicator').remove();
  
  // Add to each .kpi-summary element with different counts
  kpiSummary.each(function(index) {
    const errorCount = index + 1; // Different count per section for testing
    const errorIndicator = `<span class="kpi-error-indicator ml-2" style="color: #dc3545; font-weight: bold; font-size: 0.9em;" title="Test error indicator for section ${index + 1}">⚠ ${errorCount} test error${errorCount > 1 ? 's' : ''}</span>`;
    jQuery(this).append(errorIndicator);
    console.log(`Added test error indicator to .kpi-summary section ${index + 1}: ${errorCount} errors`);
  });
  
  console.log('Force test complete - each section should show different error counts');
};

// Debug function to check current error state and trigger manual updates
window.debugErrorState = function() {
  console.log('=== DEBUG ERROR STATE ===');
  console.log('KPI Errors:', window.kpiErrors);
  console.log('Table Errors:', window.tableErrors);
  console.log('Found .kpi-summary elements:', jQuery('.kpi-summary').length);
  
  // Show which tables have errors
  jQuery('.kpi-summary').each(function(index) {
    const $section = jQuery(this);
    const sectionId = $section.attr('id') || `section-${index}`;
    const hasKPIElements = $section.find('#kpi-unique-users, #kpi-total-sessions, #kpi-services-investigated, #kpi-service-selections').length > 0;
    const tableElements = $section.find('[id^="table-"]');
    
    console.log(`Section ${index} (${sectionId}):`);
    console.log('  - Has KPI elements:', hasKPIElements);
    console.log('  - Table elements:', tableElements.map(function() { return this.id; }).get());
    console.log('  - Current error indicator:', $section.find('.kpi-error-indicator').length > 0);
  });
  
  // Manually trigger update
  if (typeof window.updateKPISummaryIndicator === 'function') {
    console.log('Manually triggering error indicator update...');
    window.updateKPISummaryIndicator();
  }
  
  console.log('=== END DEBUG ===');
};

// Global function to simulate KPI errors for testing
window.simulateKPIErrors = function() {
  console.log('Simulating KPI errors for testing...');
  window.kpiErrors['unique-users'] = true;
  window.kpiErrors['total-sessions'] = true;
  if (typeof window.updateKPISummaryIndicator === 'function') {
    window.updateKPISummaryIndicator();
    console.log('Error indicators should now be visible');
  } else {
    console.log('updateKPISummaryIndicator function not available');
  }
};

// Global KPI error tracking - must be accessible across functions
window.kpiErrors = {};
window.tableErrors = {};

(function ($, Drupal) {
  'use strict';

  console.log('DSF Analytics Dashboard: Inside IIFE');

  /**
   * Admin dashboard for DSF analytics
   */
  Drupal.behaviors.dsfAnalyticsDashboard = {
    attach: function (context, settings) {
      // Use a more specific and unique marker to prevent duplicate initializations
      const dashboard = $(context).find('.dsf-analytics-dashboard');
      
      // Only proceed if we find the dashboard and it's not already initialized
      if (dashboard.length === 0) {
        console.log('DSF Analytics dashboard not found in context, skipping...');
        return;
      }
      
      if (dashboard.hasClass('dsf-initialized') || window.dsfAnalyticsInitialized) {
        console.log('DSF Analytics already initialized globally, skipping...');
        return;
      }
      
      // Set global flag to prevent any other instances
      window.dsfAnalyticsInitialized = true;
      
      if (typeof $ !== 'undefined') {
        $(document).ready(function() {
          try {
            // Mark as initialized to prevent duplicate runs
            dashboard.addClass('dsf-initialized');
            console.log('Starting DSF Analytics initialization...');
            initializeDashboard();
            console.log('DSF Analytics initialization completed successfully');
          } catch (error) {
            console.error('Error during DSF Analytics initialization:', error);
            // Display inline error for development
            if (typeof displayInlineError === 'function') {
              displayInlineError('dsf-analytics-dashboard', error, 'Dashboard Initialization');
            }
          }
        });
      }
    },
    
    detach: function (context, settings, trigger) {
      console.log('DSF Analytics detach called, cleaning up...');
      
      // Reset global initialization flag
      window.dsfAnalyticsInitialized = false;
      
      // Clean up when the behavior is detached
      $('.dsf-analytics-dashboard').removeClass('dsf-initialized');
      
      // Remove any event handlers with comprehensive cleanup
      $(document).off('.dsfAnalytics');
      $(document).off('.dsfTables');
      
      // Reset loading flags
      window.dsfTablesLoading = false;
      window.dsfKPILoading = false;
      
      // Clear any intervals
      if (window.dsfAutoRefreshInterval) {
        clearInterval(window.dsfAutoRefreshInterval);
        window.dsfAutoRefreshInterval = null;
      }
    }
  };

  let currentTimeRange = 'last7days';
  let dataMode = 'mock'; // Default to mock, will be updated from drupalSettings
  let dashboardInitialized = false; // Flag to prevent multiple initializations
  
  function initializeDashboard() {
    // Prevent multiple initializations with improved checking
    if (dashboardInitialized || window.dsfAnalyticsInitialized === 'complete') {
      console.log('Dashboard already fully initialized, skipping...');
      return;
    }
    
    console.log('Initializing DSF Analytics Dashboard');
    dashboardInitialized = true;
    window.dsfAnalyticsInitialized = 'initializing';
    
    try {
      // Check API availability before making any calls
      checkAPIAvailability().then(function(apiAvailable) {
        if (!apiAvailable && dataMode === 'real') {
          console.warn('API endpoints not available, falling back to mock mode');
          dataMode = 'mock';
          
          // Mark all KPIs as having errors due to API unavailability
          window.kpiErrors['unique-users'] = true;
          window.kpiErrors['total-sessions'] = true;
          window.kpiErrors['services-investigated'] = true;
          window.kpiErrors['service-selections'] = true;
          updateKPISummaryIndicator();
          
          // Display warning to user
          const errorObj = new Error('API endpoints not available - using mock data for development');
          errorObj.stack = 'API Check: /admin/reports/dsf-analytics/api/matomo\nFallback: Mock data mode activated\nSuggestion: Check Matomo configuration and API routing';
          displayInlineError('kpi-unique-users', errorObj, 'API Availability Check');
        }
        
        // Get data mode from Drupal settings - force to mock for development
        if (typeof drupalSettings !== 'undefined' && 
            drupalSettings.dsfAnalytics && 
            drupalSettings.dsfAnalytics.dataMode) {
          dataMode = drupalSettings.dsfAnalytics.dataMode;
          console.log('Data mode set from drupalSettings to:', dataMode);
        } else {
          console.log('Data mode not found in drupalSettings, using default:', dataMode);
          console.log('Available drupalSettings:', typeof drupalSettings !== 'undefined' ? drupalSettings : 'undefined');
        }
        
        // Force mock mode in development if API endpoints are not available
        // REMOVED: Do not force mock mode - respect the configured data mode
        
        console.log('Final data mode:', dataMode);
        
        // Initialize expandable KPI dashboard
        initializeExpandableKPIs();
        
        // Clear any existing event handlers before setting up new ones
        $(document).off('.dsfAnalytics');
        
        // Initialize time range handlers with namespaced events to prevent duplicates
        $(document).on('change.dsfAnalytics', '.dsf-time-range-select', function() {
          const selectedValue = $(this).val();
          
          if (selectedValue === 'custom') {
            showCustomDateRange();
          } else {
            hideCustomDateRange();
            currentTimeRange = selectedValue;
            console.log('Time range changed to:', currentTimeRange);
            updateTimeRangeInfo();
            loadDashboardData();
          }
        });

        // Initialize custom date range handlers with namespaced events
        $(document).on('click.dsfAnalytics', '#apply-custom-range', function() {
          applyCustomDateRange();
        });
        
        $(document).on('click.dsfAnalytics', '#cancel-custom-range', function() {
          cancelCustomDateRange();
        });

        // Initialize export handlers with namespaced events
        $(document).on('click.dsfAnalytics', '.dsf-export-btn', function() {
          const format = $(this).data('format');
          console.log('Export requested for format:', format);
          handleExport(format);
        });

        // Initialize Top 10 table functionality
        initializeTop10Tables();

        // Load initial data
        loadDashboardData();
        
        // Mark as completely initialized
        window.dsfAnalyticsInitialized = 'complete';
        console.log('Dashboard initialization marked as complete');
        
        // Update KPI summary indicator after initialization
        setTimeout(function() {
          if (typeof updateKPISummaryIndicator === 'function') {
            updateKPISummaryIndicator();
            console.log('KPI summary indicator updated after initialization');
          }
        }, 1000); // Delay to ensure KPI data has been loaded
        
      }).catch(function(error) {
        console.error('API availability check failed:', error);
        
        // Reset initialization flags on error
        dashboardInitialized = false;
        window.dsfAnalyticsInitialized = false;
        
        // Display inline error for development
        if (typeof displayInlineError === 'function') {
          displayInlineError('dsf-analytics-dashboard', error, 'API Availability Check Error');
        }
      });
    } catch (error) {
      console.error('Error during dashboard initialization:', error);
      
      // Reset initialization flags on error
      dashboardInitialized = false;
      window.dsfAnalyticsInitialized = false;
      
      // Display inline error for development
      if (typeof displayInlineError === 'function') {
        displayInlineError('dsf-analytics-dashboard', error, 'Dashboard Initialization Error');
      }
      
      throw error; // Re-throw to be caught by the attach function
    }
  }

  // Check if API endpoints are available before making calls
  function checkAPIAvailability() {
    return new Promise(function(resolve, reject) {
      // Quick test call to see if the API endpoint is available
      $.ajax({
        url: '/admin/reports/dsf-analytics/api/matomo?method=API.getVersion',
        method: 'GET',
        timeout: 5000
      }).done(function() {
        console.log('API endpoints are available');
        resolve(true);
      }).fail(function(xhr) {
        console.warn('API endpoints not available (status: ' + xhr.status + ')');
        resolve(false); // Resolve with false instead of rejecting
      });
    });
  }

  function loadDashboardData() {
    console.log('Loading dashboard data for range:', currentTimeRange);
    
    // Reload KPI metrics for new time range
    loadKPIMetrics();
    
    // Reload Top 10 tables if they exist
    if (typeof loadTop10Data === 'function') {
      loadTop10Data();
    }
  }

  // Helper function to display in-line errors in the UI for development
  function displayInlineError(containerId, error, context) {
    const container = $('#' + containerId);
    if (!container.length) {
      console.error('Error container not found:', containerId);
      return;
    }
    
    const errorDetails = {
      message: error.message || error.toString(),
      name: error.name || 'Error',
      context: context || 'Unknown context',
      timestamp: new Date().toISOString(),
      stack: error.stack || 'No stack trace available'
    };
    
    // Simple plain text error display
    const errorHtml = `
      <div style="background: #ffebee; border: 1px solid #f44336; padding: 15px; margin: 10px 0; font-family: monospace; font-size: 12px; color: #333;">
        <div style="color: #d32f2f; font-weight: bold; margin-bottom: 8px;">
          🚨 Development Error: ${errorDetails.name}
        </div>
        <div style="margin-bottom: 8px;">
          <strong>Message:</strong> ${errorDetails.message}
        </div>
        <div style="margin-bottom: 8px;">
          <strong>Context:</strong> ${errorDetails.context}
        </div>
        <div style="margin-bottom: 8px;">
          <strong>Time:</strong> ${errorDetails.timestamp}
        </div>
        <div style="margin-bottom: 8px;">
          <strong>Data Mode:</strong> ${dataMode} | <strong>Time Range:</strong> ${currentTimeRange}
        </div>
        <details style="margin-top: 10px;">
          <summary style="cursor: pointer; color: #d32f2f; font-weight: bold;">Stack Trace</summary>
          <pre style="background: #f5f5f5; padding: 8px; margin: 5px 0; white-space: pre-wrap; word-wrap: break-word; max-height: 200px; overflow-y: auto;">${errorDetails.stack}</pre>
        </details>
      </div>
    `;
    
    container.prepend(errorHtml);
    
    // Auto-remove after 15 seconds for development convenience
    setTimeout(() => {
      container.find('div').first().fadeOut(500, function() {
        $(this).remove();
      });
    }, 15000);
  }

  // Helper function to get current time range
  function getCurrentTimeRange() {
    return currentTimeRange || 'last7days';
  }

  function generateKpiMockData(metricId, timeRange) {
    const baseValues = {
      'unique-visitors': { value: 2847, trend: 12.5, format: 'number' },
      'finder-sessions': { value: 1823, trend: -3.2, format: 'number' },
      'services-investigated': { value: 4521, trend: 8.7, format: 'number' },
      'service-selections': { value: 892, trend: 15.3, format: 'number' }
    };

    const multipliers = {
      'last7days': 1,
      'last30days': 4.2,
      'last90days': 12.8,
      'last6months': 25.5,
      'lastyear': 52.1
    };

    const base = baseValues[metricId] || { value: 100, trend: 0, format: 'number' };
    const multiplier = multipliers[timeRange] || 1;
    
    return {
      value: Math.round(base.value * multiplier),
      trend: base.trend + (Math.random() * 10 - 5), // Add some variance
      format: base.format
    };
  }

  function generateChartMockData(metricId, timeRange) {
    const chartTypes = {
      'daily-visitors': 'line',
      'service-categories': 'doughnut',
      'popular-services': 'bar',
      'search-terms': 'bar',
      'facet-usage': 'bar',
      'filter-combinations': 'bar',
      'user-journeys': 'bar',
      'session-duration': 'line'
    };

    const chartType = chartTypes[metricId] || 'bar';

    if (chartType === 'line') {
      return generateTimeSeriesData(metricId, timeRange);
    } else if (chartType === 'doughnut') {
      return generateCategoryData(metricId);
    } else {
      return generateBarData(metricId);
    }
  }

  function generateTimeSeriesData(metricId, timeRange) {
    const periods = {
      'last7days': 7,
      'last30days': 30,
      'last90days': 90,
      'last6months': 180,
      'lastyear': 365
    };

    const days = periods[timeRange] || 7;
    const labels = [];
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Generate realistic daily variations
      const baseValue = metricId === 'daily-visitors' ? 45 : 25;
      const weekendFactor = (date.getDay() === 0 || date.getDay() === 6) ? 0.7 : 1;
      const randomVariation = 0.8 + (Math.random() * 0.4);
      
      data.push(Math.round(baseValue * weekendFactor * randomVariation));
    }

    return {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: metricId === 'daily-visitors' ? 'Daily Visitors' : 'Daily Sessions',
          data: data,
          borderColor: '#0066cc',
          backgroundColor: 'rgba(0, 102, 204, 0.1)',
          tension: 0.1
        }]
      }
    };
  }

  function generateCategoryData(metricId) {
    const categories = [
      'Research & Discovery',
      'Digital Collections',
      'Writing & Publishing',
      'Data & Analysis',
      'Preservation & Storage',
      'Collaboration Tools',
      'Teaching & Learning'
    ];

    const data = categories.map(function() {
      return Math.floor(Math.random() * 500) + 100;
    });

    return {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: data,
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#FF6384'
          ]
        }]
      }
    };
  }

  function generateBarData(metricId) {
    const dataMap = {
      'popular-services': {
        labels: ['Virgo', 'Libra', 'IIIF Hosting', 'Archivematica', 'Digital Curation', 'Avalon', 'Fedora'],
        values: [345, 289, 267, 234, 198, 156, 134]
      },
      'search-terms': {
        labels: ['preservation', 'digital collection', 'metadata', 'repository', 'digitization', 'archival', 'publishing'],
        values: [156, 134, 123, 98, 87, 76, 65]
      },
      'facet-usage': {
        labels: ['Service Type', 'Academic Department', 'Data Format', 'Access Level', 'Storage Requirements', 'Technical Skills'],
        values: [567, 434, 398, 345, 234, 198]
      },
      'filter-combinations': {
        labels: ['Type + Department', 'Format + Access', 'Skills + Type', 'Department + Access', 'Type + Storage'],
        values: [123, 98, 87, 76, 65]
      },
      'user-journeys': {
        labels: ['Browse → Search → Select', 'Search → Filter → Select', 'Browse → Filter → Compare', 'Direct → Select', 'Search → Compare → Select'],
        values: [234, 198, 156, 134, 123]
      }
    };

    const dataset = dataMap[metricId] || {
      labels: ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'],
      values: [100, 80, 60, 40, 20]
    };

    return {
      type: 'bar',
      data: {
        labels: dataset.labels,
        datasets: [{
          label: 'Count',
          data: dataset.values,
          backgroundColor: '#36A2EB'
        }]
      }
    };
  }

  function generateInsightMockData(metricId, timeRange) {
    const insights = {
      'usage-patterns': [
        'Peak usage occurs on Tuesday-Thursday between 10 AM - 3 PM',
        'Graduate students represent 67% of active users',
        'Most sessions last between 5-15 minutes',
        'Users typically investigate 3-4 services before making a selection'
      ],
      'engagement-patterns': [
        'Filter usage has increased 23% compared to previous period',
        'Service detail views average 2.3 per session',
        'Comparison feature used in 34% of multi-service sessions',
        'Search refinement occurs in 45% of search sessions'
      ],
      'workflow-stages': [
        'Browse → Filter → Compare → Select is the most common workflow (34%)',
        'Direct search accounts for 28% of successful selections',
        'Filter abandonment occurs most at the 4+ filter stage',
        'Users who use comparison tool have 78% higher selection rate'
      ],
      'selection-sessions': [
        'Average of 2.7 services compared per selection session',
        'Research-focused services have highest investigation time',
        'Multi-selection sessions show 34% higher user satisfaction',
        'Service category switching occurs in 23% of sessions'
      ],
      'investigation-depth': [
        'Deep investigation (>3 services) correlates with higher satisfaction',
        'Documentation views occur in 67% of research service investigations',
        'Technical requirements are most examined service attribute',
        'Related services feature drives 18% additional investigations'
      ],
      'search-behavior': [
        'Query refinement occurs in 43% of search sessions',
        'Auto-complete selections represent 29% of searches',
        'Domain-specific terms have highest success rates',
        'Search + browse combination used by 56% of users'
      ]
    };

    return insights[metricId] || [
      'Data analysis in progress',
      'Insights will be available with more data',
      'Check back later for detailed patterns'
    ];
  }

  function updateKpiCard(metricId, data, title) {
    const kpiCard = $('.dsf-kpi-card[data-metric="' + metricId + '"]');
    if (kpiCard.length) {
      const formattedValue = formatValue(data.value, data.format);
      const trendClass = data.trend >= 0 ? 'positive' : 'negative';
      const trendIcon = data.trend >= 0 ? '↗' : '↘';
      const trendText = Math.abs(data.trend).toFixed(1) + '%';

      kpiCard.find('.dsf-kpi-value').html(formattedValue);
      kpiCard.find('.dsf-kpi-trend')
        .html(trendIcon + ' ' + trendText)
        .removeClass('positive negative')
        .addClass(trendClass);
    }
  }

  function updateChart(metricId, chartData, title) {
    const chartContainer = $('#dsf-chart-' + metricId);
    if (chartContainer.length) {
      // Create a simple HTML representation for demo
      let chartHtml = '<div class="dsf-mock-chart">';
      chartHtml += '<h4>' + title + '</h4>';
      
      if (chartData.type === 'line') {
        chartHtml += '<div class="dsf-line-chart">Line chart visualization would appear here</div>';
      } else if (chartData.type === 'doughnut') {
        chartHtml += '<div class="dsf-doughnut-chart">Doughnut chart visualization would appear here</div>';
      } else {
        chartHtml += '<div class="dsf-bar-chart">Bar chart visualization would appear here</div>';
      }
      
      chartHtml += '</div>';
      chartContainer.html(chartHtml);
    }
  }

  function updateInsightCard(metricId, insights, title) {
    const card = $('.dsf-insight-card[data-insight="' + metricId + '"]');
    if (card.length) {
      let html = '<ul>';
      insights.forEach(function(insight) {
        html += '<li>' + insight + '</li>';
      });
      html += '</ul>';
      card.html(html);
    }
  }

  function getTimeRangeParams(range) {
    const params = {};
    const today = new Date();
    
    // Handle custom date ranges
    if (range && range.startsWith('custom_')) {
      const customData = JSON.parse(sessionStorage.getItem('customDateRange'));
      if (customData) {
        params.period = 'range';
        params.date = customData.startDate + ',' + customData.endDate;
        return params;
      }
    }
    
    switch (range) {
      case 'today':
        params.period = 'day';
        params.date = 'today';
        break;
      case 'yesterday':
        params.period = 'day';
        params.date = 'yesterday';
        break;
      case 'last7days':
        params.period = 'day';
        params.date = 'last7';
        break;
      case 'last30days':
        params.period = 'day';
        params.date = 'last30';
        break;
      case 'last90days':
        params.period = 'week';
        params.date = 'last90';
        break;
      case 'last6months':
        params.period = 'month';
        params.date = 'last6';
        break;
      case 'lastyear':
        params.period = 'month';
        params.date = 'lastyear';
        break;
      case 'thisweek':
        params.period = 'day';
        params.date = getWeekRange('this');
        break;
      case 'lastweek':
        params.period = 'day';
        params.date = getWeekRange('last');
        break;
      case 'thismonth':
        params.period = 'day';
        params.date = getMonthRange('this');
        break;
      case 'lastmonth':
        params.period = 'day';
        params.date = getMonthRange('last');
        break;
      case 'thisquarter':
        params.period = 'month';
        params.date = getQuarterRange('this');
        break;
      case 'lastquarter':
        params.period = 'month';
        params.date = getQuarterRange('last');
        break;
      case 'thisyear':
        params.period = 'month';
        params.date = getYearRange('this');
        break;
      case 'previousyear':
        params.period = 'month';
        params.date = getYearRange('previous');
        break;
      case 'semester_fall':
        params.period = 'week';
        params.date = getSemesterRange('fall');
        break;
      case 'semester_spring':
        params.period = 'week';
        params.date = getSemesterRange('spring');
        break;
      case 'semester_summer':
        params.period = 'week';
        params.date = getSemesterRange('summer');
        break;
      case 'academic_year':
        params.period = 'month';
        params.date = getAcademicYearRange();
        break;
      default:
        params.period = 'day';
        params.date = 'last7';
    }
    
    return params;
  }

  function getTimeRangeMultiplier(range) {
    // Handle custom date ranges
    if (range && range.startsWith('custom_')) {
      const customData = JSON.parse(sessionStorage.getItem('customDateRange'));
      if (customData) {
        const startDate = new Date(customData.startDate);
        const endDate = new Date(customData.endDate);
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        return days / 7; // Scale relative to 7-day baseline
      }
    }
    
    // Return multipliers to scale mock data based on time range
    const multipliers = {
      'today': 0.14,           // 1/7 of a week
      'yesterday': 0.14,       // 1/7 of a week
      'last7days': 1,          // baseline
      'last30days': 4.2,       // ~30/7
      'last90days': 12.8,      // ~90/7
      'last6months': 26,       // ~180/7
      'lastyear': 52,          // ~365/7
      'thisweek': 1,           // ~7 days
      'lastweek': 1,           // ~7 days
      'thismonth': 4.2,        // ~30 days
      'lastmonth': 4.2,        // ~30 days
      'thisquarter': 13,       // ~90 days
      'lastquarter': 13,       // ~90 days
      'thisyear': 52,          // ~365 days
      'previousyear': 52,      // ~365 days
      'semester_fall': 17,     // ~120 days
      'semester_spring': 17,   // ~120 days
      'semester_summer': 8,    // ~60 days
      'academic_year': 36      // ~250 days
    };
    
    return multipliers[range] || 1;
  }

  // Custom Date Range Functions
  function showCustomDateRange() {
    $('#custom-date-range').show();
    
    // Set default dates (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    $('#start-date').val(formatDateForInput(startDate));
    $('#end-date').val(formatDateForInput(endDate));
  }
  
  function hideCustomDateRange() {
    $('#custom-date-range').hide();
  }
  
  function applyCustomDateRange() {
    const startDate = $('#start-date').val();
    const endDate = $('#end-date').val();
    
    if (!startDate || !endDate) {
      alert('Please select both start and end dates.');
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date must be before end date.');
      return;
    }
    
    // Store custom range data
    const customData = {
      startDate: startDate,
      endDate: endDate,
      label: formatDateRange(startDate, endDate)
    };
    
    sessionStorage.setItem('customDateRange', JSON.stringify(customData));
    
    // Update current time range
    currentTimeRange = 'custom_' + Date.now();
    
    hideCustomDateRange();
    updateTimeRangeInfo();
    loadDashboardData();
  }
  
  function cancelCustomDateRange() {
    $('.dsf-time-range-select').val('last7days');
    currentTimeRange = 'last7days';
    hideCustomDateRange();
    updateTimeRangeInfo();
  }
  
  function updateTimeRangeInfo() {
    const info = $('#time-range-info');
    let label = '';
    
    if (currentTimeRange.startsWith('custom_')) {
      const customData = JSON.parse(sessionStorage.getItem('customDateRange'));
      if (customData) {
        label = 'Showing data for ' + customData.label;
      }
    } else {
      const labels = {
        'today': 'today',
        'yesterday': 'yesterday',
        'last7days': 'the last 7 days',
        'last30days': 'the last 30 days',
        'last90days': 'the last 90 days',
        'last6months': 'the last 6 months',
        'lastyear': 'the last year',
        'thisweek': 'this week',
        'lastweek': 'last week',
        'thismonth': 'this month',
        'lastmonth': 'last month',
        'thisquarter': 'this quarter',
        'lastquarter': 'last quarter',
        'thisyear': 'this year',
        'previousyear': 'the previous year',
        'semester_fall': 'Fall semester',
        'semester_spring': 'Spring semester',
        'semester_summer': 'Summer session',
        'academic_year': 'the academic year'
      };
      
      label = 'Showing data for ' + (labels[currentTimeRange] || 'the selected period');
    }
    
    info.text(label);
  }

  // Date Range Helper Functions
  function getWeekRange(type) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    let startDate, endDate;
    
    if (type === 'this') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - dayOfWeek);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else { // last
      endDate = new Date(today);
      endDate.setDate(today.getDate() - dayOfWeek - 1);
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 6);
    }
    
    return formatDateForInput(startDate) + ',' + formatDateForInput(endDate);
  }
  
  function getMonthRange(type) {
    const today = new Date();
    
    if (type === 'this') {
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return formatDateForInput(startDate) + ',' + formatDateForInput(endDate);
    } else { // last
      const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      return formatDateForInput(startDate) + ',' + formatDateForInput(endDate);
    }
  }
  
  function getQuarterRange(type) {
    const today = new Date();
    const currentQuarter = Math.floor(today.getMonth() / 3);
    
    let quarter = type === 'this' ? currentQuarter : currentQuarter - 1;
    let year = today.getFullYear();
    
    if (quarter < 0) {
      quarter = 3;
      year--;
    }
    
    const startDate = new Date(year, quarter * 3, 1);
    const endDate = new Date(year, quarter * 3 + 3, 0);
    
    return formatDateForInput(startDate) + ',' + formatDateForInput(endDate);
  }
  
  function getYearRange(type) {
    const today = new Date();
    const year = type === 'this' ? today.getFullYear() : today.getFullYear() - 1;
    
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    return formatDateForInput(startDate) + ',' + formatDateForInput(endDate);
  }
  
  function getSemesterRange(semester) {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Academic calendar dates (adjust as needed)
    const semesterDates = {
      'fall': { start: [currentYear, 7, 20], end: [currentYear, 11, 15] }, // Aug 20 - Dec 15
      'spring': { start: [currentYear, 0, 15], end: [currentYear, 4, 15] }, // Jan 15 - May 15
      'summer': { start: [currentYear, 4, 20], end: [currentYear, 7, 10] }  // May 20 - Aug 10
    };
    
    const dates = semesterDates[semester];
    if (!dates) return 'last90';
    
    const startDate = new Date(...dates.start);
    const endDate = new Date(...dates.end);
    
    return formatDateForInput(startDate) + ',' + formatDateForInput(endDate);
  }
  
  function getAcademicYearRange() {
    const today = new Date();
    const currentMonth = today.getMonth();
    
    // Academic year runs August to July
    let startYear = currentMonth >= 7 ? today.getFullYear() : today.getFullYear() - 1;
    
    const startDate = new Date(startYear, 7, 1); // August 1
    const endDate = new Date(startYear + 1, 6, 31); // July 31
    
    return formatDateForInput(startDate) + ',' + formatDateForInput(endDate);
  }
  
  function formatDateForInput(date) {
    return date.getFullYear() + '-' +
           String(date.getMonth() + 1).padStart(2, '0') + '-' +
           String(date.getDate()).padStart(2, '0');
  }
  
  function formatDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return start.toLocaleDateString('en-US', options) + ' - ' + 
           end.toLocaleDateString('en-US', options);
  }

  function formatValue(value, format) {
    if (format === 'number') {
      return value.toLocaleString();
    } else if (format === 'percentage') {
      return value.toFixed(1) + '%';
    } else if (format === 'time') {
      const minutes = Math.floor(value / 60);
      const seconds = value % 60;
      return minutes + 'm ' + seconds + 's';
    }
    return value;
  }

  function handleExport(format) {
    console.log('Exporting data in format:', format);
    
    // Collect current data
    const exportData = {
      timeRange: currentTimeRange,
      generatedAt: new Date().toISOString(),
      data: {
        kpis: {},
        insights: {}
      }
    };

    // Collect KPI data
    $('.dsf-kpi-card').each(function() {
      const metricId = $(this).data('metric');
      const value = $(this).find('.dsf-kpi-value').text();
      const trend = $(this).find('.dsf-kpi-trend').text();
      exportData.data.kpis[metricId] = { value: value, trend: trend };
    });

    // Create export content
    if (format === 'csv') {
      exportCSV(exportData);
    } else if (format === 'pdf') {
      exportPDF(exportData);
    } else if (format === 'json') {
      exportJSON(exportData);
    }
  }

  function exportCSV(data) {
    let csv = 'Metric,Value,Trend\n';
    
    Object.keys(data.data.kpis).forEach(function(key) {
      const kpi = data.data.kpis[key];
      csv += '"' + key + '","' + kpi.value + '","' + kpi.trend + '"\n';
    });

    downloadFile(csv, 'dsf-analytics-' + data.timeRange + '.csv', 'text/csv');
  }

  function exportJSON(data) {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, 'dsf-analytics-' + data.timeRange + '.json', 'application/json');
  }

  function exportPDF(data) {
    // For demo purposes, create a simple text representation
    let content = 'DSF Analytics Report\n';
    content += 'Generated: ' + new Date().toLocaleDateString() + '\n';
    content += 'Time Range: ' + data.timeRange + '\n\n';
    content += 'Key Performance Indicators:\n';
    
    Object.keys(data.data.kpis).forEach(function(key) {
      const kpi = data.data.kpis[key];
      content += '- ' + key + ': ' + kpi.value + ' (' + kpi.trend + ')\n';
    });

    downloadFile(content, 'dsf-analytics-' + data.timeRange + '.txt', 'text/plain');
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Matomo API call function (for future real data integration)
  function callMatomoAPI(method, params) {
    console.log('Calling Matomo API:', method, params);
    
    const finalParams = Object.assign({}, params);
    finalParams.method = method;
    finalParams.format = 'JSON';
    finalParams.module = 'API';
    
    const apiUrl = '/admin/reports/dsf-analytics/api/matomo?' + Object.keys(finalParams).map(function(key) {
      return key + '=' + encodeURIComponent(finalParams[key]);
    }).join('&');

    return $.get(apiUrl)
      .done(function(data) {
        console.log('Matomo API response:', data);
        return data;
      })
      .fail(function(xhr, status, error) {
        console.error('Matomo API error:', error);
        console.error('API call failed - no fallback data will be provided');
        // Do NOT fall back to mock data
        return null;
      });
  }

  // Top 10 Statistics Tables Functionality
  function initializeTop10Tables() {
    console.log('Initializing Top 10 tables');
    
    // Check if tables are already initialized
    if (window.dsfTablesInitialized) {
      console.log('Top 10 tables already initialized, skipping...');
      return;
    }
    
    try {
      // Mark as initialized
      window.dsfTablesInitialized = true;
      
      // Clear any existing table event handlers
      $(document).off('.dsfTables');
      
      // Remove existing handlers to prevent duplicates, then add new ones with namespacing
      $(document).on('click.dsfTables', '.dsf-sortable-table th.sortable', function() {
        const table = $(this).closest('table');
        const column = $(this).data('column');
        sortTable(table, column);
      });
      
      // Keyboard accessibility for sortable headers
      $(document).on('keydown.dsfTables', '.dsf-sortable-table th.sortable', function(e) {
        // Space or Enter key
        if (e.which === 32 || e.which === 13) {
          e.preventDefault();
          const table = $(this).closest('table');
          const column = $(this).data('column');
          sortTable(table, column);
        }
      });
      
      // Initialize search filtering
      $(document).on('input.dsfTables', '.dsf-table-search', function() {
        const tableId = $(this).data('table');
        const searchTerm = $(this).val().toLowerCase();
        filterTable(tableId, searchTerm);
      });
      
      // Load Top 10 data only if not already loading
      if (!window.dsfTablesLoading) {
        window.dsfTablesLoading = true;
        loadTop10Data();
        // Reset the loading flag after a delay
        setTimeout(() => {
          window.dsfTablesLoading = false;
        }, 2000); // Increased timeout to prevent race conditions
      }
      
      console.log('Top 10 tables initialization completed successfully');
      
    } catch (error) {
      console.error('Error initializing Top 10 tables:', error);
      // Reset initialization flag on error
      window.dsfTablesInitialized = false;
      
      // Display inline error for development
      if (typeof displayInlineError === 'function') {
        displayInlineError('top10-tables', error, 'Top 10 Tables Initialization');
      }
      
      throw error; // Re-throw to be caught by parent function
    }
  }
  
  function loadTop10Data() {
    console.log('Loading Top 10 data for range:', currentTimeRange, 'in mode:', dataMode);
    
    const categories = [
      'popular-services',
      'search-terms', 
      'filter-usage',
      'user-journeys',
      'departments',
      'peak-hours'
    ];
    
    categories.forEach(function(category) {
      if (dataMode === 'real') {
        // Load real data from API
        loadRealDataForCategory(category, currentTimeRange);
      } else {
        // Use mock data
        const mockData = generateTop10MockData(category, currentTimeRange);
        populateTop10Table(category, mockData);
      }
    });
  }
  
  // Load real data from Matomo API for a specific category
  function loadRealDataForCategory(category, timeRange) {
    console.log('Loading real data for category:', category);
    
    // Map categories to Matomo API methods
    const apiMethods = {
      'popular-services': 'Events.getAction',
      'search-terms': 'Events.getName', 
      'filter-usage': 'Events.getCategory',
      'user-journeys': 'Actions.getPageUrls',
      'departments': 'CustomVariables.getCustomVariables',
      'peak-hours': 'VisitTime.getVisitInformationPerServerTime'
    };
    
    const method = apiMethods[category];
    if (!method) {
      console.error('No API method mapped for category:', category);
      
      // Display inline error in UI for development
      const errorObj = new Error(`No API method mapped for category: ${category}`);
      errorObj.stack = `Category: ${category}\nAvailable methods: ${Object.keys(apiMethods).join(', ')}\nTime Range: ${timeRange}`;
      displayInlineError('table-' + category, errorObj, `Table Data Loading - ${category}`);
      
      console.error('Unable to load real data for category:', category);
      // Do NOT fall back to mock data - show error or empty state
      populateTop10Table(category, []);
      return;
    }
    
    // Call the Matomo API
    const params = getTimeRangeParams(timeRange);
    const apiUrl = '/admin/reports/dsf-analytics/api/matomo?' + 
                   'method=' + encodeURIComponent(method) +
                   '&period=' + encodeURIComponent(params.period) +
                   '&date=' + encodeURIComponent(params.date);
    
    // Add timeout and more robust error handling
    $.ajax({
      url: apiUrl,
      method: 'GET',
      timeout: 10000, // 10 second timeout
      cache: false
    })
      .done(function(response) {
        console.log('API response for', category, ':', response);
        
        if (response && response.mock) {
          console.log('Received mock data for', category);
          populateTop10Table(category, response.data || []);
        } else if (response && response.data) {
          // Process real data and convert to our format
          const processedData = processRealDataForCategory(category, response.data);
          populateTop10Table(category, processedData);
        } else {
          console.warn('Invalid or empty API response for', category);
          populateTop10Table(category, []);
        }
      })
      .fail(function(xhr, status, error) {
        // Track API failure as table error
        window.tableErrors[category] = true;
        console.log('API call failed - tracking table error for category:', category);
        updateKPISummaryIndicator(); // Update error indicator immediately
        
        // Reduce error spam by only logging critical information
        console.warn('API call failed for', category, '- Status:', status, 'Error:', error);
        
        // Only show detailed error for development mode or specific error types
        if (dataMode === 'real' && (status === 'timeout' || xhr.status >= 500)) {
          const errorObj = new Error(`API call failed for category ${category}: ${error}`);
          errorObj.stack = `Category: ${category}\nMethod: ${method}\nStatus: ${xhr.status} (${status})\nURL: ${apiUrl}`;
          displayInlineError('table-' + category, errorObj, `API Error - ${category}`);
        }
        
        // Show empty state instead of error for minor failures
        populateTop10Table(category, []);
      });
  }
  
  // Process real Matomo data into our expected format
  function processRealDataForCategory(category, rawData) {
    console.log('Processing real data for category:', category);
    
    if (!rawData || !Array.isArray(rawData)) {
      console.error('Invalid data format for category:', category);
      console.error('Expected array but received:', typeof rawData);
      
      // Track table error
      window.tableErrors[category] = true;
      updateKPISummaryIndicator(); // Update indicator when table errors occur
      
      // Display inline error in UI for development
      const errorObj = new Error(`Invalid data format for category ${category}: expected array but received ${typeof rawData}`);
      errorObj.stack = `Category: ${category}\nReceived data type: ${typeof rawData}\nData: ${JSON.stringify(rawData, null, 2).substring(0, 500)}...`;
      displayInlineError('table-' + category, errorObj, `Data Processing - ${category}`);
      
      // Do NOT fall back to mock data - return empty array
      return [];
    }
    
    // Clear table error if data is valid
    window.tableErrors[category] = false;
    
    // Convert Matomo data format to our internal format
    // This will vary by category and Matomo response structure
    let processedData = [];
    
    switch(category) {
      case 'popular-services':
        processedData = rawData.slice(0, 10).map((item, index) => ({
          name: item.label || 'Unknown Service',
          views: parseInt(item.nb_events || item.nb_visits || 0),
          trend: 'stable',
          trendValue: '0%'
        }));
        break;
        
      case 'search-terms':
        processedData = rawData.slice(0, 10).map((item, index) => ({
          term: item.label || 'Unknown Term',
          searches: parseInt(item.nb_events || item.nb_visits || 0),
          results: Math.floor(Math.random() * 30) + 5 // Placeholder
        }));
        break;
        
      case 'filter-usage':
        processedData = rawData.slice(0, 10).map((item, index) => ({
          filter: item.label || 'Unknown Filter',
          usage: parseInt(item.nb_events || item.nb_visits || 0),
          success: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)]
        }));
        break;
        
      case 'user-journeys':
        processedData = rawData.slice(0, 10).map((item, index) => ({
          path: item.label || 'Unknown Path',
          frequency: parseInt(item.nb_visits || item.nb_hits || 0),
          conversion: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)]
        }));
        break;
        
      case 'departments':
        processedData = rawData.slice(0, 10).map((item, index) => ({
          department: item.label || 'Unknown Department',
          users: parseInt(item.nb_visits || item.nb_uniq_visitors || 0),
          engagement: Math.floor(Math.random() * 40) + 60
        }));
        break;
        
      case 'peak-hours':
        // For peak hours, we need to transform to our heatmap format
        // Do NOT fall back to mock data - return empty array if no real data
        console.error('Peak hours data processing not yet implemented for real data');
        
        // Display inline error in UI for development
        const errorObj = new Error('Peak hours data processing not yet implemented for real data');
        errorObj.stack = `Category: peak-hours\nRaw data length: ${rawData.length}\nImplementation needed for: weekly heatmap transformation`;
        displayInlineError('peak-hours-heatmap', errorObj, 'Peak Hours Data Processing');
        
        return [];
        
      default:
        console.error('Unknown category for real data processing:', category);
        
        // Display inline error in UI for development
        const unknownErrorObj = new Error(`Unknown category for real data processing: ${category}`);
        unknownErrorObj.stack = `Category: ${category}\nAvailable categories: popular-services, search-terms, filter-usage, user-journeys, departments, peak-hours`;
        displayInlineError('table-' + category, unknownErrorObj, `Data Processing - Unknown Category`);
        
        return [];
    }
    
    return processedData.length > 0 ? processedData : [];
  }
  
  function generateTop10MockData(category, timeRange) {
    const multiplier = getTimeRangeMultiplier(timeRange);
    
    const datasets = {
      'popular-services': [
        { name: 'Virgo', views: Math.round(345 * multiplier), trend: 'up', trendValue: '+12%' },
        { name: 'Libra', views: Math.round(289 * multiplier), trend: 'up', trendValue: '+8%' },
        { name: 'IIIF Hosting', views: Math.round(267 * multiplier), trend: 'stable', trendValue: '+1%' },
        { name: 'Archivematica', views: Math.round(234 * multiplier), trend: 'down', trendValue: '-3%' },
        { name: 'Digital Curation', views: Math.round(198 * multiplier), trend: 'up', trendValue: '+15%' },
        { name: 'Avalon', views: Math.round(156 * multiplier), trend: 'up', trendValue: '+6%' },
        { name: 'Fedora', views: Math.round(134 * multiplier), trend: 'stable', trendValue: '0%' },
        { name: 'DSpace', views: Math.round(112 * multiplier), trend: 'down', trendValue: '-5%' },
        { name: 'Samvera', views: Math.round(98 * multiplier), trend: 'up', trendValue: '+9%' },
        { name: 'Solr', views: Math.round(87 * multiplier), trend: 'stable', trendValue: '+2%' }
      ],
      'search-terms': [
        { term: 'preservation', searches: Math.round(156 * multiplier), results: 23 },
        { term: 'digital collection', searches: Math.round(134 * multiplier), results: 18 },
        { term: 'metadata', searches: Math.round(123 * multiplier), results: 31 },
        { term: 'repository', searches: Math.round(98 * multiplier), results: 15 },
        { term: 'digitization', searches: Math.round(87 * multiplier), results: 12 },
        { term: 'archival', searches: Math.round(76 * multiplier), results: 19 },
        { term: 'publishing', searches: Math.round(65 * multiplier), results: 8 },
        { term: 'storage', searches: Math.round(54 * multiplier), results: 14 },
        { term: 'access', searches: Math.round(43 * multiplier), results: 22 },
        { term: 'migration', searches: Math.round(38 * multiplier), results: 7 }
      ],
      'filter-usage': [
        { filter: 'Service Type', usage: Math.round(567 * multiplier), success: 'high' },
        { filter: 'Academic Department', usage: Math.round(434 * multiplier), success: 'high' },
        { filter: 'Data Format', usage: Math.round(398 * multiplier), success: 'medium' },
        { filter: 'Access Level', usage: Math.round(345 * multiplier), success: 'high' },
        { filter: 'Storage Requirements', usage: Math.round(234 * multiplier), success: 'medium' },
        { filter: 'Technical Skills', usage: Math.round(198 * multiplier), success: 'low' },
        { filter: 'Support Level', usage: Math.round(156 * multiplier), success: 'medium' },
        { filter: 'Cost Range', usage: Math.round(134 * multiplier), success: 'high' },
        { filter: 'Timeline', usage: Math.round(112 * multiplier), success: 'medium' },
        { filter: 'Integration', usage: Math.round(87 * multiplier), success: 'low' }
      ],
      'user-journeys': [
        { path: 'Browse → Search → Select', frequency: Math.round(234 * multiplier), conversion: 'high' },
        { path: 'Search → Filter → Select', frequency: Math.round(198 * multiplier), conversion: 'high' },
        { path: 'Browse → Filter → Compare', frequency: Math.round(156 * multiplier), conversion: 'medium' },
        { path: 'Direct → Select', frequency: Math.round(134 * multiplier), conversion: 'high' },
        { path: 'Search → Compare → Select', frequency: Math.round(123 * multiplier), conversion: 'medium' },
        { path: 'Browse → Compare → Exit', frequency: Math.round(98 * multiplier), conversion: 'low' },
        { path: 'Search → Exit', frequency: Math.round(87 * multiplier), conversion: 'low' },
        { path: 'Filter → Compare → Filter', frequency: Math.round(76 * multiplier), conversion: 'medium' },
        { path: 'Browse → Exit', frequency: Math.round(65 * multiplier), conversion: 'low' },
        { path: 'Compare → Select → Compare', frequency: Math.round(54 * multiplier), conversion: 'medium' }
      ],
      'departments': [
        { department: 'Library Science', users: Math.round(89 * multiplier), engagement: 92 },
        { department: 'History', users: Math.round(76 * multiplier), engagement: 87 },
        { department: 'Art & Architecture', users: Math.round(67 * multiplier), engagement: 85 },
        { department: 'Computer Science', users: Math.round(54 * multiplier), engagement: 78 },
        { department: 'English', users: Math.round(43 * multiplier), engagement: 82 },
        { department: 'Anthropology', users: Math.round(38 * multiplier), engagement: 90 },
        { department: 'Music', users: Math.round(32 * multiplier), engagement: 88 },
        { department: 'Psychology', users: Math.round(29 * multiplier), engagement: 75 },
        { department: 'Sociology', users: Math.round(25 * multiplier), engagement: 83 },
        { department: 'Philosophy', users: Math.round(21 * multiplier), engagement: 86 }
      ],
      'peak-hours': generateWeeklyUsageData(multiplier)
    };
    
    return datasets[category] || [];
  }
  
  function populateTop10Table(category, data) {
    console.log('Populating table for category:', category, 'with', data.length, 'items');
    
    // Special handling for peak-hours - render heatmap and statistical tables
    if (category === 'peak-hours') {
      console.log('Peak-hours category detected - rendering heatmap instead of table');
      renderWeeklyHeatmap(data);
      populateUsageStatistics(data);
      return;
    }
    
    const tableId = 'table-' + category;
    const tbody = $('#' + tableId + ' tbody');
    
    if (!tbody.length) {
      console.warn('Table not found:', tableId);
      return;
    }
    
    console.log('Found table body for:', tableId);
    
    tbody.empty();
    
    // Handle empty data (when real API calls fail and no fallback is used)
    if (data.length === 0) {
      // Track table error
      window.tableErrors[category] = true;
      console.log('Table error tracked for category:', category);
      updateKPISummaryIndicator(); // Update indicator when table has no data
      
      const colspan = tbody.closest('table').find('thead tr th').length || 4;
      const errorRow = $('<tr>').html(
        '<td colspan="' + colspan + '" class="text-center text-muted py-4">' +
        '<i class="fas fa-exclamation-triangle mr-2"></i>' +
        'Unable to load data. Please check API configuration.' +
        '</td>'
      );
      tbody.append(errorRow);
      console.log('Added error row to table:', tableId);
      return;
    }
    
    // Clear table error if data is successfully loaded
    window.tableErrors[category] = false;
    
    data.forEach(function(item, index) {
      const rank = index + 1;
      const row = createTableRow(category, item, rank);
      
      // Show only top 5 by default, hide the rest
      if (rank > 5) {
        row.addClass('table-row-hidden').hide();
        row.attr('aria-hidden', 'true');
        console.log('Hiding row', rank, 'for category:', category);
      }
      
      tbody.append(row);
    });
    
    console.log('Added', data.length, 'rows to table:', tableId);
    
    // Add show more/less functionality if there are more than 5 items
    if (data.length > 5) {
      console.log('Data length > 5, adding show more button for:', tableId);
      addShowMoreButton(tableId, data.length);
    } else {
      console.log('Data length <= 5, no show more button needed for:', tableId);
    }
  }
  
  function createTableRow(category, item, rank) {
    const rankBadge = '<span class="rank-badge rank-' + rank + '">' + rank + '</span>';
    
    switch(category) {
      case 'popular-services':
        return $('<tr>').html([
          '<td>' + rankBadge + '</td>',
          '<td><strong>' + item.name + '</strong></td>',
          '<td><strong>' + item.views.toLocaleString() + '</strong></td>',
          '<td><span class="trend-' + item.trend + '">' + item.trendValue + '</span></td>'
        ].join(''));
        
      case 'search-terms':
        return $('<tr>').html([
          '<td>' + rankBadge + '</td>',
          '<td><strong>' + item.term + '</strong></td>',
          '<td><strong>' + item.searches.toLocaleString() + '</strong></td>',
          '<td>' + item.results + '</td>'
        ].join(''));
        
      case 'filter-usage':
        const successBadge = '<span class="conversion-badge conversion-' + item.success + '">' + 
                           item.success.charAt(0).toUpperCase() + item.success.slice(1) + '</span>';
        return $('<tr>').html([
          '<td>' + rankBadge + '</td>',
          '<td><strong>' + item.filter + '</strong></td>',
          '<td><strong>' + item.usage.toLocaleString() + '</strong></td>',
          '<td>' + successBadge + '</td>'
        ].join(''));
        
      case 'user-journeys':
        const conversionBadge = '<span class="conversion-badge conversion-' + item.conversion + '">' + 
                              item.conversion.charAt(0).toUpperCase() + item.conversion.slice(1) + '</span>';
        return $('<tr>').html([
          '<td>' + rankBadge + '</td>',
          '<td><strong>' + item.path + '</strong></td>',
          '<td><strong>' + item.frequency.toLocaleString() + '</strong></td>',
          '<td>' + conversionBadge + '</td>'
        ].join(''));
        
      case 'departments':
        const engagementBar = '<div class="engagement-bar"><div class="engagement-fill" style="width: ' + item.engagement + '%"></div></div>';
        return $('<tr>').html([
          '<td>' + rankBadge + '</td>',
          '<td><strong>' + item.department + '</strong></td>',
          '<td><strong>' + item.users.toLocaleString() + '</strong></td>',
          '<td>' + item.engagement + '%' + engagementBar + '</td>'
        ].join(''));
        
      default:
        return $('<tr>').html('<td colspan="4">Unknown category</td>');
    }
  }
  
  function sortTable(table, column) {
    const rows = table.find('tbody tr').get();
    const header = table.find('th[data-column="' + column + '"]');
    const isCurrentlyAsc = header.hasClass('sort-asc');
    const isCurrentlyDesc = header.hasClass('sort-desc');
    
    // Reset all headers
    table.find('th').removeClass('sort-asc sort-desc').removeAttr('aria-sort');
    
    // Determine new sort direction
    let newSortAsc = true; // Default to ascending for first click
    if (isCurrentlyAsc) {
      // Currently ascending, switch to descending
      newSortAsc = false;
      header.addClass('sort-desc').attr('aria-sort', 'descending');
    } else if (isCurrentlyDesc) {
      // Currently descending, switch to ascending
      newSortAsc = true;
      header.addClass('sort-asc').attr('aria-sort', 'ascending');
    } else {
      // No current sort, start with ascending
      newSortAsc = true;
      header.addClass('sort-asc').attr('aria-sort', 'ascending');
    }
    
    rows.sort(function(a, b) {
      const aVal = getCellValue(a, column);
      const bVal = getCellValue(b, column);
      
      if ($.isNumeric(aVal) && $.isNumeric(bVal)) {
        return newSortAsc ? aVal - bVal : bVal - aVal;
      } else {
        const result = aVal.toString().localeCompare(bVal.toString());
        return newSortAsc ? result : -result;
      }
    });
    
    $.each(rows, function(index, row) {
      table.find('tbody').append(row);
    });
    
    // Announce sort change to screen readers
    const sortDirection = newSortAsc ? 'ascending' : 'descending';
    const columnName = header.text().replace(/[↕↑↓]/g, '').trim();
    announceToScreenReader(`Table sorted by ${columnName} in ${sortDirection} order`);
  }
  
  function getCellValue(row, column) {
    const cellIndex = $(row).closest('table').find('th[data-column="' + column + '"]').index();
    const cellText = $(row).find('td').eq(cellIndex).text().trim();
    
    // Extract numeric values from formatted text
    const numericMatch = cellText.match(/[\d,]+/);
    if (numericMatch) {
      return parseInt(numericMatch[0].replace(/,/g, ''));
    }
    
    return cellText;
  }
  
  function filterTable(tableId, searchTerm) {
    const table = $('#table-' + tableId);
    const rows = table.find('tbody tr');
    
    rows.each(function() {
      const row = $(this);
      const text = row.text().toLowerCase();
      
      if (text.indexOf(searchTerm) > -1) {
        row.show();
      } else {
        row.hide();
      }
    });
  }

  // Add show more/less functionality to tables
  function addShowMoreButton(tableId, totalItems) {
    console.log('Adding show more button for table:', tableId, 'with', totalItems, 'total items');
    
    const table = $('#' + tableId);
    const tableContainer = table.closest('.table-responsive');
    
    // Remove existing show more button if it exists
    tableContainer.siblings('.table-show-more').remove();
    
    const hiddenCount = totalItems - 5;
    const buttonId = 'show-more-' + tableId;
    
    const showMoreContainer = $('<div>', {
      class: 'table-show-more mt-3 text-center'
    });
    
    const showMoreButton = $('<button>', {
      type: 'button',
      class: 'btn btn-outline-primary btn-sm',
      id: buttonId,
      'aria-expanded': 'false',
      'aria-controls': tableId + '-hidden-rows',
      'data-table': tableId,
      'data-hidden-count': hiddenCount
    });
    
    showMoreButton.html(
      '<i class="fas fa-chevron-down mr-2" aria-hidden="true"></i>' +
      'Show ' + hiddenCount + ' more items'
    );
    
    showMoreContainer.append(showMoreButton);
    tableContainer.after(showMoreContainer);
    
    console.log('Show more button created and added for table:', tableId);
    
    // Add event handler for the button
    showMoreButton.on('click', function() {
      console.log('Show more button clicked for table:', tableId);
      toggleTableRows($(this));
    });
    
    // Keyboard accessibility
    showMoreButton.on('keydown', function(e) {
      if (e.which === 32 || e.which === 13) {
        e.preventDefault();
        console.log('Show more button keyboard activated for table:', tableId);
        toggleTableRows($(this));
      }
    });
  }
  
  // Toggle visibility of hidden table rows
  function toggleTableRows(button) {
    const tableId = button.data('table');
    const table = $('#' + tableId);
    const hiddenRows = table.find('.table-row-hidden');
    const isExpanded = button.attr('aria-expanded') === 'true';
    const hiddenCount = button.data('hidden-count');
    
    console.log('Toggling table rows for:', tableId);
    console.log('Hidden rows found:', hiddenRows.length);
    console.log('Current expanded state:', isExpanded);
    console.log('Hidden count:', hiddenCount);
    
    if (isExpanded) {
      // Hide the extra rows
      hiddenRows.hide().attr('aria-hidden', 'true');
      button.attr('aria-expanded', 'false');
      button.html(
        '<i class="fas fa-chevron-down mr-2" aria-hidden="true"></i>' +
        'Show ' + hiddenCount + ' more items'
      );
      
      // Announce to screen readers
      announceToScreenReader('Table collapsed to show top 5 items');
      
      // Scroll to table top for better UX
      table.get(0).scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      console.log('Table collapsed - showing top 5 items');
    } else {
      // Show the extra rows
      hiddenRows.show().attr('aria-hidden', 'false');
      button.attr('aria-expanded', 'true');
      button.html(
        '<i class="fas fa-chevron-up mr-2" aria-hidden="true"></i>' +
        'Show fewer items'
      );
      
      // Announce to screen readers
      announceToScreenReader('Table expanded to show all ' + (hiddenCount + 5) + ' items');
      
      console.log('Table expanded - showing all', (hiddenCount + 5), 'items');
    }
  }

  // Expandable KPI Dashboard Functions
  
  // Initialize the expandable KPI dashboard
  function initializeExpandableKPIs() {
    console.log('Initializing expandable KPI dashboard');
    
    // Set up collapse/expand functionality
    setupKPICollapse();
    
    // Load initial KPI metrics
    loadKPIMetrics();
    
    // Load insight data
    loadInsightData();
    
    // Initialize table functionality for embedded tables
    initializeTop10Tables();
    
    // Initialize Bootstrap collapse components if available
    if (typeof $.fn.collapse !== 'undefined') {
      $('.kpi-header').on('click', function() {
        var target = $(this).data('target');
        var isExpanded = $(this).attr('aria-expanded') === 'true';
        $(this).attr('aria-expanded', !isExpanded);
        $(target).collapse('toggle');
      });
    }
  }

  // Set up KPI section collapse functionality
  function setupKPICollapse() {
    $('.kpi-header').each(function() {
      var $header = $(this);
      var target = $header.data('target');
      var $target = $(target);
      
      // Ensure collapsed state by default
      $header.attr('aria-expanded', 'false');
      $target.removeClass('show').addClass('collapse');
      
      $header.on('click', function(e) {
        e.preventDefault();
        toggleKPISection($header, $target);
      });
      
      // Keyboard accessibility
      $header.on('keydown', function(e) {
        // Space or Enter key
        if (e.which === 32 || e.which === 13) {
          e.preventDefault();
          toggleKPISection($header, $target);
        }
      });
    });
  }

  // Toggle KPI section with proper accessibility
  function toggleKPISection($header, $target) {
    var isExpanded = $header.attr('aria-expanded') === 'true';
    var newState = !isExpanded;
    
    // Update aria-expanded
    $header.attr('aria-expanded', newState.toString());
    
    // Update visual state
    if (newState) {
      $target.removeClass('collapse').addClass('show');
      $header.find('.kpi-expand-icon i').removeClass('fa-chevron-right').addClass('fa-chevron-down');
    } else {
      $target.removeClass('show').addClass('collapse');
      $header.find('.kpi-expand-icon i').removeClass('fa-chevron-down').addClass('fa-chevron-right');
    }
    
    // Announce state change to screen readers
    var announcement = $header.find('.kpi-title').text() + ' section ' + (newState ? 'expanded' : 'collapsed');
    announceToScreenReader(announcement);
  }

  // Announce changes to screen readers
  function announceToScreenReader(message) {
    var $announcement = $('#sr-announcements');
    if ($announcement.length === 0) {
      $announcement = $('<div>', {
        id: 'sr-announcements',
        'aria-live': 'polite',
        'aria-atomic': 'true',
        'class': 'sr-only'
      }).appendTo('body');
    }
    $announcement.text(message);
  }

  // Load KPI summary metrics
  function loadKPIMetrics() {
    // Prevent multiple simultaneous loads
    if (window.dsfKPILoading) {
      console.log('KPI metrics already loading, skipping...');
      return;
    }
    
    var timeRange = getCurrentTimeRange();
    console.log('Loading KPI metrics for:', timeRange, 'in mode:', dataMode);
    
    window.dsfKPILoading = true;
    
    if (dataMode === 'real') {
      // Load real KPI data from API
      loadRealKPIData(timeRange);
    } else {
      // Use mock KPI data
      loadMockKPIData(timeRange);
    }
    
    // Reset loading flag after a delay
    setTimeout(() => {
      window.dsfKPILoading = false;
    }, 2000);
  }
  
  // Load real KPI data from Matomo API
  function loadRealKPIData(timeRange) {
    const params = getTimeRangeParams(timeRange);
    
    // Get multiple metrics from Matomo
    const apiCalls = [
      { method: 'VisitsSummary.getUniqueVisitors', target: 'unique-users' },
      { method: 'VisitsSummary.getVisits', target: 'total-sessions' },
      { method: 'Events.getAction', target: 'services-investigated' },
      { method: 'Goals.get', target: 'service-selections' }
    ];
    
    apiCalls.forEach(function(call) {
      const apiUrl = '/admin/reports/dsf-analytics/api/matomo?' + 
                     'method=' + encodeURIComponent(call.method) +
                     '&period=' + encodeURIComponent(params.period) +
                     '&date=' + encodeURIComponent(params.date);
      
      $.get(apiUrl)
        .done(function(response) {
          console.log('KPI API response for', call.method, ':', response);
          
          let value = 0;
          if (response.mock) {
            // Extract value from mock data
            if (response.data && typeof response.data === 'object') {
              value = response.data.value || Object.keys(response.data).length || 0;
            }
          } else {
            // Extract value from real Matomo data
            if (response.data) {
              if (typeof response.data === 'number') {
                value = response.data;
              } else if (response.data.value) {
                value = response.data.value;
              } else if (Array.isArray(response.data)) {
                value = response.data.length;
              }
            }
          }
          
          // Update the corresponding KPI display
          updateKPIDisplay(call.target, value);
        })
        .fail(function(xhr, status, error) {
          console.error('KPI API call failed for', call.method, ':', error);
          console.log('XHR status:', xhr.status, 'Response:', xhr.responseText);
          
          // Display inline error in UI for development
          const errorObj = new Error(`API call failed for ${call.method}: ${error}`);
          errorObj.stack = `API Call: ${call.method}\nStatus: ${xhr.status}\nResponse: ${xhr.responseText}\nURL: ${apiUrl}`;
          displayInlineError('kpi-unique-users', errorObj, `KPI Data Loading - ${call.target}`);
          
          console.error('Unable to load real data for', call.target, '- API endpoint unavailable');
          
          // Do NOT fall back to mock data - show error state instead
          updateKPIDisplay(call.target, 'Error');
        });
    });
  }
  
  // Track KPI errors for summary indicator (using global window.kpiErrors)
  
  // Update individual KPI display
  function updateKPIDisplay(target, value) {
    let formattedValue;
    
    if (value === 'Error' || value === null || value === undefined) {
      formattedValue = '<span class="text-danger">Error</span>';
      window.kpiErrors[target] = true;
    } else {
      formattedValue = formatNumber(value);
      window.kpiErrors[target] = false;
    }
    
    // Update the KPI summary error indicator
    updateKPISummaryIndicator();
    
    switch(target) {
      case 'unique-users':
        $('#kpi-unique-users').html(formattedValue);
        break;
      case 'total-sessions':
        $('#kpi-total-sessions').html(formattedValue);
        break;
      case 'services-investigated':
        $('#kpi-services-investigated').html(formattedValue);
        break;
      case 'service-selections':
        $('#kpi-service-selections').html(formattedValue);
        break;
    }
  }
  
  // Update KPI summary error indicator
  function updateKPISummaryIndicator() {
    console.log('Updating KPI summary indicators for each section...');
    console.log('Current KPI errors:', window.kpiErrors);
    console.log('Current Table errors:', window.tableErrors);
    
    // Target all .kpi-summary elements individually
    const kpiSummaryElements = jQuery('.kpi-summary');
    console.log('Found .kpi-summary elements:', kpiSummaryElements.length);
    
    // Remove existing error indicators from all sections
    kpiSummaryElements.find('.kpi-error-indicator').remove();
    jQuery('.kpi-error-indicator').remove(); // Global cleanup
    
    // Process each .kpi-summary section individually
    kpiSummaryElements.each(function(index) {
      const $section = jQuery(this);
      const sectionId = $section.attr('id') || $section.data('section') || $section.closest('[id]').attr('id') || `section-${index}`;
      
      console.log(`Processing section ${index}: ${sectionId}`);
      
      // Determine which errors belong to this section
      let sectionErrorCount = 0;
      let errorTypes = [];
      
      // Check for KPI errors in this section
      const kpiErrorsInSection = [];
      if (sectionId.includes('kpi') || $section.find('#kpi-unique-users, #kpi-total-sessions, #kpi-services-investigated, #kpi-service-selections').length > 0) {
        // This is a KPI section
        Object.keys(window.kpiErrors).forEach(kpiKey => {
          if (window.kpiErrors[kpiKey] === true) {
            kpiErrorsInSection.push(kpiKey);
            sectionErrorCount++;
          }
        });
        if (kpiErrorsInSection.length > 0) {
          errorTypes.push(`${kpiErrorsInSection.length} KPI`);
        }
      }
      
      // Check for table errors in this section  
      const tableErrorsInSection = [];
      Object.keys(window.tableErrors).forEach(tableKey => {
        if (window.tableErrors[tableKey] === true) {
          // Check if this table belongs to this section
          const tableElement = jQuery(`#table-${tableKey}, [data-category="${tableKey}"]`);
          if (tableElement.length > 0 && (tableElement.closest('.kpi-summary').is($section) || $section.find(tableElement).length > 0)) {
            tableErrorsInSection.push(tableKey);
            sectionErrorCount++;
          }
        }
      });
      if (tableErrorsInSection.length > 0) {
        errorTypes.push(`${tableErrorsInSection.length} table`);
      }
      
      console.log(`Section ${sectionId} has ${sectionErrorCount} errors:`, { kpi: kpiErrorsInSection, table: tableErrorsInSection });
      
      // Add error indicator if this section has errors
      if (sectionErrorCount > 0) {
        const errorText = errorTypes.length > 0 ? errorTypes.join(', ') : 'data';
        const errorIndicator = `<span class="kpi-error-indicator ml-2" style="color: #dc3545; font-weight: bold; font-size: 0.9em;" title="${errorText} error(s) in this section - expand to see details">⚠ ${sectionErrorCount} error${sectionErrorCount > 1 ? 's' : ''}</span>`;
        
        $section.append(errorIndicator);
        console.log(`Added error indicator to section ${sectionId}: ${sectionErrorCount} errors`);
      } else {
        console.log(`No errors in section ${sectionId}`);
      }
    });
    
    // Fallback: if no .kpi-summary elements found, use global approach
    if (kpiSummaryElements.length === 0) {
      console.log('No .kpi-summary elements found, using fallback approach...');
      
      const hasKpiErrors = Object.values(window.kpiErrors).some(error => error === true);
      const hasTableErrors = Object.values(window.tableErrors).some(error => error === true);
      
      if (hasKpiErrors || hasTableErrors) {
        const totalErrorCount = Object.values(window.kpiErrors).filter(e => e === true).length + 
                              Object.values(window.tableErrors).filter(e => e === true).length;
        
        const fallbackSelectors = ['.kpi-summary-header', '.dsf-expandable-kpi h3', '.card-header'];
        
        for (let selector of fallbackSelectors) {
          const elements = jQuery(selector);
          if (elements.length > 0) {
            const errorIndicator = `<span class="kpi-error-indicator ml-2" style="color: #dc3545; font-weight: bold; font-size: 0.9em;" title="${totalErrorCount} error(s) - expand to see details">⚠ ${totalErrorCount} error${totalErrorCount > 1 ? 's' : ''}</span>`;
            elements.first().append(errorIndicator);
            console.log('Added fallback error indicator');
            break;
          }
        }
      }
    }
  }
  
  // Make updateKPISummaryIndicator globally available for debugging
  window.updateKPISummaryIndicator = updateKPISummaryIndicator;
  
  // Load mock KPI data (existing functionality)
  function loadMockKPIData(timeRange) {
    // Get scaling factor for the current time range
    var scalingFactor = getTimeRangeMultiplier(timeRange);
    
    // Simulate loading metrics with realistic data scaled by time range
    setTimeout(function() {
      // User Engagement KPI
      var uniqueUsers = Math.round(1200 * scalingFactor);
      var totalSessions = Math.round(1800 * scalingFactor);
      $('#kpi-unique-users').text(formatNumber(uniqueUsers));
      $('#kpi-total-sessions').text(formatNumber(totalSessions));
      $('#trend-user-engagement').html('<i class="fas fa-arrow-up text-success"></i> +12% vs last period');
      
      // Service Discovery KPI  
      var servicesInvestigated = Math.round(520 * scalingFactor);
      var searchQueries = Math.round(890 * scalingFactor);
      $('#kpi-services-investigated').text(formatNumber(servicesInvestigated));
      $('#kpi-search-queries').text(formatNumber(searchQueries));
      $('#trend-service-discovery').html('<i class="fas fa-arrow-up text-success"></i> +8% vs last period');
      
      // Selection Success KPI
      var serviceSelections = Math.round(380 * scalingFactor);
      var filterUsage = Math.round(650 * scalingFactor);
      $('#kpi-service-selections').text(formatNumber(serviceSelections));
      $('#kpi-filter-usage').text(formatNumber(filterUsage));
      $('#trend-selection-success').html('<i class="fas fa-arrow-up text-success"></i> +15% vs last period');
      
      // Additional insights
      $('#trend-additional-insights').html('<i class="fas fa-lightbulb text-warning"></i> 3 optimization opportunities');
      
    }, 500);
  }

  // Load insight card data
  function loadInsightData() {
    setTimeout(function() {
      // Usage patterns insight
      $('.insight-card[data-insight="usage-patterns"] .insight-content').html(
        '<div class="small">' +
        '<div class="mb-2"><strong>Top Path:</strong> Browse → Filter → Service Details (34%)</div>' +
        '<div class="mb-2"><strong>Avg Steps:</strong> 3.2 interactions per successful selection</div>' +
        '<div><strong>Drop-off:</strong> Most exits occur at filter stage (22%)</div>' +
        '</div>'
      );
      
      // Engagement patterns insight
      $('.insight-card[data-insight="engagement-patterns"] .insight-content').html(
        '<div class="small">' +
        '<div class="mb-2"><strong>Search optimization:</strong> 28% of searches return 0 results</div>' +
        '<div class="mb-2"><strong>Filter clarity:</strong> "Research Support" filter underutilized</div>' +
        '<div><strong>Mobile UX:</strong> 18% higher bounce rate on mobile devices</div>' +
        '</div>'
      );
      
      // Workflow stages insight
      $('.insight-card[data-insight="workflow-stages"] .insight-content').html(
        '<div class="small">' +
        '<div class="mb-2"><strong>High performers:</strong> Library Research, Data Management</div>' +
        '<div class="mb-2"><strong>Conversion rate:</strong> 67% browse-to-selection average</div>' +
        '<div><strong>Session completion:</strong> 4.2 min average successful session</div>' +
        '</div>'
      );
      
      // Selection sessions insight
      $('.insight-card[data-insight="selection-sessions"] .insight-content').html(
        '<div class="small">' +
        '<div class="mb-2"><strong>User satisfaction:</strong> 89% complete intended workflow</div>' +
        '<div class="mb-2"><strong>Repeat usage:</strong> 72% return within 30 days</div>' +
        '<div><strong>Support requests:</strong> 0.3% sessions generate help tickets</div>' +
        '</div>'
      );
    }, 800);
  }

  // Helper function to format numbers with commas
  function formatNumber(num) {
    if (num >= 1000) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    return num.toString();
  }

  // Generate comprehensive weekly usage data for heatmap
  function generateWeeklyUsageData(multiplier) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const hours = [];
    
    // Generate 24-hour periods
    for (let h = 0; h < 24; h++) {
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? 'AM' : 'PM';
      hours.push(`${hour12}:00 ${ampm}`);
    }
    
    const weeklyData = [];
    
    days.forEach((day, dayIndex) => {
      hours.forEach((hour, hourIndex) => {
        // Generate realistic usage patterns
        let baseActivity = 20; // Base activity level
        
        // Weekend reduction
        if (dayIndex >= 5) {
          baseActivity *= 0.3;
        }
        
        // Business hours boost (9 AM - 5 PM)
        const hour24 = hourIndex;
        if (hour24 >= 9 && hour24 <= 17) {
          baseActivity *= 3.5;
        }
        
        // Peak times boost
        if ((hour24 >= 10 && hour24 <= 11) || (hour24 >= 14 && hour24 <= 15)) {
          baseActivity *= 1.8;
        }
        
        // Late night reduction
        if (hour24 >= 22 || hour24 <= 6) {
          baseActivity *= 0.1;
        }
        
        // Tuesday-Thursday boost
        if (dayIndex >= 1 && dayIndex <= 3) {
          baseActivity *= 1.3;
        }
        
        // Add some randomness
        const randomFactor = 0.7 + (Math.random() * 0.6);
        const activity = Math.round(baseActivity * randomFactor * multiplier);
        
        weeklyData.push({
          day: day,
          hour: hour,
          hourIndex: hourIndex,
          dayIndex: dayIndex,
          activity: activity
        });
      });
    });
    
    return weeklyData;
  }

  // Render weekly usage heatmap
  function renderWeeklyHeatmap(data) {
    const canvas = document.getElementById('weekly-usage-heatmap');
    if (!canvas) {
      // Display inline error in UI for development
      const errorObj = new Error('Weekly heatmap canvas element not found');
      errorObj.stack = 'Function: renderWeeklyHeatmap()\nExpected element ID: weekly-usage-heatmap\nCheck template: analytics-dashboard.html.twig\nCanvas required for: Heatmap visualization';
      displayInlineError('peak-hours-heatmap', errorObj, 'Heatmap Canvas Missing');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Set up dimensions
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const margin = { top: 30, right: 20, bottom: 20, left: 40 };
    const graphWidth = canvasWidth - margin.left - margin.right;
    const graphHeight = canvasHeight - margin.top - margin.bottom;
    
    const cellWidth = graphWidth / 24; // 24 hours
    const cellHeight = graphHeight / 7; // 7 days
    
    // Find max activity for color scaling
    const maxActivity = Math.max(...data.map(d => d.activity));
    
    // Color scale (GitHub-style)
    const getActivityColor = (activity) => {
      const intensity = activity / maxActivity;
      if (intensity === 0) return '#ebedf0';
      if (intensity <= 0.25) return '#c6e48b';
      if (intensity <= 0.5) return '#7bc96f';
      if (intensity <= 0.75) return '#239a3b';
      return '#196127';
    };
    
    // Draw cells
    data.forEach(item => {
      const x = margin.left + (item.hourIndex * cellWidth);
      const y = margin.top + (item.dayIndex * cellHeight);
      
      ctx.fillStyle = getActivityColor(item.activity);
      ctx.fillRect(x, y, cellWidth - 1, cellHeight - 1);
      
      // Add border for accessibility
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, cellWidth - 1, cellHeight - 1);
    });
    
    // Draw labels
    ctx.fillStyle = '#333333';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    
    // Hour labels (every 3 hours)
    for (let h = 0; h < 24; h += 3) {
      const x = margin.left + (h * cellWidth) + (cellWidth / 2);
      const y = margin.top - 5;
      const hour12 = h === 0 ? '12a' : h > 12 ? `${h-12}p` : h === 12 ? '12p' : `${h}a`;
      ctx.fillText(hour12, x, y);
    }
    
    // Day labels
    ctx.textAlign = 'right';
    days.forEach((day, index) => {
      const x = margin.left - 5;
      const y = margin.top + (index * cellHeight) + (cellHeight / 2) + 4;
      ctx.fillText(day, x, y);
    });
    
    // Add title
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('Weekly Activity Pattern', canvasWidth / 2, 15);
  }
  
  // Populate busiest and quietest times statistical tables
  function populateUsageStatistics(data) {
    // Sort data by activity level
    const sortedData = [...data].sort((a, b) => b.activity - a.activity);
    
    // Get top 5 busiest times
    const busiestTimes = sortedData.slice(0, 5);
    populateUsageTable('busiest-times-table', busiestTimes, 'busiest');
    
    // Get top 5 quietest times (exclude zero activity times)
    const nonZeroData = sortedData.filter(item => item.activity > 0);
    const quietestTimes = nonZeroData.slice(-5).reverse();
    populateUsageTable('quietest-times-table', quietestTimes, 'quietest');
  }

  // Populate individual usage statistics table
  function populateUsageTable(tableId, data, type) {
    const tbody = $('#' + tableId + ' tbody');
    if (!tbody.length) return;
    
    tbody.empty();
    
    data.forEach((item, index) => {
      const rank = index + 1;
      const formattedTime = formatTimeDisplay(item.hour);
      const activityDisplay = item.activity.toLocaleString();
      
      // Create activity bar width (normalize to percentage of max in this dataset)
      const maxActivity = Math.max(...data.map(d => d.activity));
      const barWidth = Math.round((item.activity / maxActivity) * 100);
      
      const row = $('<tr>').html([
        '<td class="small">',
        `<span class="usage-rank ${type}">${rank}</span>`,
        `<strong>${formattedTime}</strong>`,
        '</td>',
        `<td class="small">${item.day.substring(0, 3)}</td>`,
        '<td class="small">',
        `<div><strong>${activityDisplay}</strong></div>`,
        `<div class="activity-bar ${type === 'busiest' ? 'high' : 'low'}" style="width: ${barWidth}%;"></div>`,
        '</td>'
      ].join(''));
      
      tbody.append(row);
    });
  }

  // Format time display for better readability
  function formatTimeDisplay(timeString) {
    // Convert "10:00 AM" to "10 AM", "2:00 PM" to "2 PM"
    return timeString.replace(':00', '');
  }

})(jQuery, Drupal);