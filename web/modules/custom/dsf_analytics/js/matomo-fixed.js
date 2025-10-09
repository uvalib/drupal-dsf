(function () {
	'use strict';

	// Initialize _paq queue
	var _paq = window._paq = window._paq || [];
	
	// Logging control - set to false to silence most logs
	var DEBUG_LOGGING = false;
	
	// Expose logging control globally for easy debugging
	window.DSF_ANALYTICS_DEBUG = {
		enable: function() {
			DEBUG_LOGGING = true;
			console.log('DSF Analytics: Debug logging enabled');
		},
		disable: function() {
			DEBUG_LOGGING = false;
			console.log('DSF Analytics: Debug logging disabled');
		},
		status: function() {
			console.log('DSF Analytics: Debug logging is ' + (DEBUG_LOGGING ? 'enabled' : 'disabled'));
		},
		isEnabled: function() {
			return !!DEBUG_LOGGING;
		}
	};
	
	// Helper function for conditional logging
	var log = function(message, data) {
		if (DEBUG_LOGGING && typeof console !== 'undefined' && console.log) {
			if (data) {
				console.log('DSF Analytics: ' + message, data);
			} else {
				console.log('DSF Analytics: ' + message);
			}
		}
	};
	
	var warn = function(message, data) {
		if (DEBUG_LOGGING && typeof console !== 'undefined' && console.warn) {
			if (data) {
				console.warn('DSF Analytics: ' + message, data);
			} else {
				console.warn('DSF Analytics: ' + message);
			}
		}
	};
	
	var error = function(message, data) {
		if (typeof console !== 'undefined' && console.error) {
			if (data) {
				console.error('DSF Analytics: ' + message, data);
			} else {
				console.error('DSF Analytics: ' + message);
			}
		}
	};
	
	try {
		log('matomo-fixed loader executing');
		
		// Get settings with fallback defaults
		var settings = (typeof drupalSettings !== 'undefined') ? drupalSettings : null;
		if (!settings) {
			warn('drupalSettings not available, using defaults');
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
			warn('matomo-fixed missing baseUrl/siteId', { dsf: dsf, contrib: contrib });
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
			log('✅ Matomo script loaded successfully (synchronous)');
			
			// Process any queued events
			if (_paq && _paq.length > 0) {
				log('Processing ' + _paq.length + ' queued events');
			}
		};
		
		g.onerror = function() {
			error('❌ Matomo script failed to load');
		};
		
		s.parentNode.insertBefore(g, s);
		
		log('matomo-fixed initialized with synchronous loading', { baseUrl: u, siteId: siteId });
		
	} catch (e) {
		error('matomo-fixed loader error', e);
	}
})();


