///<reference path="../../../headers/common.d.ts" />

import angular from 'angular';
import _ from 'lodash';
import {QueryCtrl} from 'app/plugins/sdk';

export class RedisQueryCtrl extends QueryCtrl {
  static templateUrl = 'partials/query.editor.html';

  reports: any[];

  /** @ngInject **/
  constructor($scope, $injector) {
    super($scope, $injector);
    this.reports = this.datasource.getReportList();
    if (this.target.report) {
        this.$scope.fields = this.datasource.getFields(this.target.report.id);
    }
  }

  changeReport() {
      this.$scope.fields = this.datasource.getFields(this.target.report.id);
      this.refresh();
  }
}
