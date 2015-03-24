var TreatStreet = angular.module('TreatStreet', [
  'ngRoute',
  'ui.bootstrap',
  'TreatStreetControllers',
  'chieffancypants.loadingBar',
  'angularFileUpload',
  'ngAnimate'
]);

// ROUTES

TreatStreet.config(
  [
    '$routeProvider',
    '$locationProvider',
    function($routeProvider, $locationProvider) {
      $routeProvider
      .when('/users', {
        templateUrl: '/templates/users/list.html',
        controller: 'UsersController'
      })
      .when('/users/new', {
        templateUrl: '/templates/users/new.html',
        controller: 'UsersController'
      })
      .when('/users/:id', {
        templateUrl: '/templates/users/show.html',
        controller: 'UsersController'
      })
      .when('/users/:id/edit', {
        templateUrl: '/templates/users/edit.html',
        controller: 'UsersController'
      })
      .when('/venues', {
        templateUrl: '/templates/venues/list.html',
        controller: 'VenuesController'
      })
      .when('/venues/new', {
        templateUrl: '/templates/venues/new.html',
        controller: 'VenuesController'
      })
      .when('/venues/:id', {
        templateUrl: '/templates/venues/show.html',
        controller: 'VenuesController'
      })
      .when('/venues/:id/edit', {
        templateUrl: '/templates/venues/edit.html',
        controller: 'VenuesController'
      })
      .when('/orders', {
        templateUrl: '/templates/orders/list.html',
        controller: 'OrdersController'
      })
      .when('/orders/:id', {
        templateUrl: '/templates/orders/show.html',
        controller: 'OrdersController'
      })
      .when('/orders/:id/edit', {
        templateUrl: '/templates/orders/edit.html',
        controller: 'OrdersController'
      })
      .when('/about', {
        templateUrl: '/templates/about.html',
        controller: 'AboutController'
      })
      .when('/master-admin', {
        templateUrl: '/templates/master_admin/list.html',
        controller: 'MasterAdminController'
      })
      .when('/master-admin/login', {
        templateUrl: '/templates/master_admin/login.html',
        controller: 'MasterAdminController'
      })
      .when('/admin', {
        templateUrl: '/templates/restaurant_admin/list.html',
        controller: 'RestaurantAdminController'
      })
      .when('/admin/login', {
        templateUrl: '/templates/restaurant_admin/login.html',
        controller: 'RestaurantAdminController'
      })
      .when('/terms_and_conditions', {
        templateUrl: '/templates/terms_and_conditions.html',
        controller: 'MainController'
      })
      .when('/', {
        redirectTo: '/venues'
      })
      .otherwise({
        templateUrl: '/templates/index.html',
        controller: 'IndexController'
      });

      $locationProvider.html5Mode(false);
      $locationProvider.hashPrefix('!');
    }
  ]
);

TreatStreet.customUtils = {}; // put random stuff here (horrible, I know).

// MONKEYPATCH!!!

RegExp.escape = function(s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
};


