define(
    ['angular', 'crypto-js'],
    function(angular, CryptoJS) {
      'use strict';

      angular.module('ngGravatar', []);
      angular
          .module('ngGravatar')
          .directive(
              "gravatar",
              [
                  'Gravatar',
                  function(Gravatar) {
                    return {
                      replace : true,
                      restrict : "E",
                      template : "<img class='user-gravatar' ng-src='{{gravatarUrl()}}'>",
                      scope : {
                        email : "=",
                        size : "="
                      },
                      link : function(scope) {
                        scope.gravatarUrl = function() {
                          return Gravatar(scope.email, scope.size);
                        };
                      }
                    };
                  }]);

      angular.module('ngGravatar').provider(
          'Gravatar',
          function() {
            var imageSize = 50;
            var url = "http://www.gravatar.com/avatar/";

            this.setSize = function(value) {
              imageSize = value;
            };

            this.$get = function() {
              return function(email, size) {
                return url + CryptoJS.MD5(email) + "?size="
                    + (size ? size : imageSize.toString());
              };
            };
          });

    });