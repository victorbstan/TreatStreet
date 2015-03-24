TreatStreet.factory('TreatStreetVenuesFactory', [
  '$http',
  function($http) {
    var urlBase = '/api/venues/';
    return {
      listVenues : function() {
        return $http.get(urlBase);
      },
      getVenue : function(id) {
        return $http.get(urlBase + id);
      },
      createVenue : function(resource) {
        return $http.post(urlBase, resource);
      },
      updateVenue : function(resource) {
        return $http.put(urlBase + resource._id, resource);
      },
      deleteVenue : function(id) {
        return $http.delete(urlBase + id);
      }
    }
  }
]);

TreatStreet.factory('TreatStreetUsersFactory', [
  '$http',
  function($http) {
    var urlBase = '/api/users/';
    return {
      listUsers : function() {
        return $http.get(urlBase);
      },
      getUser : function(id) {
        return $http.get(urlBase + id);
      },
      createUser : function(resource) {
        return $http.post(urlBase, resource);
      },
      updateUser : function(resource) {
        return $http.put(urlBase + resource._id, resource);
      },
      deleteUser : function(id) {
        return $http.delete(urlBase + id);
      }
    }
  }
]);

TreatStreet.factory('TreatStreetOrdersFactory', [
  '$http',
  function($http) {
    var urlBase = '/api/orders/';
    return {
      listOrders : function() {
        return $http.get(urlBase);
      },
      getOrder : function(id) {
        return $http.get(urlBase + id);
      },
      createOrder : function(resource) {
        return $http.post(urlBase, resource);
      },
      updateOrder : function(resource) {
        return $http.put(urlBase + resource._id, resource);
      },
      deleteOrder : function(id) {
        return $http.delete(urlBase + id);
      }
    }
  }
]);

TreatStreet.factory('TreatStreetFinderFactory', [
  '$http',
  function($http) {
    var urlBase = '/api/find';
    return {
      find : function(model, key, value, limit) {
        var url = [urlBase, model, key, value, limit].join('/');
        return $http.get(url);
      }
    }
  }
]);

TreatStreet.factory('TreatStreetFinderRestrictedFactory', [
  '$http',
  function($http) {
    var urlBase = '/api/find_restricted';
    return {
      findRestricted : function(model, key, value, limit) {
        var url = [urlBase, model, key, value, limit].join('/');
        return $http.get(url);
      }
    }
  }
]);

TreatStreet.factory('TreatStreetSessionFactory', [
  '$http',
  function($http) {
    var urlBase = '/api/authenticated_session';
    return {
      authenticatedSession : function() {
        return $http.get(urlBase);
      },
      authenticatedMasterAdmin : function() {
        return $http.get(urlBase + "/admin");
      }
    }
  }
]);
