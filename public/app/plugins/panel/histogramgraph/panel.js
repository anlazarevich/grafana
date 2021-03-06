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

        var ctrl = scope.ctrl;
        var panel = ctrl.panel;

        $('.nav.nav-tabs a', elem).click(function (e) {
          e.preventDefault();
          var navtab = $(this);
          activateTab(navtab);
          ctrl.events.emit('render-'+ navtab.attr('data-source'));
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

        ctrl.events.on('render', function(renderData) {
          if(panel.targets.length > 0 && panel.targets[0].qip) {
            ctrl.events.emit('render-graph', renderData);
          } else {
            var target = $('.nav.nav-tabs .active a', elem).attr('data-source');
            ctrl.events.emit('render-'+ target, renderData);
          }
        });

      }
    };
  });
});
