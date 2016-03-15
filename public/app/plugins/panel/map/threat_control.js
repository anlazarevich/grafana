define([
  'jquery',
  'leaflet',
  './threat_control.html!text'
],
function ($, L, template) {
  'use strict';

  var ThreatControl = L.Control.extend({

    options: {
        position: 'topright'
    },

    onAdd: function (map) {
      console.log('initializing threat controll here',  map);
      var container = L.DomUtil.create('div', 'threat-control');
      var wrapper = $(container);
      wrapper.append(template);
      function toggleOptions() {
        wrapper.find('.threat-list').toggle();
      }
      wrapper.find('.btn').on("click", function() {
        toggleOptions();
      });
      return container;
    }
  });

  return ThreatControl;

});