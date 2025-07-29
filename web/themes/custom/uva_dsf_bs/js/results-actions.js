/**
 * @file
 * JavaScript for safe results sharing functionality.
 */

(function ($) {
  'use strict';

  // Function to initialize once DOM and dependencies are ready
  function initResultsActions() {
    
    // Prevent multiple initializations
    if (window.resultsActionsInitialized) {
      return;
    }
    window.resultsActionsInitialized = true;
    
    // Function to get selected criteria and results
    function getResultsData() {
      var data = {
        selectedCriteria: [],
        selectedServices: [],
        comparisonTable: '',
        url: window.location.href
      };

      // Get selected facets/criteria
      $('.facet:checked').each(function() {
        var label = $(this).closest('label').text().trim();
        var question = $(this).closest('fieldset').prev('h4').text().trim();
        data.selectedCriteria.push({
          question: question,
          answer: label
        });
      });

      // Get selected services from comparison chart
      $('.cardcheckbox:checked').each(function() {
        var servicePanel = $(this).closest('.service-panel');
        var title = servicePanel.find('.service-title').text().trim();
        var summary = servicePanel.find('p').text().trim();
        data.selectedServices.push({
          title: title,
          summary: summary
        });
      });

      // Get the entire comparison table if it exists and is visible
      var comparisonTable = $('#comparisonchart');
      if (comparisonTable.length > 0 && comparisonTable.is(':visible')) {
        // Instead of cloning and removing, let's build a new table with only visible columns
        var visibleServices = [];
        
        // Get the IDs of services that are currently visible in the table
        $('.cardcheckbox:checked').each(function() {
          var servicePanel = $(this).closest('.service-panel');
          var serviceId = servicePanel.attr('service');
          if (serviceId) {
            visibleServices.push(serviceId);
          }
        });
        
        if (visibleServices.length > 0) {
          // Build a new table with only the visible columns
          data.comparisonTable = buildVisibleTable(comparisonTable, visibleServices);
          data.comparisonTableText = extractTableAsText($(data.comparisonTable));
        } else {
          // If no services are selected, include the whole table
          data.comparisonTable = comparisonTable.prop('outerHTML');
          data.comparisonTableText = extractTableAsText(comparisonTable);
        }
      }

      return data;
    }

    // Function to extract table data as readable text
    function extractTableAsText(table) {
      var text = '';
      var rows = table.find('tr');
      
      rows.each(function(index) {
        var row = $(this);
        var cells = row.find('th, td');
        var rowText = [];
        
        cells.each(function() {
          var cellText = $(this).text().trim();
          // Remove extra whitespace and clean up
          cellText = cellText.replace(/\s+/g, ' ');
          if (cellText) {
            rowText.push(cellText);
          }
        });
        
        if (rowText.length > 0) {
          text += rowText.join(' | ') + '\n';
        }
      });
      
      return text;
    }

    // Function to build a table with only visible service columns - Print optimized
    function buildVisibleTable(originalTable, visibleServiceIds) {
      var newTable = $('<table class="table table-striped table-bordered" role="table"></table>');
      
      // Add accessible table caption
      newTable.append('<caption class="sr-only">Comparison table showing selected data storage services and their characteristics</caption>');
      
      var originalRows = originalTable.find('tr');
      var headerRowProcessed = false;
      
      originalRows.each(function() {
        var originalRow = $(this);
        var newRow = $('<tr></tr>');
        var cells = originalRow.find('th, td');
        var isHeaderRow = originalRow.parent().is('thead') || originalRow.find('th[scope="col"]').length > 0;
        
        cells.each(function() {
          var cell = $(this);
          var cellClasses = cell.attr('class') || '';
          var cellClone = cell.clone();
          
          // Optimize text content for printing
          var cellText = cellClone.text().trim();
          if (cellText) {
            // Break long text with word breaks for better printing
            if (cellText.length > 100) {
              cellText = cellText.replace(/(.{80})/g, '$1<wbr>');
            }
            cellClone.html(cellText);
          }
          
          // Always include the first column (row headers) and cells without service class
          if (!cellClasses.includes('service')) {
            // Ensure proper accessibility attributes
            if (cellClone.is('th') && !cellClone.attr('scope')) {
              if (isHeaderRow) {
                cellClone.attr('scope', 'col');
              } else {
                cellClone.attr('scope', 'row');
              }
            }
            
            // Add print-friendly attributes
            if (cellClone.is('th:first-child') || cellClone.is('td:first-child')) {
              cellClone.attr('style', 'min-width: 120px; max-width: 120px; word-wrap: break-word;');
            }
            
            newRow.append(cellClone);
          } else {
            // For service columns, check if this service is in our visible list
            var isVisible = false;
            for (var i = 0; i < visibleServiceIds.length; i++) {
              if (cellClasses.includes('service-' + visibleServiceIds[i])) {
                isVisible = true;
                break;
              }
            }
            if (isVisible) {
              // Ensure proper accessibility attributes for service columns
              if (cellClone.is('th') && !cellClone.attr('scope')) {
                cellClone.attr('scope', 'col');
              }
              
              // Add print-friendly attributes for service columns
              cellClone.attr('style', 'min-width: 80px; max-width: 100px; word-wrap: break-word; hyphens: auto;');
              
              newRow.append(cellClone);
            }
          }
        });
        
        // Only add rows that have content
        if (newRow.find('th, td').length > 0) {
          newTable.append(newRow);
        }
      });
      
      return newTable.prop('outerHTML');
    }

    // Function to create an alternative print layout for very wide tables
    function createAlternativePrintLayout(data) {
      if (!data.selectedServices || data.selectedServices.length === 0) {
        return '';
      }

      var html = '<section aria-labelledby="alt-comparison-heading">';
      html += '<h2 id="alt-comparison-heading">Service-by-Service Comparison</h2>';
      html += '<p class="text-muted">This layout shows each service\'s details separately for better printing.</p>';

      // Get the original table to extract field names
      var originalTable = $('#comparisonchart');
      var fieldNames = [];
      
      // Extract field names from the first column
      originalTable.find('tr').each(function() {
        var firstCell = $(this).find('th:first-child, td:first-child');
        var fieldName = firstCell.text().trim();
        if (fieldName && fieldName !== '' && !fieldNames.includes(fieldName)) {
          fieldNames.push(fieldName);
        }
      });

      // Create a section for each service
      data.selectedServices.forEach(function(service, index) {
        html += '<div style="page-break-inside: avoid; margin-bottom: 2em; border: 1px solid #ccc; padding: 1em;">';
        html += '<h3 style="margin-top: 0; color: #000; border-bottom: 2px solid #000; padding-bottom: 0.5em;">';
        html += escapeHtml(service.title) + '</h3>';
        html += '<p style="margin-bottom: 1em; font-style: italic;">' + escapeHtml(service.summary) + '</p>';
        
        // Create a simple two-column layout for this service's data
        html += '<table style="width: 100%; border-collapse: collapse; font-size: 10px;">';
        
        // Extract this service's data from the original table
        var serviceIndex = index + 1; // Assuming services start from column 1
        originalTable.find('tr').each(function() {
          var cells = $(this).find('th, td');
          if (cells.length > serviceIndex) {
            var fieldCell = cells.eq(0);
            var valueCell = cells.eq(serviceIndex);
            var fieldText = fieldCell.text().trim();
            var valueText = valueCell.text().trim();
            
            if (fieldText && valueText && fieldText !== valueText) {
              html += '<tr>';
              html += '<td style="border: 1px solid #000; padding: 6px; font-weight: bold; width: 30%; vertical-align: top;">';
              html += escapeHtml(fieldText) + '</td>';
              html += '<td style="border: 1px solid #000; padding: 6px; width: 70%; word-wrap: break-word;">';
              html += escapeHtml(valueText) + '</td>';
              html += '</tr>';
            }
          }
        });
        
        html += '</table>';
        html += '</div>';
        
        // Add page break between services for printing
        if (index < data.selectedServices.length - 1) {
          html += '<div style="page-break-after: always;"></div>';
        }
      });

      html += '</section>';
      return html;
    }

    // Function to format results as text
    function formatResultsAsText(data) {
      var text = "Data Storage Finder Results\n";
      text += "==========================\n\n";
      
      if (data.selectedCriteria.length > 0) {
        text += "Selected Criteria:\n";
        text += "-----------------\n";
        data.selectedCriteria.forEach(function(criterion) {
          text += "• " + criterion.question + ": " + criterion.answer + "\n";
        });
        text += "\n";
      }

      if (data.selectedServices.length > 0) {
        text += "Selected Services for Comparison:\n";
        text += "--------------------------------\n";
        data.selectedServices.forEach(function(service) {
          text += "• " + service.title + "\n";
          text += "  " + service.summary + "\n\n";
        });
      }

      // Add the comparison table if available
      if (data.comparisonTableText) {
        text += "Detailed Comparison Table:\n";
        text += "=========================\n";
        text += data.comparisonTableText + "\n";
      }

      text += "View full details: " + data.url + "\n";
      text += "\nGenerated on: " + new Date().toLocaleDateString();
      
      return text;
    }

    // Function to format results as HTML
    function formatResultsAsHTML(data) {
      var html = "<div role='document' aria-label='Data Storage Finder Results'>";
      html += "<h1>Data Storage Finder Results</h1>";
      
      if (data.selectedCriteria.length > 0) {
        html += "<section aria-labelledby='criteria-heading'>";
        html += "<h2 id='criteria-heading'>Selected Criteria</h2>";
        html += "<ul role='list'>";
        data.selectedCriteria.forEach(function(criterion) {
          html += "<li><strong>" + escapeHtml(criterion.question) + ":</strong> " + escapeHtml(criterion.answer) + "</li>";
        });
        html += "</ul></section>";
      }

      if (data.selectedServices.length > 0) {
        html += "<section aria-labelledby='services-heading'>";
        html += "<h2 id='services-heading'>Selected Services for Comparison</h2>";
        html += "<ul role='list'>";
        data.selectedServices.forEach(function(service) {
          html += "<li><strong>" + escapeHtml(service.title) + "</strong><br>" + escapeHtml(service.summary) + "</li>";
        });
        html += "</ul></section>";
      }

      // Add the comparison table if available
      if (data.comparisonTable) {
        html += "<section aria-labelledby='table-heading'>";
        html += "<h2 id='table-heading'>Detailed Comparison Table</h2>";
        html += "<div style='margin: 1em 0; overflow-x: auto;' role='region' aria-label='Scrollable comparison table' class='screen-only'>";
        
        // Add WCAG compliant styling to the table
        var styledTable = data.comparisonTable.replace(
          '<table', 
          '<table role="table" style="border-collapse: collapse; width: 100%; font-size: 12px;" aria-label="Service comparison data"'
        ).replace(
          /<th(?![^>]*scope=)/g, 
          '<th scope="col"'
        ).replace(
          /<th/g, 
          '<th style="border: 1px solid #333; padding: 8px; background-color: #f5f5f5; text-align: left; font-weight: bold; color: #000;"'
        ).replace(
          /<td/g, 
          '<td style="border: 1px solid #333; padding: 8px; text-align: left; color: #000;"'
        );
        
        html += styledTable;
        html += "</div>";
        
        // Add print-friendly alternative layout
        html += "<div class='print-only' style='display: none;'>";
        html += createAlternativePrintLayout(data);
        html += "</div>";
        
        html += "</section>";
      }

      html += "<section aria-labelledby='details-heading'>";
      html += "<h2 id='details-heading'>Additional Information</h2>";
      html += "<p><strong>View full details:</strong> <a href='" + escapeHtml(data.url) + "' aria-label='View full details on website'>" + escapeHtml(data.url) + "</a></p>";
      html += "<p><em>Generated on: " + new Date().toLocaleDateString() + "</em></p>";
      html += "</section></div>";
      
      return html;
    }

    // Helper function to escape HTML for security and accessibility
    function escapeHtml(text) {
      var div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Print functionality
    $('#print_results').on('click', function() {
      var data = getResultsData();
      var printContent = formatResultsAsHTML(data);
      
      var printWindow;
      try {
        printWindow = window.open('', '_blank', 'width=800,height=600');
        
        // Enhanced accessibility and error handling
        if (!printWindow) {
          var errorMsg = 'Print window was blocked by your browser. Please allow popups for this site and try again, or use the email preview above to manually copy the results.';
          announceToScreenReader(errorMsg);
          alert(errorMsg);
          return;
        }
        
        printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Data Storage Finder Results - Print View</title>
            <style>
              /* WCAG 2.0 AA compliant styles */
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                line-height: 1.5; 
                color: #000;
                background: #fff;
              }
              h1 { 
                color: #000; 
                margin-top: 0; 
                font-size: 24px;
                font-weight: bold;
              }
              h2 { 
                color: #000; 
                margin-top: 20px; 
                margin-bottom: 10px; 
                font-size: 18px;
                font-weight: bold;
              }
              ul[role="list"] { 
                list-style-type: disc; 
                margin-left: 20px; 
                padding-left: 0;
              }
              li { 
                margin-bottom: 10px; 
                line-height: 1.4;
              }
              table { 
                border-collapse: collapse; 
                width: 100%; 
                margin: 1em 0; 
              }
              th, td { 
                border: 1px solid #333; 
                padding: 8px; 
                text-align: left; 
                vertical-align: top;
              }
              th { 
                background-color: #f5f5f5; 
                font-weight: bold; 
                color: #000;
              }
              td {
                color: #000;
              }
              a { 
                color: #0066cc; 
                text-decoration: underline;
              }
              section {
                margin-bottom: 2em;
              }
              .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0,0,0,0);
                white-space: nowrap;
                border: 0;
              }
              @media print {
                @page { 
                  margin: 0.5in; 
                  size: landscape;
                }
                body { 
                  margin: 0; 
                  font-size: 10px;
                  line-height: 1.4; /* WCAG 2.2 AA - improved line height */
                  color: #000; /* WCAG 2.2 AA - ensure high contrast */
                }
                a { 
                  color: #000; 
                  text-decoration: none;
                }
                h1 {
                  font-size: 16px;
                  margin-bottom: 10px;
                  font-weight: bold;
                  color: #000;
                }
                h2 {
                  font-size: 14px;
                  margin: 15px 0 8px 0;
                  font-weight: bold;
                  color: #000;
                }
                h3 {
                  font-size: 12px;
                  margin: 10px 0 6px 0;
                  font-weight: bold;
                  color: #000;
                }
                /* Hide screen-only content and show print-only content */
                .screen-only {
                  display: none !important;
                }
                .print-only {
                  display: block !important;
                }
                /* WCAG 2.2 AA - Enhanced table accessibility for print */
                table { 
                  font-size: 9px; /* Slightly larger for better readability */
                  width: 100%;
                  table-layout: fixed;
                  word-wrap: break-word;
                  page-break-inside: avoid;
                  border-collapse: collapse;
                  margin: 10px 0;
                  /* WCAG 2.2 AA - Ensure sufficient color contrast */
                  color: #000;
                  background: #fff;
                }
                th, td { 
                  padding: 4px 3px; /* Increased padding for readability */
                  border: 1px solid #000;
                  vertical-align: top;
                  word-break: break-word;
                  hyphens: auto;
                  max-width: none;
                  overflow: visible;
                  /* WCAG 2.2 AA - Text spacing requirements */
                  line-height: 1.3;
                }
                th {
                  font-weight: bold;
                  font-size: 9px;
                  background-color: #f0f0f0;
                  color: #000;
                }
                /* WCAG 2.2 AA - Ensure table fits properly */
                .table-responsive {
                  overflow: visible !important;
                }
                /* WCAG 2.2 AA - Optimized column sizing */
                table th:first-child,
                table td:first-child {
                  min-width: 130px;
                  max-width: 130px;
                  font-weight: bold;
                }
                table th:not(:first-child),
                table td:not(:first-child) {
                  min-width: 90px;
                  max-width: 110px;
                }
                section {
                  page-break-inside: avoid;
                  margin-bottom: 1.2em;
                }
                h1, h2, h3 {
                  page-break-after: avoid;
                }
                ul {
                  margin: 10px 0;
                  padding-left: 18px;
                }
                li {
                  margin-bottom: 5px;
                  font-size: 9px;
                  line-height: 1.3;
                }
                /* Alternative layout specific styles */
                .print-only table {
                  font-size: 9px;
                  table-layout: auto;
                  margin-bottom: 1em;
                }
                .print-only th,
                .print-only td {
                  padding: 5px 7px;
                  word-wrap: break-word;
                  line-height: 1.3;
                }
                /* WCAG 2.2 AA - Ensure proper page breaks */
                div[style*="page-break-inside: avoid"] {
                  page-break-inside: avoid;
                }
                div[style*="page-break-after: always"] {
                  page-break-after: always;
                }
                /* WCAG 2.2 AA - Print-specific accessibility */
                .sr-only {
                  position: static !important;
                  width: auto !important;
                  height: auto !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  overflow: visible !important;
                  clip: auto !important;
                  white-space: normal !important;
                  border: 0 !important;
                  font-size: 8px !important;
                  font-style: italic !important;
                  color: #666 !important;
                }
              }
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              // Focus management for accessibility
              document.addEventListener('DOMContentLoaded', function() {
                document.body.focus();
                // Auto-print after content loads
                setTimeout(function() {
                  try {
                    window.print();
                  } catch (printErr) {
                    console.error('Print error:', printErr);
                  }
                }, 500);
              });
              
              // Handle window errors
              window.onerror = function(msg, url, lineNo, columnNo, error) {
                console.error('Print window error:', error);
                return false;
              };
            </script>
          </body>
          </html>
        `);
        
        printWindow.document.close();
        
        // Enhanced focus management
        printWindow.onload = function() {
          try {
            printWindow.focus();
            announceToScreenReader('Print window opened successfully. Print dialog should appear shortly.');
          } catch (focusErr) {
            console.error('Focus error:', focusErr);
            announceToScreenReader('Print window opened. You may need to manually switch to the print window.');
          }
        };
        
        // Error handling for print window
        printWindow.onerror = function(msg, url, lineNo, columnNo, error) {
          console.error('Print window error:', error);
          announceToScreenReader('Print window encountered an error, but should still be usable.');
          return false;
        };
        
      } catch (err) {
        console.error('Print window creation error:', err);
        var fallbackMsg = 'Unable to open print window. This may be due to browser security settings. The results are displayed in the email preview above where you can manually copy and print them.';
        announceToScreenReader(fallbackMsg);
        alert(fallbackMsg);
      }
    });

    // Copy to clipboard functionality
    $('#copy_results').on('click', function() {
      var data = getResultsData();
      var textContent = formatResultsAsText(data);
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textContent).then(function() {
          showCopyFeedback();
        }).catch(function() {
          fallbackCopyToClipboard(textContent);
        });
      } else {
        fallbackCopyToClipboard(textContent);
      }
    });

    // Fallback copy function for older browsers
    function fallbackCopyToClipboard(text) {
      var textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('aria-hidden', 'true');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        showCopyFeedback();
      } catch (err) {
        // More accessible error message
        var errorMsg = 'Unable to copy to clipboard automatically. The results are displayed in the email preview above where you can manually select and copy the text.';
        announceToScreenReader(errorMsg);
        alert(errorMsg);
      }
      
      document.body.removeChild(textArea);
    }

    // Show copy feedback
    function showCopyFeedback() {
      $('#copy_feedback').fadeIn().delay(3000).fadeOut();
      // Announce to screen readers
      var announcement = 'Results have been copied to clipboard';
      announceToScreenReader(announcement);
    }

    // Generate email functionality - DISABLED
    $('#generate_email').on('click', function() {
      // Email functionality is currently disabled
      announceToScreenReader('Email functionality is currently disabled. Please use the share link or copy functionality instead.');
      return false;
      
      var data = getResultsData();
      var htmlContent = formatResultsAsHTML(data);
      var textContent = formatResultsAsText(data);
      
      $('#email_content').html(htmlContent);
      
      // Create a shorter mailto URL for better compatibility
      var subject = encodeURIComponent('Data Storage Finder Results');
      // Truncate body to avoid URL length limits (many browsers limit to ~2000 chars)
      var shortBody = textContent.length > 1500 ? 
        textContent.substring(0, 1500) + '\n\n[Content truncated - see full results in email preview above]' : 
        textContent;
      var body = encodeURIComponent(shortBody);
      var mailtoLink = 'mailto:?subject=' + subject + '&body=' + body;
      
      $('#open_email_client').attr('href', mailtoLink);
      
      $('#email_preview').slideDown();
      
      // Focus management for accessibility
      setTimeout(function() {
        $('#email_preview h4').focus();
      }, 300);
    });

    // Open email client - Enhanced with better error handling and feedback
    $('#open_email_client').on('click', function(e) {
      var href = $(this).attr('href');
      
      // Check if we have a valid mailto link
      if (!href || !href.startsWith('mailto:')) {
        e.preventDefault();
        var errorMsg = 'Email content not ready. Please try clicking "Generate Email" first.';
        announceToScreenReader(errorMsg);
        alert(errorMsg);
        return;
      }

      // Let the browser handle the mailto link, but provide better feedback
      announceToScreenReader('Attempting to open email client...');
      
      // Show immediate feedback
      var feedbackDiv = $('<div class="alert alert-info mt-2" style="display: none;" id="email_attempt_feedback">' +
        '<i class="fa fa-info-circle" aria-hidden="true"></i> ' +
        'Attempting to open your email client. If it doesn\'t open, your browser may not have a default email client configured, ' +
        'or the content may be too long. Use "Copy Email Text" below as an alternative.' +
        '</div>');
      
      // Remove any existing feedback
      $('#email_attempt_feedback').remove();
      $('#email_preview').append(feedbackDiv);
      feedbackDiv.slideDown();
      
      // Hide feedback after delay
      setTimeout(function() {
        feedbackDiv.slideUp(function() {
          $(this).remove();
        });
      }, 8000);
      
      // Additional help message after delay
      setTimeout(function() {
        var helpMsg = 'If your email client did not open, this may be because:\n' +
          '• No default email client is configured in your browser\n' +
          '• The content is too long for a mailto link\n' +
          '• Your browser security settings prevent mailto links\n\n' +
          'Please use the "Copy Email Text" button below to copy the content manually.';
        announceToScreenReader('Email client status: If the email application did not open, please use the copy button instead.');
      }, 3000);
    });

    // Close email preview
    $('#close_email_preview').on('click', function() {
      $('#email_preview').slideUp();
    });

    // Initialize persistent share link display
    function initPersistentShareLink() {
      const persistentUrlInput = $('#persistent_share_url');
      const copyPersistentButton = $('#copy_persistent_link');
      const persistentCopyFeedback = $('#persistent_copy_feedback');

      // Update persistent share link display
      function updatePersistentShareLink() {
        try {
          const shareUrl = createShareableUrl(false); // Don't include timestamp for persistent link
          persistentUrlInput.val(shareUrl);
        } catch (error) {
          console.error('Error updating persistent share link:', error);
          persistentUrlInput.val(window.location.href);
        }
      }

      // Copy persistent share link
      copyPersistentButton.on('click', function() {
        var shareUrl = persistentUrlInput.val();
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(shareUrl).then(function() {
            persistentCopyFeedback.show();
            setTimeout(() => persistentCopyFeedback.hide(), 3000);
            announceToScreenReader('Share link copied to clipboard successfully.');
          }).catch(function() {
            fallbackCopyToClipboard(shareUrl);
          });
        } else {
          fallbackCopyToClipboard(shareUrl);
        }
      });

      // Initial update
      updatePersistentShareLink();

      // Return the update function so it can be called when selections change
      return updatePersistentShareLink;
    }

    // Initialize persistent share link
    var updatePersistentLink = initPersistentShareLink();

    // Function to create a shareable URL with current state
    function createShareableUrl(includeTimestamp) {
      if (includeTimestamp === undefined) {
        includeTimestamp = true; // Default behavior for share links
      }
      
      var currentUrl = window.location.href.split('?')[0]; // Base URL without query params
      var queryParts = [];
      
      // Get current facet selections (matching app.js structure)
      var selectedFacets = [];
      $('.facet:checked').each(function() {
        var facetId = $(this).attr('facetid');
        if (facetId) {
          selectedFacets.push(facetId);
        }
      });
      
      if (selectedFacets.length > 0) {
        // Use simple comma-separated format without encoding
        queryParts.push('facets=' + selectedFacets.join(','));
      }
      
      // Get selected services for comparison (matching app.js structure)
      var selectedServices = [];
      $('.cardcheckbox:checked').each(function() {
        var servicePanel = $(this).closest('.service-panel');
        var serviceId = servicePanel.attr('service');
        if (serviceId) {
          selectedServices.push(serviceId);
        }
      });
      
      if (selectedServices.length > 0) {
        // Use simple comma-separated format without encoding
        queryParts.push('services=' + selectedServices.join(','));
      }
      
      // Add timestamp for cache busting and tracking (only for explicit share links)
      if (includeTimestamp) {
        queryParts.push('shared=' + Date.now());
      } else {
        // For browser URL updates, preserve existing shared timestamp if present
        var currentParams = new URLSearchParams(window.location.search);
        if (currentParams.has('shared')) {
          queryParts.push('shared=' + currentParams.get('shared'));
        }
      }
      
      var shareUrl = currentUrl;
      if (queryParts.length > 0) {
        shareUrl += '?' + queryParts.join('&');
      }
      
      return shareUrl;
    }

    // Function to update the browser URL to reflect current state (for bookmarking)
    function updateBrowserUrl() {
      try {
        var shareUrl = createShareableUrl(false); // Don't add new timestamp for browser URL
        var currentUrl = window.location.href;
        
        // Only update if the URL would actually change (avoid unnecessary history entries)
        if (shareUrl !== currentUrl) {
          // Use replaceState to update URL without adding to browser history
          window.history.replaceState(
            { timestamp: Date.now() }, 
            document.title, 
            shareUrl
          );
          
          // Optional: Announce to screen readers for debugging (can be removed in production)
          // announceToScreenReader('Page URL updated to reflect current selections');
        }
        
        // Update the persistent share link display
        if (typeof updatePersistentLink === 'function') {
          updatePersistentLink();
        }
      } catch (error) {
        // Fail silently if History API is not supported
        console.log('URL update failed:', error);
      }
    }

    // Function to initialize URL sync with user interactions
    function initUrlSync() {
      // Update URL when facets change
      $(document).on('change', '.facet', function() {
        setTimeout(updateBrowserUrl, 100);
      });
      
      // Update URL when services are selected/deselected
      $(document).on('change', '.cardcheckbox', function() {
        setTimeout(updateBrowserUrl, 100);
      });
      
      // Update URL when manual comparison checkboxes change
      $(document).on('change', '.manualcheckbox', function() {
        setTimeout(updateBrowserUrl, 100);
      });
      
      // Listen for custom event when filters are cleared
      $(document).on('filtersCleared', function() {
        setTimeout(updateBrowserUrl, 100);
      });
      
      // Initial URL update on page load (after restoration)
      setTimeout(function() {
        updateBrowserUrl();
      }, 1000);
    }

    // Make functions available globally for other scripts
    window.updateBrowserUrl = updateBrowserUrl;
    window.updatePersistentLink = updatePersistentLink;

    // Show share copy feedback
    function showShareCopyFeedback() {
      // Remove any existing feedback
      $('#share_copy_feedback').remove();
      
      var feedbackHtml = '<div id="share_copy_feedback" class="alert alert-success mt-2" role="status" aria-live="polite">' +
        '<i class="fa fa-check-circle" aria-hidden="true"></i> ' +
        'Share link copied to clipboard! You can now paste it anywhere to share your comparison setup.' +
        '</div>';
      
      $('#share_link_preview').append(feedbackHtml);
      $('#share_copy_feedback').fadeIn().delay(6000).fadeOut(function() {
        $(this).remove();
      });
      
      // Announce to screen readers
      var announcement = 'Share link has been copied to clipboard and is ready to paste';
      announceToScreenReader(announcement);
    }

    // Function to restore state from URL parameters (should be called on page load)
    function restoreFromShareLink() {
      var urlParams = new URLSearchParams(window.location.search);
      
      // Check if this is a shared link and hasn't been restored already
      if (urlParams.has('shared') && !window.shareLinksRestored) {
        window.shareLinksRestored = true; // Prevent multiple executions
        
        announceToScreenReader('Loading shared comparison setup...');
        
        // Restore facet selections (matching app.js expectations)
        if (urlParams.has('facets')) {
          var facets = urlParams.get('facets').split(',');
          facets.forEach(function(facetId) {
            // Find and check the appropriate facet input by ID
            var selector = '#facet-' + facetId + ', [facetid="' + facetId + '"]';
            $(selector).prop('checked', true).trigger('change');
          });
        }
        
        // Restore service selections (matching app.js expectations)
        if (urlParams.has('services')) {
          var services = urlParams.get('services').split(',');
          services.forEach(function(serviceId) {
            // Find service panel and check its checkbox
            var servicePanel = $('#service-' + serviceId);
            if (servicePanel.length > 0) {
              servicePanel.find('.cardcheckbox').prop('checked', true).trigger('change');
            }
          });
        }
        
        // Show notification that link was restored (only once)
        setTimeout(function() {
          // Double-check no notification exists already
          if ($('.share-link-notification').length === 0) {
            var notification = $('<div class="alert alert-info alert-dismissible fade show share-link-notification" role="alert">' +
              '<i class="fa fa-link" aria-hidden="true"></i> ' +
              '<strong>Shared Link Loaded:</strong> This comparison was shared with you. The criteria and services have been pre-selected.' +
              '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
              '<span aria-hidden="true">&times;</span>' +
              '</button>' +
              '</div>');
            
            $('#app').prepend(notification);
            
            // Auto-dismiss after 10 seconds
            setTimeout(function() {
              notification.fadeOut(function() {
                $(this).remove();
              });
            }, 10000);
            
            announceToScreenReader('Shared comparison setup loaded successfully.');
          }
        }, 1000);
      }
    }

    // Copy email content functionality - Enhanced with better feedback
    $('#copy_email_content').on('click', function() {
      var data = getResultsData();
      var textContent = formatResultsAsText(data);
      var emailText = "Subject: Data Storage Finder Results\n\n" + textContent;
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(emailText).then(function() {
          showEmailCopyFeedback();
        }).catch(function() {
          fallbackCopyToClipboard(emailText);
        });
      } else {
        fallbackCopyToClipboard(emailText);
      }
    });

    // Show email copy feedback - Enhanced
    function showEmailCopyFeedback() {
      // Remove any existing feedback
      $('#email_copy_feedback').remove();
      
      var feedbackHtml = '<div id="email_copy_feedback" class="alert alert-success mt-2" role="status" aria-live="polite">' +
        '<i class="fa fa-check-circle" aria-hidden="true"></i> ' +
        'Email content copied to clipboard! You can now paste it into your email client (Ctrl+V or Cmd+V).' +
        '</div>';
      
      $('#email_preview').append(feedbackHtml);
      $('#email_copy_feedback').fadeIn().delay(6000).fadeOut(function() {
        $(this).remove();
      });
      
      // Announce to screen readers
      var announcement = 'Email content has been copied to clipboard and is ready to paste';
      announceToScreenReader(announcement);
    }

    // Function to announce messages to screen readers
    function announceToScreenReader(message) {
      var announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      document.body.appendChild(announcement);
      
      // Remove the announcement after it's been read
      setTimeout(function() {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 1000);
    }

    // Enhanced keyboard navigation support for WCAG 2.2 AA accessibility
    function initKeyboardSupport() {
      // Add keyboard support for action buttons (excluding disabled email functionality)
      $('#print_results, #copy_results, #copy_persistent_link').on('keydown', function(e) {
        // Activate on Enter or Space key (WCAG 2.2 AA requirement)
        if (e.which === 13 || e.which === 32) {
          e.preventDefault();
          $(this).click();
          var actionLabel = $(this).attr('aria-label') || $(this).text().trim();
          announceToScreenReader(actionLabel + ' activated');
        }
      });

      // WCAG 2.2 AA - Focus management and appearance (excluding disabled email functionality)
      $('#print_results, #copy_results, #copy_persistent_link')
        .on('focus', function() {
          $(this).addClass('focus-visible');
          // WCAG 2.2 AA - Focus Not Obscured - ensure focus is visible
          this.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        })
        .on('blur', function() {
          $(this).removeClass('focus-visible');
        });

      // WCAG 2.2 AA - Consistent Help - provide help for complex interactions via title attributes
      $('[data-action]').each(function() {
        var action = $(this).data('action');
        var helpText = getHelpTextForAction(action);
        if (helpText) {
          $(this).attr('title', helpText);
          // Removed help-available class to clean up button appearance
        }
      });

      // WCAG 2.2 AA - Target Size compliance
      $('.btn, button, a[role="button"]').each(function() {
        var $this = $(this);
        $this.addClass('no-drag'); // Prevent drag interactions
        
        // Ensure minimum target size
        var width = $this.outerWidth();
        var height = $this.outerHeight();
        if (width < 44 || height < 44) {
          $this.css({
            'min-width': '44px',
            'min-height': '44px',
            'padding': '12px 16px'
          });
        }
      });

            // WCAG 2.2 AA - Redundant Entry prevention
      initRedundantEntryPrevention();
    }    // Helper function to provide consistent help text
    function getHelpTextForAction(action) {
      var helpTexts = {
        'print': 'Opens a print dialog with your comparison results formatted for printing',
        'copy': 'Copies your results to the clipboard as text that you can paste elsewhere',
        'share-link': 'Creates a shareable URL that includes your selected criteria and services',
        'email': 'Creates an email preview with your results that you can copy or send',
        'copy-email': 'Copies the email content to your clipboard for manual pasting into email',
        'open-email': 'Attempts to open your default email client with pre-filled content',
        'close-preview': 'Closes the email preview and returns to the main results view',
        'copy-share': 'Copies the shareable link to your clipboard',
        'test-share': 'Opens the share link in a new tab to verify it works correctly',
        'close-share': 'Closes the share link preview and returns to the main results view'
      };
      return helpTexts[action] || '';
    }

    // WCAG 2.2 AA - Redundant Entry prevention
    function initRedundantEntryPrevention() {
      // Store successful actions to avoid redundant confirmations
      var completedActions = new Set();
      
      $('[data-action]').on('click', function() {
        var action = $(this).data('action');
        if (completedActions.has(action)) {
          // Provide shortcut for repeated actions
          var shortcutMsg = 'This action was recently completed. Press Enter to repeat or Escape to cancel.';
          announceToScreenReader(shortcutMsg);
        }
        
        // Mark action as completed after successful execution
        setTimeout(function() {
          completedActions.add(action);
          // Clear after 5 minutes to prevent indefinite storage
          setTimeout(function() {
            completedActions.delete(action);
          }, 300000);
        }, 1000);
      });
    }

    // WCAG 2.2 AA - Motion preferences support
    function respectMotionPreferences() {
      // Check for reduced motion preference
      var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (prefersReducedMotion) {
        // Disable animations for users who prefer reduced motion
        $.fn.fadeIn = function() { return this.show(); };
        $.fn.fadeOut = function() { return this.hide(); };
        $.fn.slideDown = function() { return this.show(); };
        $.fn.slideUp = function() { return this.hide(); };
      }
    }

    // Initialize all WCAG 2.2 AA enhancements
    respectMotionPreferences();
    initKeyboardSupport();
    initTableNavigation();
    
    // Initialize URL synchronization for bookmarking
    initUrlSync();
    
    // Ensure email functionality is properly hidden from screen readers
    disableEmailAccessibility();
    
    // Restore state from share link if present
    $(document).ready(function() {
      // Small delay to ensure other scripts have initialized
      setTimeout(restoreFromShareLink, 500);
    });

    // Function to properly disable email functionality for accessibility compliance
    function disableEmailAccessibility() {
      // Remove email elements from tab order and accessibility tree
      $('#generate_email, #email-desc, #email_preview').attr({
        'aria-hidden': 'true',
        'tabindex': '-1'
      });
      
      // Remove email-related buttons from tab order
      $('#copy_email_content, #open_email_client, #close_email_preview').attr({
        'aria-hidden': 'true',
        'tabindex': '-1'
      });
      
      console.log('Email functionality disabled for accessibility compliance');
    }

    // WCAG 2.2 AA - Enhanced table navigation
    function initTableNavigation() {
      var $table = $('#comparisonchart');
      var currentCell = null;
      var tableNavigationMode = false;

      // Enable table navigation when table receives focus
      $('#comparisonchart-wrapper').on('keydown', function(e) {
        var $table = $('#comparisonchart');
        
        if (!tableNavigationMode && (e.which >= 37 && e.which <= 40)) {
          // Arrow keys pressed - enter table navigation mode
          tableNavigationMode = true;
          currentCell = $table.find('th:first, td:first').first();
          if (currentCell.length) {
            highlightCell(currentCell);
            announceToScreenReader('Table navigation mode activated. Use arrow keys to navigate, Escape to exit.');
          }
          e.preventDefault();
          return;
        }

        if (tableNavigationMode) {
          switch(e.which) {
            case 37: // Left arrow
              navigateTable('left');
              e.preventDefault();
              break;
            case 38: // Up arrow  
              navigateTable('up');
              e.preventDefault();
              break;
            case 39: // Right arrow
              navigateTable('right');
              e.preventDefault();
              break;
            case 40: // Down arrow
              navigateTable('down');
              e.preventDefault();
              break;
            case 27: // Escape
              exitTableNavigation();
              e.preventDefault();
              break;
            case 13: // Enter
            case 32: // Space
              if (currentCell) {
                announceToScreenReader('Cell content: ' + currentCell.text().trim());
              }
              e.preventDefault();
              break;
          }
        }
      });

      function navigateTable(direction) {
        if (!currentCell) return;

        var $cells = $table.find('th, td');
        var currentIndex = $cells.index(currentCell);
        var $rows = $table.find('tr');
        var currentRow = currentCell.closest('tr');
        var rowIndex = $rows.index(currentRow);
        var cellsInRow = currentRow.find('th, td');
        var cellIndexInRow = cellsInRow.index(currentCell);

        var newCell = null;

        switch(direction) {
          case 'left':
            if (cellIndexInRow > 0) {
              newCell = cellsInRow.eq(cellIndexInRow - 1);
            }
            break;
          case 'right':
            if (cellIndexInRow < cellsInRow.length - 1) {
              newCell = cellsInRow.eq(cellIndexInRow + 1);
            }
            break;
          case 'up':
            if (rowIndex > 0) {
              var prevRow = $rows.eq(rowIndex - 1);
              var prevRowCells = prevRow.find('th, td');
              newCell = prevRowCells.eq(Math.min(cellIndexInRow, prevRowCells.length - 1));
            }
            break;
          case 'down':
            if (rowIndex < $rows.length - 1) {
              var nextRow = $rows.eq(rowIndex + 1);
              var nextRowCells = nextRow.find('th, td');
              newCell = nextRowCells.eq(Math.min(cellIndexInRow, nextRowCells.length - 1));
            }
            break;
        }

        if (newCell && newCell.length) {
          highlightCell(newCell);
          currentCell = newCell;
          
          // Scroll into view if needed
          newCell[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          
          // Announce cell content
          var cellText = newCell.text().trim();
          var isHeader = newCell.is('th');
          var announcement = (isHeader ? 'Header: ' : 'Cell: ') + cellText;
          announceToScreenReader(announcement);
        }
      }

      function highlightCell($cell) {
        // Remove previous highlight
        $table.find('.table-nav-highlight').removeClass('table-nav-highlight');
        
        // Add highlight to current cell
        $cell.addClass('table-nav-highlight');
      }

      function exitTableNavigation() {
        tableNavigationMode = false;
        $table.find('.table-nav-highlight').removeClass('table-nav-highlight');
        currentCell = null;
        announceToScreenReader('Table navigation mode deactivated.');
      }

      // Add CSS for table navigation highlight
      if (!$('#table-nav-styles').length) {
        $('<style id="table-nav-styles">')
          .text('.table-nav-highlight { background-color: #e3f2fd !important; outline: 2px solid #1976d2 !important; outline-offset: -2px !important; }')
          .appendTo('head');
      }
    }
  }

  // Initialize when DOM is ready
  $(document).ready(function() {
    // Small delay to ensure all other scripts have loaded
    setTimeout(initResultsActions, 100);
  });

  // Also try to initialize if Drupal behaviors are available
  if (typeof Drupal !== 'undefined' && Drupal.behaviors) {
    Drupal.behaviors.resultsActions = {
      attach: function (context, settings) {
        initResultsActions();
      }
    };
  }

})(jQuery);
