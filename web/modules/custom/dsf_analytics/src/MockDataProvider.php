<?php

namespace Drupal\dsf_analytics\src;

/**
 * Provides mock data for analytics API endpoints.
 */
class MockDataProvider {

  /**
   * Get mock data based on API method.
   *
   * @param string $method
   *   The API method name (e.g., 'Events.getAction').
   * @param array $params
   *   Optional parameters including date range.
   *
   * @return array
   *   Mock data array with appropriate structure.
   */
  public static function getMockData($method, $params = []) {
    // Calculate scaling factor based on time range.
    $scaleFactor = self::getScalingFactor($params);

    switch ($method) {
      case 'Events.getAction':
        return self::getFacetSelectionData($scaleFactor);

      case 'Events.getName':
        return self::getServiceViewData($scaleFactor);

      case 'Events.getCategory':
        return self::getEngagementCategoryData($scaleFactor);

      case 'Actions.getPageUrls':
        return self::getPageViewData($scaleFactor);

      case 'Referrers.getSearchEngines':
        return self::getReferrerData($scaleFactor);

      case 'DevicesDetection.getOS':
        return self::getDeviceData($scaleFactor);

      default:
        return [
          ['label' => 'Sample Data Available', 'value' => 1],
        ];
    }
  }

  /**
   * Calculate scaling factor based on time range.
   *
   * @param array $params
   *   Parameters that may include period, date, etc.
   *
   * @return float
   *   Scaling factor for the data.
   */
  private static function getScalingFactor($params) {
    // Default to 7-day baseline.
    $scaleFactor = 1.0;

    if (isset($params['date'])) {
      $date = $params['date'];

      // Handle specific date ranges.
      if (strpos($date, ',') !== false) {
        // Custom date range format: start,end.
        [$start, $end] = explode(',', $date);
        $startDate = new \DateTime($start);
        $endDate = new \DateTime($end);
        $days = $startDate->diff($endDate)->days + 1;

        // Scale relative to 7-day baseline.
        $scaleFactor = $days / 7.0;
      }
      else {
        // Predefined ranges.
        switch ($date) {
          case 'today':
            $scaleFactor = 1.0 / 7.0;
            break;

          case 'yesterday':
            $scaleFactor = 1.0 / 7.0;
            break;

          case 'last7':
            $scaleFactor = 1.0;
            break;

          case 'last30':
            $scaleFactor = 30.0 / 7.0;
            break;

          case 'last90':
            $scaleFactor = 90.0 / 7.0;
            break;

          case 'last6':
            $scaleFactor = 180.0 / 7.0;
            break;

          case 'lastyear':
            $scaleFactor = 365.0 / 7.0;
            break;

          default:
            $scaleFactor = 1.0;
        }
      }
    }
    elseif (isset($params['period'])) {
      // Legacy period-based scaling.
      switch ($params['period']) {
        case 'day':
          $scaleFactor = 1.0;
          break;

        case 'week':
          $scaleFactor = 7.0;
          break;

        case 'month':
          $scaleFactor = 30.0 / 7.0;
          break;

        default:
          $scaleFactor = 1.0;
      }
    }

    // Add some randomness for realism (±20%).
    $randomFactor = 0.8 + (mt_rand() / mt_getrandmax()) * 0.4;
    return $scaleFactor * $randomFactor;
  }

  /**
   * Get facet selection tracking data.
   *
   * @param float $scaleFactor
   *   Factor to scale the data by.
   *
   * @return array
   *   Array of facet selection statistics.
   */
  private static function getFacetSelectionData($scaleFactor = 1.0) {
    $baseData = [
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

    return self::scaleData($baseData, $scaleFactor);
  }

  /**
   * Get service view tracking data.
   *
   * @return array
   *   Array of service usage statistics.
   */
  private static function getServiceViewData() {
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
  }

  /**
   * Get engagement category data.
   *
   * @return array
   *   Array of engagement category statistics.
   */
  private static function getEngagementCategoryData() {
    return [
      ['label' => 'Page_Consultation_Completed', 'nb_events' => 1234],
      ['label' => 'Email_Contact_Submitted', 'nb_events' => 567],
      ['label' => 'Download_Service_Information', 'nb_events' => 445],
      ['label' => 'External_Link_Followed', 'nb_events' => 389],
      ['label' => 'Research_Help_Requested', 'nb_events' => 234],
      ['label' => 'Workshop_Registration', 'nb_events' => 178],
      ['label' => 'Resource_Bookmarked', 'nb_events' => 134],
      ['label' => 'Feedback_Submitted', 'nb_events' => 89],
    ];
  }

  /**
   * Get page view data.
   *
   * @return array
   *   Array of page view statistics.
   */
  private static function getPageViewData() {
    return [
      ['label' => '/dsf/digital-storage-finder', 'nb_hits' => 8934],
      ['label' => '/dsf/storage-services/box', 'nb_hits' => 3245],
      ['label' => '/dsf/storage-services/google-workspace', 'nb_hits' => 2876],
      ['label' => '/dsf/storage-services/onedrive', 'nb_hits' => 2134],
      ['label' => '/dsf/research-data/libra', 'nb_hits' => 1789],
      ['label' => '/dsf/storage-services/rivanna', 'nb_hits' => 1456],
      ['label' => '/dsf/about', 'nb_hits' => 1123],
      ['label' => '/dsf/help', 'nb_hits' => 897],
      ['label' => '/dsf/storage-services/sharepoint', 'nb_hits' => 756],
      ['label' => '/dsf/research-data/dataverse', 'nb_hits' => 623],
    ];
  }

  /**
   * Get referrer data.
   *
   * @return array
   *   Array of referrer statistics.
   */
  private static function getReferrerData() {
    return [
      ['label' => 'Google Search', 'nb_visits' => 2345],
      ['label' => 'library.virginia.edu', 'nb_visits' => 1876],
      ['label' => 'Direct Entry', 'nb_visits' => 1234],
      ['label' => 'its.virginia.edu', 'nb_visits' => 987],
      ['label' => 'research.virginia.edu', 'nb_visits' => 756],
      ['label' => 'Bing Search', 'nb_visits' => 445],
      ['label' => 'canvas.its.virginia.edu', 'nb_visits' => 334],
      ['label' => 'collab.its.virginia.edu', 'nb_visits' => 234],
      ['label' => 'Social Media', 'nb_visits' => 178],
      ['label' => 'Email Links', 'nb_visits' => 123],
    ];
  }

  /**
   * Get device/OS data.
   *
   * @return array
   *   Array of device usage statistics.
   */
  private static function getDeviceData() {
    return [
      ['label' => 'Windows', 'nb_visits' => 3456],
      ['label' => 'Mac OS X', 'nb_visits' => 2890],
      ['label' => 'iOS', 'nb_visits' => 1234],
      ['label' => 'Android', 'nb_visits' => 987],
      ['label' => 'Linux', 'nb_visits' => 567],
      ['label' => 'Chrome OS', 'nb_visits' => 234],
      ['label' => 'Other', 'nb_visits' => 89],
    ];
  }

  /**
   * Get facet statistics.
   *
   * @return array
   *   Array of facet statistics.
   */
  public static function getFacetStats() {
    return self::getFacetSelectionData();
  }

  /**
   * Get service statistics.
   *
   * @return array
   *   Array of service statistics.
   */
  public static function getServiceStats() {
    return self::getServiceViewData();
  }

  /**
   * Get investigation statistics.
   *
   * @return array
   *   Array of investigation statistics.
   */
  public static function getInvestigationStats() {
    return self::getEngagementCategoryData();
  }

}
