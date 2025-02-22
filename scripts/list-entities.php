<?php

// Get entity type manager and query factory
$entityTypeManager = \Drupal::entityTypeManager();
$entityTypes = $entityTypeManager->getDefinitions();

// Sort alphabetically
ksort($entityTypes);

// Print header
printf("\n%-30s %-20s %-10s %-30s\n", 'ID', 'Label', 'Count', 'Class');
print str_repeat('-', 90) . "\n";

// Print each entity type with count
foreach ($entityTypes as $entityType) {
    try {
        $count = $entityTypeManager->getStorage($entityType->id())->getQuery()->count()->execute();
    } catch (\Exception $e) {
        $count = 'N/A';
    }
    
    printf("%-30s %-20s %-10s %-30s\n",
        $entityType->id(),
        $entityType->getLabel(),
        $count,
        $entityType->getClass()
    );
}

print "\nTotal: " . count($entityTypes) . " entity types\n\n";
