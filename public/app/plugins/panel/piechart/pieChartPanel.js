define([
  'angular',
  'lodash',
  'jquery',
  'jquery.flot',
  'jquery.flot.pie',
],
function (angular, _, $) {
  'use strict';

  var module = angular.module('grafana.directives');

  module.directive('piechartPanel', function() {

    return {
      link: function(scope, elem) {
        var data;
        var ctrl = scope.ctrl;
        var panel = ctrl.panel;

        scope.$on('render', function(event, renderData) {
          if(!renderData) {
            return;
          }
          data = renderData;
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

            elem.css('height', height + 'px');

            return true;
          } catch(e) { // IE throws errors sometimes
            return false;
          }
        }

        function addPieChart() {
          var width = elem.width();
          var height = elem.height();

          var size = Math.min(width, height);

          var plotCanvas = $('<div></div>');
          var plotCss = {};

          plotCss.top = '10px';
          plotCss.margin = 'auto';
          plotCss.position = 'relative';
          plotCss.height = (size - 20) + 'px';

          plotCanvas.css(plotCss);

          var options = {
            legend: {
              show: false
            },
            series: {
              pie: {
                show: true,
                label: {
                  show: panel.legend.show && panel.legendType === 'On graph'
                }
              }
            //},
            //grid: {
            //  hoverable: true
            }
          };

          if (panel.pieType === 'donut') {
            options.series.pie.innerRadius = 0.5;
          }

          elem.html(plotCanvas);

//          var dataSet = [
//                         {label: "Asia", data: 4119630000, color: "#005CDE" },
//                         { label: "Latin America", data: 590950000, color: "#00A36A" },
//                         { label: "Africa", data: 1012960000, color: "#7D0096" },
//                         { label: "Oceania", data: 35100000, color: "#992B00" },
//                         { label: "Europe", data: 727080000, color: "#DE000F" },
//                         { label: "North America", data: 344120000, color: "#ED7B00" }
//                     ];
          for (var i = 0; i < data.length; i++) {
            var series = data[i];
            series.data = 0;
            for(var index in series.flotpairs){
              series.data += series.flotpairs[index][1];
            }
          }

          $.plot(plotCanvas, data, options);
        }

        function render() {
          setElementHeight();
          addPieChart();
        }
      }
    };
  });
});
