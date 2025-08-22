/**
 * @file
 * DSF Analytics Dashboard - displays human-readable Matomo data
 * 
 * This module provides a simple interface to view key DSF usage statistics
 * directly from Matomo data in an admin dashboard.
 */

(function ($, Drupal, once) {
  'use strict';

  /**
   * Admin dashboard for DSF analytics
   */
  Drupal.behaviors.dsfAnalyticsDashboard = {
    attach: function (context, settings) {
      const dashboards = once('dsf-analytics-dashboard', '.dsf-analytics-dashboard', context);
      dashboards.forEach(function(element) {
        const dashboard = $(element);
        
        // Initialize dashboard if Matomo is available
        // Check for either _paq (from Matomo module) OR our MATOMO_CONFIG
        if (typeof _paq !== 'undefined' || (typeof MATOMO_CONFIG !== 'undefined' && MATOMO_CONFIG.enabled)) {
          initializeDashboard(dashboard);
        }
      });
    }
  };

  /**
   * Initialize the analytics dashboard
   */
  function initializeDashboard(dashboard) {
    // Create dashboard sections
    const sections = [
      {
        title: 'Most Popular Criteria',
        id: 'popular-criteria',
        description: 'Which search criteria are selected most often',
        endpoint: 'Events.getAction',
        params: { 
          segment: 'eventCategory==DSF_Facets;eventAction=@Selected_',
          period: 'month',
          date: 'today'
        }
      },
      {
        title: 'Least Popular Criteria', 
        id: 'unpopular-criteria',
        description: 'Which search criteria are rarely used',
        endpoint: 'Events.getAction',
        params: {
          segment: 'eventCategory==DSF_Facets;eventAction=@Selected_',
          period: 'month', 
          date: 'today',
          filter_sort_order: 'asc'
        }
      },
      {
        title: 'Most Viewed Services',
        id: 'popular-services',
        description: 'Services that users look at most frequently',
        endpoint: 'Events.getName',
        params: {
          segment: 'eventCategory==DSF_Services;eventAction==Service_view',
          period: 'month',
          date: 'today'
        }
      },
      {
        title: 'Most Investigated Services',
        id: 'investigated-services', 
        description: 'Services users investigate in detail (comparisons, external links)',
        endpoint: 'Events.getName',
        params: {
          segment: 'eventCategory==DSF_Service_Investigation',
          period: 'month',
          date: 'today'
        }
      },
      {
        title: 'User Engagement Patterns',
        id: 'engagement-patterns',
        description: 'How users interact with the finder',
        endpoint: 'Events.getCategory',
        params: {
          period: 'week',
          date: 'today'
        }
      }
    ];

    // Build dashboard HTML
    let dashboardHTML = '<div class="dsf-analytics-container">';
    
    sections.forEach(section => {
      dashboardHTML += `
        <div class="analytics-section" id="${section.id}">
          <h3>${section.title}</h3>
          <p class="description">${section.description}</p>
          <div class="analytics-content loading">
            <div class="spinner"></div>
            <span>Loading data...</span>
          </div>
        </div>
      `;
    });
    
    dashboardHTML += '</div>';
    
    dashboard.html(dashboardHTML);
    
    // Load data for each section
    sections.forEach(section => {
      loadSectionData(section);
    });
  }

  /**
   * Load data for a dashboard section
   */
  function loadSectionData(section) {
    const container = $(`#${section.id} .analytics-content`);
    
    // Make actual Matomo API call through our proxy
    const apiUrl = '/admin/reports/dsf-analytics/api/matomo';
    const params = {
      method: section.endpoint,
      period: section.params.period,
      date: section.params.date
    };
    
    $.ajax({
      url: apiUrl,
      method: 'GET',
      data: params,
      dataType: 'json'
    })
    .done(function(response) {
      if (response.mock) {
        console.log(`Using mock data for ${section.endpoint}:`, response.error || 'Matomo not available');
      } else {
        console.log(`Loaded real data for ${section.endpoint}`);
      }
      
      displaySectionData(container, response.data, section, response.mock);
    })
    .fail(function(xhr, status, error) {
      console.error(`Failed to load data for ${section.endpoint}:`, error);
      
      // Fallback to mock data on failure
      const mockData = generateMockData(section.id);
      displaySectionData(container, mockData, section, true);
    });
  }

  /**
   * Display data in a dashboard section
   */
  function displaySectionData(container, data, section, isMock) {
    container.removeClass('loading');
    
    let html = '<div class="analytics-results">';
    
    // Add indicator for mock data
    if (isMock) {
      html += '<div class="mock-data-notice" style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 8px; margin-bottom: 10px; border-radius: 4px; font-size: 12px; color: #856404;">';
      html += '<strong>Note:</strong> Displaying sample data (Matomo not available or not configured)';
      html += '</div>';
    }
    
    // Check for "no data available" status (real Matomo connection but no events yet)
    if (!isMock && data && data._status === 'no_data_available') {
      html += '<div class="no-data-notice" style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 12px; margin-bottom: 10px; border-radius: 4px; font-size: 14px; color: #0c5460;">';
      html += '<strong>Matomo Connected:</strong> ' + (data._message || 'No analytics data available yet.');
      html += '</div>';
      html += '<p style="color: #6c757d; font-style: italic;">Data source: ' + (data._data_source || 'unknown') + '</p>';
      html += '</div>';
      container.html(html);
      return;
    }
    
    if (data && data.length > 0) {
      html += '<table class="analytics-table">';
      html += '<thead><tr><th>Item</th><th class="item-count">Count</th><th class="item-percentage">Percentage</th></tr></thead>';
      html += '<tbody>';
      
      // Handle different Matomo data formats
      const processedData = data.map(item => {
        let name = item.label || item.name || 'Unknown';
        let count = item.nb_visits || item.nb_hits || item.nb_events || item.count || item.value || 0;
        
        return { name, count };
      });
      
      const total = processedData.reduce((sum, item) => sum + item.count, 0);
      
      processedData.forEach((item, index) => {
        const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
        html += `
          <tr class="rank-${index + 1}">
            <td class="item-name">${item.name}</td>
            <td class="item-count">${item.count.toLocaleString()}</td>
            <td class="item-percentage">${percentage}%</td>
          </tr>
        `;
      });
      
      html += '</tbody></table>';
      
      // Add summary stats
      html += `
        <div class="section-summary">
          <p><strong>Total Events:</strong> ${total}</p>
          <p><strong>Unique Items:</strong> ${data.length}</p>
          <p><strong>Time Period:</strong> ${section.params?.period || 'month'}</p>
        </div>
      `;
    } else {
      html += '<p class="no-data">No data available for this time period.</p>';
    }
    
    html += '</div>';
    container.html(html);
  }

  /**
   * Generate mock data for demonstration
   * Realistic DSF usage patterns for UVA academic environment
   */
  function generateMockData(sectionId) {
    const mockData = {
      'popular-criteria': [
        { name: 'Access Level: Restricted', count: 892 },
        { name: 'Data Type: Research Data', count: 756 },
        { name: 'Storage Duration: Long-term', count: 634 },
        { name: 'Backup Required: Yes', count: 587 },
        { name: 'Data Size: Large (>1TB)', count: 445 },
        { name: 'Collaboration Required: Yes', count: 398 },
        { name: 'Compliance: FERPA', count: 334 },
        { name: 'Geographic Location: US Only', count: 287 }
      ],
      'unpopular-criteria': [
        { name: 'Data Type: Administrative', count: 198 },
        { name: 'Access Level: Departmental', count: 234 },
        { name: 'Geographic Location: International', count: 156 },
        { name: 'Storage Duration: Temporary', count: 123 },
        { name: 'Data Size: Small (<1GB)', count: 98 },
        { name: 'Backup Required: No', count: 76 },
        { name: 'Access Level: Public', count: 54 },
        { name: 'Compliance: None Required', count: 43 }
      ],
      'popular-services': [
        { name: 'Box Cloud Storage', count: 1456 },
        { name: 'Libra Research Data Repository', count: 987 },
        { name: 'Google Workspace for Education', count: 834 },
        { name: 'HPC (Rivanna) Storage', count: 672 },
        { name: 'Office 365 OneDrive', count: 589 },
        { name: 'Fedora Research Repository', count: 445 },
        { name: 'SharePoint Sites', count: 378 },
        { name: 'Dataverse', count: 334 }
      ],
      'investigated-services': [
        { name: 'Box Cloud Storage', count: 234 },
        { name: 'Libra Research Data Repository', count: 189 },
        { name: 'HPC (Rivanna) Storage', count: 156 },
        { name: 'Google Workspace for Education', count: 134 },
        { name: 'Fedora Research Repository', count: 98 },
        { name: 'Office 365 OneDrive', count: 87 },
        { name: 'Dataverse', count: 76 },
        { name: 'ORCID Integration', count: 54 }
      ],
      'engagement-patterns': [
        { name: 'Facet Selections', count: 4567 },
        { name: 'Service Views', count: 3234 },
        { name: 'Service Investigations', count: 1876 },
        { name: 'Service Comparisons', count: 987 },
        { name: 'External Link Clicks', count: 654 },
        { name: 'Help Documentation Views', count: 432 },
        { name: 'Contact Form Submissions', count: 234 }
      ]
    };
    
    return mockData[sectionId] || [];
  }

  /**
   * Utility function to fetch real Matomo data
   * Call this function to replace mock data with actual analytics
   */
  window.DSFAnalytics = {
    fetchMatomoData: function(endpoint, params, callback) {
      // Get config from either our MATOMO_CONFIG or drupalSettings.matomo
      const config = typeof MATOMO_CONFIG !== 'undefined' ? MATOMO_CONFIG : {
        url: drupalSettings.matomo?.url_https || drupalSettings.matomo?.url_http || 'https://vah-analytics.lib.virginia.edu/',
        siteId: drupalSettings.matomo?.site_id || 1,
        enabled: drupalSettings.matomo ? true : false
      };
      
      if (!config.enabled) {
        console.warn('Matomo not enabled');
        return;
      }
      
      const apiUrl = `${config.url}?module=API&method=${endpoint}&idSite=${config.siteId}&format=JSON`;
      const queryParams = new URLSearchParams(params).toString();
      const fullUrl = `${apiUrl}&${queryParams}`;
      
      // Note: You'll need to handle CORS and authentication
      // This might require a server-side proxy in your Drupal module
      $.getJSON(fullUrl)
        .done(callback)
        .fail(function(error) {
          console.error('Failed to fetch Matomo data:', error);
        });
    },
    
    refreshDashboard: function() {
      $('.dsf-analytics-dashboard').trigger('refresh');
    }
  };

})(jQuery, Drupal, once);
