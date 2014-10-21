'use strict';

var accessTokenService = angular.module('oauth.accessToken', ['LocalStorageModule']);

accessTokenService.factory('AccessTokenFactory', function($rootScope, $location, localStorageService, $timeout){
    var accessTokenInstances = {};

    return {
      findOrCreate: function (clientName) {
        if (!clientName) {
          clientName = 'default';
        }
        if (accessTokenInstances[clientName]) {
          return accessTokenInstances[clientName];
        }
        var service = {
            token: null
          },
          oAuth2HashTokens = [ //per http://tools.ietf.org/html/rfc6749#section-4.2.2
            'access_token', 'token_type', 'expires_in', 'scope', 'state',
            'error', 'error_description'
          ];
        accessTokenInstances[clientName] = service;

        /**
         * Returns the access token.
         */
        service.get = function () {
          return this.token;
        };

        /**
         * Returns the accessToken
         */
        service.accessToken = function() {
          return this.token.access_token;
        };

        /**
         * Returns the clientName
         */
        service.clientName = function () {
          return clientName;
        };

        /**
         * Sets and returns the access token. It tries (in order) the following strategies:
         * - takes the token from the fragment URI
         * - takes the token from the sessionStorage
         */
        service.set = function () {
          setTokenFromString($location.hash());

          //If hash is present in URL always use it, cuz its coming from oAuth2 provider redirect
          if (null === service.token) {
            setTokenFromSession();
          }

          return this.token;
        };

        /**
         * Delete the access token and remove the session.
         * @returns {null}
         */
        service.destroy = function () {
          localStorageService.remove(clientName + '.token');
          this.token = null;
          return this.token;
        };


        /**
         * Tells if the access token is expired.
         */
        service.expired = function () {
          return (this.token && this.token.expires_at && this.token.expires_at < new Date());
        };


        /* * * * * * * * * *
         * PRIVATE METHODS *
         * * * * * * * * * */

        /**
         * Get the access token from a string and save it
         * @param hash
         */
        var setTokenFromString = function (hash) {
          var params = getTokenFromString(hash);

          if (params) {
            removeFragment();
            setToken(params);
            setExpiresAt();
            $rootScope.$broadcast('oauth:login', service.token, clientName);
          }
        };

        /**
         * Set the access token from the sessionStorage.
         */
        var setTokenFromSession = function () {
          if (localStorageService.get(clientName + '.token')) {
            var params = localStorageService.get(clientName + '.token');
            params.expires_at = new Date(params.expires_at);
            setToken(params);
          }
        };

        /**
         * Set the access token.
         *
         * @param params
         * @returns {*|{}}
         */
        var setToken = function (params) {
          if( !isCorrectToken(params)) {
            console.debug("Location based token ignored because it did not match clientName.")
            return;
          }
          service.token = service.token || {};      // init the token
          angular.extend(service.token, params);      // set the access token params
          setTokenInSession();                // save the token into the session
          setExpiresAtEvent();                // event to fire when the token expires

          return service.token;
        };

        /**
         * Checks the token for the 'clientName' equality
         * to ensure this is for the client we requested.
         * @param params
         */
        var isCorrectToken = function( params ) {
          if( !params.state)
            return;
          var info = JSON.parse(params.state);
          return info && info.clientName == clientName;
        };

        /**
         * Parse the fragment URI and return an object
         * @param hash
         * @returns {{}}
         */
        var getTokenFromString = function (hash) {
          var params = {},
            regex = /([^&=]+)=([^&]*)/g,
            m;

          while (m = regex.exec(hash)) {
            params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
          }

          if (params.access_token || params.error) {
            return params;
          }
        };

        /**
         * Save the access token into the session
         */
        var setTokenInSession = function () {
          localStorageService.set(clientName + '.token', service.token);
        };

        /**
         * Set the access token expiration date (useful for refresh logics)
         */
        var setExpiresAt = function () {
          if (service.token) {
            var expires_at = new Date();
            expires_at.setSeconds(expires_at.getSeconds() + parseInt(service.token.expires_in) - 60); // 60 seconds less to secure browser and response latency
            service.token.expires_at = expires_at;
          }
        };


        /**
         * Set the timeout at which the expired event is fired
         */
        var setExpiresAtEvent = function () {
          var time = (new Date(service.token.expires_at)) - (new Date());
          if (time) {
            $timeout(function () {
              $rootScope.$broadcast('oauth:expired', service.token, clientName)
            }, time)
          }
        };

        /**
         * Remove the oAuth2 pieces from the hash fragment
         */
        var removeFragment = function () {
          var curHash = $location.hash();
          angular.forEach(oAuth2HashTokens, function (hashKey) {
            var re = new RegExp('&' + hashKey + '(=[^&]*)?|^' + hashKey + '(=[^&]*)?&?');
            curHash = curHash.replace(re, '');
          });

          $location.hash(curHash);
        };


        return service;
      }
    };
});

accessTokenService.factory('AccessToken', function(AccessTokenFactory) {
  return AccessTokenFactory.findOrCreate('default');
});
