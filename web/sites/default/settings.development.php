<?php

// Force all errors to be hidden from display
error_reporting(0);
ini_set('display_errors', 'Off');
ini_set('display_startup_errors', 'Off');
ini_set('html_errors', 0);
ini_set('log_errors', 'On');
ini_set('error_log', '../logs/php-errors.log');

// Prevent error display in all cases
$config['system.logging']['error_level'] = 'hide';

// Development service parameters
$settings['container_yamls'][] = DRUPAL_ROOT . '/sites/development.services.yml';

// Disable caches
$settings['cache']['bins']['render'] = 'cache.backend.null';
$settings['cache']['bins']['dynamic_page_cache'] = 'cache.backend.null';
$settings['cache']['bins']['page'] = 'cache.backend.null';

// Development settings
$settings['skip_permissions_hardening'] = TRUE;
$settings['rebuild_access'] = TRUE;
$settings['extension_discovery_scan_tests'] = FALSE;
