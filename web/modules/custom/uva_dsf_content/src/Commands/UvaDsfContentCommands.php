<?php

namespace Drupal\uva_dsf_content\Commands;

use Drush\Commands\DrushCommands;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\node\Entity\Node;
use Drupal\paragraphs\Entity\Paragraph;
use Symfony\Component\Yaml\Yaml;
use Symfony\Component\Yaml\Exception\ParseException;
use Drupal\Core\File\FileSystemInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Drush commands for UVA DSF Content module.
 */
class UvaDsfContentCommands extends DrushCommands {

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The file system service.
   *
   * @var \Drupal\Core\File\FileSystemInterface
   */
  protected $fileSystem;

  /**
   * Track generated UUIDs to prevent duplicates.
   *
   * @var array
   */
  protected $usedUuids = [];

  /**
   * Sample content for paragraphs.
   *
   * @var array
   */
  protected $sample_content = [
    [
      'Service Overview',
      'Our storage solution provides:
       - Highly available storage infrastructure
       - 99.999% uptime guarantee
       - 24/7 technical support
       - Flexible pricing models
       - Automatic data replication
       - Geographic redundancy'
    ],
    [
      'Storage Specifications',
      'Technical specifications:
       - Maximum file size: 5TB per file
       - Total storage capacity: Up to 1PB
       - Minimum storage duration: 30 days
       - Maximum retention period: Unlimited
       - Access latency: < 10ms
       - Data transfer speed: Up to 10Gb/s'
    ],
    [
      'Security Features',
      'Enterprise-grade security features:
       - AES-256 bit encryption at rest
       - TLS 1.3 encryption in transit
       - Multi-factor authentication (MFA)
       - Role-based access control (RBAC)
       - Audit logging and reporting
       - Compliance with SOC 2, HIPAA, and GDPR'
    ],
    [
      'Backup and Recovery',
      'Comprehensive data protection:
       - Automated daily backups
       - Point-in-time recovery options
       - 30-day backup retention
       - Cross-region backup replication
       - 15-minute recovery time objective (RTO)
       - Zero recovery point objective (RPO)'
    ],
    [
      'Integration Options',
      'Compatible with popular platforms:
       - REST API for custom integration
       - WebDAV support
       - S3-compatible interface
       - SFTP access
       - Native Windows/Mac/Linux clients
       - Mobile apps for iOS and Android'
    ],
    [
      'Cost Structure',
      'Transparent pricing model:
       - Base storage: $0.02 per GB/month
       - Data transfer: $0.01 per GB
       - API requests: First 10,000 free
       - Backup storage: 50% of base rate
       - Volume discounts available
       - No hidden fees'
    ],
    [
      'Compliance Certifications',
      'Current compliance certifications:
       - SOC 2 Type II
       - ISO 27001
       - HIPAA compliance available
       - GDPR compliant
       - FedRAMP Moderate
       - PCI DSS Level 1'
    ],
    [
      'Support Services',
      'Comprehensive support options:
       - 24/7 technical support
       - Dedicated account manager
       - Online knowledge base
       - Video tutorials
       - Regular training sessions
       - Community forums'
    ],
  ];

  /**
   * Constructs a new UvaDsfContentCommands object.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager.
   * @param \Drupal\Core\File\FileSystemInterface $fileSystem
   *   The file system service.
   */
  public function __construct(
    EntityTypeManagerInterface $entityTypeManager,
    FileSystemInterface $fileSystem
  ) {
    $this->entityTypeManager = $entityTypeManager;
    $this->fileSystem = $fileSystem;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('entity_type.manager'),
      $container->get('file_system')
    );
  }

  /**
   * Get the UUID storage file path.
   */
  protected function getUuidStoragePath() {
    $moduleHandler = \Drupal::service('module_handler');
    return $moduleHandler->getModule('uva_dsf_content')->getPath() . '/uuid_storage.json';
  }

  /**
   * Load UUIDs from storage.
   */
  protected function loadStoredUuids() {
    $storage_file = $this->getUuidStoragePath();
    if (file_exists($storage_file)) {
      $this->usedUuids = json_decode(file_get_contents($storage_file), TRUE) ?? [];
    }
  }

  /**
   * Save UUIDs to storage.
   */
  protected function saveStoredUuids() {
    $storage_file = $this->getUuidStoragePath();
    file_put_contents($storage_file, json_encode($this->usedUuids, JSON_PRETTY_PRINT));
  }

  /**
   * Generate a unique UUID.
   *
   * @return string
   *   A unique UUID.
   */
  protected function generateUniqueUuid() {
    $this->loadStoredUuids();
    do {
      $uuid = \Drupal::service('uuid')->generate();
    } while (isset($this->usedUuids[$uuid]));
    
    $this->usedUuids[$uuid] = true;
    $this->saveStoredUuids();
    return $uuid;
  }

  /**
   * Clear tracked UUIDs.
   */
  protected function clearUuidTracking() {
    $this->usedUuids = [];
    $storage_file = $this->getUuidStoragePath();
    if (file_exists($storage_file)) {
      unlink($storage_file);
    }
  }

  /**
   * Load existing UUIDs from content files.
   */
  protected function loadExistingUuids() {
    $this->loadStoredUuids();
    $moduleHandler = \Drupal::service('module_handler');
    $modulePath = $moduleHandler->getModule('uva_dsf_content')->getPath();
    $contentPath = $modulePath . '/content';
    
    if (!file_exists($contentPath)) {
      return;
    }

    $yamlFiles = $this->fileSystem->scanDirectory($contentPath, '/\.yml$/');
    foreach ($yamlFiles as $file) {
      try {
        $content = Yaml::parse(file_get_contents($file->uri));
        if (isset($content['_meta']['uuid'])) {
          $this->usedUuids[$content['_meta']['uuid']] = true;
        }
        // Check for nested paragraph UUIDs
        if (isset($content['default']['field_service_paragraphs'])) {
          foreach ($content['default']['field_service_paragraphs'] as $paragraph) {
            if (isset($paragraph['entity']['_meta']['uuid'])) {
              $this->usedUuids[$paragraph['entity']['_meta']['uuid']] = true;
            }
          }
        }
      }
      catch (\Exception $e) {
        // Skip invalid files
        continue;
      }
    }
    $this->saveStoredUuids();
  }

  /**
   * Generate sample storage services.
   *
   * @command uva:generate-services
   * @argument count Optional number of services to generate (default: 3)
   * @aliases uva-gen-services
   * @usage drush uva:generate-services 5
   */
  public function generateServices($count = 3) {
    $this->loadExistingUuids();
    // Clear any existing service files first
    $this->removeExistingServices();
    
    $available_services = [
      ['Dropbox', 'Cloud storage with file syncing and sharing capabilities'],
      ['Google Drive', 'Cloud storage integrated with Google Workspace'],
      ['OneDrive', 'Microsoft cloud storage with Office integration'],
      ['Amazon S3', 'Scalable cloud object storage service'],
      ['Box', 'Enterprise-focused cloud content management platform'],
      ['iCloud Drive', 'Apple ecosystem cloud storage solution'],
      ['Wasabi', 'Hot cloud storage for all your data needs'],
      ['Backblaze B2', 'Affordable cloud object storage service'],
      ['pCloud', 'Secure and encrypted cloud storage platform'],
      ['Mega', 'Privacy-focused cloud storage and collaboration'],
    ];

    if ($count > count($available_services)) {
      $this->logger()->warning(dt('Requested @count services but only @available are available. Using maximum available.', [
        '@count' => $count,
        '@available' => count($available_services)
      ]));
      $count = count($available_services);
    }

    $services = array_slice($available_services, 0, $count);
    
    $moduleHandler = \Drupal::service('module_handler');
    $modulePath = $moduleHandler->getModule('uva_dsf_content')->getPath();
    $contentPath = $modulePath . '/content/node';
    
    if (!file_exists($contentPath)) {
      $this->fileSystem->mkdir($contentPath, 0777, TRUE);
    }

    $count = 0;
    foreach ($services as $index => $service) {
      $uuid = $this->generateUniqueUuid();
      
      // Generate 2-3 paragraphs per service
      $paragraphCount = rand(2, 3);
      $paragraphUuids = [];
      $paragraphYamls = [];
      
      // Get random paragraph content
      $sample_paragraphs = $this->sample_content;
      shuffle($sample_paragraphs);
      $selected_paragraphs = array_slice($sample_paragraphs, 0, $paragraphCount);
      
      foreach ($selected_paragraphs as $pIndex => $content) {
        $paragraph_uuid = $this->generateUniqueUuid();
        $paragraphUuids[] = $paragraph_uuid;
        
        $paragraphYaml = [
          '_meta' => [
            'version' => '1.0',
            'entity_type' => 'paragraph',
            'uuid' => $paragraph_uuid,
            'bundle' => 'service_paragraphs',
            'default_langcode' => 'en',
          ],
          'default' => [
            'status' => [['value' => true]],
            'created' => [['value' => time()]],
            'behavior_settings' => [['value' => []]],
            'revision_translation_affected' => [['value' => true]],
            'field_section_title' => [['value' => $content[0]]],
            'field_section_content' => [['value' => $content[1], 'format' => 'basic_html']],
          ],
        ];
        
        // Save paragraph YAML
        $paragraphPath = $this->getContentPath('paragraph');
        $paragraphFile = $paragraphPath . '/paragraph-' . $this->sanitizeFilename($service[0]) . '-' . ($pIndex + 1) . '.yml';
        file_put_contents($paragraphFile, Yaml::dump($paragraphYaml, 10, 2));
      }
      
      // Get facet matches
      $facetUuids = array_values($this->facetMap ?? []);
      shuffle($facetUuids);
      $matchCount = rand(3, 5);
      $selectedFacets = array_slice($facetUuids, 0, $matchCount);
      
      $yaml_content = [
        '_meta' => [
          'version' => '1.0',
          'entity_type' => 'node',
          'uuid' => $uuid,
          'bundle' => 'service',
          'default_langcode' => 'en',
          'depends' => array_merge(
            array_combine(
              $selectedFacets,
              array_fill(0, count($selectedFacets), 'taxonomy_term')
            ),
            array_combine(
              $paragraphUuids,
              array_fill(0, count($paragraphUuids), 'paragraph')
            )
          ),
        ],
        'default' => [
          'revision_uid' => [['target_id' => 1]],
          'status' => [['value' => true]],
          'uid' => [['target_id' => 1]],
          'title' => [['value' => $service[0]]],
          'created' => [['value' => time()]],
          'promote' => [['value' => true]],
          'sticky' => [['value' => false]],
          'revision_translation_affected' => [['value' => true]],
          'path' => [['alias' => '', 'langcode' => 'en']],
          'field_facet_matches' => array_map(function($uuid) {
            return ['entity' => $uuid];
          }, $selectedFacets),
          'field_service_paragraphs' => array_map(function($puuid) {
            return ['entity' => $puuid];
          }, $paragraphUuids),
          'field_summary' => [['value' => $service[1]]],
        ],
      ];

      $yaml = Yaml::dump($yaml_content, 10, 2);
      $filename = $contentPath . '/node-' . ($index + 1) . '.yml';
      file_put_contents($filename, $yaml);
      $count++;
    }

    $this->logger()->success(dt('Generated @count service YAML files.', ['@count' => $count]));
  }

  /**
   * Remove existing service files.
   */
  protected function removeExistingServices() {
    $moduleHandler = \Drupal::service('module_handler');
    $contentPath = $moduleHandler->getModule('uva_dsf_content')->getPath() . '/content/node';
    
    if (!file_exists($contentPath)) {
      return;
    }

    $pattern = '/^node-.*\.yml$/';
    $files = $this->fileSystem->scanDirectory($contentPath, $pattern);
    foreach ($files as $file) {
      try {
        $content = Yaml::parse(file_get_contents($file->uri));
        if (isset($content['_meta']['bundle']) && $content['_meta']['bundle'] === 'service') {
          unlink($file->uri);
          $this->logger()->info(dt('Removed existing service file: @file', [
            '@file' => basename($file->uri)
          ]));
        }
      } catch (\Exception $e) {
        continue;
      }
    }
  }

  /**
   * Generate sample service paragraphs.
   *
   * @command uva:generate-paragraphs
   * @argument count Optional number of paragraphs to generate (default: 3)
   * @aliases uva-gen-para
   * @usage drush uva:generate-paragraphs 5
   */
  public function generateParagraphs($count = 3) {
    $this->loadExistingUuids();
    // Clear any existing paragraph files first
    $this->removeExistingParagraphs();
    
    $sample_content = [
      [
        'Service Overview',
        'Our storage solution provides:
         - Highly available storage infrastructure
         - 99.999% uptime guarantee
         - 24/7 technical support
         - Flexible pricing models
         - Automatic data replication
         - Geographic redundancy'
      ],
      [
        'Storage Specifications',
        'Technical specifications:
         - Maximum file size: 5TB per file
         - Total storage capacity: Up to 1PB
         - Minimum storage duration: 30 days
         - Maximum retention period: Unlimited
         - Access latency: < 10ms
         - Data transfer speed: Up to 10Gb/s'
      ],
      [
        'Security Features',
        'Enterprise-grade security features:
         - AES-256 bit encryption at rest
         - TLS 1.3 encryption in transit
         - Multi-factor authentication (MFA)
         - Role-based access control (RBAC)
         - Audit logging and reporting
         - Compliance with SOC 2, HIPAA, and GDPR'
      ],
      [
        'Backup and Recovery',
        'Comprehensive data protection:
         - Automated daily backups
         - Point-in-time recovery options
         - 30-day backup retention
         - Cross-region backup replication
         - 15-minute recovery time objective (RTO)
         - Zero recovery point objective (RPO)'
      ],
      [
        'Integration Options',
        'Compatible with popular platforms:
         - REST API for custom integration
         - WebDAV support
         - S3-compatible interface
         - SFTP access
         - Native Windows/Mac/Linux clients
         - Mobile apps for iOS and Android'
      ],
      [
        'Cost Structure',
        'Transparent pricing model:
         - Base storage: $0.02 per GB/month
         - Data transfer: $0.01 per GB
         - API requests: First 10,000 free
         - Backup storage: 50% of base rate
         - Volume discounts available
         - No hidden fees'
      ],
      [
        'Compliance Certifications',
        'Current compliance certifications:
         - SOC 2 Type II
         - ISO 27001
         - HIPAA compliance available
         - GDPR compliant
         - FedRAMP Moderate
         - PCI DSS Level 1'
      ],
      [
        'Support Services',
        'Comprehensive support options:
         - 24/7 technical support
         - Dedicated account manager
         - Online knowledge base
         - Video tutorials
         - Regular training sessions
         - Community forums'
      ],
    ];

    if ($count > count($sample_content)) {
      $this->logger()->warning(dt('Requested @count paragraphs but only @available are available. Using maximum available.', [
        '@count' => $count,
        '@available' => count($sample_content)
      ]));
      $count = count($sample_content);
    }

    $moduleHandler = \Drupal::service('module_handler');
    $modulePath = $moduleHandler->getModule('uva_dsf_content')->getPath();
    $contentPath = $modulePath . '/content/paragraph';
    
    if (!file_exists($contentPath)) {
      $this->fileSystem->mkdir($contentPath, 0777, TRUE);
    }

    $paragraphs = array_slice($sample_content, 0, $count);
    $generated = 0;

    foreach ($paragraphs as $index => $content) {
      $uuid = $this->generateUniqueUuid();
      
      $yaml_content = [
        '_meta' => [
          'version' => '1.0',
          'entity_type' => 'paragraph',
          'uuid' => $uuid,
          'bundle' => 'service_paragraphs',
          'default_langcode' => 'en',
        ],
        'default' => [
          'status' => [['value' => true]],
          'created' => [['value' => time()]],
          'behavior_settings' => [['value' => []]],
          'revision_translation_affected' => [['value' => true]],
          'field_section_title' => [['value' => $content[0]]],
          'field_section_content' => [
            [
              'value' => $content[1],
              'format' => 'basic_html'
            ]
          ],
        ],
      ];

      $yaml = Yaml::dump($yaml_content, 10, 2);
      $filename = $contentPath . '/paragraph-' . ($index + 1) . '.yml';
      file_put_contents($filename, $yaml);
      $generated++;
    }

    $this->logger()->success(dt('Generated @count paragraph YAML files.', [
      '@count' => $generated
    ]));
  }

  /**
   * Remove existing paragraph files.
   */
  protected function removeExistingParagraphs() {
    $moduleHandler = \Drupal::service('module_handler');
    $contentPath = $moduleHandler->getModule('uva_dsf_content')->getPath() . '/content/paragraph';
    
    if (!file_exists($contentPath)) {
      return;
    }

    $files = $this->fileSystem->scanDirectory($contentPath, '/\.yml$/');
    foreach ($files as $file) {
      unlink($file->uri);
      $this->logger()->info(dt('Removed existing paragraph file: @file', [
        '@file' => basename($file->uri)
      ]));
    }
  }

  /**
   * Validate all YAML content files.
   *
   * @command uva:validate-content
   * @option fix Try to fix YAML indentation issues
   * @aliases uva-val-content
   * @usage drush uva:validate-content --fix
   */
  public function validateContent($options = ['fix' => FALSE]) {
    $moduleHandler = \Drupal::service('module_handler');
    $modulePath = $moduleHandler->getModule('uva_dsf_content')->getPath();
    $contentPath = $modulePath . '/content';
    
    if (!file_exists($contentPath)) {
      throw new \Exception(dt('Content directory not found at @path', ['@path' => $contentPath]));
    }

    $yamlFiles = $this->fileSystem->scanDirectory($contentPath, '/\.yml$/');
    $errors = [];
    $fixed = [];
    $validCount = 0;
    
    foreach ($yamlFiles as $file) {
      try {
        $yaml = Yaml::parse(file_get_contents($file->uri));
        $validCount++;
        $this->logger()->info(dt('✓ Valid: @file', [
          '@file' => str_replace($modulePath . '/', '', $file->uri)
        ]));
      }
      catch (ParseException $e) {
        if ($options['fix']) {
          try {
            // Try to fix common YAML issues
            $content = file_get_contents($file->uri);
            $fixed_content = $this->fixYamlIndentation($content);
            // Validate the fixed content
            Yaml::parse($fixed_content);
            // If validation passes, save the fixed content
            file_put_contents($file->uri, $fixed_content);
            $fixed[] = str_replace($modulePath . '/', '', $file->uri);
            $validCount++;
          }
          catch (\Exception $e2) {
            $errors[] = [
              'file' => str_replace($modulePath . '/', '', $file->uri),
              'message' => $e->getMessage()
            ];
          }
        }
        else {
          $errors[] = [
            'file' => str_replace($modulePath . '/', '', $file->uri),
              'message' => $e->getMessage()
          ];
        }
      }
    }

    if (!empty($fixed)) {
      $this->logger()->warning(dt('Fixed @count files:', ['@count' => count($fixed)]));
      foreach ($fixed as $file) {
        $this->logger()->info(dt('✓ Fixed: @file', ['@file' => $file]));
      }
    }

    if (!empty($errors)) {
      $this->logger()->warning(dt('@count files still have errors:', ['@count' => count($errors)]));
      foreach ($errors as $error) {
        $this->logger()->error(dt('× @file: @message', [
          '@file' => $error['file'],
          '@message' => $error['message']
        ]));
      }
      return 1;
    }

    $this->logger()->success(dt('All @count content files are now valid.', [
      '@count' => $validCount
    ]));
    return 0;
  }

  /**
   * Fix common YAML indentation issues.
   *
   * @param string $content
   *   The YAML content to fix.
   *
   * @return string
   *   The fixed YAML content.
   */
  protected function fixYamlIndentation($content) {
    $lines = explode("\n", $content);
    $fixed_lines = [];
    $current_indent = 0;
    
    foreach ($lines as $line) {
      if (trim($line) === '') {
        $fixed_lines[] = '';
        continue;
      }

      // Count leading spaces
      $indent = strlen($line) - strlen(ltrim($line));
      
      // Handle array items
      if (preg_match('/^\s*-/', $line)) {
        $fixed_line = str_repeat('  ', $current_indent) . '- ' . trim(ltrim($line, " -"));
      }
      // Handle key-value pairs
      else if (strpos(trim($line), ':') !== false) {
        $current_indent = $indent / 2;
        $fixed_line = str_repeat('  ', $current_indent) . trim($line);
      }
      else {
        $fixed_line = str_repeat('  ', $current_indent + 1) . trim($line);
      }
      
      $fixed_lines[] = $fixed_line;
    }
    
    return implode("\n", $fixed_lines);
  }

  /**
   * Get random facet references.
   */
  protected function getRandomFacetReferences($facets, $count) {
    $facetIds = array_keys($facets);
    shuffle($facetIds);
    $selected = array_slice($facetIds, 0, $count);
    
    return array_map(function($id) {
      return ['target_id' => $id];
    }, $selected);
  }

  /**
   * Clear all content before generating.
   */
  protected function clearAllContent() {
    $this->removeExistingServices();
    $this->removeExistingParagraphs();
    $this->removeExistingQuestions();
  }

  /**
   * Delete all nodes of a specific type.
   */
  protected function deleteNodesByType($type) {
    $nodeStorage = $this->entityTypeManager->getStorage('node');
    $nodes = $nodeStorage->loadByProperties(['type' => $type]);
    if (!empty($nodes)) {
      $nodeStorage->delete($nodes);
      $this->logger()->info(dt('Deleted @count @type nodes', [
        '@count' => count($nodes),
        '@type' => $type
      ]));
    }
  }

  /**
   * Clean up all existing content completely.
   */
  protected function cleanupAllContent() {
    $moduleHandler = \Drupal::service('module_handler');
    $contentPath = $moduleHandler->getModule('uva_dsf_content')->getPath() . '/content';
    
    // Remove entire content directory if it exists
    if (file_exists($contentPath)) {
      $this->fileSystem->deleteRecursive($contentPath);
      $this->logger()->info('Removed existing content directory');
    }
    
    // Delete all nodes from database
    foreach (['question', 'service'] as $type) {
      $this->deleteNodesByType($type);
    }
    
    // Delete all taxonomy terms
    $termStorage = $this->entityTypeManager->getStorage('taxonomy_term');
    $terms = $termStorage->loadByProperties(['vid' => 'facets']);
    if (!empty($terms)) {
      $termStorage->delete($terms);
      $this->logger()->info('Deleted all facet terms');
    }
  }

  /**
   * Generate all content.
   *
   * @command uva:generate-all
   * @option keep Whether to keep existing content files
   * @aliases uva-gen-all
   * @usage drush uva:generate-all
   * @usage drush uva:generate-all --keep  Preserves existing content files
   */
  public function generateAll($options = ['keep' => FALSE]) {
    if (!$options['keep']) {
      // Complete cleanup when --keep is not passed
      $this->cleanupAllContent();
      $this->clearUuidTracking();
      $this->logger()->info('Removed existing content (use --keep to preserve)');
    } else {
      $this->logger()->info('Keeping existing content files (--keep flag)');
    }
    
    // Create content directory structure
    $moduleHandler = \Drupal::service('module_handler');
    $contentPath = $moduleHandler->getModule('uva_dsf_content')->getPath() . '/content';
    $this->fileSystem->mkdir($contentPath, NULL, TRUE);
    
    // Generate content in order
    $facetUuids = $this->generateFacets();
    $this->facetMap = $facetUuids;
    
    $this->generateParagraphs();
    $this->generateServices(10);
    
    $this->logger()->success(dt('Generated all content successfully.'));
  }

  /**
   * Generate facet terms.
   *
   * @command uva:generate-facets
   * @aliases uva-gen-facets
   * @usage drush uva:generate-facets
   */
  public function generateFacets() {
    $this->loadExistingUuids();
    
    // First generate a control type term that all terms will reference
    $controlTypeUuid = $this->generateUniqueUuid();
    $controlTypeYaml = [
      '_meta' => [
        'version' => '1.0',
        'entity_type' => 'taxonomy_term',
        'uuid' => $controlTypeUuid,
        'bundle' => 'facets',
        'default_langcode' => 'en',
      ],
      'default' => [
        'status' => [['value' => true]],
        'name' => [['value' => 'Storage Finder Controls']],
        'weight' => [['value' => 0]],
        'parent' => [['target_id' => 0]],
        'revision_translation_affected' => [['value' => true]],
        'path' => [['alias' => '', 'langcode' => 'en']],
      ],
    ];

    $moduleHandler = \Drupal::service('module_handler');
    $contentPath = $moduleHandler->getModule('uva_dsf_content')->getPath() . '/content/taxonomy_term';
    
    if (!file_exists($contentPath)) {
      $this->fileSystem->mkdir($contentPath, 0777, TRUE);
    }

    $yaml = Yaml::dump($controlTypeYaml, 10, 2);
    file_put_contents($contentPath . '/term-control-type.yml', $yaml);

    $generatedUuids = [];
    $index = 0;

    // Define the taxonomy structure
    $taxonomy = [
      [
        'question' => ['What type of storage do you need?', 'Choose your primary storage solution'],
        'answers' => [
          ['Emerald Storage', 'High-performance green storage from the Emerald City'],
          ['Ruby Archives', 'Long-term preservation in the Ruby Vault'],
          ['Yellow Brick Storage', 'Reliable path to your data'],
          ['Poppy Field Cache', 'Fast but temporary data storage'],
          ['Oz Cloud', 'Enterprise cloud storage solution'],
        ]
      ],
      [
        'question' => ['How will you access your data?', 'Select your preferred access method'],
        'answers' => [
          ['Flying Monkey Delivery', 'Fast aerial data transfer'],
          ['Rainbow Bridge Access', 'Multi-region data access'],
          ['Tornado Express', 'High-speed data movement'],
          ['Magical Portal', 'Instant data retrieval'],
          ['Crystal Ball Browse', 'Data preview and search'],
        ]
      ],
      [
        'question' => ['What security level do you require?', 'Choose your security requirements'],
        'answers' => [
          ['Wizard Protection', 'Enterprise-grade security'],
          ['Glinda\'s Shield', 'Advanced data protection'],
          ['Emerald Gate', 'Secure access control'],
          ['Munchkin Watch', '24/7 monitoring'],
          ['Scarecrow Guard', 'Intelligent threat detection'],
        ]
      ],
      [
        'question' => ['What backup features do you need?', 'Select your backup requirements'],
        'answers' => [
          ['Dorothy\'s Mirror', 'Point-in-time snapshots'],
          ['Tin Man\'s Heart', 'Redundant storage'],
          ['Lion\'s Courage', 'Disaster recovery'],
          ['Good Witch Backup', 'Managed backup service'],
          ['Toto\'s Cache', 'Local backup storage'],
        ]
      ],
      [
        'question' => ['What compliance features are required?', 'Choose your compliance needs'],
        'answers' => [
          ['Oz Certification', 'Regulatory compliance'],
          ['Wizard\'s Scroll', 'Audit logging'],
          ['Golden Cap Control', 'Access management'],
          ['Silver Shoes Track', 'Data lineage tracking'],
          ['Magic Book Vault', 'Compliant archival'],
        ]
      ]
    ];

    foreach ($taxonomy as $group) {
      // Create the question term
      $questionUuid = $this->generateUniqueUuid();
      $questionName = $group['question'][0];
      $questionYaml = [
        '_meta' => [
          'version' => '1.0',
          'entity_type' => 'taxonomy_term',
          'uuid' => $questionUuid,
          'bundle' => 'facets',
          'default_langcode' => 'en',
          'depends' => [
            $controlTypeUuid => 'taxonomy_term'
          ],
        ],
        'default' => [
          'status' => [['value' => true]],
          'name' => [['value' => $questionName]],
          'weight' => [['value' => $index]],
          'parent' => [['target_id' => 0]],
          'revision_translation_affected' => [['value' => true]],
          'path' => [['alias' => '', 'langcode' => 'en']],
          'field_control_type' => [['entity' => $controlTypeUuid]],
        ],
      ];

      $yaml = Yaml::dump($questionYaml, 10, 2);
      file_put_contents($contentPath . '/term-question-' . $this->sanitizeFilename($questionName) . '.yml', $yaml);
      $generatedUuids[$questionName] = $questionUuid;

      // Create the answer terms
      foreach ($group['answers'] as $answerIndex => $answer) {
        $answerUuid = $this->generateUniqueUuid();
        $answerName = $answer[0];
        $answerYaml = [
          '_meta' => [
            'version' => '1.0',
            'entity_type' => 'taxonomy_term',
            'uuid' => $answerUuid,
            'bundle' => 'facets',
            'default_langcode' => 'en',
            'depends' => [
              $questionUuid => 'taxonomy_term',
              $controlTypeUuid => 'taxonomy_term'
            ],
          ],
          'default' => [
            'status' => [['value' => true]],
            'name' => [['value' => $answerName]],
            'weight' => [['value' => $answerIndex]],
            'parent' => [['entity' => $questionUuid]],
            'revision_translation_affected' => [['value' => true]],
            'path' => [['alias' => '', 'langcode' => 'en']],
            'field_control_type' => [['entity' => $controlTypeUuid]],
          ],
        ];

        $yaml = Yaml::dump($answerYaml, 10, 2);
        file_put_contents($contentPath . '/term-answer-' . $this->sanitizeFilename($answerName) . '.yml', $yaml);
        $generatedUuids[$answerName] = $answerUuid;
      }

      $index++;
    }

    $this->logger()->success(dt('Generated @count taxonomy terms for questions and answers.', 
      ['@count' => count($generatedUuids)]));
    return $generatedUuids;
  }

  /**
   * Helper to sanitize filenames
   */
  protected function sanitizeFilename($name) {
    return strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $name));
  }

  /**
   * Analyze and optionally fix facet matches for services.
   *
   * @command uva:analyze-facets
   * @option fix Automatically fix issues found
   * @option report Generate a detailed report
   * @aliases uva-analyze-facets
   * @usage drush uva:analyze-facets
   * @usage drush uva:analyze-facets --fix
   * @usage drush uva:analyze-facets --report
   */
  public function analyzeFacets($options = ['fix' => FALSE, 'report' => FALSE]) {
    $moduleHandler = \Drupal::service('module_handler');
    $contentPath = $moduleHandler->getModule('uva_dsf_content')->getPath() . '/content/node';
    
    if (!file_exists($contentPath)) {
      throw new \Exception(dt('Content directory not found at @path', ['@path' => $contentPath]));
    }

    $yamlFiles = $this->fileSystem->scanDirectory($contentPath, '/\.yml$/');
    $issues = [];
    $facetCounts = [];
    $serviceCount = 0;
    
    // Load all available facets
    $facetStorage = $this->entityTypeManager->getStorage('taxonomy_term');
    $facets = $facetStorage->loadByProperties(['vid' => 'facets']);
    $availableFacetUuids = array_keys($facets);

    foreach ($yamlFiles as $file) {
      try {
        $content = Yaml::parse(file_get_contents($file->uri));
        
        // Skip non-service nodes
        if (!isset($content['_meta']['bundle']) || $content['_meta']['bundle'] !== 'service') {
          continue;
        }
        
        $serviceCount++;
        $filename = basename($file->uri);
        $issues[$filename] = [];
        
        // Check facet matches
        if (empty($content['default']['field_facet_matches'])) {
          $issues[$filename][] = 'No facet matches found';
        } else {
          foreach ($content['default']['field_facet_matches'] as $match) {
            if (!isset($match['entity'])) {
              $issues[$filename][] = 'Invalid facet match format';
              continue;
            }
            
            $facetUuid = $match['entity'];
            if (!in_array($facetUuid, $availableFacetUuids)) {
              $issues[$filename][] = "Invalid facet UUID: $facetUuid";
            }
            
            if (!isset($facetCounts[$facetUuid])) {
              $facetCounts[$facetUuid] = 0;
            }
            $facetCounts[$facetUuid]++;
          }
        }
        
        // Fix issues if requested
        if ($options['fix'] && !empty($issues[$filename])) {
          $this->fixServiceFacets($file->uri, $content, $availableFacetUuids);
          $issues[$filename][] = '(Fixed)';
        }
        
      } catch (\Exception $e) {
        $issues[$filename][] = 'YAML parsing error: ' . $e->getMessage();
      }
    }

    // Output results
    $this->logger()->info(dt('Analyzed @count services', ['@count' => $serviceCount]));
    
    $hasIssues = false;
    foreach ($issues as $filename => $fileIssues) {
      if (!empty($fileIssues)) {
        $hasIssues = true;
        $this->logger()->warning(dt('@file: @issues', [
          '@file' => $filename,
          '@issues' => implode(', ', $fileIssues)
        ]));
      }
    }

    if ($options['report']) {
      $this->generateFacetReport($facetCounts, $facets, $serviceCount);
    }

    if (!$hasIssues) {
      $this->logger()->success(dt('No issues found'));
    }
  }

  /**
   * Fix facet matches for a service.
   */
  protected function fixServiceFacets($filepath, $content, $availableFacetUuids) {
    // Ensure at least 2 valid facet matches
    $validMatches = [];
    if (!empty($content['default']['field_facet_matches'])) {
      foreach ($content['default']['field_facet_matches'] as $match) {
        if (isset($match['entity']) && in_array($match['entity'], $availableFacetUuids)) {
          $validMatches[] = $match;
        }
      }
    }

    // Add random facets if needed
    while (count($validMatches) < 2) {
      $randomFacet = $availableFacetUuids[array_rand($availableFacetUuids)];
      if (!in_array(['entity' => $randomFacet], $validMatches)) {
        $validMatches[] = ['entity' => $randomFacet];
      }
    }

    $content['default']['field_facet_matches'] = $validMatches;
    
    // Save the updated content
    $yaml = Yaml::dump($content, 10, 2);
    file_put_contents($filepath, $yaml);
  }

  /**
   * Generate a detailed facet usage report.
   */
  protected function generateFacetReport($facetCounts, $facets, $serviceCount) {
    $this->output()->writeln("\n=== Facet Usage Report ===");
    
    foreach ($facets as $uuid => $term) {
      $count = $facetCounts[$uuid] ?? 0;
      $percentage = ($count / $serviceCount) * 100;
      $this->output()->writeln(sprintf(
        "%-30s: %3d uses (%3d%%)",
        $term->getName(),
        $count,
        round($percentage)
      ));
    }
    
    $this->output()->writeln("\nTotal services: " . $serviceCount);
  }

  /**
   * Debug facet relationships and values.
   *
   * @command uva:debug-facets
   * @aliases uva-debug-facets
   * @usage drush uva:debug-facets
   */
  public function debugFacets() {
    // 1. Check taxonomy terms
    $facetStorage = $this->entityTypeManager->getStorage('taxonomy_term');
    $facets = $facetStorage->loadByProperties(['vid' => 'facets']);
    
    $this->output()->writeln("\n=== Facet Taxonomy Terms ===");
    if (empty($facets)) {
      $this->logger()->error('No facet terms found in taxonomy!');
    } else {
      foreach ($facets as $facet) {
        $this->output()->writeln(sprintf(
          "UUID: %s\nName: %s\nID: %d\n",
          $facet->uuid(),
          $facet->getName(),
          $facet->id()
        ));
      }
    }

    // 2. Check service nodes
    $nodeStorage = $this->entityTypeManager->getStorage('node');
    $services = $nodeStorage->loadByProperties(['type' => 'service']);
    
    $this->output()->writeln("\n=== Service Facet References ===");
    if (empty($services)) {
      $this->logger()->error('No service nodes found!');
    } else {
      foreach ($services as $service) {
        $this->output()->writeln("\nService: " . $service->getTitle());
        
        // Check field_facet_matches
        if ($service->hasField('field_facet_matches')) {
          $facetRefs = $service->get('field_facet_matches')->getValue();
          if (empty($facetRefs)) {
            $this->logger()->warning('No facet matches found for this service');
          } else {
            foreach ($facetRefs as $ref) {
              if (isset($ref['target_id'])) {
                $referencedFacet = $facetStorage->load($ref['target_id']);
                if ($referencedFacet) {
                  $this->output()->writeln("- " . $referencedFacet->getName() . " (ID: " . $ref['target_id'] . ")");
                } else {
                  $this->logger()->error("Referenced facet ID " . $ref['target_id'] . " does not exist!");
                }
              } else {
                $this->logger()->error("Invalid facet reference format");
                $this->output()->writeln(print_r($ref, TRUE));
              }
            }
          }
        } else {
          $this->logger()->error('Service is missing field_facet_matches field');
        }
      }
    }

    // 3. Check YAML content files
    $moduleHandler = \Drupal::service('module_handler');
    $contentPath = $moduleHandler->getModule('uva_dsf_content')->getPath() . '/content/node';
    
    $this->output()->writeln("\n=== YAML Content Files Analysis ===");
    if (file_exists($contentPath)) {
      $yamlFiles = $this->fileSystem->scanDirectory($contentPath, '/\.yml$/');
      foreach ($yamlFiles as $file) {
        try {
          $content = Yaml::parse(file_get_contents($file->uri));
          if (isset($content['_meta']['bundle']) && $content['_meta']['bundle'] === 'service') {
            $this->output()->writeln("\nFile: " . basename($file->uri));
            if (isset($content['default']['field_facet_matches'])) {
              foreach ($content['default']['field_facet_matches'] as $match) {
                $this->output()->writeln("- Facet reference: " . print_r($match, TRUE));
              }
            } else {
              $this->logger()->warning('No field_facet_matches in ' . basename($file->uri));
            }
          }
        } catch (\Exception $e) {
          $this->logger()->error("Error parsing " . basename($file->uri) . ": " . $e->getMessage());
        }
      }
    }
  }

  /**
   * Check UUID relationships across content.
   *
   * @command uva:check-uuids
   * @aliases uva-check-uuids
   * @usage drush uva:check-uuids
   */
  public function checkUuids() {
    $moduleHandler = \Drupal::service('module_handler');
    $modulePath = $moduleHandler->getModule('uva_dsf_content')->getPath();
    
    // First, gather all UUIDs from taxonomy terms
    $taxonomyPath = $modulePath . '/content/taxonomy_term';
    $termUuids = [];
    if (file_exists($taxonomyPath)) {
      $termFiles = $this->fileSystem->scanDirectory($taxonomyPath, '/\.yml$/');
      foreach ($termFiles as $file) {
        $content = Yaml::parse(file_get_contents($file->uri));
        if (isset($content['_meta']['uuid'])) {
          $uuid = $content['_meta']['uuid'];
          $name = $content['default']['name'][0]['value'] ?? 'unknown';
          $termUuids[$uuid] = [
            'name' => $name,
            'file' => basename($file->uri),
            'references' => [],
          ];
        }
      }
    }

    // Then check all service nodes for references
    $nodePath = $modulePath . '/content/node';
    if (file_exists($nodePath)) {
      $nodeFiles = $this->fileSystem->scanDirectory($nodePath, '/\.yml$/');
      foreach ($nodeFiles as $file) {
        $content = Yaml::parse(file_get_contents($file->uri));
        if (isset($content['default']['field_facet_matches'])) {
          foreach ($content['default']['field_facet_matches'] as $match) {
            if (isset($match['entity'])) {
              $referencedUuid = $match['entity'];
              if (isset($termUuids[$referencedUuid])) {
                $termUuids[$referencedUuid]['references'][] = basename($file->uri);
              } else {
                $this->logger()->warning(dt('UUID @uuid referenced in @file but not found in taxonomy terms', [
                  '@uuid' => $referencedUuid,
                  '@file' => basename($file->uri),
                ]));
              }
            }
          }
        }
      }
    }

    // Output the relationships
    $this->output()->writeln("\n=== UUID Relationships ===");
    foreach ($termUuids as $uuid => $info) {
      $this->output()->writeln(sprintf(
        "\nUUID: %s\nName: %s\nFile: %s\nReferenced by: %s",
        $uuid,
        $info['name'],
        $info['file'],
        empty($info['references']) ? 'None' : implode(', ', $info['references'])
      ));
    }
  }

  /**
   * Helper to get content path.
   */
  protected function getContentPath($type = '') {
    $moduleHandler = \Drupal::service('module_handler');
    $path = $moduleHandler->getModule('uva_dsf_content')->getPath() . '/content';
    
    // Create base content directory if it doesn't exist
    if (!file_exists($path)) {
      $thisSystem->mkdir($path, 0777, TRUE);
    }
    
    if ($type) {
      $path .= '/' . $type;
      // Create type-specific directory if it doesn't exist
      if (!file_exists($path)) {
        $this->fileSystem->mkdir($path, 0777, TRUE);
      }
    }
    
    return $path;
  }

  /**
   * Dump all finder data to YAML files.
   *
   * @command uva:dump-finder
   * @aliases uva-dump
   * @usage drush uva:dump-finder
   */
  public function dumpFinder() {
    try {
      // Ensure directories exist
      $contentPath = $this->getContentPath();
      foreach (['node', 'taxonomy_term', 'paragraph'] as $dir) {
        $path = $contentPath . '/' . $dir;
        if (!file_exists($path)) {
          $this->fileSystem->mkdir($path, 0777, TRUE);
        }
      }

      // Dump facets
      $facetStorage = $this->entityTypeManager->getStorage('taxonomy_term');
      $facets = $facetStorage->loadByProperties(['vid' => 'facets']);
      foreach ($facets as $facet) {
        $description = $facet->hasField('description') ? $facet->get('description')->value : '';
        $yaml_content = [
          '_meta' => [
            'version' => '1.0',
            'entity_type' => 'taxonomy_term',
            'uuid' => $facet->uuid(),
            'bundle' => 'facets',
            'default_langcode' => 'en',
          ],
          'default' => [
            'name' => [['value' => $facet->label()]],
            'description' => [['value' => $description, 'format' => 'basic_html']],
            'weight' => [['value' => $facet->getWeight()]],
            'status' => [['value' => $facet->isPublished()]],
          ],
        ];
        $yaml = Yaml::dump($yaml_content, 10, 2);
        file_put_contents($contentPath . '/taxonomy_term/term-' . $facet->id() . '.yml', $yaml);
      }
      $this->logger()->success(dt('Dumped @count facet terms', ['@count' => count($facets)]));

      // Dump questions
      $nodeStorage = $this->entityTypeManager->getStorage('node');
      $questions = $nodeStorage->loadByProperties(['type' => 'question']);
      foreach ($questions as $question) {
        $facetRefs = [];
        if ($question->hasField('field_facets')) {
          foreach ($question->get('field_facets')->referencedEntities() as $facet) {
            $facetRefs[] = ['entity' => $facet->uuid()];
          }
        }

        $bodyValue = $question->hasField('body') ? $question->get('body')->value : '';
        $weightValue = $question->hasField('field_weight') ? $question->get('field_weight')->value : 0;

        $yaml_content = [
          '_meta' => [
            'version' => '1.0',
            'entity_type' => 'node',
            'uuid' => $question->uuid(),
            'bundle' => 'question',
            'default_langcode' => 'en',
          ],
          'default' => [
            'title' => [['value' => $question->getTitle()]],
            'status' => [['value' => $question->isPublished()]],
          ],
        ];

        if ($bodyValue) {
          $yaml_content['default']['body'] = [['value' => $bodyValue, 'format' => 'basic_html']];
        }
        if ($weightValue) {
          $yaml_content['default']['field_weight'] = [['value' => $weightValue]];
        }
        if (!empty($facetRefs)) {
          $yaml_content['default']['field_facets'] = $facetRefs;
          $yaml_content['_meta']['depends'] = array_combine(
            array_column($facetRefs, 'entity'),
            array_fill(0, count($facetRefs), 'taxonomy_term')
          );
        }

        $yaml = Yaml::dump($yaml_content, 10, 2);
        file_put_contents($contentPath . '/node/question-' . md5($question->getTitle()) . '.yml', $yaml);
      }
      $this->logger()->success(dt('Dumped @count questions', ['@count' => count($questions)]));

      // Dump services
      $services = $nodeStorage->loadByProperties(['type' => 'service']);
      foreach ($services as $service) {
        $facetRefs = [];
        if ($service->hasField('field_facet_matches')) {
          foreach ($service->get('field_facet_matches')->referencedEntities() as $facet) {
            $facetRefs[] = ['entity' => $facet->uuid()];
          }
        }

        // Handle paragraphs
        $paragraphRefs = [];
        if ($service->hasField('field_service_paragraphs')) {
          foreach ($service->get('field_service_paragraphs')->referencedEntities() as $paragraph) {
            $data = [
              '_meta' => [
                'version' => '1.0',
                'entity_type' => 'paragraph',
                'uuid' => $paragraph->uuid(),
                'bundle' => $paragraph->bundle(),
                'default_langcode' => 'en',
              ],
              'default' => [
                'status' => [['value' => $paragraph->status->value]],
                'created' => [['value' => $paragraph->getCreatedTime()]],
              ],
            ];

            // Add fields if they exist
            if ($paragraph->hasField('field_section_title')) {
              $data['default']['field_section_title'] = [
                ['value' => $paragraph->get('field_section_title')->value]
              ];
            }
            if ($paragraph->hasField('field_section_content')) {
              $data['default']['field_section_content'] = [
                [
                  'value' => $paragraph->get('field_section_content')->value,
                  'format' => 'basic_html'
                ]
              ];
            }

            $paragraphRefs[] = ['entity' => $data];
          }
        }

        $yaml_content = [
          '_meta' => [
            'version' => '1.0',
            'entity_type' => 'node',
            'uuid' => $service->uuid(),
            'bundle' => 'service',
            'default_langcode' => 'en',
          ],
          'default' => [
            'title' => [['value' => $service->getTitle()]],
            'status' => [['value' => $service->isPublished()]],
          ],
        ];

        if (!empty($facetRefs)) {
          $yaml_content['default']['field_facet_matches'] = $facetRefs;
          $yaml_content['_meta']['depends'] = array_combine(
            array_column($facetRefs, 'entity'),
            array_fill(0, count($facetRefs), 'taxonomy_term')
          );
        }

        if (!empty($paragraphRefs)) {
          $yaml_content['default']['field_service_paragraphs'] = $paragraphRefs;
        }

        if ($service->hasField('field_summary')) {
          $yaml_content['default']['field_summary'] = [
            ['value' => $service->get('field_summary')->value]
          ];
        }

        $yaml = Yaml::dump($yaml_content, 10, 2);
        file_put_contents($contentPath . '/node/service-' . md5($service->getTitle()) . '.yml', $yaml);
      }
      $this->logger()->success(dt('Dumped @count services', ['@count' => count($services)]));

    } catch (\Exception $e) {
      $this->logger()->error($e->getMessage());
      return 1;
    }
  }

}
