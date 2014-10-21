'use strict';

describe('oauth', function() {

  var $rootScope, $location, localStorageService, $httpBackend, $compile, AccessToken, EndpointFactory, element, scope, result, callback, Endpoint;

  var uri      = 'http://example.com/oauth/authorize?response_type=token&client_id=client-id&redirect_uri=http://example.com/redirect&scope=scope&state=/';
  var fragment = 'access_token=token&token_type=bearer&expires_in=7200&state={"clientName":"default"}';
  var denied   = 'error=access_denied&error_description=error&state={"clientName":"default"}';
  var headers  = { 'Accept': 'application/json, text/plain, */*', 'Authorization': 'Bearer token' }
  var profile  = { id: '1', full_name: 'Alice Wonderland', email: 'alice@example.com' };
  var stateFragment = "%257B%2522clientName%2522%253A%2522default%2522%257D"

  beforeEach(module('oauth'));
  beforeEach(module('templates'));

  beforeEach(inject(function($injector) { $rootScope      = $injector.get('$rootScope') }));
  beforeEach(inject(function($injector) { $compile        = $injector.get('$compile') }));
  beforeEach(inject(function($injector) { $location       = $injector.get('$location') }));
  beforeEach(inject(function($injector) { localStorageService = $injector.get('localStorageService') }));
  beforeEach(inject(function($injector) { $httpBackend    = $injector.get('$httpBackend') }));
  beforeEach(inject(function($injector) { AccessToken     = $injector.get('AccessToken') }));
  beforeEach(inject(function($injector) { EndpointFactory        = $injector.get('EndpointFactory') }));

  beforeEach(function() {
    element = angular.element(
      '<span class="xyze-widget">' +
        '<oauth ng-cloak site="http://example.com"' +
          'client="client-id"' +
          'redirect="http://example.com/redirect"' +
          'scope="scope"' +
          'profile-uri="http://example.com/me">Sign In</oauth>' +
      '</span>'
    );
  });

  var compile = function() {
    scope = $rootScope;
    $compile(element)(scope);
    Endpoint = scope.endPoint;
    scope.$digest();
  };


  describe('when logged in', function() {

    beforeEach(function() {
      callback = jasmine.createSpy('callback');
    });

    beforeEach(function() {
      $location.hash(fragment);
    });

    beforeEach(function() {
      $httpBackend.whenGET('http://example.com/me', headers).respond(profile);
    });

    beforeEach(function() {
      $rootScope.$on('oauth:authorized', callback);
    });

    beforeEach(function() {
      $rootScope.$on('oauth:login', callback);
    });

    beforeEach(function() {
      compile($rootScope, $compile);
    });

    it('shows the link "Logout #{profile.email}"', function() {
      $rootScope.$apply();
      $httpBackend.flush();
      result = element.find('.logged-in').text();
      expect(result).toBe('Logout alice@example.com');
    });

    it('removes the fragment', function() {
      expect($location.hash()).toBe('');
    });

    it('shows the logout link', function() {
      expect(element.find('.logged-out').attr('class')).toMatch('ng-hide');
      expect(element.find('.logged-in').attr('class')).not.toMatch('ng-hide');
    });

    it('fires the oauth:login and oauth:authorized event', function() {
      var token = AccessToken.get();
      expect(callback.calls.count()).toBe(2);
    });


    describe('when refreshes the page', function() {

      beforeEach(function() {
        callback = jasmine.createSpy('callback');
      });

      beforeEach(function() {
        $rootScope.$on('oauth:authorized', callback);
      });

      beforeEach(function() {
        $location.path('/');
      });

      beforeEach(function() {
        compile($rootScope, $compile);
      });

      it('keeps being logged in', function() {
        $rootScope.$apply();
        $httpBackend.flush();
        result = element.find('.logged-in').text();
        expect(result).toBe('Logout alice@example.com');
      });

      it('shows the logout link', function() {
        expect(element.find('.logged-out').attr('class')).toMatch('ng-hide');
        expect(element.find('.logged-in').attr('class')).not.toMatch('ng-hide');
      });

      it('fires the oauth:authorized event', function() {
        var event = jasmine.any(Object);
        var token = AccessToken.get();
        expect(callback).toHaveBeenCalledWith(event, token);
      });

      it('does not fire the oauth:login event', function() {
        var token = AccessToken.get();
        expect(callback.calls.count()).toBe(1);
      });
    });


    describe('when logs out', function() {

      beforeEach(function() {
        callback = jasmine.createSpy('callback');
      });

      beforeEach(function() {
        $rootScope.$on('oauth:logout', callback);
      });

      beforeEach(function() {
        element.find('.logged-in').click();
      });

      it('shows the login link', function() {
        expect(element.find('.logged-out').attr('class')).not.toMatch('ng-hide');
        expect(element.find('.logged-in').attr('class')).toMatch('ng-hide');
      });

      it('fires the oauth:logout event', function() {
        var event = jasmine.any(Object);
        expect(callback).toHaveBeenCalledWith(event);
      });
    });
  });


  describe('when logged out', function() {

    beforeEach(function() {
      callback = jasmine.createSpy('callback');
    });

    beforeEach(function() {
      $rootScope.$on('oauth:logout', callback);
    });

    beforeEach(function() {
      AccessToken.destroy();
    });

    beforeEach(function() {
      compile($rootScope, $compile)
    });

    beforeEach(function() {
      spyOn( window.location, 'replace');
    });

    it('shows the text "Sign In"', function() {
      result = element.find('.logged-out').text();
      expect(result).toBe('Sign In');
    });

    it('sets the href attribute', function() {
      result = element.find('.logged-out').click();
      expect(window.location.replace).toHaveBeenCalled();
    });

    it('shows the login link', function() {
      expect(element.find('.logged-out').attr('class')).not.toMatch('ng-hide');
      expect(element.find('.logged-in').attr('class')).toMatch('ng-hide');
    });

    it('fires the oauth:logout event', function() {
      var event = jasmine.any(Object);
      expect(callback).toHaveBeenCalledWith(event);
    });
  });


  describe('when denied', function() {

    beforeEach(function() {
      callback = jasmine.createSpy('callback');
    });

    beforeEach(function() {
      $location.hash(denied);
    });

    beforeEach(function() {
      $rootScope.$on('oauth:denied', callback);
    });

    beforeEach(function() {
      compile($rootScope, $compile)
    });

    beforeEach(function() {
      spyOn( window.location, 'replace');
    });

    it('shows the text "Denied"', function() {
      result = element.find('.denied').text();
      expect(result).toBe('Access denied. Try again.');
    });

    it('sets the href attribute', function() {
      result = element.find('.denied').click();
      expect(window.location.replace).toHaveBeenCalled();
    });

    it('shows the login link', function() {
      expect(element.find('.logged-out').attr('class')).toMatch('ng-hide');
      expect(element.find('.logged-in').attr('class')).toMatch('ng-hide');
      expect(element.find('.denied').attr('class')).not.toMatch('ng-hide');
    });

    it('fires the oauth:denied event', function() {
      var event = jasmine.any(Object);
      expect(callback).toHaveBeenCalledWith(event);
    });
  });


  describe('with no custom template', function() {

    beforeEach(function() {
      AccessToken.destroy();
    });

    beforeEach(function() {
      compile($rootScope, $compile)
    });

    it('shows the default template', function() {
      expect(element.find('.btn-oauth').text()).toBe('');
    });
  });


  describe('with custom template', function() {

    beforeEach(function() {
      AccessToken.destroy();
    });

    beforeEach(function() {
      compile($rootScope, $compile)
    });

    beforeEach(function() {
      $rootScope.$broadcast('oauth:template:update', 'views/templates/button.html');
      $rootScope.$apply();
    });

    it('shows the button template', function() {
      expect(element.find('.oauth .logged-out').text()).toBe('Login Button');
    });
  });



  describe('with custom authorize path', function() {

    beforeEach(function() {
      element = angular.element(
        '<oauth ng-cloak site="http://example.com"' +
          'client="client-id"' +
          'redirect="http://example.com/redirect"' +
          'authorize-path="/new-authorize-path">Sign In</oauth>'
      );
    });

    beforeEach(function() {
      AccessToken.destroy();
      spyOn( window.location, 'replace');
      compile($rootScope, $compile)
    });

    it('redirects to the new authorize path', function() {
      result = element.find('.logged-out').click();
      expect(window.location.replace).toHaveBeenCalledWith('http://example.com/new-authorize-path?response_type=token&client_id=undefined&redirect_uri=undefined&scope=&state=' + stateFragment);
    });
  });
});
