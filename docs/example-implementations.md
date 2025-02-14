# CD-Finder Example Implementations

## Reference Implementations

1. Cornell University Research Data Storage Finder
   - Original implementation (2018)
   - URL: https://finder.research.cornell.edu
   - Use Case: Help researchers choose between 18-20 data storage options
   - Features:
     - Storage location options
     - Security compliance requirements
     - Cost considerations
     - Technical specifications

2. Source Code Reference
   - Original repository: https://github.com/CU-CommunityApps/CD-finder
   - Contains example configurations and implementation patterns

## Example Configuration Pattern

### Basic Storage Service Finder

1. Control Types:
   ```
   checkbox:
   - Multiple feature selection
   - Cost requirements
   - Security features

   radio:
   - Location selection
   - Size requirements
   - Support level
   ```

2. Facet Structure Example:
   ```
   Storage Type [radio]
   ├─ Cloud Storage
   ├─ Network Drive
   └─ Archival Storage

   Security Level [checkbox]
   ├─ Basic
   ├─ HIPAA Compliant
   └─ FERPA Compliant

   Budget Range [radio]
   ├─ Free
   ├─ Under $100/month
   └─ Enterprise
   ```

3. Service Paragraphs Fields:
   ```
   - Technical Specifications
   - Security Features
   - Backup Information
   - Cost Structure
   - Support Details
   ```

## Implementation Tips from Cornell
- Start with a minimal viable configuration
- Test with 3-4 services before scaling
- Focus on clear, unambiguous questions
- Provide help text for complex options
- Regular content review and updates

## Additional References

1. Web Archive Links
   - Cornell Finder (Archive.org):
     https://web.archive.org/web/*/https://finder.research.cornell.edu
   - Shows historical implementations from 2018-2020

2. Similar Projects
   - Harvard Research Data Management Systems Finder
     - Similar concept but different implementation
     - https://researchdatamanagement.harvard.edu/tools-services

3. Alternative Implementations
   - Decision Tree Based:
     - UK Data Service: https://ukdataservice.ac.uk/learning-hub/research-data-management/
   - Wizard Style:
     - DMPTool: https://dmptool.org/

## Demo Data Available
- Sample configuration export available at:
  https://github.com/CU-CommunityApps/CD-finder/tree/master/config/install
- Contains example:
  - Taxonomy structure
  - Field configurations
  - Sample services
  - Help content

## Visual References
Consider checking Internet Archive's Wayback Machine for these dates:
- 2018-06-15: Initial launch
- 2019-03-20: Enhanced version
- 2020-01-15: Last known good configuration
