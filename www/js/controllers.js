angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $cordovaSQLite) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.db = window.openDatabase("ekolohiya", "1.0", "First database", 2 * 1024 * 1024);
  $cordovaSQLite.execute($scope.db, 'CREATE TABLE IF NOT EXISTS geo_locations (device_id, fuel_type, type_of_vehicle, latitude, longitude, accuracy, measured_date_time)');

  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})

.controller('TopCtrl', function($scope, $http, $q, $interval, $cordovaGeolocation, $cordovaSQLite, $cordovaDevice, $cordovaNetwork) {

  // Insert geo location
  var save_geo_location = function(param) {
    $cordovaSQLite.execute($scope.db, "INSERT INTO geo_locations (device_id, fuel_type, type_of_vehicle, latitude, longitude, accuracy, measured_date_time) VALUES (?, ?, ?, ?, ?, ?, ?)", param)
    .then(function(result) {
      console.log('Success insert geo location');
      console.log(result);
    }, function(error) {
      console.log('Error insert geo location');
      console.log(error);
    });
  };

  //Delete geo location
  var delete_geo_location = function(param) {
    $cordovaSQLite.execute($scope.db, "DELETE FROM geo_locations")
    .then(function(result) {
      console.log('Success delete geo locations');
      console.log(result);
    }, function(error) {
      console.log('Error delete geo locations');
      console.log(error);
    });
  };

  var posOptions = {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 0
  };

  // Repeat
  repeat = function() {
    console.log("Repeating");
    $cordovaGeolocation.getCurrentPosition(posOptions).then(function(position) {
      console.log('Success get location');
      $scope.latitude = position.coords.latitude;
      $scope.longitude = position.coords.longitude;
      $scope.accuracy = position.coords.accuracy;
      try {
        $scope.device_id = $cordovaDevice.getUUID();
      } catch(e) {
        //For the web browser 
        $scope.device_id = '20013fea6bcc820c';
      }
      var now = new Date().getTime();
      var param = [$scope.device_id, 1, 3, $scope.latitude, $scope.longitude, $scope.accuracy, now];
      var data = {
        "device_id" : $scope.device_id,
        "fuel_type" : 1,
        "type_of_vehicle" : 3,
        "latitude" : $scope.latitude,
        "longitude" : $scope.longitude,
        "accuracy" : $scope.accuracy,
        "measured_date_time" : now
      };
      try {
        $scope.network = $cordovaNetwork.getNetwork();
        if($cordovaNetwork.getNetwork() === Connection.NONE) {
          console.log('No network');
          save_geo_location(param);
        } else {
          console.log('Network is available');
          $cordovaSQLite.execute($scope.db, "SELECT * FROM geo_locations ORDER BY rowid ASC")
          .then(function(result) {
            console.log('Success select geo locations');
            data["sent_date_time"] = now;
            $http({
              method: 'POST',
              url: '/geo_locations',
              data: JSON.stringify(data)
            }).then(function(result) {
              console.log('Success ajax request');
              console.log(result);
            }, function(error) {
              console.log('Error ajax request');
              console.log(error);
              save_geo_location(param);
            }); 
          }, function(error) {
            console.log('Error select geo locations');
            console.log(error);
          });
        }
/*
            var promises = [];
            angular.forEach(result, function(row) {
              row['sent_date_time'] = now;
              var promise = $http({
                method: 'POST',
                url: '/geo_locations',
                data: JSON.stringify(row)
              }); 
              promises.push(promise);
            })
            //data["sent_date_time"] = now;
            //promises.push(data);
            $scope.number_of_rows = promises.length;
            $q.all(promises)
            .then(function(result) {
              console.log('Success ajax request');
              console.log(result);
              delete_geo_location();
            }, function(error) {
              console.log('Error ajax request');
              console.log(error);
              save_geo_location(param);
            }); 
*/
      } catch(e) {
        console.log('Error network check');
        save_geo_location(param);
      }
      }, function(error) {
      console.log('Error geo location');
      console.log(error);
    });
  };

  var stop;

  // Press start button
  $scope.start = function() {
    console.log('Press start');
    stop = $interval(repeat, 3000);
  };

  // Press stop button
  $scope.stop = function() {
    console.log('Press stop');
    $interval.cancel(stop);
  };

});
