///<reference path="../../../headers/common.d.ts" />

import angular from 'angular';
import _ from 'lodash';
import {QueryCtrl} from 'app/plugins/sdk';

export class RedisQueryCtrl extends QueryCtrl {
  static templateUrl = 'partials/query.editor.html';

  reports: any[];
  options: any[];

  /** @ngInject **/
  constructor($scope, $injector) {
    super($scope, $injector);
    this.reports = this.datasource.getReportList(this.panel.type);
    var report = this.panel.report;
    if (report) {
        this.options = this.datasource.getOptions(report.id);
    }
    if (!this.target.report) {
        this.target.report = report;
    }
  }

  changeReport() {
      var fields = this.datasource.getFields(this.target.report.id);
      this.options = this.datasource.getOptions(this.target.report.id);

      this.panel.report = this.target.report;
      this.panel.targets = [];
      var target;
      if (fields) {
        var self = this;
        fields.forEach(function(field){
          target = {};
          target['refId'] = self.getNextQueryLetter();
          target['field'] = field;
          target['report'] = self.target.report;
          self.panel.targets.push(target);
        });
      } else {
        target = {};
        target['report'] = this.target.report;
        target['hidden'] = true;
        this.panel.targets.push(target);
      }
      this.refresh();
  }

  isHidden() {
      return this.panel.report && !this.target.hidden;
  }

}
