'use strict';

describe('Endpoint', function() {

  var result, $location, localStorageService, EndpointFactory, AccessToken;

  var stateFragment = "%257B%2522clientName%2522%253A%2522default%2522%257D"
  var fragment = 'access_token=token&token_type=bearer&expires_in=7200&state=' + stateFragment;
  var params   = { site: 'http://example.com', clientId: 'client-id', redirectUri: 'http://example.com/redirect', scope: 'scope', authorizePath: '/oauth/authorize' };
  var uri      = 'http://example.com/oauth/authorize?response_type=token&client_id=client-id&redirect_uri=http%3A%2F%2Fexample.com%2Fredirect&scope=scope&state=' + stateFragment;

  beforeEach(module('oauth'));

  beforeEach(inject(function($injector) { $location       = $injector.get('$location') }));
  beforeEach(inject(function($injector) { localStorageService = $injector.get('localStorageService') }));
  beforeEach(inject(function($injector) { EndpointFactory        = $injector.get('EndpointFactory') }));
  beforeEach(inject(function($injector) { AccessToken        = $injector.get('AccessToken') }));

  describe('#create', function() {

    beforeEach(function() {
      result = EndpointFactory.create(params, AccessToken);
    });

    it('returns the oauth server endpoint', function() {
      expect(result.url()).toEqual(uri);
    });

    describe('when in a specific /path', function() {

      beforeEach(function() {
        $location.path('/path');
      });

      beforeEach(function() {
        result = EndpointFactory.create(params, AccessToken);
      });

      it('uri should not be in state', function() {
        expect(result.url()).toEqual(uri);
      });
    });

    describe('set state', function() {
      var paramsClone = JSON.parse(JSON.stringify(params));

      beforeEach(function() {
          paramsClone.state = {};
          paramsClone.state.test = 'test';
      });

      beforeEach(function() {
          result = EndpointFactory.create(paramsClone, AccessToken);
      });

      it('should include the test in the uri', function() {
          expect(result.url()).toMatch(/test/);
      });
    });

    describe('authorizePath can have query string it in', function() {
      var paramsClone = JSON.parse(JSON.stringify(params));

      beforeEach(function() {
          paramsClone.authorizePath = '/oauth/authorize?google=doesthis';
      });

      beforeEach(function() {
          result = EndpointFactory.create(paramsClone, AccessToken);
      });

      it('uri should not be in state', function() {
          var expectedUri = 'http://example.com/oauth/authorize?google=doesthis&response_type=token&client_id=client-id&redirect_uri=http%3A%2F%2Fexample.com%2Fredirect&scope=scope&state='+stateFragment;
          expect(result.url()).toEqual(expectedUri);
      });
    });

    describe('authorizePath can be empty', function() {
      var paramsClone = JSON.parse(JSON.stringify(params));

      beforeEach(function() {
          paramsClone.authorizePath = '';
      });

      beforeEach(function() {
          result = EndpointFactory.create(paramsClone, AccessToken);
      });

      it('uri should not be in state', function() {
          var expectedUri = 'http://example.com?response_type=token&client_id=client-id&redirect_uri=http%3A%2F%2Fexample.com%2Fredirect&scope=scope&state=' + stateFragment;
          expect(result.url()).toEqual(expectedUri);
      });
    });
  });
});
