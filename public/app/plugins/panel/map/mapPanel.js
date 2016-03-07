define([
  'angular',
  'app/app',
  'lodash',
  'jquery',
  'leaflet'
],
function (angular, app, _, $, L) {
  'use strict';

  var module = angular.module('grafana.directives');

  module.directive('grafanaMap', function() {

    return {
      restrict: 'A',
      link: function(scope, elem) {
        var data, annotations, map, circles = [];
        var ctrl = scope.ctrl;
        var panel = ctrl.panel;

        scope.$on('render', function(event, renderData) {
          if(!renderData) {
            return;
          }
          data = renderData.data;
          buildAnnotationCache(renderData.annotations);
          render(renderData);
        });

        function buildAnnotationCache(events) {
          if(!events || events.length === 0) {
            annotations = null;
            return;
          }
          annotations = {};
          events.forEach(function(event) {
            annotations[event.tags] = event.title;
          });
        }

        function setElementHeight() {
          try {
            var graphHeight = ctrl.height || panel.height || ctrl.row.height;
            if (_.isString(graphHeight)) {
              graphHeight = parseInt(graphHeight.replace('px', ''), 10);
            }

            graphHeight -= 5; // padding
            graphHeight -= panel.title ? 24 : 9; // subtract panel title bar

            elem.css('height', graphHeight + 'px');

            return true;
          } catch(e) { // IE throws errors sometimes
            return false;
          }
        }

        function initMap() {
          if(map) {
            return;
          }
          L.Icon.Default.imagePath = 'public/vendor/leaflet/dist/images';
          map = L.map(elem[0]).setView([37.8, -96], 2);
          L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(map);
        }

        function addCircles() {
          circles.forEach(function(c) {
            map.removeLayer(c);
          });
          circles = [];
          if(!data) {
            return;
          }
          // check result set has geo info
          if(data.length === 0 || data[0].datapoints.length === 0  || data[0].datapoints[0].length < 3) {
            return;
          }
          data.forEach(function(row) {
            row.datapoints.forEach(function(dp) {
              var coords = dp[2].coordinates;
              var circle = L.circle([coords[1], coords[0]], dp[0]*10000, {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.5
              }).addTo(map);
              if(annotations) {
                circle.bindPopup(annotations[dp[3]]);
              }
              circles.push(circle);
            });
          });
        }

        function render() {
          setElementHeight();
          initMap();
          addCircles();
        }
      }
    };
  });
});
