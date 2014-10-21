'use strict';

var endpointClient = angular.module('oauth.endpoint', []);

endpointClient.factory('EndpointFactory', function() {

  return {
    create: function(params, accessToken) {
      var service = {};
      var url;

      /*
       * Defines the authorization URL
       */
      params.state = params.state || {};
      params.state.clientName = accessToken.clientName();

      var oAuthScope = (params.scope) ? params.scope : '',
        state = (params.state) ? encodeURIComponent(JSON.stringify(params.state)) : '',
        authPathHasQuery = (params.authorizePath.indexOf('?') == -1) ? false : true,
        appendChar = (authPathHasQuery) ? '&' : '?';    //if authorizePath has ? already append OAuth2 params

      url = params.site +
        params.authorizePath +
        appendChar + 'response_type=token&' +
        'client_id=' + encodeURIComponent(params.clientId) + '&' +
        'redirect_uri=' + encodeURIComponent(params.redirectUri) + '&' +
        'scope=' + encodeURIComponent(oAuthScope) + '&' +
        'state=' + encodeURIComponent(state);

      /*
       * Returns the authorization URL
       */

      service.url = function () {
        return url;
      };


      /*
       * Redirects the app to the authorization URL
       */

      service.redirect = function () {
        window.location.replace(url);
      };

      return service;
    }
  };
});
