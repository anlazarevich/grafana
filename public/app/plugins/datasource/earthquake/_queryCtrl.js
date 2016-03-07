define([
    'angular',
    'lodash'
  ],
  function (angular, _) {
    'use strict';

    var module = angular.module('grafana.controllers');

    module.controller('EarthquakeQueryCtrl', function ($scope) {

      $scope.init = function () {
        $scope.target.errors = validateTarget($scope.target);
        $scope.magnitudeList = [2,3,4,5,6,7,8,9];
        $scope.alertList = ['green', 'yellow', 'orange', 'red'];
      };

      $scope.duplicate = function () {
        var clone = angular.copy($scope.target);
        $scope.panel.targets.push(clone);
      };

      $scope.moveMetricQuery = function (fromIndex, toIndex) {
        _.move($scope.panel.targets, fromIndex, toIndex);
      };

      $scope.selectItem = function () {
        $scope.target.errors = validateTarget($scope.target);
        if (!_.isEqual($scope.oldTarget, $scope.target) && _.isEmpty($scope.target.errors)) {
          $scope.oldTarget = angular.copy($scope.target);
          $scope.get_data();
        }
      };

      function validateTarget(target) {
        var errs = {};
        if (!target) {
          errs = 'Not defined';
        }
        return errs;
      }

      $scope.init();

    });

  });
