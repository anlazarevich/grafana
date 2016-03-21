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
        var data;

        $('.nav.nav-tabs a', elem).click(function (e) {
          e.preventDefault();
          var navtab = $(this);
          var attrVal = navtab.attr('data-source');
          $('.tab-pane.active', elem).removeClass('active');
          $('div[data-target*=' + attrVal + ']', elem).addClass('active');
          $(this).tab('show');
          if(attrVal === 'graph') {
            scope.$broadcast('render-graph', data);
          }
        });

        scope.$on('render', function(event, renderData) {
          if(!renderData) {
            return;
          }
          scope.$broadcast('render-histogram', renderData);
          data = renderData;
        });

      }
    };
  });
});
