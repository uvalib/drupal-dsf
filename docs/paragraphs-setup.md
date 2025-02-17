# Service Paragraphs Configuration Guide

## Initial Setup
1. Navigate to `/admin/structure/paragraphs_type/service_paragraphs/fields`
2. Review existing fields:
   - First Category (field_first_category)
   - Second Category (field_second_category)

## Field Configuration
1. For each existing/new field:
   - Field Type: Text (formatted, long)
   - Widget: Text area with a WYSIWYG editor
   - Allowed formats: Basic HTML or Full HTML
   - Required: Yes

## Recommended Fields
1. Basic Information:
   - Cost/Pricing
   - Storage Limits
   - Support Level
   - Technical Requirements

2. Additional Details:
   - Access Methods
   - Backup Options
   - Maintenance Windows
   - Service Level Agreement

## Adding New Fields
1. Click "Add field"
2. Select "Text (formatted, long)"
3. Enter field name (e.g., "Storage Limits")
4. Configure field settings:
   - Default format: Basic HTML
   - Required field: Yes
   - Help text: Add clear instructions

## Field Display
1. Go to "Manage display" tab
2. Order fields logically
3. Set format to "Default"
4. Hide labels if preferred

## Testing
1. Create test Service node
2. Verify all fields appear
3. Test WYSIWYG functionality
4. Confirm field order matches requirements
