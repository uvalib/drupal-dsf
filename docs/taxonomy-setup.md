# Detailed Taxonomy Setup Instructions

## 1. Control Type Taxonomy
1. Navigate to `/admin/structure/taxonomy/manage/control_type/overview`
2. Add two terms:
   - Name: "checkbox"
     - Description: "Allow multiple selections (any, all, or none)"
   - Name: "radio"
     - Description: "Force single selection from options"

## 2. Facets Taxonomy
1. Navigate to `/admin/structure/taxonomy/manage/facets/overview`
2. Create top-level terms (Questions/Criteria):
   ```
   Example structure:
   - Storage Location [radio]
     └─ Options:
        ├─ On-Premises
        └─ Cloud-Based
   
   - Security Requirements [checkbox]
     └─ Options:
        ├─ HIPAA Compliance
        ├─ FERPA Compliance
        └─ Encryption at Rest
   ```

3. For each top-level term:
   a. Add "Control Type" reference field
   b. Select appropriate control type (radio/checkbox)
   c. Add child terms for available choices
   d. Use drag-and-drop to arrange hierarchy

## Tips
- Keep question/criteria terms clear and concise
- Limit choices to 2-5 options per criterion
- Use radio buttons when choices are mutually exclusive
- Use checkboxes when multiple selections make sense
- Consider the impact on service matching logic

## Validation
1. Visit `/admin/structure/taxonomy/manage/facets/overview`
2. Verify hierarchy is correct
3. Confirm each top-level term has a control type
4. Test relationship in Finder configuration
