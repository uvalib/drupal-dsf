(function () {
	'use strict';

	// Ensure queue exists before we load the tracker
	window._paq = window._paq || [];

	try {
		var settings = (typeof drupalSettings !== 'undefined' && drupalSettings.matomo) ? drupalSettings.matomo : null;
		var baseUrl = settings ? (settings.url_https || settings.url_http) : '';
		var siteId = settings ? settings.site_id : '';

		if (!baseUrl || !siteId) {
			// Nothing to do without config
			return;
		}

		// Minimal bootstrap consistent with Matomo’s recommended snippet
		_paq.push(['setSiteId', siteId]);
		_paq.push(['setTrackerUrl', baseUrl + 'matomo.php']);
		_paq.push(['enableLinkTracking']);

		// Load matomo.js with async only (no defer)
		var d = document;
		var g = d.createElement('script');
		var s = d.getElementsByTagName('script')[0];
		g.type = 'text/javascript';
		g.async = true;
		g.src = baseUrl + 'matomo.js';
		s.parentNode.insertBefore(g, s);
	} catch (e) {
		// Fail silently
	}
})();


