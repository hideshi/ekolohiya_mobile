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

.controller('TopCtrl', function($scope, $interval, $cordovaGeolocation, $cordovaSQLite, $cordovaDevice) {

  var stop;

  var posOptions = {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 0
  };

  // Repeat something
  repeat = function() {
    console.log("Repeating");
    $cordovaGeolocation.getCurrentPosition(posOptions).then(function(position) {
      console.log('Success get location');
      //console.log(position);
      $scope.latitude = position.coords.latitude;
      $scope.longitude = position.coords.longitude;
      $scope.accuracy = position.coords.accuracy;
      //console.log($cordovaDevice);
      try {
        $scope.device_id = $cordovaDevice.getUUID();
      } catch(e) {
        $scope.device_id = '20013fea6bcc820c';
      }
      $cordovaSQLite.execute($scope.db, "INSERT INTO geo_locations (device_id, fuel_type, type_of_vehicle, latitude, longitude, accuracy, measured_date_time) VALUES ('" + $scope.device_id + "', 1, 3, " + $scope.latitude + ", " + $scope.longitude + ", " + $scope.accuracy + ", " + new Date().getTime() + ")")
      .then(function(result) {
        console.log('Success insert geo location');
        console.log(result);
      }, function(error) {
        console.log('Error insert geo location');
        console.log(error);
      })
    }, function(error) {
      console.log('Error geo location');
      console.log(error);
    });
  };

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
