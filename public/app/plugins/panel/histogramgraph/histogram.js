define([
  'angular',
  'app/app',
  'lodash',
  'jquery',
  'jquery.flot',
  'jquery.flot.navigate'
],
function (angular, app, _, $) {
  'use strict';

  var module = angular.module('grafana.directives');

  module.directive('tabHistogram', function() {

    return {
      link: function(scope, elem) {
        var ctrl = scope.ctrl;
        var panel = ctrl.panel;

        scope.$on('render-histogram', function(event, renderData) {
          if(!renderData) {
            return;
          }
          render(transform(renderData.data));
        });

        function transform(data) {
          // return top 10 clients only
          return data[0].datapoints.slice(0, 10);
        }

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

        function render(response) {
          setElementHeight();

          var ticks = [], data = [];
          for(var i in response) {
            var item = response[i];
            ticks.push([i, item.qip]);
            data.push([i, item.count]);
          }

          var stack = 0,
          bars = true,
          lines = false,
          steps = false;

          function plotWithOptions() {
            $.plot(elem[0], [{label:'Infected Clients', data: data}], {
              series: {
                stack: stack,
                lines: {
                  show: lines,
                  fill: true,
                  steps: steps
              },
              bars: {
                show: bars,
                barWidth: 0.3
              }
            },
            xaxis: {
              ticks: ticks
            },
            zoom: {
              interactive: true
            },
            pan: {
              interactive: true
            },
            grid: { clickable: true, hoverable: true }
          });
          }

          $(elem).unbind("plotclick");
          $(elem).bind("plotclick", function (event, pos, item) {
            if(!item) {
              return;
            }
            panel.targets[0].qip = ticks[item.dataIndex][1];
            panel.targets[0].report.id = 'graph';
            scope.$emit('activate-tab', 'graph');
            ctrl.refresh();
          });

          plotWithOptions();
        }
      }
    };
  });
});
