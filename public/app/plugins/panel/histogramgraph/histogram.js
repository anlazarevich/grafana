define([
  'angular',
  'app/app',
  'lodash',
  'jquery',
  'jquery.flot'
],
function (angular, app, _, $) {
  'use strict';

  var module = angular.module('grafana.directives');

  module.directive('tabHistogram', function() {

    return {
      link: function(scope, elem) {
        var data, histogram;
        var ctrl = scope.ctrl;
        var panel = ctrl.panel;

        scope.$on('render-histogram', function(event, renderData) {
          if(!renderData) {
            return;
          }
          data = renderData.data;
          render(renderData);
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

          if(histogram) {
            return;
          }

          var d1 = [];
          for (var i = 0; i <= 10; i += 1) {
            d1.push([i, parseInt(Math.random() * 30)]);
          }

          var d2 = [];
          for (i = 0; i <= 10; i += 1) {
            d2.push([i, parseInt(Math.random() * 30)]);
          }

          var d3 = [];
          for (i = 0; i <= 10; i += 1) {
            d3.push([i, parseInt(Math.random() * 30)]);
          }

          var stack = 0,
          bars = true,
          lines = false,
          steps = false;

          function plotWithOptions() {
            $.plot(elem[0], [{label:'test1', data: d1}, {label:'test2', data: d2}, {label:'test3', data: d3}], {
              series: {
                stack: stack,
                lines: {
                  show: lines,
                  fill: true,
                  steps: steps
              },
              bars: {
                show: bars,
                barWidth: 0.6
              }
            },
            grid: { clickable: true, hoverable: true }
          });
          }

          $(elem).bind("plotclick", function (event, pos, item) {
            if (item) {
              alert(item.datapoint);
            }
          });

          plotWithOptions();
        }
      }
    };
  });
});
