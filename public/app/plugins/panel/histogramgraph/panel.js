define([
  'angular',
  'lodash',
  'jquery',
  './panel.html!text',
  './graph',
  './histogram'
],
function (angular, _, $, template) {
  'use strict';

  var module = angular.module('grafana.directives');

  module.directive('histogramGraphPanel', function() {

    return {
      template: template,
      link: function(scope, elem) {

        $('.nav.nav-tabs a', elem).click(function (e) {
          e.preventDefault();
          var navtab = $(this);
          activateTab(navtab);
        });

        scope.$on('activate-tab', function(event, tab) {
          var navtab = $('.nav.nav-tabs a[data-source="' + tab + '"]', elem);
          activateTab(navtab);
          event.stopPropagation();
        });

        function activateTab(navtab) {
          var attrVal = navtab.attr('data-source');
          $('.tab-pane.active', elem).removeClass('active');
          $('div[data-target*=' + attrVal + ']', elem).addClass('active');
          navtab.tab('show');
        }

        scope.$on('render', function(event, renderData) {
          if(!renderData) {
            return;
          }
          if(Array.isArray(renderData.data)) {
            scope.$broadcast('render-histogram', renderData);
          } else {
            scope.$broadcast('render-graph', renderData);
          }
        });

      }
    };
  });
});
