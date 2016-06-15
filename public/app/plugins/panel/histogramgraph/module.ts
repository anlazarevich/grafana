///<reference path="../../../headers/common.d.ts" />

import './panel';

import _ from 'lodash';
import {MetricsPanelCtrl} from 'app/plugins/sdk';

var panelDefaults = {
  links: [],
  datasource: null,
  maxDataPoints: 3,
  interval: null,
  targets: [{}],
  cacheTimeout: null,
  nullText: null,
  nullPointMode: 'connected'
};

class HistogramGraphCtrl extends MetricsPanelCtrl {
  static templateUrl = 'module.html';

  annotationsPromise: any;

  /** @ngInject */
  constructor($scope, $injector, private annotationsSrv) {
    super($scope, $injector);
    this.events.on('data-received', this.render.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.render.bind(this));

    _.defaults(this.panel, panelDefaults);
  }

  onDataError(err) {
    this.render([]);
  }

}

export {HistogramGraphCtrl, HistogramGraphCtrl as PanelCtrl}
