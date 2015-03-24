var TreatStreetControllers = angular.module('TreatStreetControllers', []);

// mostly for information/debugging purposes
TreatStreetControllers.controller(
  'MainController',
  [
    '$scope',
    '$rootScope',
    '$route',
    '$routeParams',
    '$location',
    'alertService',
    function($scope, $rootScope, $route, $routeParams, $location, alertService) {
      $scope.$route = $route;
      $scope.$location = $location;
      $scope.$routeParams = $routeParams;

      // root binding for alertService
      $rootScope.closeAlert = alertService.closeAlert;

      // redirect's careful uncle
      $scope.switchPage = function(path) {
        console.log("SWITCH PAGE", path);

        var $dearModal = $('#venue-detail-modal');
        if ($dearModal && ($dearModal.attr('aria-hidden') === 'false')) {
          console.log("HAVE MODAL");

          $dearModal.modal('hide');
          $dearModal.on('hidden.bs.modal', function(e) {
            // redirect only after modal is removed,
            // otherwise phoey ensues
            $location.path(path);
            // scroll to top of page
            $(window).scrollTop(0);
          });

        } else {

          // no modal, so just redirect
          $location.path(path);
          // scroll to top of page
          $(window).scrollTop(0);

        }
      };
    }
  ]
);


// INDEX


TreatStreetControllers.controller(
  'IndexController',
  [
    '$scope',
    function($scope) {
      $scope.controller = {
        name: 'IndexController'
      };
    }
  ]
);


// VENUES


// venues list
TreatStreetControllers.controller(
  'VenuesListController',
  [
    '$scope',
    'TreatStreetVenuesFactory',
    'alertService',
    function($scope, TreatStreetVenuesFactory, alertService) {
      $scope.controller = "VenuesListController";

      $scope.addLocationToVenue = TreatStreet.customUtils.venues.addNewLocation;

      $scope.listVenues = function() {
        TreatStreetVenuesFactory.listVenues()
        .success(function(res) {
          $scope.venues = res.venues;
        })
        .error(function(res) {
          alertService.add("danger", res.error);
          console.log(res.error);
        });
      };

      $scope.listVenues();
    }
  ]
);

// venues
TreatStreetControllers.controller(
  'VenuesController',
  [
    '$scope',
    '$routeParams',
    '$location',
    '$sce',
    'TreatStreetVenuesFactory',
    'alertService',
    function($scope, $routeParams, $location, $sce, TreatStreetVenuesFactory, alertService) {
      $scope.controller = "VenuesController";

      var id = $routeParams.id || null;

      $scope.addLocationToVenue = TreatStreet.customUtils.venues.addNewLocation;

      // API

      $scope.listVenues = function() {
        TreatStreetVenuesFactory.listVenues()
        .success(function(res) {
          $scope.venues = res.venues;
        })
        .error(function(res) {
          alertService.add("danger", res.error);
          console.log(res.error);
        });
      };

      $scope.getVenue = function(customId) {
        var ID = customId || id;
        TreatStreetVenuesFactory.getVenue(ID)
        .success(function(res) {
          $scope.venue = res;
        })
        .error(function(res) {
          alertService.add("danger", res.error);
          console.log(res.error);
        });
      };

      $scope.deleteVenue = function(idx) {
        var delete_resource = $scope.venues[idx];

        TreatStreetVenuesFactory.deleteVenue(delete_resource._id)
        .success(function(res) {
          alertService.add("success", "Venue deleted sucessfully.");
          console.log(res);
          $scope.venues.splice(idx, 1);
        })
        .error(function(res) {
          alertService.add("danger", res.error);
          console.log(res.error);
        });
      };

      // RESOURCE/S
      // is_venues = /^\/venues/.test($location.url());
      if (id) {
        $scope.getVenue(id);
      } else if (!id) {
        console.log("LIST VENUES FOR: ", $location.url());
        $scope.listVenues();
      } else {
        // empty resource
        $scope.venue = {
          locations: []
        }
      }

      // MODAL

      $scope.showModal = function(e, venue) {
        e.preventDefault();
        console.log("SHOW MODAL", venue);

        $scope.modalVenue = venue;
      };

      $scope.googleMapIframeFromLocation = function(location) {
        var address = location.fullAddress;
        var url = encodeURI([
          "//maps.google.com/maps/?q=",
          address,
          "&z=16&output=embed&iwloc=near&near=",
          location.country
        ].join(''));

        console.log("MAP URL", url);

        return $sce.trustAsHtml(
        [
          '<iframe',
            ' width="425" height="350" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="', url, '">',
          '</iframe>'
        ].join(''));
      };
    }
  ]
);

// Update form
TreatStreetControllers.controller(
  'VenuesUpdateController',
  [
    '$scope',
    '$routeParams',
    'TreatStreetVenuesFactory',
    'alertService',
    function($scope, $routeParams, TreatStreetVenuesFactory, alertService) {
      $scope.controller = "VenuesUpdateController";

      $scope.deleteLocation = TreatStreet.customUtils.venues.deleteLocation;
      $scope.addLocationToVenue = TreatStreet.customUtils.venues.addNewLocation;

      var updateVenue = function(venue) {
        TreatStreetVenuesFactory.updateVenue(venue)
        .success(function(res) {
          alertService.add("success", "Venue updated sucessfully.");
          $scope.venue = res;
        })
        .error(function(res) {
          alertService.add("danger", res.error);
          console.log(res.error);
        });
      };

      $scope.deleteImage = function(image_path) {
        $scope.venue.images = _.without($scope.venue.images, image_path);
      };

      // form submit
      $scope.submit = function(venue) {
        updateVenue(venue);
      };
    }
  ]
);

// Create form
TreatStreetControllers.controller(
  'VenuesCreateController',
  [
    '$scope',
    'TreatStreetVenuesFactory',
    'alertService',
    function($scope, TreatStreetVenuesFactory, alertService) {
      $scope.controller = "VenuesCreateController";

      $scope.deleteLocation = TreatStreet.customUtils.venues.deleteLocation;
      $scope.addLocationToVenue = TreatStreet.customUtils.venues.addNewLocation;

      var createVenue = function(venue) {
        TreatStreetVenuesFactory.createVenue(venue)
        .success(function(res) {
          alertService.add("success", "Venue created sucessfully.");
          $scope.venue = res;
        })
        .error(function(res) {
          alertService.add("danger", res.error);
          console.log(res.error);
        });
      };

      // form submit
      $scope.submit = function(venue) {
        createVenue(venue);
      };
    }
  ]
);

// venues utils
TreatStreet.customUtils.venues = {};
TreatStreet.customUtils.venues.addNewLocation = function () {
  // we always want a blank form for locations
  // to be able to add new ones...
  var newLocation = {
    country: null,
    province: null,
    city: null,
    address: null,
    phone: null,
    url: null
  };
  this.venue.locations.push(newLocation);
};

TreatStreet.customUtils.venues.deleteLocation = function (index) {
  console.log("INDEX", index);
  if (this.venue && this.venue.locations.length > 0) {
    console.log("DELETE LOCATION AT INDEX:", index);
    this.venue.locations.splice(index,1);
  }
};


// RESTAURANT ADMIN


TreatStreetControllers.controller(
  'RestaurantAdminController',
  [
    '$scope',
    '$location',
    '$route',
    'TreatStreetVenuesFactory',
    'TreatStreetFinderFactory',
    'TreatStreetFinderRestrictedFactory',
    'TreatStreetOrdersFactory',
    'TreatStreetSessionFactory',
    'alertService',
    function($scope, $location, $route, TreatStreetVenuesFactory, TreatStreetFinderFactory, TreatStreetFinderRestrictedFactory, TreatStreetOrdersFactory, TreatStreetSessionFactory, alertService){
      $scope.controller = {
        name: "RestaurantAdminController"
      };

      $scope.orders = {};
      $scope.orders.active = [];
      $scope.orders.redeemed = [];
      $scope.orders.cancelled = [];

      TreatStreetSessionFactory.authenticatedSession()
      .success(function(res) {

        if (res.email) {
          $scope.sessionUser = res.email;

          TreatStreetFinderFactory.find('User', 'email', res.email, 1)
          .success(function(res) {
            var user = res;
            console.log("USER", user);

            if (user) {

              // get all venues for the (authorized) user
              TreatStreetFinderRestrictedFactory.findRestricted('Venue', '_user', user._id, 'all')
              .success(function(res) {
                $scope.venues = res;
                var venue_ids = _.pluck(res, '_id');

                console.log("VENUE IDS", venue_ids);

                // get all orders, for all the venues, associated to a specific user
                _.each(venue_ids, function(venue_id) {
                  var orders = [];

                  TreatStreetFinderRestrictedFactory.findRestricted('Order', '_venue', venue_id, 'all')
                  .success(function(res) {
                    orders.push(res);
                    orders = _.compact(_.flatten(orders));

                    // organize orders in active, redeemed and cancelled groups
                    _.each(orders, function(order) {
                      if (order.redemptionStatus === 'active')
                        $scope.orders.active.push(order);
                      else if (order.redemptionStatus === 'redeemed')
                        $scope.orders.redeemed.push(order);
                      else if (order.redemptionStatus === 'cancelled')
                        $scope.orders.cancelled.push(order);
                    });

                    var updateOrderWithStatus = function(order, newStatus) {
                      if (order && newStatus) {
                        order.redemptionStatus = newStatus;

                        TreatStreetOrdersFactory.updateOrder(order)
                        .success(function(res) {
                          alertService.add("success", "Order updated sucessfully with status: " + newStatus.toUpperCase());
                          $route.reload();
                        })
                        .error(function(res) {
                          alertService.add("danger", "I failed to update the order status, I'm sorry... Please try again or contact us for support. " + res.error);
                        });

                      } else {
                        alertService.add("warning", "I couldn't find an order & status to update... Are you sure you submitted both?");
                      }
                    }

                    // handle buttons
                    $scope.redeemed = function() {
                      console.log("CLICKED REDEEMED", this.order);
                      updateOrderWithStatus(this.order, 'redeemed');
                    };

                    $scope.cancelled = function() {
                      console.log("CLICKED CANCELLED", this.order);
                      updateOrderWithStatus(this.order, 'cancelled');
                    };

                    $scope.active = function() {
                      console.log("CLICKED ACTIVE", this.order);
                      updateOrderWithStatus(this.order, 'active');
                    };

                  })
                  .error(function(res) {
                    alertService.add("danger", res.error);
                    console.log(res.error);
                  });
                });
              })
              .error(function(res) {
                alertService.add("danger", res.error);
                console.log(res.error);
              });

            }

          })
          .error(function(res) {
            alertService.add("danger", res.error);
            console.log(res.error);
          });

        } else {

          $location.path('/admin/login');

        }

      })
      .error(function(res) {
        alertService.add("danger", res.error);
        console.log(res.error);
        $location.path('/admin/login');
      });
    }
  ]
);


// MASTER ADMIN


TreatStreetControllers.controller(
  'MasterAdminController',
  [
    '$scope',
    '$location',
    'TreatStreetSessionFactory',
    'alertService',
    function($scope, $location, TreatStreetSessionFactory, alertService) {
      $scope.controller = {
        name: "MasterAdminController"
      };

      TreatStreetSessionFactory.authenticatedMasterAdmin()
      .success(function(res) {
        console.log("MASTER ADMIN CONTROLLER", res);
        // access granted
        console.log("MASTER ADMIN - ACCESS GRANTED");
      })
      .error(function(res) {
        alertService.add("danger", res.error);
        console.log(res.error);
        $location.path('/master-admin/login');
      });
    }
  ]
);


// BLOG


TreatStreetControllers.controller(
  'BlogController',
  [
    '$scope',
    function($scope){
      $scope.controller = {
        name: "BlogController"
      };
    }
  ]
);


// ABOUT


TreatStreetControllers.controller(
  'AboutController',
  [
    '$scope',
    function($scope){
      $scope.controller = {
        name: "AboutController"
      };
    }
  ]
);


// USERS


TreatStreetControllers.controller(
  'UsersController',
  [
    '$scope',
    '$routeParams',
    '$location',
    '$sce',
    'TreatStreetUsersFactory',
    'TreatStreetVenuesFactory',
    'TreatStreetFinderFactory',
    'alertService',
    function($scope, $routeParams, $location, $sce, TreatStreetUsersFactory, TreatStreetVenuesFactory, TreatStreetFinderFactory, alertService) {
      $scope.controller = "UsersController";

      var id = $routeParams.id || null;

      // API

      $scope.listUsers = function() {
        TreatStreetUsersFactory.listUsers()
        .success(function(res) {
          $scope.users = res.users;
        })
        .error(function(res) {
          alertService.add("danger", res.error);
          console.log(res.error);
        });
      };

      $scope.getUser = function(customId) {
        var ID = customId || id;
        TreatStreetUsersFactory.getUser(ID)
        .success(function(res) {
          $scope.user = res;
          // get the associated venue
          $scope.findVenue(res.id);
        })
        .error(function(res) {
          alertService.add("danger", res.error);
          console.log(res.error);
        });
      };

      $scope.deleteUser = function(idx) {
        var delete_resource = $scope.users[idx];

        TreatStreetUsersFactory.deleteUser(delete_resource._id)
        .success(function(res) {
          console.log(res);
          alertService.add("success", "User deleted sucessfully.");
          $scope.users.splice(idx, 1);
        })
        .error(function(res) {
          alertService.add("danger", res.error);
          console.log(res.error);
        });
      };

      $scope.findVenue = function(id) {
        TreatStreetFinderFactory.find('Venue', '_user', id, 1)
        .success(function(res) {
          $scope.venue = res;
        })
        .error(function(res) {
          alertService.add("danger", res.error);
          console.log(res.error);
        });
      };

      $scope.isSelectedVenue = function(user_id, venues) {
        console.log(user_id, venues);
        var venue = _.findWhere(venues, { _id: user_id });
        // return (user_id === venue_id) ? venue_name : null;
        console.log(venue);
        return venue;
      };

      // RESOURCE/S

      if (id) {
        $scope.getUser(id);
      } else if (!id) {
        console.log("LIST RESOURCES FOR: ", $location.url());
        $scope.listUsers();
      } else {
        // empty resource
        $scope.user = {}
      }

    }
  ]
);

// Update form
TreatStreetControllers.controller(
  'UsersUpdateController',
  [
    '$scope',
    '$routeParams',
    'TreatStreetUsersFactory',
    'TreatStreetVenuesFactory',
    'alertService',
    function($scope, $routeParams, TreatStreetUsersFactory, TreatStreetVenuesFactory, alertService) {
      $scope.controller = "UsersUpdateController";

      var venueId;

      $scope.submit = function(user) {
        if (user.selectedVenue)
          venueId = user.selectedVenue._id;
          delete user.selectedVenue;

        if (venueId) {
          // update venue with association to user
          TreatStreetVenuesFactory.updateVenue({_id: venueId, _user: user._id})
          .success(function(res) {
            alertService.add("success", "Venue updated sucessfully.");
            console.log('SUBMIT RESPONSE', res);
            $scope.venue = res;
          })
          .error(function(res) {
            alertService.add("danger", res.error);
            console.log(res.error);
          });
        }

        TreatStreetUsersFactory.updateUser(user)
        .success(function(res) {
          alertService.add("success", "User updated sucessfully.");
          console.log('SUBMIT RESPONSE', res);
          $scope.user = res;
        })
        .error(function(res) {
          alertService.add("danger", res.error);
          console.log(res.error);
        });
      };
    }
  ]
);

// Create form
TreatStreetControllers.controller(
  'UsersCreateController',
  [
    '$scope',
    'TreatStreetUsersFactory',
    'TreatStreetVenuesFactory',
    'alertService',
    function($scope, TreatStreetUsersFactory, TreatStreetVenuesFactory, alertService) {
      $scope.controller = "UsersCreateController";
      var venueId;

      var createUser = function(user) {
        TreatStreetUsersFactory.createUser(user)
        .success(function(res) {
          $scope.user = res;
          // create association
          if (user.selectedVenue) {
            venueId = user.selectedVenue._id;
            delete user.selectedVenue;
            associateVenue(venueId, res._id);
          }
          alertService.add("success", "User created sucessfully");
        })
        .error(function(res) {
          alertService.add("danger", res.error);
          console.log(res.error);
        });
      };

      var associateVenue = function(venueId, userId) {
        // update venue with association to user
        TreatStreetVenuesFactory.updateVenue({_id: venueId, _user: userId})
        .success(function(res) {
          console.log('SUBMIT RESPONSE', res);
          $scope.venue = res;
        })
        .error(function(res) {
          alertService.add("danger", res.error);
          console.log(res.error);
        });
      };

      $scope.submit = function(user) {
        createUser(user);
      };
    }
  ]
);


// ORDERS


TreatStreetControllers.controller(
  'OrdersController',
  [
    '$scope',
    '$routeParams',
    '$location',
    '$sce',
    'TreatStreetUsersFactory',
    'TreatStreetVenuesFactory',
    'TreatStreetOrdersFactory',
    'alertService',
    function($scope, $routeParams, $location, $sce, TreatStreetUsersFactory, TreatStreetVenuesFactory, TreatStreetOrdersFactory, alertService) {
      var id = $routeParams.id || null;

      // API

      $scope.listOrders = function() {
        TreatStreetOrdersFactory.listOrders()
        .success(function(res) {
          $scope.orders = res.orders;
        })
        .error(function(res) {
          alertService.add("danger", res.error);
          console.log(res.error);
        });
      };

      $scope.getOrder = function(customId) {
        var ID = customId || id;
        TreatStreetOrdersFactory.getOrder(ID)
        .success(function(res) {
          $scope.order = res;
          // get the associated venue
          $scope.getVenue(res._venue);
        })
        .error(function(res) {
          alertService.add("danger", res.error);
          console.log(res.error);
        });
      };

      $scope.deleteOrder = function(idx) {
        var delete_resource = $scope.orders[idx];

        TreatStreetOrdersFactory.deleteOrder(delete_resource._id)
        .success(function(res) {
          console.log(res);
          $scope.orders.splice(idx, 1);
        })
        .error(function(res) {
          alertService.add("danger", res.error);
          console.log(res.error);
        });
      };

      $scope.getVenue = function(id) {
        TreatStreetVenuesFactory.getVenue(id)
        .success(function(res) {
          $scope.venue = res;
        })
        .error(function(res) {
          alertService.add("danger", res.error);
          console.log(res.error);
        });
      };

      // RESOURCE/S

      if (id) {
        $scope.getOrder(id);
      } else if (!id) {
        console.log("LIST RESOURCES FOR: ", $location.url());
        $scope.listOrders();
      } else {
        // empty resource
        $scope.user = {}
      }

    }
  ]
);

// Update form
TreatStreetControllers.controller(
  'OrdersUpdateController',
  [
    '$scope',
    '$routeParams',
    'TreatStreetOrdersFactory',
    'alertService',
    function($scope, $routeParams, TreatStreetOrdersFactory, alertService) {
      $scope.controller = "OrdersUpdateController";
      var venueId;

      var updateOrder = function(order) {
        TreatStreetOrdersFactory.updateOrder(order)
        .success(function(res) {
          alertService.add("success", "Order updated sucessfully.");
          console.log('UPDATE RESPONSE', res);
          $scope.order = res;
        })
        .error(function(res) {
          alertService.add("danger", res.error);
          console.log(res.error);
        });
      };

      $scope.submit = function(order) {
        if (order.selectedVenue)
          venueId = order.selectedVenue._id;
          delete order.selectedVenue;

        order._venue = venueId; // set association
        updateOrder(order);
      };
    }
  ]
);

// Create form
TreatStreetControllers.controller(
  'OrdersCreateController',
  [
    '$scope',
    '$location',
    'TreatStreetOrdersFactory',
    'TreatStreetVenuesFactory',
    'alertService',
    function($scope, $location, TreatStreetOrdersFactory, TreatStreetVenuesFactory, alertService) {
      var createOrder = function(order) {
        TreatStreetOrdersFactory.createOrder(order)
        .success(function(res) {
          if (res.error) {

            // inline notification
            $scope.CCAlerts = {
              type: "danger",
              msg: res.error
            };

            // gritter notification
            alertService.add("danger", "Error processing payment. "+res.error);

            console.log(res.error);

          } else {

            $scope.order = res;
            var path = "/orders/"+res.id;
            $scope.switchPage(path);

          }
        })
        .error(function(res) {
          alertService.add("danger", res.error);
          console.log(res.error);
        });
      };

      $scope.submit = function(order, venueId) {
        var stripeData = {};
        var yearMonthArr = order.stripe.yearMonth.split('-');

        order._venue = venueId; // set association

        // set data for stripe token request
        stripeData.number = order.stripe.number;
        stripeData.cvc = order.stripe.cvc;
        stripeData.exp_year = yearMonthArr[0];
        stripeData.exp_month = yearMonthArr[1];

        Stripe.card.createToken(stripeData, function(status, response){
          if (status === 200) {
            console.log('STRIPE createToken response: ', response);
            // clear stipe data from order as we don't use it
            delete order.stripe;
            // Set the token on order to the value from Stripe
            order.payment.card = { token: response };
            // and submit order finally
            createOrder(order);
          } else {
            // http://jimhoskins.com/2012/12/17/angularjs-and-apply.html
            // You do need to use it if you are going to run code in a new turn.
            // And only if that turn isn’t being created from a method in the AngularJS library.
            // Inside that new turn, you should wrap your code in $scope.$apply().
            $scope.$apply(function() {
              var message = "Sorry, we couldn't process your card. Please make sure all fields are filled in correctly and try again." + " " + response.error.message;

              // inline notification
              $scope.CCAlerts = {
                type: "danger",
                msg: message
              };

              // gritter
              alertService.add('danger', message);
            });
            console.log("STRIPE ERROR", status, response);
          }
        });
      };
    }
  ]
);


// FIND ORDER RECEIPT


TreatStreetControllers.controller(
  'OrderReceiptFinderController',
  [
    '$scope',
    '$location',
    'TreatStreetOrdersFactory',
    'TreatStreetFinderFactory',
    'alertService',
    function($scope, $location, TreatStreetOrdersFactory, TreatStreetFinderFactory, alertService) {

      $scope.findOrderReceipt = function(code) {
        console.log("findOrderReceipt CODE", code)
        if (code) {
          var cleanCode = code;
          TreatStreetFinderFactory.find('Order', 'redemptionCode', cleanCode, 1)
          .success(function(res) {
            console.log("findOrderReceipt RESPONSE", res);
            $scope.order = res;
            if (res.id) {
              var path = "/orders/"+res.id;
              $scope.switchPage(path);
            } else {
              alertService.add("danger", "Sorry, no Order Receipt was found by that code.");
            }
          })
          .error(function(res) {
            alertService.add("danger", res.error);
            console.log(res.error);
          });
        }
      };

    }
  ]
);


// FILE UPLOAD


TreatStreetControllers.controller(
  'FileUploaderController',
  [
    '$scope',
    '$fileUploader',
    'alertService',
    function($scope, $fileUploader, alertService) {

      // create a uploader with options
      var uploader = $scope.uploader = $fileUploader.create(
        {
          scope: $scope, // to automatically update the html. Default: $rootScope
          url: '/api/upload',
          formData: [
            { objId: null }
          ],
          removeAfterUpload: false,
          filters: [
            function (item) { // first user filter
              console.info('filter1');
              return true;
            }
          ]
        }
      );

      // ADDING FILTERS

      uploader.filters.push(function (item) { // second user filter
        console.info('filter2');
        return true;
      });

      // REGISTER HANDLERS

      uploader.bind('afteraddingfile', function (event, item) {
        console.info('After adding a file', item);
      });

      uploader.bind('afteraddingall', function (event, items) {
        console.info('After adding all files', items);
      });

      uploader.bind('changedqueue', function (event, items) {
        console.info('Changed queue', items);
      });

      uploader.bind('beforeupload', function (event, item) {
        // SET objId
        item.formData[0]['objId'] = item.uploader.scope.venue.id;
        console.info('Before upload', item);
      });

      uploader.bind('progress', function (event, item, progress) {
        console.info('Progress: ' + progress, item);
      });

      uploader.bind('success', function (event, xhr, item, response) {
        console.info('Success', xhr, item, response);
      });

      uploader.bind('error', function (event, xhr, item, response) {
        alertService.add("danger", "Error, uploading image. Please try again.");
        console.info('Error', xhr, item, response);
      });

      uploader.bind('complete', function (event, xhr, item, response) {
        if (xhr.status == 200) {
          item.uploader.scope.venue.images.push(response.image)
        }
        alertService.add("success", "Image uploaded.");
        console.info('Complete', xhr, item, response);
      });

      uploader.bind('progressall', function (event, progress) {
        console.info('Total progress: ' + progress);
      });

      uploader.bind('completeall', function (event, items) {
        alertService.add("success", "All files are transferred.");
        console.info('All files are transferred', items);
      });
    }
  ]
);

