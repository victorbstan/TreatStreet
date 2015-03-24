TreatStreet.factory('alertService',
  [
    '$rootScope',
    '$timeout',
    function($rootScope, $timeout) {
      var alertService = {};

      // create an array of alerts available globally
      $rootScope.alerts = [];

      alertService.add = function(type, msg, timeout) {

        var message = {'type': type, 'msg': msg};
        var found = _.find($rootScope.alerts, function(alert) {
          return alert.msg == msg;
        });

        if (typeof found === 'undefined') {
          $rootScope.alerts.push(message);
        }

        timeout = 5000; // hardcoded
        if (timeout) {
          $timeout(function(){
            alertService.closeAlert(this);
          }, timeout);
        }
      };

      alertService.closeAlert = function(index) {
        $rootScope.alerts.splice(index, 1);
      };

      return alertService;
    }
  ]
);