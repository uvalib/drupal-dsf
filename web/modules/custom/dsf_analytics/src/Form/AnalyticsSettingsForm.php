<?php

namespace Drupal\dsf_analytics\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configuration form for DSF Analytics settings.
 */
class AnalyticsSettingsForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return ['dsf_analytics.settings'];
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'dsf_analytics_settings_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('dsf_analytics.settings');

    $form['data_source'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Data Source Settings'),
      '#description' => $this->t('Configure whether to use real Matomo data or mock data for testing.'),
    ];

    $form['data_source']['use_real_data'] = [
      '#type' => 'radios',
      '#title' => $this->t('Analytics Data Source'),
      '#default_value' => $config->get('use_real_data') ? 'real' : 'mock',
      '#options' => [
        'mock' => $this->t('Mock Data (for testing and development)'),
        'real' => $this->t('Real Matomo Data (live analytics)'),
      ],
      '#description' => $this->t('Choose the data source for the analytics dashboard.'),
    ];

    // Add information about the current Matomo configuration
    $matomo_config = \Drupal::config('matomo.settings');
    $matomo_enabled = !empty($matomo_config->get('site_id'));
    
    if ($matomo_enabled) {
      $site_id = $matomo_config->get('site_id');
      $url = $matomo_config->get('url_http') ?: $matomo_config->get('url_https');
      
      $form['matomo_status'] = [
        '#type' => 'fieldset',
        '#title' => $this->t('Matomo Integration Status'),
      ];
      
      $form['matomo_status']['status'] = [
        '#type' => 'item',
        '#markup' => '<div class="messages messages--status">' .
          '<strong>' . $this->t('Matomo is configured:') . '</strong><br>' .
          $this->t('URL: @url', ['@url' => $url]) . '<br>' .
          $this->t('Site ID: @id', ['@id' => $site_id]) .
          '</div>',
      ];
    }
    else {
      $form['matomo_status'] = [
        '#type' => 'fieldset',
        '#title' => $this->t('Matomo Integration Status'),
      ];
      
      $form['matomo_status']['warning'] = [
        '#type' => 'item',
        '#markup' => '<div class="messages messages--warning">' .
          '<strong>' . $this->t('Matomo is not configured.') . '</strong><br>' .
          $this->t('To use real data, please configure the <a href="@url">Matomo module</a> first.', [
            '@url' => '/admin/config/system/matomo',
          ]) .
          '</div>',
      ];
    }

    // API Configuration (for future use)
    $form['api_settings'] = [
      '#type' => 'details',
      '#title' => $this->t('API Settings (Advanced)'),
      '#open' => FALSE,
      '#description' => $this->t('Advanced settings for Matomo API integration.'),
    ];

    $form['api_settings']['matomo_token'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Matomo API Token'),
      '#default_value' => $config->get('matomo_token'),
      '#description' => $this->t('Optional: API token for enhanced Matomo data access. Leave empty to use basic integration.'),
      '#maxlength' => 64,
    ];

    $form['api_settings']['cache_duration'] = [
      '#type' => 'select',
      '#title' => $this->t('Data Cache Duration'),
      '#default_value' => $config->get('cache_duration') ?: 3600,
      '#options' => [
        300 => $this->t('5 minutes'),
        900 => $this->t('15 minutes'),
        1800 => $this->t('30 minutes'),
        3600 => $this->t('1 hour'),
        7200 => $this->t('2 hours'),
        14400 => $this->t('4 hours'),
        86400 => $this->t('24 hours'),
      ],
      '#description' => $this->t('How long to cache analytics data before fetching fresh data.'),
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $config = $this->configFactory()->getEditable('dsf_analytics.settings');
    
    // Convert radio value to boolean
    $use_real_data = $form_state->getValue('use_real_data') === 'real';
    
    $config
      ->set('use_real_data', $use_real_data)
      ->set('matomo_token', $form_state->getValue('matomo_token'))
      ->set('cache_duration', $form_state->getValue('cache_duration'))
      ->save();

    // Clear relevant caches
    \Drupal::cache()->deleteAll();
    
    // Show confirmation message
    if ($use_real_data) {
      $this->messenger()->addStatus($this->t('Analytics dashboard will now use real Matomo data.'));
    }
    else {
      $this->messenger()->addStatus($this->t('Analytics dashboard will now use mock data for testing.'));
    }

    parent::submitForm($form, $form_state);
  }

}
