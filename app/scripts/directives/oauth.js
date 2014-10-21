'use strict';

var directives = angular.module('oauth.directive', []);

directives.directive('oauth', function(AccessTokenFactory, EndpointFactory, ProfileFactory, $location, $rootScope, $compile, $http, $templateCache) {

  var definition = {
    restrict: 'AE',
    replace: true,
    scope: {
      site: '@',          // (required) set the oauth server host (e.g. http://oauth.example.com)
      clientId: '@',      // (required) client id
      redirectUri: '@',   // (required) client redirect uri
      clientName: '@',    // (optional) name for this access token, defaults to 'default'.  Used for multi-tenancy
      scope: '@',         // (optional) scope
      profileUri: '@',    // (optional) user profile uri (e.g http://example.com/me)
      template: '@',      // (optional) template to render (e.g views/templates/default.html)
      text: '@',          // (optional) login text
      authorizePath: '@', // (optional) authorization url
      state: '@'          // (optional) An arbitrary unique string created by your app to guard against Cross-site Request Forgery
    }
  };

  definition.link = function postLink(scope, element, attrs) {
    scope.show = 'none';
    var accessToken = undefined;
    var endPoint = undefined;
    var profile = undefined;

    scope.$watch('clientId', function(value) { init() });

    var init = function() {
      initAttributes();          // sets defaults
      initObjects();
      compile();                 // compiles the desired layout
      accessToken.set(scope);    // sets the access token object (if existing, from fragment or session)
      initProfile(scope);        // gets the profile resource (if existing the access token)
      initView();                // sets the view (logged in or out)
    };

    var initObjects = function() {
      accessToken = AccessTokenFactory.findOrCreate( scope.clientName || 'default')
      endPoint = EndpointFactory.create(scope, accessToken);  //creates an endpoint handler for this scope
      profile = ProfileFactory.create(accessToken);
    };

    var initAttributes = function() {
      scope.authorizePath = scope.authorizePath || '/oauth/authorize';
      scope.tokenPath     = scope.tokenPath     || '/oauth/token';
      scope.template      = scope.template      || 'views/templates/default.html';
      scope.text          = scope.text          || 'Sign In';
      scope.state         = scope.state         || undefined;
      scope.scope         = scope.scope         || undefined;
    };

    var compile = function() {
      $http.get(scope.template, { cache: $templateCache }).success(function(html) {
        element.html(html);
        $compile(element.contents())(scope);
      });
    };

    var initProfile = function(scope) {
      var token = accessToken.get();

      if (token && token.access_token && scope.profileUri) {
        profile.find(scope.profileUri).success(function(response) {
          scope.profile = response
        })
      }
    };

    var initView = function() {
      var token = accessToken.get();

      if (!token)             { return loggedOut()  }  // without access token it's logged out
      if (token.access_token) { return authorized() }  // if there is the access token we are done
      if (token.error)        { return denied()     }  // if the request has been denied we fire the denied event
    };

    scope.login = function() {
      endPoint.redirect();
    };

    scope.logout = function() {
      accessToken.destroy(scope);
      loggedOut();
    };

    // user is authorized
    var authorized = function() {
      $rootScope.$broadcast('oauth:authorized', accessToken.get());
      scope.show = 'logged-in';
    };

    // set the oauth directive to the logged-out status
    var loggedOut = function() {
      $rootScope.$broadcast('oauth:logout');
      scope.show = 'logged-out';
    };

    // set the oauth directive to the denied status
    var denied = function() {
      scope.show = 'denied';
      $rootScope.$broadcast('oauth:denied');
    };

    // Updates the template at runtime
    scope.$on('oauth:template:update', function(event, template) {
      scope.template = template;
      compile(scope);
    });

    // Hack to update the directive content on logout
    // TODO think to a cleaner solution
    scope.$on('$routeChangeSuccess', function () {
      init();
    });
  };

  return definition
});
