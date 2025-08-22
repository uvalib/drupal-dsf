<?php

namespace Drupal\dsf_analytics\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Config\ConfigFactoryInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Controller for the DSF Analytics Dashboard.
 */
class AnalyticsDashboardController extends ControllerBase {

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * Constructs a new AnalyticsDashboardController object.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   */
  public function __construct(ConfigFactoryInterface $config_factory) {
    $this->configFactory = $config_factory;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('config.factory')
    );
  }

  /**
   * Displays the analytics dashboard.
   *
   * @return array
   *   A render array for the dashboard page.
   */
  public function dashboard() {
    // Get Matomo configuration
    $matomo_config = $this->configFactory->get('matomo.settings');
    
    $build = [
      '#theme' => 'dsf_analytics_dashboard',
      '#matomo_enabled' => !empty($matomo_config->get('site_id')),
      '#matomo_site_id' => $matomo_config->get('site_id'),
      '#matomo_url' => $matomo_config->get('url_https') ?: $matomo_config->get('url_http'),
      '#attached' => [
        'library' => [
          'dsf_analytics/dashboard',
        ],
        'drupalSettings' => [
          'dsfAnalytics' => [
            'apiBase' => '/admin/reports/dsf-analytics/api',
            'matomo' => [
              'enabled' => !empty($matomo_config->get('site_id')),
              'siteId' => $matomo_config->get('site_id'),
              'url' => $matomo_config->get('url_https') ?: $matomo_config->get('url_http'),
            ],
          ],
        ],
      ],
    ];

    return $build;
  }

}
