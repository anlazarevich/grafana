///<reference path="../../../headers/common.d.ts" />

import angular from 'angular';
import _ from 'lodash';
import {QueryCtrl} from 'app/plugins/sdk';

export class RedisQueryCtrl extends QueryCtrl {
  static templateUrl = 'partials/query.editor.html';

  measures: string[];

  /** @ngInject **/
  constructor($scope, $injector) {
    super($scope, $injector);
    this.datasource.catalog().then(function(res){
        $scope.tables = Object.keys(res);
        this.catalog = res;
    });
  }

}
