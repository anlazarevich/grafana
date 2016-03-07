///<reference path="../../../headers/common.d.ts" />

import angular from 'angular';
import _ from 'lodash';
import {QueryCtrl} from 'app/plugins/sdk';

export class EarthquakeQueryCtrl extends QueryCtrl {
  static templateUrl = 'partials/query.editor.html';

  magnitudeList: number[];
  alertList: string[];

  /** @ngInject **/
  constructor($scope, $injector) {
    super($scope, $injector);

    this.magnitudeList = [2,3,4,5,6,7,8,9];
    this.alertList = ['green', 'yellow', 'orange', 'red'];
  }

}
