<?php

namespace Drupal\dsf_analytics\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configure DSF Analytics settings.
 */
class DsfAnalyticsSettingsForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      'dsf_analytics.settings',
    ];
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

    $form['matomo'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Matomo Integration'),
      '#description' => $this->t('Configure Matomo tracking for DSF pages. This is separate from the main Drupal Matomo module and specifically tracks DSF interactions.'),
    ];

    $form['matomo']['matomo_enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable DSF Matomo tracking'),
      '#description' => $this->t('Enable specialized tracking for Digital Service Finder interactions.'),
      '#default_value' => $config->get('matomo_enabled') ?? FALSE,
    ];

    $form['matomo']['matomo_url'] = [
      '#type' => 'url',
      '#title' => $this->t('Matomo URL'),
      '#description' => $this->t('The base URL of your Matomo installation (e.g., https://analytics.example.com/).'),
      '#default_value' => $config->get('matomo_url') ?? 'https://vah-analytics.lib.virginia.edu/',
      '#states' => [
        'visible' => [
          ':input[name="matomo_enabled"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['matomo']['matomo_site_id'] = [
      '#type' => 'number',
      '#title' => $this->t('Matomo Site ID'),
      '#description' => $this->t('The numeric site ID for this site in Matomo.'),
      '#default_value' => $config->get('matomo_site_id') ?? 1,
      '#min' => 1,
      '#states' => [
        'visible' => [
          ':input[name="matomo_enabled"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['matomo']['matomo_token'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Matomo API Token'),
      '#description' => $this->t('The API token for accessing Matomo data. Required for real data integration. Generate this in your Matomo Admin → Personal → Security → Auth tokens.'),
      '#default_value' => $config->get('matomo_token') ?? '',
      '#states' => [
        'visible' => [
          ':input[name="matomo_enabled"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['tracking'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Tracking Configuration'),
      '#states' => [
        'visible' => [
          ':input[name="matomo_enabled"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['tracking']['tracking_mode'] = [
      '#type' => 'select',
      '#title' => $this->t('Tracking Mode'),
      '#description' => $this->t('Select the tracking mode for analytics data.'),
      '#options' => [
        'PROD' => $this->t('Production (Normal tracking)'),
        'MOCK' => $this->t('Mock (Simulated data for testing)'),
        'DEBUG' => $this->t('Debug (Detailed logging enabled)'),
      ],
      '#default_value' => $config->get('tracking_mode') ?? 'PROD',
    ];

    $form['integration'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Integration Settings'),
      '#states' => [
        'visible' => [
          ':input[name="matomo_enabled"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['integration']['dsf_pages'] = [
      '#type' => 'textarea',
      '#title' => $this->t('DSF Pages'),
      '#description' => $this->t('Enter one path per line where DSF tracking should be enabled. Use paths like /dsf, /digital-service-finder, etc.'),
      '#default_value' => $config->get('dsf_pages') ?? "/dsf\n/digital-service-finder\n/services\n/find-services",
      '#rows' => 5,
    ];

    $form['integration']['content_types'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Service Content Types'),
      '#description' => $this->t('Comma-separated list of content types that represent services (e.g., service, dsf_service, digital_service).'),
      '#default_value' => $config->get('content_types') ?? 'service,dsf_service,digital_service',
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $this->config('dsf_analytics.settings')
      ->set('matomo_enabled', $form_state->getValue('matomo_enabled'))
      ->set('matomo_url', $form_state->getValue('matomo_url'))
      ->set('matomo_site_id', $form_state->getValue('matomo_site_id'))
      ->set('matomo_token', $form_state->getValue('matomo_token'))
      ->set('tracking_mode', $form_state->getValue('tracking_mode'))
      ->set('dsf_pages', $form_state->getValue('dsf_pages'))
      ->set('content_types', $form_state->getValue('content_types'))
      ->save();

    parent::submitForm($form, $form_state);
  }

}
