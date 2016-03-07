///<reference path="../../../headers/common.d.ts" />

import './pieChartPanel';
import './legend';

import moment from 'moment';
import kbn from 'app/core/utils/kbn';
import _ from 'lodash';
import TimeSeries from 'app/core/time_series2';
import {MetricsPanelCtrl} from 'app/plugins/sdk';

var panelDefaults = {
      legend: {
        show: true, // disable/enable legend
        legendType: 'rightSide',
        values: false, // disable/enable legend values
        min: false,
        max: false,
        current: false,
        total: false,
        avg: false
      },
      links: [],
      datasource: null,
      maxDataPoints: 3,
      interval: null,
      targets: [{}],
      cacheTimeout: null,
      nullText: null,
      nullPointMode: 'connected'
};

class PieChartCtrl extends MetricsPanelCtrl {
  static templateUrl = 'module.html';

  unitFormats: any;
  series: any = [];

  /** @ngInject */
  constructor($scope, $injector, private annotationsSrv) {
    super($scope, $injector);
    _.defaults(this.panel, panelDefaults);
    _.defaults(this.panel.legend, panelDefaults.legend);
  }

  initEditMode() {
    super.initEditMode();
    this.icon = "fa fa-dashboard";
    this.unitFormats = kbn.getUnitFormats();
  }

  setUnitFormat(axis, subItem) {
    this.panel.format = subItem.value;
    this.render();
  }

  refreshData(datasource) {
    return this.issueQueries(datasource)
    .then(res => this.dataHandler(res))
    .catch(err => {
      this.render([]);
      throw err;
    });
  }

  loadSnapshot(snapshotData) {
    this.dataHandler(snapshotData);
  }

  dataHandler(results) {
    this.series = _.map(results.data, (series, i) => this.seriesHandler(series, i));
    this.render(this.series);
  }

  seriesHandler(seriesData, index) {
    var series = new TimeSeries({
      datapoints: seriesData.datapoints,
      alias: seriesData.target
    });
    series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
    return series;
  }

  render(data?: any) {
    this.broadcastRender(data);
  }

}

export {PieChartCtrl, PieChartCtrl as PanelCtrl}
