///<reference path="../../../headers/common.d.ts" />

import './mapPanel';

import _ from 'lodash';
import {MetricsPanelCtrl} from 'app/plugins/sdk';

var panelDefaults = {
  // datasource name, null = default datasource
  datasource: null,
  // sets client side (flot) or native graphite png renderer (png)
  renderer: 'flot',
  enableThreatControl: false,
  // metric queries
  targets: [{}]
};

class MapCtrl extends MetricsPanelCtrl {
  static templateUrl = 'module.html';

  annotationsPromise: any;
  colors: any = [];

  /** @ngInject */
  constructor($scope, $injector, private annotationsSrv) {
    super($scope, $injector);

    this.events.on('data-received', this.render.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.render.bind(this));

    _.defaults(this.panel, panelDefaults);

    this.colors = $scope.$root.colors;
  }

  onDataError(err) {
    this.render([]);
  }

}

export {MapCtrl, MapCtrl as PanelCtrl}
