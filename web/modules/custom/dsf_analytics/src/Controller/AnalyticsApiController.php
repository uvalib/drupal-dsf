<?php

namespace Drupal\dsf_analytics\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Config\ConfigFactoryInterface;
use GuzzleHttp\ClientInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * API Controller for DSF Analytics data.
 */
class AnalyticsApiController extends ControllerBase {

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The HTTP client.
   *
   * @var \GuzzleHttp\ClientInterface
   */
  protected $httpClient;

  /**
   * Constructs a new AnalyticsApiController object.
   */
  public function __construct(ConfigFactoryInterface $config_factory, ClientInterface $http_client) {
    $this->configFactory = $config_factory;
    $this->httpClient = $http_client;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('config.factory'),
      $container->get('http_client')
    );
  }

  /**
   * Proxy Matomo API requests.
   */
  public function matomoProxy(Request $request) {
    $config = \Drupal::config('dsf_analytics.settings');
    $data_mode = $config->get('data_mode') ?: 'mock';
    
    // Return mock data if not in real mode
    if ($data_mode !== 'real') {
      $method = $request->query->get('method', 'unknown');
      return new JsonResponse([
        'success' => TRUE,
        'mock' => TRUE,
        'data' => $this->getMockData($method),
        'data_mode' => $data_mode,
        'message' => 'Displaying demo data (data mode: ' . $data_mode . ')'
      ]);
    }

    // Real data mode - check if API token is configured
    $api_token = $config->get('api_token');
    if (empty($api_token)) {
      return new JsonResponse([
        'error' => 'Matomo token not configured - using mock data',
        'mock' => TRUE,
        'data' => $this->getMockData($request->query->get('method', 'unknown'))
      ]);
    }

    // Get parameters from request
    $method = $request->query->get('method');
    $period = $request->query->get('period', 'week');
    $date = $request->query->get('date', 'today');
    
    // Build Matomo API URL using consistent configuration
    $matomo_url = 'https://analytics.lib.virginia.edu';
    $site_id = 66;
    
    $api_url = $matomo_url . '/index.php?module=API'
      . '&method=' . urlencode($method)
      . '&idSite=' . urlencode($site_id)
      . '&period=' . urlencode($period)
      . '&date=' . urlencode($date)
      . '&format=json'
      . '&token_auth=' . urlencode($api_token);

    try {
      $response = $this->httpClient->request('GET', $api_url, [
        'timeout' => 10,
        'headers' => [
          'User-Agent' => 'Drupal DSF Analytics Dashboard',
        ],
      ]);

      $data = json_decode($response->getBody()->getContents(), TRUE);
      
      // Check if we got meaningful data for facet-related methods
      if (in_array($method, ['Events.getAction', 'Events.getName', 'Events.getCategory'])) {
        if (empty($data) || !is_array($data) || count($data) === 0) {
          return new JsonResponse([
            'success' => TRUE,
            'mock' => FALSE,
            'data' => [],
            'method' => $method,
            '_status' => 'no_data_available',
            '_message' => 'Connected to Matomo successfully, but no analytics events have been recorded yet for this method. Data will appear here once the application is deployed and users start interacting with the DSF.'
          ]);
        }
      }
      
      return new JsonResponse([
        'success' => TRUE,
        'mock' => FALSE,
        'data' => $data,
        'method' => $method,
      ]);

    } catch (\Exception $e) {
      \Drupal::logger('dsf_analytics')->error('Matomo API error for method @method: @error', [
        '@method' => $method,
        '@error' => $e->getMessage(),
      ]);

      return new JsonResponse([
        'error' => 'Failed to fetch data from Matomo: ' . $e->getMessage(),
        'mock' => TRUE,
        'data' => $this->getMockData($method),
      ]);
    }
  }

  /**
   * Get facet statistics from Matomo.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with facet statistics.
   */
  public function getFacetStats() {
    // Check if we should use real data
    $config = \Drupal::config('dsf_analytics.settings');
    $data_mode = $config->get('data_mode') ?: 'mock';
    
    // Debug logging
    \Drupal::logger('dsf_analytics')->info('getFacetStats: data_mode = @mode', ['@mode' => $data_mode]);
    
    if ($data_mode === 'real') {
      \Drupal::logger('dsf_analytics')->info('getFacetStats: Using real data path');
      return $this->getRealFacetStats();
    }
    
    \Drupal::logger('dsf_analytics')->info('getFacetStats: Using mock data path');
    // Return mock data for development/testing
    $data = [
      'most_popular' => [
        ['facet' => 'Access Level', 'value' => 'Restricted', 'selections' => 892],
        ['facet' => 'Data Type', 'value' => 'Research Data', 'selections' => 756],
        ['facet' => 'Storage Duration', 'value' => 'Long-term', 'selections' => 634],
        ['facet' => 'Backup Required', 'value' => 'Yes', 'selections' => 587],
        ['facet' => 'Data Size', 'value' => 'Large (>1TB)', 'selections' => 445],
      ],
      'least_popular' => [
        ['facet' => 'Compliance', 'value' => 'None Required', 'selections' => 43],
        ['facet' => 'Access Level', 'value' => 'Public', 'selections' => 54],
        ['facet' => 'Backup Required', 'value' => 'No', 'selections' => 76],
        ['facet' => 'Data Size', 'value' => 'Small (<1GB)', 'selections' => 98],
        ['facet' => 'Storage Duration', 'value' => 'Temporary', 'selections' => 123],
      ],
      'total_selections' => 4567,
      'unique_combinations' => 287,
    ];

    return new JsonResponse([
      'data' => $data,
      'mock' => true,
      'error' => 'DSF Analytics Matomo not configured'
    ]);
  }

  /**
   * Get service statistics from Matomo.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with service statistics.
   */
  public function getServiceStats() {
    // Check if we should use real data
    $data_mode = \Drupal::config('dsf_analytics.settings')->get('data_mode') ?: 'mock';
    
    if ($data_mode === 'real') {
      return $this->getRealServiceStats();
    }
    
    // Return mock data for development/testing
    $data = [
      'most_viewed' => [
        ['service' => 'Box Cloud Storage', 'views' => 1456],
        ['service' => 'Libra Research Data Repository', 'views' => 987],
        ['service' => 'Google Workspace for Education', 'views' => 834],
        ['service' => 'HPC (Rivanna) Storage', 'views' => 672],
        ['service' => 'Office 365 OneDrive', 'views' => 589],
      ],
      'least_viewed' => [
        ['service' => 'ORCID Integration', 'views' => 287],
        ['service' => 'Virginia Heritage', 'views' => 234],
        ['service' => 'Research Collaboration Platform', 'views' => 198],
        ['service' => 'Secure File Transfer', 'views' => 167],
        ['service' => 'Data Visualization Tools', 'views' => 134],
      ],
      'total_views' => 8234,
      'unique_services_viewed' => 42,
    ];

    return new JsonResponse([
      'data' => $data,
      'mock' => true,
      'error' => 'DSF Analytics Matomo not configured'
    ]);
  }

  /**
   * Get investigation statistics from Matomo.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with investigation statistics.
   */
  public function getInvestigationStats() {
    // Check if we should use real data
    $data_mode = \Drupal::config('dsf_analytics.settings')->get('data_mode') ?: 'mock';
    
    if ($data_mode === 'real') {
      return $this->getRealInvestigationStats();
    }
    
    // Return mock data for development/testing
    $data = [
      'details_views' => [
        ['service' => 'Box Cloud Storage', 'detail_views' => 234],
        ['service' => 'Libra Research Data Repository', 'detail_views' => 189],
        ['service' => 'HPC (Rivanna) Storage', 'detail_views' => 156],
        ['service' => 'Google Workspace for Education', 'detail_views' => 134],
        ['service' => 'Fedora Research Repository', 'detail_views' => 98],
      ],
      'comparisons' => [
        ['services' => 'Box vs Google Workspace', 'comparisons' => 89],
        ['services' => 'Libra vs Fedora Repository', 'comparisons' => 76],
        ['services' => 'HPC vs Box Storage', 'comparisons' => 54],
        ['services' => 'OneDrive vs Box', 'comparisons' => 43],
        ['services' => 'Dataverse vs Libra', 'comparisons' => 32],
      ],
      'external_clicks' => 654,
      'average_investigation_depth' => 3.2,
    ];

    return new JsonResponse([
      'data' => $data,
      'mock' => true,
      'error' => 'DSF Analytics Matomo not configured'
    ]);
  }

  /**
   * Get real facet statistics from Matomo API.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with real facet statistics.
   */
  private function getRealFacetStats() {
    // Check if API token is configured
    $config = \Drupal::config('dsf_analytics.settings');
    $api_token = $config->get('api_token');
    
    if (empty($api_token)) {
      return new JsonResponse([
        'data' => [
          'most_popular' => [],
          'least_popular' => [],
          'total_selections' => 0,
          'unique_combinations' => 0,
        ],
        'mock' => true,
        'error' => 'Matomo API token not configured'
      ]);
    }
    
    $matomo_data = $this->fetchMatomoData($api_token);
    
    if (!$matomo_data) {
      // Return error response instead of fallback
      return new JsonResponse([
        'data' => [
          'most_popular' => [],
          'least_popular' => [],
          'total_selections' => 0,
          'unique_combinations' => 0,
        ],
        'mock' => true,
        'error' => 'Failed to fetch Matomo data'
      ]);
    }
    
    // Process real Matomo data for facet statistics
    \Drupal::logger('dsf_analytics')->info('getRealFacetStats: Processing @count pages of Matomo data', ['@count' => is_array($matomo_data) ? count($matomo_data) : 0]);
    $facet_stats = $this->processFacetData($matomo_data);
    \Drupal::logger('dsf_analytics')->info('getRealFacetStats: Processed facet stats - most_popular: @count', ['@count' => count($facet_stats['most_popular'] ?? [])]);
    
    // Check if we got meaningful data
    $has_meaningful_data = $facet_stats['total_selections'] > 0 && !empty($facet_stats['most_popular']);
    
    if (!$has_meaningful_data) {
      // We connected to Matomo successfully but no relevant data exists yet
      return new JsonResponse([
        'data' => [
          'most_popular' => [],
          'least_popular' => [],
          'total_selections' => 0,
          'unique_combinations' => 0,
          '_data_source' => 'matomo_api_live',
          '_last_updated' => date('Y-m-d H:i:s'),
          '_status' => 'no_data_available',
          '_message' => 'Connected to Matomo successfully, but no facet interaction events have been recorded yet. Data will appear here once the application is deployed and users start interacting with the search filters.'
        ],
        'mock' => false,
        'error' => null
      ]);
    }
    
    $data = [
      'most_popular' => $facet_stats['most_popular'],
      'least_popular' => $facet_stats['least_popular'],
      'total_selections' => $facet_stats['total_selections'],
      'unique_combinations' => $facet_stats['unique_combinations'],
      '_data_source' => 'matomo_api_live',
      '_last_updated' => date('Y-m-d H:i:s'),
      '_api_token_configured' => TRUE,
    ];

    return new JsonResponse([
      'data' => $data,
      'mock' => false
    ]);
  }

  /**
   * Get real service statistics from Matomo API.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with real service statistics.
   */
  private function getRealServiceStats() {
    $config = \Drupal::config('dsf_analytics.settings');
    $api_token = $config->get('api_token');
    
    if (!$api_token) {
      return new JsonResponse([
        'error' => 'API token not configured. Please configure your Matomo API token in the DSF Analytics settings.',
        'most_viewed' => [],
        'least_viewed' => [],
        'total_views' => 0,
        'unique_services_viewed' => 0
      ], 400);
    }
    
    $matomo_data = $this->fetchMatomoData($api_token);
    
    if ($matomo_data === false) {
      return new JsonResponse([
        'error' => 'Failed to fetch data from Matomo API. Please check your API token and Matomo configuration.',
        'most_viewed' => [],
        'least_viewed' => [],
        'total_views' => 0,
        'unique_services_viewed' => 0
      ], 500);
    }
    
    // Process Matomo data to extract service usage
    $services_stats = [];
    $total_views = 0;
    
    if (is_array($matomo_data)) {
      foreach ($matomo_data as $page) {
        if (isset($page['label']) && strpos($page['label'], '/services/') !== false) {
          $service_name = str_replace('/services/', '', $page['label']);
          $service_name = str_replace('/', '', $service_name);
          
          if (!empty($service_name)) {
            $views = $page['nb_visits'] ?? 0;
            $total_views += $views;
            
            $services_stats[] = [
              'service' => ucwords(str_replace('-', ' ', $service_name)),
              'views' => $views,
            ];
          }
        }
      }
    }
    
    // Sort by views descending
    usort($services_stats, function($a, $b) {
      return $b['views'] - $a['views'];
    });
    
    $data = [
      'most_viewed' => array_slice($services_stats, 0, 5),
      'least_viewed' => array_reverse(array_slice($services_stats, -5)),
      'total_views' => $total_views,
      'unique_services_viewed' => count($services_stats),
      '_data_source' => 'matomo_api',
    ];
    
    \Drupal::logger('dsf_analytics')->info('Retrieved real services stats: @count services, @total views', [
      '@count' => count($services_stats),
      '@total' => $total_views,
    ]);

    return new JsonResponse([
      'data' => $data,
      'mock' => false
    ]);
  }

  /**
   * Get real investigation statistics from Matomo API.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with real investigation statistics.
   */
  private function getRealInvestigationStats() {
    $config = \Drupal::config('dsf_analytics.settings');
    $api_token = $config->get('api_token');
    
    if (!$api_token) {
      return new JsonResponse([
        'error' => 'API token not configured. Please configure your Matomo API token in the DSF Analytics settings.',
        'details_views' => [],
        'comparisons' => [],
        'external_clicks' => 0,
        'average_investigation_depth' => 0
      ], 400);
    }
    
    $matomo_data = $this->fetchMatomoData($api_token);
    
    if ($matomo_data === false) {
      return new JsonResponse([
        'error' => 'Failed to fetch data from Matomo API. Please check your API token and Matomo configuration.',
        'details_views' => [],
        'comparisons' => [],
        'external_clicks' => 0,
        'average_investigation_depth' => 0
      ], 500);
    }
    
    // Process Matomo data to extract investigation patterns
    $details_views = [];
    $external_clicks = 0;
    $total_depth = 0;
    $depth_count = 0;
    
    if (is_array($matomo_data)) {
      foreach ($matomo_data as $page) {
        if (isset($page['label'])) {
          // Look for detail page views
          if (strpos($page['label'], '/services/') !== false && strpos($page['label'], '/details') !== false) {
            $service_name = str_replace(['/services/', '/details', '/'], '', $page['label']);
            if (!empty($service_name)) {
              $details_views[] = [
                'service' => ucwords(str_replace('-', ' ', $service_name)),
                'detail_views' => $page['nb_visits'] ?? 0,
              ];
            }
          }
          
          // Count external clicks (approximate)
          if (isset($page['exit_rate'])) {
            $external_clicks += ($page['nb_visits'] * ($page['exit_rate'] / 100));
          }
          
          // Calculate investigation depth (pages per session)
          if (isset($page['avg_page_load_time'])) {
            $total_depth += $page['avg_page_load_time'];
            $depth_count++;
          }
        }
      }
    }
    
    // Sort details views by count
    usort($details_views, function($a, $b) {
      return $b['detail_views'] - $a['detail_views'];
    });
    
    $average_depth = $depth_count > 0 ? round($total_depth / $depth_count, 1) : 0;
    
    $data = [
      'details_views' => array_slice($details_views, 0, 5),
      'comparisons' => [
        // This would require more complex analysis of user sessions
        // For now, returning empty as real comparison data needs session tracking
      ],
      'external_clicks' => round($external_clicks),
      'average_investigation_depth' => $average_depth,
      '_data_source' => 'matomo_api',
    ];
    
    \Drupal::logger('dsf_analytics')->info('Retrieved real investigation stats: @details detail views, @clicks external clicks', [
      '@details' => count($details_views),
      '@clicks' => round($external_clicks),
    ]);

    return new JsonResponse([
      'data' => $data,
      'mock' => false
    ]);
  }

  /**
   * Fetch data from Matomo API.
   *
   * @param string $api_token
   *   Matomo API authentication token.
   *
   * @return array|false
   *   Matomo data or FALSE on failure.
   */
  private function fetchMatomoData($api_token) {
    $matomo_config = \Drupal::config('matomo.settings');
    $site_id = $matomo_config->get('site_id');
    $matomo_url = $matomo_config->get('url_http') ?: $matomo_config->get('url_https');
    
    if (!$site_id || !$matomo_url) {
      \Drupal::logger('dsf_analytics')->error('Matomo not configured properly - missing site_id or URL');
      return FALSE;
    }
    
    // Build Matomo API URL
    $api_url = rtrim($matomo_url, '/') . '/index.php';
    
    $params = [
      'module' => 'API',
      'method' => 'Actions.getPageUrls',
      'idSite' => $site_id,
      'period' => 'range',
      'date' => date('Y-m-d', strtotime('-30 days')) . ',' . date('Y-m-d'),
      'format' => 'json',
      'token_auth' => $api_token,
      'expanded' => 1,
      'flat' => 1,
    ];
    
    $query_string = http_build_query($params);
    $full_url = $api_url . '?' . $query_string;
    
    \Drupal::logger('dsf_analytics')->info('Attempting Matomo API call to: @url', [
      '@url' => str_replace($api_token, '[REDACTED]', $full_url),
    ]);
    
    try {
      $client = \Drupal::httpClient();
      $response = $client->get($full_url, [
        'timeout' => 30,
        'headers' => [
          'User-Agent' => 'DSF Analytics Dashboard',
        ],
      ]);
      
      if ($response->getStatusCode() === 200) {
        $body = $response->getBody()->getContents();
        $data = json_decode($body, TRUE);
        
        // Check for Matomo API errors
        if (isset($data['result']) && $data['result'] === 'error') {
          \Drupal::logger('dsf_analytics')->error('Matomo API error: @message', [
            '@message' => $data['message'] ?? 'Unknown error',
          ]);
          return FALSE;
        }
        
        \Drupal::logger('dsf_analytics')->info('Successfully fetched Matomo data: @count pages', [
          '@count' => is_array($data) ? count($data) : 0,
        ]);
        return $data;
      }
      else {
        \Drupal::logger('dsf_analytics')->error('Matomo API returned status: @status', [
          '@status' => $response->getStatusCode(),
        ]);
      }
    }
    catch (\Exception $e) {
      \Drupal::logger('dsf_analytics')->error('Failed to fetch Matomo data: @error', [
        '@error' => $e->getMessage(),
      ]);
    }
    
    return FALSE;
  }

  /**
   * Process Matomo data to extract facet statistics.
   *
   * @param array $matomo_data
   *   Raw Matomo data.
   *
   * @return array
   *   Processed facet statistics.
   */
  private function processFacetData($matomo_data) {
    $facet_counts = [];
    $total_selections = 0;
    
    if (!is_array($matomo_data)) {
      return $this->getDefaultFacetStats();
    }
    
    foreach ($matomo_data as $page) {
      if (isset($page['label']) && isset($page['nb_visits'])) {
        $url = $page['label'];
        $visits = intval($page['nb_visits']);
        
        // Extract facet information from URL parameters
        $facets = $this->extractFacetsFromUrl($url);
        
        foreach ($facets as $facet_type => $facet_value) {
          if (!isset($facet_counts[$facet_type])) {
            $facet_counts[$facet_type] = [];
          }
          if (!isset($facet_counts[$facet_type][$facet_value])) {
            $facet_counts[$facet_type][$facet_value] = 0;
          }
          $facet_counts[$facet_type][$facet_value] += $visits;
          $total_selections += $visits;
        }
      }
    }
    
    // Sort and get top/bottom facets
    $most_popular = [];
    $least_popular = [];
    
    foreach ($facet_counts as $facet_type => $values) {
      arsort($values);
      $sorted_values = array_slice($values, 0, 5, TRUE);
      
      foreach ($sorted_values as $value => $count) {
        $most_popular[] = [
          'facet' => $facet_type,
          'value' => $value,
          'selections' => $count,
        ];
      }
      
      // Get least popular (reverse order, bottom 2)
      $reverse_values = array_slice(array_reverse($values, TRUE), 0, 2, TRUE);
      foreach ($reverse_values as $value => $count) {
        $least_popular[] = [
          'facet' => $facet_type,
          'value' => $value,
          'selections' => $count,
        ];
      }
    }
    
    // Sort by selection count
    usort($most_popular, function($a, $b) {
      return $b['selections'] - $a['selections'];
    });
    
    usort($least_popular, function($a, $b) {
      return $a['selections'] - $b['selections'];
    });
    
    return [
      'most_popular' => array_slice($most_popular, 0, 5),
      'least_popular' => array_slice($least_popular, 0, 5),
      'total_selections' => $total_selections,
      'unique_combinations' => count($facet_counts),
    ];
  }

  /**
   * Extract facet information from URL parameters.
   *
   * @param string $url
   *   URL to parse.
   *
   * @return array
   *   Extracted facets.
   */
  private function extractFacetsFromUrl($url) {
    $facets = [];
    
    // Parse URL to extract query parameters
    $parsed = parse_url($url);
    if (isset($parsed['query'])) {
      parse_str($parsed['query'], $params);
      
      // Map URL parameters to facet types
      $facet_mapping = [
        'college' => 'College/School',
        'service_type' => 'Service Type',
        'audience' => 'Audience',
        'format' => 'Format',
        'cost' => 'Cost',
        'language' => 'Language',
        'accessibility' => 'Accessibility',
      ];
      
      foreach ($facet_mapping as $param => $facet_type) {
        if (isset($params[$param]) && !empty($params[$param])) {
          $facets[$facet_type] = ucwords(str_replace(['_', '-'], ' ', $params[$param]));
        }
      }
    }
    
    return $facets;
  }

  /**
   * Get default facet stats when no data available.
   *
   * @return array
   *   Default facet statistics.
   */
  private function getDefaultFacetStats() {
    return [
      'most_popular' => [
        ['facet' => 'Data Source', 'value' => 'Live Matomo', 'selections' => 0],
      ],
      'least_popular' => [
        ['facet' => 'Status', 'value' => 'No Data Available', 'selections' => 0],
      ],
      'total_selections' => 0,
      'unique_combinations' => 0,
    ];
  }

  /**
   * Get mock facet stats as fallback.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   Mock facet statistics.
   */
  private function getMockFacetStats() {
    $data = [
      'most_popular' => [
        ['facet' => 'College/School', 'value' => 'Engineering', 'selections' => 245],
        ['facet' => 'Service Type', 'value' => 'Academic Support', 'selections' => 189],
        ['facet' => 'Audience', 'value' => 'Students', 'selections' => 167],
        ['facet' => 'Format', 'value' => 'Online', 'selections' => 134],
        ['facet' => 'Cost', 'value' => 'Free', 'selections' => 98],
      ],
      'least_popular' => [
        ['facet' => 'Language', 'value' => 'Spanish', 'selections' => 12],
        ['facet' => 'Service Type', 'value' => 'Equipment Rental', 'selections' => 8],
        ['facet' => 'Accessibility', 'value' => 'Sign Language', 'selections' => 5],
        ['facet' => 'Format', 'value' => 'Phone Only', 'selections' => 3],
        ['facet' => 'Cost', 'value' => 'Premium', 'selections' => 2],
      ],
      'total_selections' => 1467,
      'unique_combinations' => 89,
      '_data_source' => 'matomo_api_fallback',
      '_note' => 'API call failed, showing fallback data',
    ];

    return new JsonResponse($data);
  }

  /**
   * Generate mock data for fallback when Matomo is unavailable.
   */
  private function getMockData($method) {
    switch ($method) {
      case 'Events.getAction':
        // DSF Facet selections - realistic academic research needs
        return [
          ['label' => 'Selected_Access_Level_Restricted', 'nb_events' => 892],
          ['label' => 'Selected_Data_Type_Research_Data', 'nb_events' => 756],
          ['label' => 'Selected_Storage_Duration_Long_term', 'nb_events' => 634],
          ['label' => 'Selected_Backup_Required_Yes', 'nb_events' => 587],
          ['label' => 'Selected_Data_Size_Large', 'nb_events' => 445],
          ['label' => 'Selected_Collaboration_Required_Yes', 'nb_events' => 398],
          ['label' => 'Selected_Compliance_FERPA', 'nb_events' => 334],
          ['label' => 'Selected_Geographic_Location_US_Only', 'nb_events' => 287],
          ['label' => 'Selected_Access_Level_Departmental', 'nb_events' => 234],
          ['label' => 'Selected_Data_Type_Administrative', 'nb_events' => 198],
        ];

      case 'Events.getName':
        // Service views - actual UVA digital services
        return [
          ['label' => 'Box Cloud Storage', 'nb_events' => 1456],
          ['label' => 'Libra Research Data Repository', 'nb_events' => 987],
          ['label' => 'Google Workspace for Education', 'nb_events' => 834],
          ['label' => 'HPC (Rivanna) Storage', 'nb_events' => 672],
          ['label' => 'Office 365 OneDrive', 'nb_events' => 589],
          ['label' => 'Fedora Research Repository', 'nb_events' => 445],
          ['label' => 'SharePoint Sites', 'nb_events' => 378],
          ['label' => 'Dataverse', 'nb_events' => 334],
          ['label' => 'ORCID Integration', 'nb_events' => 287],
          ['label' => 'Virginia Heritage', 'nb_events' => 234],
        ];

      case 'Events.getCategory':
        // User engagement categories
        return [
          ['label' => 'DSF_Facets', 'nb_events' => 4567],
          ['label' => 'DSF_Services', 'nb_events' => 3234],
          ['label' => 'DSF_Service_Investigation', 'nb_events' => 1876],
          ['label' => 'DSF_Comparisons', 'nb_events' => 987],
          ['label' => 'DSF_External_Links', 'nb_events' => 654],
        ];

      case 'Actions.getPageUrls':
        // DSF page views
        return [
          ['label' => '/digital-service-finder', 'nb_visits' => 2340, 'nb_hits' => 4567],
          ['label' => '/digital-service-finder/results', 'nb_visits' => 1876, 'nb_hits' => 3234],
          ['label' => '/digital-service-finder/service/box-storage', 'nb_visits' => 987, 'nb_hits' => 1234],
          ['label' => '/digital-service-finder/service/libra-repository', 'nb_visits' => 756, 'nb_hits' => 987],
          ['label' => '/digital-service-finder/compare', 'nb_visits' => 543, 'nb_hits' => 756],
        ];

      case 'Referrers.getSearchEngines':
        return [
          ['label' => 'Google', 'nb_visits' => 1876],
          ['label' => 'Direct Access', 'nb_visits' => 1234],
          ['label' => 'UVA Library Website', 'nb_visits' => 756],
          ['label' => 'Bing', 'nb_visits' => 234],
          ['label' => 'DuckDuckGo', 'nb_visits' => 123],
        ];

      case 'DevicesDetection.getOS':
        return [
          ['label' => 'Windows', 'nb_visits' => 2134],
          ['label' => 'macOS', 'nb_visits' => 1567],
          ['label' => 'iOS', 'nb_visits' => 678],
          ['label' => 'Android', 'nb_visits' => 456],
          ['label' => 'Linux', 'nb_visits' => 234],
        ];

      default:
        return [
          ['label' => 'Sample Data Available', 'value' => 1],
        ];
    }
  }

}
