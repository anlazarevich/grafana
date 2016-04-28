define([
  'angular',
  'lodash',
  'jquery',
  'sigma',
  'sigma.force2Atlas',
  'sigma.dragNodes'
],
function (angular, _, $, sigma) {
  'use strict';

  var module = angular.module('grafana.directives');

  module.directive('tabGraph', function($timeout) {

    return {
      link: function(scope, elem) {
        var data, sigmaInstance;
        var ctrl = scope.ctrl;
        var panel = ctrl.panel, width, height;

        scope.$on('render-graph', function(event, renderData) {
          if(renderData) {
            data = toGraph(renderData.data);
            render();
          } else if(!data) {
            return;
          } else {
            var h = elem.height(), w = elem.width();
            if(h !== height || w !== width) {
              render();
            }
          }
        });

        function toGraph(data) {
          var qip = panel.targets[0].qip;
          var g = {
              nodes : [],
              edges : []
            },
            nodeSeq = 2, edgeSeq = 1, rootNodeId = '1';
            // add root node as qip
          g.nodes.push({
              id : rootNodeId,
              label : qip,
              x : 0 + (Math.random()*0.001),
              y : 0 + (Math.random()*0.001),
              size : 10,
              color : '#6E9ECE'
            });
          var map = {};
          data[0].datapoints.forEach(function(item) {
              for(var tag in item) {
                var count = map[tag];
                if(!count) {
                  map[tag] = item[tag];
                } else {
                  map[tag]+= item[tag];
                }
              }
            });
          var result = [];
          for(var tag in map) {
            result.push({tag:tag, count: map[tag]});
          }
          result.sort(function(a,b) {
            b.count - a.count;
          });
          var maxChildNodes = 100;
          if(result.length > maxChildNodes) {
            result = result.slice(0, maxChildNodes);
          }
          nodeSeq++;
          result.forEach(function(row, i, a) {
            var nodeId = nodeSeq.toString();
            nodeSeq++;
            g.nodes
                  .push({
                    id : nodeId,
                    label : row.tag + '(' + row.count + ')',
                    x: Math.cos(Math.PI * 2 * i / a.length),
                    y: Math.sin(Math.PI * 2 * i / a.length),
                    size : 10,
                    color : '#FF0000'
                  });
            g.edges.push({
                id : edgeSeq.toString(),
                source : rootNodeId, // root node has always id equal to 1
                target : nodeId,
                size : 10,
                color : '#ccc',
                type : 'curvedArrow',
                arrow : 'source',
                label : "This is the label"
              });
            edgeSeq++;
          });
          return g;
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

        function render() {
          setElementHeight();

          height = elem.height(), width = elem.width();

          delete panel.targets[0].qip;
          panel.targets[0].report.id = 'top_bad_traffic_users';

          elem.empty();
//          if (!sigmaInstance) {
            // Instantiate sigma:
          sigmaInstance = new sigma({
              graph : data,
              renderer : {
                container : elem[0],
                // IMPORTANT:
                // This works only with the canvas renderer, so the
                // renderer type set as "canvas" is necessary here.
                type : 'canvas'
              },
              settings : {
                defaultLabelColor : '#606060' //gray color
              }
            });
//          } else {
//            var graph = sigmaInstance.graph;
//            graph.clear();
//            data.nodes.forEach(function(node) {
//              graph.addNode(node);
//            });
//            data.edges.forEach(function(edge) {
//              graph.addEdge(edge);
//            });
////            sigma.plugins.killDragNodes(sigmaInstance);
//            sigmaInstance.refresh();
//          }

          //TODO Move this property to panel configuration tab
          var enableForce2Atlas = data.nodes.length > 20;
          if (enableForce2Atlas) {
            var forceConfig = {
              /**
               * The “Strong gravity” option sets a force that attracts the
               * nodes that are distant from the center more ( is this
               * distance). This force has the drawback of being so strong that
               * it is sometimes stronger than the other forces. It may result
               * in a biased placement of the nodes. However, its advantage is
               * to force a very compact layout, which may be useful for certain
               * purposes.
               */
              strongGravityMode : true,
              /**
               * It is important to notice that this mode adds a considerable
               * friction in the convergence movement, slowing spatialization
               * performances. It is necessary to apply it only after the
               * convergence of graph spatialization.
               */
              adjustSizes : true
            };
            sigmaInstance.startForceAtlas2(forceConfig);
            $timeout(stopForceAtlas2, 3000);
          }
          // Initialize the dragNodes plugin:
          sigma.plugins.dragNodes(sigmaInstance, sigmaInstance.renderers[0]);
        }

        function stopForceAtlas2() {
          sigmaInstance.killForceAtlas2();
        }
      }
    };
  });
});
