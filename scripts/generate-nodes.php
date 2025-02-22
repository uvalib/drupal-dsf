<?php

$services = [
    ['Dropbox', 'Cloud storage with file syncing and sharing capabilities'],
    ['Google Drive', 'Cloud storage integrated with Google Workspace'],
    ['OneDrive', 'Microsoft cloud storage with Office integration'],
    ['Box', 'Enterprise-focused cloud content management'],
    ['iCloud', 'Apple ecosystem cloud storage solution'],
    ['AWS S3', 'Object storage service by Amazon'],
    ['Azure Blob Storage', 'Microsoft cloud object storage'],
    ['UVA Library Local Storage', 'On-premises storage for UVA Library'],
    ['Research Data Storage', 'High-performance storage for research data'],
    ['Sharepoint', 'Document management and collaboration platform'],
    ['NextCloud', 'Self-hosted file sync and share platform'],
    ['OwnCloud', 'Private cloud file storage solution'],
    ['UVA Box', 'UVA-managed Box storage instance'],
    ['Rivanna Storage', 'HPC storage system for research'],
    ['Project Storage', 'Dedicated project-based storage solution'],
    ['Archive Storage', 'Long-term data archival system'],
    ['Scratch Storage', 'Temporary high-performance storage'],
    ['Glacier Storage', 'Cold storage for infrequently accessed data'],
    ['Department Share', 'Departmental network storage'],
    ['Research Share', 'Collaborative research data storage']
];

$facetMatchUUIDs = [
    'b2eec5ff-ba68-4f38-86dd-052a3e0e9c38',
    '92e88c40-1c14-4788-9255-1447100cf153',
    '4b9b9b78-3bb7-48c6-a290-c8d8cae56c25',
    'a1234567-89ab-cdef-0123-456789abcdef',
    'b2345678-89ab-cdef-0123-456789abcdef'
];

$template = <<<YAML
_meta:
  version: '1.0'
  entity_type: node
  uuid: %s
  bundle: service
  default_langcode: en
  depends:
%s
default:
  revision_uid:
    -
      target_id: 1
  status:
    -
      value: true
  uid:
    -
      target_id: 1
  title:
    -
      value: %s
  created:
    -
      value: %d
  promote:
    -
      value: true
  sticky:
    -
      value: false
  field_facet_matches:
%s
  field_summary:
    -
      value: %s
YAML;

$outputDir = __DIR__ . '/../web/modules/custom/uva_dsf_content/content/node/';

foreach ($services as $index => $service) {
    $nodeId = $index + 3; // Starting from 3 since we already have 1 and 2
    $uuid = uuid_create();
    
    // Generate 2-3 random facet matches
    $numFacets = rand(2, 3);
    shuffle($facetMatchUUIDs);
    $selectedFacets = array_slice($facetMatchUUIDs, 0, $numFacets);
    
    // Build depends string with correct indentation
    $depends = [];
    foreach ($selectedFacets as $facetUUID) {
        $depends[] = "    $facetUUID: taxonomy_term";
    }
    $dependsString = implode("\n", $depends);
    
    // Build facet matches string with correct indentation
    $facetMatches = [];
    foreach ($selectedFacets as $facetUUID) {
        $facetMatches[] = "    -\n      entity: $facetUUID";
    }
    $facetMatchesString = implode("\n", $facetMatches);
    
    $created = time() + $index; // Ensure unique timestamps
    $paragraphUuid = uuid_create();
    
    $content = sprintf(
        $template,
        $uuid,
        $dependsString,
        $service[0],
        $created,
        $facetMatchesString,
        $service[1]
    );
    
    file_put_contents($outputDir . "node-$nodeId.yml", $content);
}

function uuid_create() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
