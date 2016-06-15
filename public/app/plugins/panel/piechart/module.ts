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
  colors: any = [];

  /** @ngInject */
  constructor($scope, $injector, private annotationsSrv) {
    super($scope, $injector);

    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));

    _.defaults(this.panel, panelDefaults);
    _.defaults(this.panel.legend, panelDefaults.legend);

    this.colors = $scope.$root.colors;
  }

  onDataError(err) {
    this.render([]);
  }

  onInitEditMode() {
    this.unitFormats = kbn.getUnitFormats();
  }

  setUnitFormat(axis, subItem) {
    this.panel.format = subItem.value;
    this.render();
  }

  onDataReceived(results) {
    this.series = _.map(results, (series, i) => this.seriesHandler(series, i));
    this.render(this.series);
  }

  seriesHandler(seriesData, index) {
    var alias = seriesData.target;
    var colorIndex = index % this.colors.length;
    var color = this.colors[colorIndex];
    var series = new TimeSeries({
      datapoints: seriesData.datapoints,
      alias: seriesData.target,
      color: color
    });
    series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
    return series;
  }

}

export {PieChartCtrl, PieChartCtrl as PanelCtrl}
