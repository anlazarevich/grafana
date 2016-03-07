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
    _.defaults(this.panel, panelDefaults);
  }

  initEditMode() {
    super.initEditMode();
    this.icon = "fa fa-dashboard";
  }

  refreshData(datasource) {
    this.annotationsPromise = this.annotationsSrv.getAnnotations(this.dashboard);

    return this.issueQueries(datasource)
    .then(res => this.dataHandler(res))
    .catch(err => {
      this.render([]);
      throw err;
    });
  }

  loadSnapshot(snapshotData) {
    this.annotationsPromise = this.annotationsSrv.getAnnotations(this.dashboard);
    this.dataHandler(snapshotData);
  }

  dataHandler(results) {
    // png renderer returns just a url
    if (_.isString(results)) {
      this.render(results);
      return;
    }

    this.annotationsPromise.then(annotations => {
      this.loading = false;
      results.annotations = annotations;
      this.render(results);
    }, () => {
      this.loading = false;
      this.render(results);
    });
  };

  render(data?: any) {
    this.broadcastRender(data);
  }

}

export {HistogramGraphCtrl, HistogramGraphCtrl as PanelCtrl}
