define([
  'angular',
  'lodash',
  'jquery',
  'sigma',
  'sigma.force2Atlas',
  'sigma.dragNodes'
],
function (angular, _, $, sigma) {
  'use strict';

  var module = angular.module('grafana.directives');

  module.directive('tabGraph', function($timeout) {

    return {
      link: function(scope, elem) {
        var data, sigmaInstance;
        var ctrl = scope.ctrl;
        var panel = ctrl.panel;

        scope.$on('render-graph', function(event, renderData) {
          if(!renderData) {
            return;
          }
          data = renderData.data;
          render();
        });

        function setElementHeight() {
          try {
            var height = ctrl.height || panel.height || ctrl.row.height;
            if (_.isString(height)) {
              height = parseInt(height.replace('px', ''), 10);
            }

            height -= 5; // padding
            height -= panel.title ? 24 : 9; // subtract panel title bar
            height -= 50; // substract tab header

            elem.css('height', height + 'px');

            return true;
          } catch(e) { // IE throws errors sometimes
            return false;
          }
        }

        function render() {
          setElementHeight();

          if(sigmaInstance) {
            return;
          }

          // Instantiate sigma:
          sigmaInstance = new sigma({
            graph: data,
            renderer: {
              // IMPORTANT:
              // This works only with the canvas renderer, so the
              // renderer type set as "canvas" is necessary here.
              container: elem[0],
              type: 'canvas'
            },
            settings: {defaultLabelColor: '#FFFFFF'}
          });

          var forceConfig = {
              /**
               * The “Strong gravity” option sets a force that attracts the nodes that are distant
               * from the center more ( is this distance). This force has the drawback of being so
               * strong that it is sometimes stronger than the other forces.
               * It may result in a biased placement of the nodes.
               * However, its advantage is to force a very compact layout,
               * which may be useful for certain purposes.
               */
              strongGravityMode: true,
              /**
               *  It is important to notice that this mode adds a considerable friction
               *  in the convergence movement,
               *  slowing spatialization performances. It is necessary to apply it only
               *  after the convergence
               *  of graph spatialization.
               */
              adjustSizes: true,
          };
          sigmaInstance.startForceAtlas2(forceConfig);
          $timeout(stopForceAtlas2, 3000);
        }

        function stopForceAtlas2() {
          sigmaInstance.stopForceAtlas2();
          // Initialize the dragNodes plugin:
          sigma.plugins.dragNodes(sigmaInstance, sigmaInstance.renderers[0]);
        }
      }
    };
  });
});
