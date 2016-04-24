define([
  'angular',
  'app/app',
  'lodash',
  'jquery',
  'jquery.flot',
  'jquery.flot.navigate',
  'jquery.paging'
],
function (angular, app, _, $) {
  'use strict';

  var module = angular.module('grafana.directives');

  module.directive('tabHistogram', function() {

    return {
      link: function(scope, elem) {
        var ctrl = scope.ctrl;
        var panel = ctrl.panel, data,
        paginatorEl, histogramEl, width, height;

        function init() {
          histogramEl = $(elem).append('<div class="histogram-container"></div>').find('.histogram-container');
          paginatorEl = $(elem).append('<div class="pagination"></div>').find('.pagination');
        }

        init();

        scope.$on('render-histogram', function(event, renderData) {
          if(renderData) {
            data = transform(renderData);
            renderPaginator(data.length);
          } else if(!data) {
            return;
          } else {
            var h = elem.height(), w = elem.width();
            if(h !== height || w !== width) {
              renderPaginator(data.length);
            }
          }
        });

        function transform(data) {
          return data.data[0].datapoints;
        }

        function setHistogramHeight() {
          try {
            var height = ctrl.height || panel.height || ctrl.row.height;
            if (_.isString(height)) {
              height = parseInt(height.replace('px', ''), 10);
            }

            height -= 5; // padding
            height -= panel.title ? 24 : 9; // subtract panel title bar
            height -= 50; // substract tab header
            height -= 50; // substract paginator

            histogramEl.css('height', height + 'px');

            return true;
          } catch(e) { // IE throws errors sometimes
            return false;
          }
        }

        function renderPaginator(numberOfItems) {
          height = elem.height(), width = elem.width();
          var perpage = 10;
          paginatorEl.empty();
          paginatorEl.paging(numberOfItems, {
            format : '[< ncnnnnnnnnnnn >]',
            perpage: perpage,
            onSelect : function(page) {
              var end = page * perpage,
                  start = (page - 1)*perpage;
              renderHistogram(data.slice(start, end));
            },
            onFormat : function(type) {
              switch (type) {

              case 'block':

                if (!this.active) {
                  return '&nbsp;<span class="disabled">' + this.value + '</span>&nbsp;';
                }
                else if (this.value !== this.page) {
                  return '&nbsp;<em><a class="pagination-link" href="#' + this.value + '">' + this.value + '</a></em>&nbsp;';
                }
                return '&nbsp;<span class="current">' + this.value + '</span>&nbsp;';

              case 'right':
              case 'left':

                if (!this.active) {
                  return "";
                }
                return '&nbsp;<a class="pagination-link" href="#' + this.value + '">' + this.value + '</a>&nbsp;';

              case 'next':

                if (this.active) {
                  return '&nbsp;<a class="pagination-link" href="#' + this.value + '" class="next">Next</a>&nbsp;';
                }
                return '&nbsp;<span class="disabled">Next</span>&nbsp;';

              case 'prev':

                if (this.active) {
                  return '&nbsp;<a class="pagination-link" href="#' + this.value + '" class="prev">Previous</a>&nbsp;';
                }
                return '&nbsp;<span class="disabled">Previous</span>&nbsp;';

              case 'first':

                if (this.active) {
                  return '<a class="pagination-link" href="#' + this.value + '" class="first">|&lt;</a>';
                }
                return '<span class="disabled">|&lt;</span>';

              case 'last':

                if (this.active) {
                  return '<a class="pagination-link" href="#' + this.value + '" class="prev">&gt;|</a>';
                }
                return '<span class="disabled">&gt;|</span>';

              case 'fill':
                if (this.active) {
                  return "...";
                }
              }
              return ""; // return nothing for missing branches
            }
          });
        }

        function renderHistogram(response) {
          setHistogramHeight();
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
            $.plot(histogramEl[0], [{label:'Infected Clients', data: data}], {
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
                //this option doesn't work for current flot version
                //labelAngle: 45
              },
              zoom: {
                interactive: false
              },
              pan: {
                interactive: true
              },
              grid: { clickable: true, hoverable: true }
            });
            $('.flot-x-axis>.flot-tick-label', histogramEl).addClass('flot-tick-label-rotate');
          }

          $(histogramEl).unbind("plotclick");
          $(histogramEl).bind("plotclick", function (event, pos, item) {
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
