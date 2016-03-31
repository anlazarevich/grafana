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
        var histogram;
        var ctrl = scope.ctrl;
        var panel = ctrl.panel;

        scope.$on('render-histogram', function(event, renderData) {
          if(!renderData) {
            return;
          }
//          data = renderData.data;
          render(renderData.data);
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

        function render(response) {
          setElementHeight();

          if(histogram) {
            return;
          }
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
                barWidth: 0.6
              }
            },
            xaxis: {
              ticks: ticks
            },
            grid: { clickable: true, hoverable: true }
          });
          }

          $(elem).bind("plotclick", function (event, pos, item) {
            panel.targets[0].qip = ticks[item.dataIndex][1];
            panel.targets[0].table = 'graph_stat';
            scope.$emit('activate-tab', 'graph');
            ctrl.refresh();
          });

          plotWithOptions();
        }
      }
    };
  });
});
