(function () {
	'use strict';

	// Initialize _paq queue
	var _paq = window._paq = window._paq || [];
	
	try {
		if (typeof console !== 'undefined' && console.log) {
			console.log('DSF Analytics: matomo-fixed loader executing');
		}
		
		// Get settings with fallback defaults
		var settings = (typeof drupalSettings !== 'undefined') ? drupalSettings : null;
		if (!settings) {
			if (typeof console !== 'undefined' && console.warn) {
				console.warn('DSF Analytics: drupalSettings not available, using defaults');
			}
			settings = {
				dsfAnalytics: {
					matomo: {
						url: 'https://analytics.lib.virginia.edu/',
						siteId: 67
					}
				}
			};
		}
		
		// Get Matomo configuration
		var dsf = (settings.dsfAnalytics && settings.dsfAnalytics.matomo) ? settings.dsfAnalytics.matomo : null;
		var contrib = settings.matomo || null;
		var baseUrl = '';
		var siteId = '';
		
		if (dsf) {
			baseUrl = dsf.url || '';
			siteId = (dsf.siteId != null ? dsf.siteId : '');
		}
		if ((!baseUrl || !siteId) && contrib) {
			baseUrl = baseUrl || contrib.url_https || contrib.url_http || '';
			siteId = siteId || contrib.site_id || '';
		}

		if (!baseUrl || !siteId) {
			if (typeof console !== 'undefined' && console.warn) {
				console.warn('DSF Analytics: matomo-fixed missing baseUrl/siteId', { dsf: dsf, contrib: contrib });
			}
			return;
		}

		// Convert to protocol-relative URL
		var u = baseUrl.replace(/^https?:/, '');
		if (!u.endsWith('/')) {
			u += '/';
		}

		// Set up Matomo tracking
		_paq.push(['setSiteId', siteId]);
		_paq.push(['setTrackerUrl', u + 'matomo.php']);
		_paq.push(['enableLinkTracking']);
		_paq.push(['trackPageView']);
		
		// Load Matomo script synchronously (the working approach)
		var d = document;
		var g = d.createElement('script');
		var s = d.getElementsByTagName('script')[0];
		g.async = false;  // Synchronous loading - this is what works
		g.defer = false;
		g.src = u + 'matomo.js';
		
		g.onload = function() {
			if (typeof console !== 'undefined' && console.log) {
				console.log('DSF Analytics: ✅ Matomo script loaded successfully (synchronous)');
			}
			
			// Process any queued events
			if (_paq && _paq.length > 0) {
				if (typeof console !== 'undefined' && console.log) {
					console.log('DSF Analytics: Processing ' + _paq.length + ' queued events');
				}
			}
		};
		
		g.onerror = function() {
			if (typeof console !== 'undefined' && console.error) {
				console.error('DSF Analytics: ❌ Matomo script failed to load');
			}
		};
		
		s.parentNode.insertBefore(g, s);
		
		if (typeof console !== 'undefined' && console.log) {
			console.log('DSF Analytics: matomo-fixed initialized with synchronous loading', { baseUrl: u, siteId: siteId });
		}
		
	} catch (e) {
		if (typeof console !== 'undefined' && console.error) {
			console.error('DSF Analytics: matomo-fixed loader error', e);
		}
	}
})();


