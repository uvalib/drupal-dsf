(function () {
	'use strict';

	// Follow official Matomo pattern exactly
	var _paq = window._paq = window._paq || [];
	
	try {
		if (typeof console !== 'undefined' && console.log) {
			console.log('DSF Analytics: matomo-fixed loader executing');
		}
		
		// Wait for drupalSettings to be available
		var getSettings = function() {
			if (typeof drupalSettings !== 'undefined') {
				return drupalSettings;
			}
			return null;
		};
		
		var settings = getSettings();
		if (!settings) {
			if (typeof console !== 'undefined' && console.warn) {
				console.warn('DSF Analytics: drupalSettings not available, using defaults');
			}
			// Use hardcoded defaults if drupalSettings not available
			settings = {
				dsfAnalytics: {
					matomo: {
						url: 'https://analytics.lib.virginia.edu/',
						siteId: 67
					}
				}
			};
		}
		
		// Prefer DSF module config; fallback to contrib matomo settings
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

		// Convert full URL to protocol-relative URL like official pattern
		var u = baseUrl.replace(/^https?:/, '');
		if (!u.endsWith('/')) {
			u += '/';
		}

		// Follow official Matomo pattern exactly
		/* tracker methods like "setCustomDimension" should be called before "trackPageView" */
		_paq.push(['trackPageView']);
		_paq.push(['enableLinkTracking']);
		
		(function() {
			_paq.push(['setTrackerUrl', u + 'matomo.php']);
			_paq.push(['setSiteId', siteId]);
			var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];
			g.async = true; 
			g.src = u + 'matomo.js'; 
			g.onload = function() {
				if (typeof console !== 'undefined' && console.log) {
					console.log('DSF Analytics: matomo.js loaded successfully');
				}
			};
			g.onerror = function() {
				if (typeof console !== 'undefined' && console.error) {
					console.error('DSF Analytics: matomo.js failed to load');
				}
			};
			s.parentNode.insertBefore(g, s);
		})();
		
		if (typeof console !== 'undefined' && console.log) {
			console.log('DSF Analytics: matomo-fixed initialized with official pattern', { baseUrl: u, siteId: siteId });
		}
		
	} catch (e) {
		if (typeof console !== 'undefined' && console.error) {
			console.error('DSF Analytics: matomo-fixed loader error', e);
		}
	}
})();


