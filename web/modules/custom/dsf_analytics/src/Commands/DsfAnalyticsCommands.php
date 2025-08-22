<?php

namespace Drupal\dsf_analytics\Commands;

use Drush\Commands\DrushCommands;

/**
 * Drush commands for DSF Analytics.
 */
class DsfAnalyticsCommands extends DrushCommands {

  /**
   * Toggle between mock and real data mode, or show current mode.
   *
   * @param string $mode
   *   Either 'mock', 'real', or omit to show current mode.
   *
   * @command dsf-analytics:data-mode
   * @aliases dsf-data
   * @usage dsf-analytics:data-mode
   *   Show current data mode and available options.
   * @usage dsf-analytics:data-mode real
   *   Switch to real Matomo data.
   * @usage dsf-analytics:data-mode mock
   *   Switch to mock data for testing.
   */
  public function setDataMode($mode = NULL) {
    $config = \Drupal::configFactory()->getEditable('dsf_analytics.settings');
    
    // If no mode specified, show current status and available options
    if ($mode === NULL) {
      $current_mode = $config->get('data_mode') ?: 'mock';
      $this->output()->writeln('Current data mode: ' . strtoupper($current_mode));
      $this->output()->writeln('');
      $this->output()->writeln('Available modes:');
      $this->output()->writeln('  real - Use live Matomo API data');
      $this->output()->writeln('  mock - Use sample/test data');
      $this->output()->writeln('');
      $this->output()->writeln('Usage:');
      $this->output()->writeln('  drush dsf-data real   # Switch to real data');
      $this->output()->writeln('  drush dsf-data mock   # Switch to mock data');
      $this->output()->writeln('  drush dsf-status      # Show detailed status');
      return;
    }

    if ($mode === 'real') {
      $config->set('data_mode', 'real');
      $this->output()->writeln('[OK] Switched to REAL Matomo data mode.');
      $this->output()->writeln('Dashboard will now attempt to fetch live analytics.');
    }
    elseif ($mode === 'mock') {
      $config->set('data_mode', 'mock');
      $this->output()->writeln('[OK] Switched to MOCK data mode.');
      $this->output()->writeln('Dashboard will show sample/test data.');
    }
    else {
      $this->output()->writeln('[ERROR] Invalid mode: "' . $mode . '"');
      $this->output()->writeln('Valid options are: real, mock');
      $this->output()->writeln('Or run without arguments to see current status.');
      return;
    }

    $config->save();

    // Clear cache to ensure changes take effect.
    \Drupal::cache()->deleteAll();
    $this->output()->writeln('Cache cleared. Changes will take effect immediately.');
  }

  /**
   * Show current data mode status.
   *
   * @command dsf-analytics:status
   * @aliases dsf-status
   */
  public function getStatus() {
    $config = \Drupal::config('dsf_analytics.settings');
    $data_mode = $config->get('data_mode') ?: 'mock';

    if ($data_mode === 'real') {
      $this->output()->writeln('Current mode: REAL data (Matomo API)');
      
      // Check API token status
      $api_token = $config->get('api_token');
      if ($api_token) {
        $this->output()->writeln('API Token: Configured (' . substr($api_token, 0, 8) . '...)');
        
        // Test token validation
        $this->output()->writeln('Validating token...');
        $validation_result = $this->validateTokenQuietly($api_token);
        
        if ($validation_result['valid']) {
          $this->output()->writeln('Token Status: [VALID] ' . $validation_result['site_name']);
        }
        else {
          $this->output()->writeln('Token Status: [INVALID] ' . $validation_result['error']);
          $this->output()->writeln('Use "drush dsf-token YOUR_TOKEN" to update with a valid token.');
        }
      }
      else {
        $this->output()->writeln('API Token: [WARNING] Not configured');
        $this->output()->writeln('Configure at: /admin/config/system/dsf-analytics');
      }
    }
    else {
      $this->output()->writeln('Current mode: MOCK data (samples)');
    }

    // Check Matomo module status.
    $matomo_config = \Drupal::config('matomo.settings');
    $matomo_enabled = $matomo_config->get('site_id');

    if ($matomo_enabled) {
      $site_id = $matomo_config->get('site_id');
      $url = $matomo_config->get('url_http') ?: $matomo_config->get('url_https');
      $this->output()->writeln("Matomo configured: {$url} (Site ID: {$site_id})");
    }
    else {
      $this->output()->writeln('Matomo module not configured');
    }
  }

  /**
   * Set or update the Matomo API token.
   *
   * @param string $token
   *   The Matomo API token to configure.
   * @param array $options
   *   Command options.
   *
   * @command dsf-analytics:set-token
   * @aliases dsf-token
   * @option force Skip token validation and save directly
   * @usage dsf-analytics:set-token abc123def456
   *   Set the Matomo API token to 'abc123def456'
   * @usage dsf-analytics:set-token abc123def456 --force
   *   Set the token without validation (development use)
   */
  public function setApiToken($token, array $options = ['force' => FALSE]) {
    if (empty($token)) {
      $this->output()->writeln('[ERROR] API token cannot be empty.');
      $this->output()->writeln('Usage: drush dsf-token YOUR_API_TOKEN');
      return;
    }

    // Validate token format (basic check)
    if (strlen($token) < 16) {
      $this->output()->writeln('[WARNING] API token seems short. Matomo tokens are typically 32+ characters.');
      if (!$options['force']) {
        $this->output()->writeln('Continuing with validation...');
      }
    }

    // Skip validation if --force flag is used
    if ($options['force']) {
      $this->output()->writeln('[WARNING] Skipping token validation (--force used)');
      $this->output()->writeln('Token: ' . substr($token, 0, 8) . str_repeat('*', strlen($token) - 8));
      
      $config = \Drupal::configFactory()->getEditable('dsf_analytics.settings');
      $config->set('api_token', $token);
      $config->save();

      $this->output()->writeln('[OK] API token saved (unvalidated).');
      
      // Clear cache and show mode
      \Drupal::cache()->deleteAll();
      $this->output()->writeln('Cache cleared. Token is now active.');
      
      $use_real_data = $config->get('use_real_data') ?: FALSE;
      if ($use_real_data) {
        $this->output()->writeln('System is in REAL data mode - token will be used immediately.');
        $this->output()->writeln('Use "drush dsf-test" to verify the token works.');
      }
      else {
        $this->output()->writeln('System is in MOCK data mode. Use "drush dsf-data real" to enable API calls.');
      }
      return;
    }

    $this->output()->writeln('Validating API token...');
    $this->output()->writeln('Token: ' . substr($token, 0, 8) . str_repeat('*', strlen($token) - 8));

    // Check Matomo module configuration first
    $matomo_config = \Drupal::config('matomo.settings');
    $site_id = $matomo_config->get('site_id');
    $matomo_url = $matomo_config->get('url_http') ?: $matomo_config->get('url_https');
    
    if (!$site_id || !$matomo_url) {
      $this->output()->writeln('[ERROR] Matomo module not properly configured.');
      $this->output()->writeln('Please configure Matomo module first with site_id and URL.');
      $this->output()->writeln('Or use --force to skip validation: drush dsf-token TOKEN --force');
      return;
    }

    // Test the token against Matomo API
    try {
      $api_url = rtrim($matomo_url, '/') . '/index.php';
      $params = [
        'module' => 'API',
        'method' => 'SitesManager.getSiteFromId',
        'idSite' => $site_id,
        'format' => 'json',
        'token_auth' => $token,
      ];
      
      $query_string = http_build_query($params);
      $full_url = $api_url . '?' . $query_string;
      
      $client = \Drupal::httpClient();
      $response = $client->get($full_url, [
        'timeout' => 10,
        'headers' => [
          'User-Agent' => 'DSF Analytics Token Validation',
        ],
      ]);
      
      if ($response->getStatusCode() === 200) {
        $body = $response->getBody()->getContents();
        $data = json_decode($body, TRUE);
        
        // Check for API errors
        if (isset($data['result']) && $data['result'] === 'error') {
          $this->output()->writeln('[ERROR] Invalid API token: ' . ($data['message'] ?? 'Unknown error'));
          if (strpos($data['message'], 'token_auth') !== false) {
            $this->output()->writeln('The token is invalid, expired, or lacks permissions.');
          }
          return;
        }
        
        // Validate response format
        if (isset($data['name']) || isset($data[0]['name'])) {
          $site_name = $data['name'] ?? $data[0]['name'] ?? 'Unknown';
          $this->output()->writeln('[SUCCESS] Token validated successfully!');
          $this->output()->writeln('Connected to site: ' . $site_name);
        }
        else {
          $this->output()->writeln('[WARNING] Token works but returned unexpected format.');
          $this->output()->writeln('Proceeding to save token...');
        }
      }
      else {
        $this->output()->writeln('[ERROR] HTTP error during validation: ' . $response->getStatusCode());
        $this->output()->writeln('Cannot validate token. Please check your Matomo configuration.');
        return;
      }
    }
    catch (\Exception $e) {
      $this->output()->writeln('[ERROR] Token validation failed: ' . $e->getMessage());
      $this->output()->writeln('Cannot reach Matomo API. Please check your network and Matomo URL.');
      return;
    }

    // If we get here, token is valid - save it
    $config = \Drupal::configFactory()->getEditable('dsf_analytics.settings');
    $config->set('api_token', $token);
    $config->save();

    $this->output()->writeln('[OK] API token configured successfully.');
    
    // Clear cache to ensure changes take effect
    \Drupal::cache()->deleteAll();
    $this->output()->writeln('Cache cleared. Token is now active.');
    
    // Show current mode
    $use_real_data = $config->get('use_real_data') ?: FALSE;
    if ($use_real_data) {
      $this->output()->writeln('System is in REAL data mode - token will be used immediately.');
    }
    else {
      $this->output()->writeln('System is in MOCK data mode. Use "drush dsf-data real" to enable API calls.');
    }
  }

  /**
   * Test Matomo API connection and token validity.
   *
   * @command dsf-analytics:test-api
   * @aliases dsf-test
   * @usage dsf-analytics:test-api
   *   Test the current API token and connection to Matomo
   */
  public function testApiConnection() {
    $config = \Drupal::config('dsf_analytics.settings');
    $api_token = $config->get('api_token');
    
    // Check if token is configured
    if (empty($api_token)) {
      $this->output()->writeln('[ERROR] No API token configured.');
      $this->output()->writeln('Set token with: drush dsf-token YOUR_TOKEN');
      return;
    }
    
    $this->output()->writeln('Testing Matomo API connection...');
    $this->output()->writeln('Token: ' . substr($api_token, 0, 8) . str_repeat('*', strlen($api_token) - 8));
    
    // Check Matomo module configuration
    $matomo_config = \Drupal::config('matomo.settings');
    $site_id = $matomo_config->get('site_id');
    $matomo_url = $matomo_config->get('url_http') ?: $matomo_config->get('url_https');
    
    if (!$site_id || !$matomo_url) {
      $this->output()->writeln('[ERROR] Matomo module not properly configured.');
      $this->output()->writeln('Missing site_id or URL in Matomo settings.');
      return;
    }
    
    $this->output()->writeln("Matomo URL: {$matomo_url}");
    $this->output()->writeln("Site ID: {$site_id}");
    
    // Test API call
    try {
      $api_url = rtrim($matomo_url, '/') . '/index.php';
      $params = [
        'module' => 'API',
        'method' => 'SitesManager.getSiteFromId',
        'idSite' => $site_id,
        'format' => 'json',
        'token_auth' => $api_token,
      ];
      
      $query_string = http_build_query($params);
      $full_url = $api_url . '?' . $query_string;
      
      $client = \Drupal::httpClient();
      $response = $client->get($full_url, [
        'timeout' => 10,
        'headers' => [
          'User-Agent' => 'DSF Analytics Test',
        ],
      ]);
      
      if ($response->getStatusCode() === 200) {
        $body = $response->getBody()->getContents();
        $data = json_decode($body, TRUE);
        
        // Check for API errors
        if (isset($data['result']) && $data['result'] === 'error') {
          $this->output()->writeln('[ERROR] Matomo API error: ' . ($data['message'] ?? 'Unknown error'));
          if (strpos($data['message'], 'token_auth') !== false) {
            $this->output()->writeln('This usually means the API token is invalid or expired.');
          }
          return;
        }
        
        // Success - show site info
        if (isset($data['name'])) {
          $this->output()->writeln('[SUCCESS] API connection working!');
          $this->output()->writeln('Site name: ' . $data['name']);
          $this->output()->writeln('Site URL: ' . ($data['main_url'] ?? 'N/A'));
          $this->output()->writeln('Timezone: ' . ($data['timezone'] ?? 'N/A'));
        }
        elseif (isset($data[0]['name'])) {
          // Fallback for array format
          $this->output()->writeln('[SUCCESS] API connection working!');
          $this->output()->writeln('Site name: ' . $data[0]['name']);
          $this->output()->writeln('Site URL: ' . ($data[0]['main_url'] ?? 'N/A'));
        }
        else {
          $this->output()->writeln('[SUCCESS] API responded, but unexpected format.');
          $this->output()->writeln('Response: ' . substr($body, 0, 200) . '...');
        }
      }
      else {
        $this->output()->writeln('[ERROR] HTTP error: ' . $response->getStatusCode());
      }
    }
    catch (\Exception $e) {
      $this->output()->writeln('[ERROR] Connection failed: ' . $e->getMessage());
    }
  }

  /**
   * Test fetching analytics data from Matomo API.
   *
   * @command dsf-analytics:test-data
   * @aliases dsf-test-data
   * @usage dsf-analytics:test-data
   *   Test fetching actual analytics data from Matomo
   */
  public function testDataFetch() {
    $config = \Drupal::config('dsf_analytics.settings');
    $api_token = $config->get('api_token');
    
    if (empty($api_token)) {
      $this->output()->writeln('[ERROR] No API token configured.');
      $this->output()->writeln('Set token with: drush dsf-token YOUR_TOKEN');
      return;
    }
    
    $this->output()->writeln('Testing analytics data fetch...');
    
    // Check Matomo configuration
    $matomo_config = \Drupal::config('matomo.settings');
    $site_id = $matomo_config->get('site_id');
    $matomo_url = $matomo_config->get('url_http') ?: $matomo_config->get('url_https');
    
    if (!$site_id || !$matomo_url) {
      $this->output()->writeln('[ERROR] Matomo module not configured properly.');
      return;
    }
    
    try {
      // Test page views API
      $api_url = rtrim($matomo_url, '/') . '/index.php';
      $params = [
        'module' => 'API',
        'method' => 'Actions.getPageUrls',
        'idSite' => $site_id,
        'period' => 'range',
        'date' => date('Y-m-d', strtotime('-7 days')) . ',' . date('Y-m-d'),
        'format' => 'json',
        'token_auth' => $api_token,
        'flat' => 1,
        'filter_limit' => 10,
      ];
      
      $query_string = http_build_query($params);
      $full_url = $api_url . '?' . $query_string;
      
      $client = \Drupal::httpClient();
      $response = $client->get($full_url, [
        'timeout' => 15,
        'headers' => [
          'User-Agent' => 'DSF Analytics Test',
        ],
      ]);
      
      if ($response->getStatusCode() === 200) {
        $body = $response->getBody()->getContents();
        $data = json_decode($body, TRUE);
        
        if (isset($data['result']) && $data['result'] === 'error') {
          $this->output()->writeln('[ERROR] API error: ' . ($data['message'] ?? 'Unknown error'));
          return;
        }
        
        if (is_array($data) && count($data) > 0) {
          $this->output()->writeln('[SUCCESS] Retrieved ' . count($data) . ' page records');
          $this->output()->writeln('Sample pages:');
          
          $count = 0;
          foreach ($data as $page) {
            if ($count >= 3) break;
            $label = $page['label'] ?? 'Unknown';
            $visits = $page['nb_visits'] ?? 0;
            $this->output()->writeln("  - {$label} ({$visits} visits)");
            $count++;
          }
          
          // Look for services pages
          $services_count = 0;
          foreach ($data as $page) {
            if (isset($page['label']) && strpos($page['label'], '/services/') !== false) {
              $services_count++;
            }
          }
          
          if ($services_count > 0) {
            $this->output()->writeln("Found {$services_count} service-related pages");
          }
          else {
            $this->output()->writeln('[INFO] No service pages found in recent data');
          }
        }
        else {
          $this->output()->writeln('[INFO] No data returned (may be no recent visits)');
        }
      }
      else {
        $this->output()->writeln('[ERROR] HTTP error: ' . $response->getStatusCode());
      }
    }
    catch (\Exception $e) {
      $this->output()->writeln('[ERROR] Data fetch failed: ' . $e->getMessage());
    }
  }

  /**
   * Quietly validate an API token without verbose output.
   *
   * @param string $token
   *   The API token to validate.
   *
   * @return array
   *   Array with 'valid' boolean and either 'site_name' or 'error' message.
   */
  private function validateTokenQuietly($token) {
    // Check Matomo module configuration
    $matomo_config = \Drupal::config('matomo.settings');
    $site_id = $matomo_config->get('site_id');
    $matomo_url = $matomo_config->get('url_http') ?: $matomo_config->get('url_https');
    
    if (!$site_id || !$matomo_url) {
      return [
        'valid' => FALSE,
        'error' => 'Matomo module not configured',
      ];
    }

    try {
      $api_url = rtrim($matomo_url, '/') . '/index.php';
      $params = [
        'module' => 'API',
        'method' => 'SitesManager.getSiteFromId',
        'idSite' => $site_id,
        'format' => 'json',
        'token_auth' => $token,
      ];
      
      $query_string = http_build_query($params);
      $full_url = $api_url . '?' . $query_string;
      
      $client = \Drupal::httpClient();
      $response = $client->get($full_url, [
        'timeout' => 5, // Shorter timeout for status check
        'headers' => [
          'User-Agent' => 'DSF Analytics Status Check',
        ],
      ]);
      
      if ($response->getStatusCode() === 200) {
        $body = $response->getBody()->getContents();
        $data = json_decode($body, TRUE);
        
        // Check for API errors
        if (isset($data['result']) && $data['result'] === 'error') {
          return [
            'valid' => FALSE,
            'error' => $data['message'] ?? 'API error',
          ];
        }
        
        // Extract site name
        $site_name = 'Connected';
        if (isset($data['name'])) {
          $site_name = $data['name'];
        }
        elseif (isset($data[0]['name'])) {
          $site_name = $data[0]['name'];
        }
        
        return [
          'valid' => TRUE,
          'site_name' => $site_name,
        ];
      }
      else {
        return [
          'valid' => FALSE,
          'error' => 'HTTP error ' . $response->getStatusCode(),
        ];
      }
    }
    catch (\Exception $e) {
      return [
        'valid' => FALSE,
        'error' => 'Connection failed: ' . $e->getMessage(),
      ];
    }
  }

}
