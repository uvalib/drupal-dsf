(function () {
	'use strict';

	// Ensure queue exists before we load the tracker
	window._paq = window._paq || [];

	try {
		if (typeof console !== 'undefined' && console.log) {
			console.log('DSF Analytics: matomo-fixed loader executing');
		}
		// Prefer DSF module config; fallback to contrib matomo settings
		var dsf = (typeof drupalSettings !== 'undefined' && drupalSettings.dsfAnalytics && drupalSettings.dsfAnalytics.matomo) ? drupalSettings.dsfAnalytics.matomo : null;
		var contrib = (typeof drupalSettings !== 'undefined' && drupalSettings.matomo) ? drupalSettings.matomo : null;
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
			// Nothing to do without config
			if (typeof console !== 'undefined' && console.warn) {
				console.warn('DSF Analytics: matomo-fixed missing baseUrl/siteId');
			}
			return;
		}

		// Minimal bootstrap consistent with Matomo’s recommended snippet
		_paq.push(['setSiteId', siteId]);
		_paq.push(['setTrackerUrl', baseUrl + 'matomo.php']);
		_paq.push(['enableLinkTracking']);
		// Ensure at least one initial pageview on first load
		_paq.push(['trackPageView']);

		// Load matomo.js with async only (no defer)
		var d = document;
		var g = d.createElement('script');
		var s = d.getElementsByTagName('script')[0];
		g.type = 'text/javascript';
		g.async = true;
		g.src = baseUrl + 'matomo.js';
		g.onload = function() {
			if (typeof console !== 'undefined' && console.log) {
				console.log('DSF Analytics: matomo.js loaded (async-only)');
			}
		};
		g.onerror = function() {
			if (typeof console !== 'undefined' && console.error) {
				console.error('DSF Analytics: matomo.js failed to load', { src: g.src });
			}
		};
		s.parentNode.insertBefore(g, s);
	} catch (e) {
		// Fail silently
		if (typeof console !== 'undefined' && console.error) {
			console.error('DSF Analytics: matomo-fixed loader error', e);
		}
	}
})();


