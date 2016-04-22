define([
  'angular',
  'app/app',
  'lodash',
  'jquery',
  'leaflet',
  './threat_control',
  'app/core/config'
],
function (angular, app, _, $, L, ThreatControl, config) {
  'use strict';

  var module = angular.module('grafana.directives');

  module.directive('grafanaMap', function() {

    return {
      restrict: 'A',
      link: function(scope, elem) {
        var data, map, circles = [];
        var ctrl = scope.ctrl;
        var panel = ctrl.panel;

        scope.$on('render', function(event, renderData) {
          if(renderData) {
            data = renderData.data;
            render();
          } else if(!data) {
            return;
          } else {
            map.invalidateSize();
          }
        });

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
          L.Icon.Default.imagePath = config.appSubUrl + '/public/vendor/leaflet/dist/images';
          map = L.map(elem[0]).setView([37.8, -96], 2);
          L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(map);
          if(panel.enableThreatControl) {
            map.addControl(new ThreatControl());
          }
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
          var mapData = normalize(data);
          // FIXME - The scale was set to 10000 not sure why it broke?
          // Scale value highly depends on number of hits in a given record if the value is too high then
          // a circle may have a huge radius that causes red screen on the map.
          // Probably scale should be calculated with more intelligent way.
          var scale = 3;

          for(var id in mapData) {
            var val = mapData[id];
            var coords = val.coords;
            // coords have the format as an array[latitude,longitude]
            var circle = L.circle([coords[0], coords[1]], val.measure*scale, {
              color: 'red',
              fillColor: '#f03',
              fillOpacity: 0.5
            }).addTo(map);
//            if(annotations) {
//              circle.bindPopup(annotations[id]);
//            }
            circles.push(circle);
          }
        }

        function normalize(data) {
          var map = {};
          data.forEach(function(row) {
            row.datapoints.forEach(function(dp) {
              var id = dp[3];
              var val = map[id];
              if(!val) {
                map[id] = {measure: dp[0], coords: dp[2]};
              } else {
                map[id].measure += dp[0];
              }
            });
          });
          return map;
        }

        function render() {
          setElementHeight();
          elem.empty();
          initMap();
          addCircles();
        }
      }
    };
  });
});
