define([],
function () {
  'use strict';

  function RedisDatasource(instanceSettings, $q, backendSrv) {
    var baseUrl = '/api/v1/redis',
    res_secs = {'minute': 120*60, 'hour': 48*60*60, 'day': Number.POSITIVE_INFINITY};
    this.name = instanceSettings.name;
    this.type = instanceSettings.type;
    this.url = instanceSettings.url + baseUrl;

    var reports  = {'geo_dest_watch_list':{ 'name':'Geographic Destination Watch List',
                      'fields':[{'id':'CH','name':'China'}, {'id':'RU','name':'Russia'},
                                {'id':'SY','name':'Syria'}, {'id':'IR','name':'Iran'},
                                {'id':'SI','name':'Slovenia'}],
                      'dim':'country',
                      'filter': 'fieldFilter',
                      'table':':tag:confidence:severity:continent:country.hits'},
                    'watchlist_vs_total_traffic':{ 'name':'Watch List vs Total Traffic',
                        'fields':[{'id':'watchlist_traffic','name':'Watchlist Traffic'},
                                  {'id':'total_traffic','name':'Total Traffic'}],
                        'dim':'country',
                        'filter': 'watchDestFilter',
                        'table':':tag:confidence:severity:continent:country.hits'}
    };

    this.reportList;

    var filters = {fieldFilter: fieldFilter, watchDestFilter: watchDestFilter};

    function fieldFilter(dim, target) {
      return dim === target.field.id;
    }

    function watchDestFilter(dim, target) {
      if(target.field.id === 'total_traffic') {
        return true;
      }
      var fields = reports.geo_dest_watch_list.fields;
      for(var i in fields) {
        if(dim === fields[i].id) {
          return true;
        }
      }
      return false;
    }

    this.getReportList = function() {
      if(this.reportList) {
        return this.reportList;
      }
      var res = [];
      for(var key in reports) {
        res.push({'label':reports[key].name, 'id': key});
      }
      this.reportList = res;
      return res;
    };

    this.getFields = function(reportId) {
      var report = reports[reportId];
      if(!report) {
        return;
      }
      return report.fields;
    };

    this._get = function(action, params) {
      return backendSrv.datasourceRequest({
        method: 'GET',
        url: this.url + action,
        params: params,
        withCredentials: true
      });
    };

    this.testDatasource = function() {
      return this._get('/catalog').then(function() {
        return { status: "success", message: "Data source is working", title: "Success" };
      }, function(err) {
        if (err.data && err.data.error) {
          return { status: "error", message: err.data.error, title: "Error" };
        } else {
          return { status: "error", message: err.status, title: "Error" };
        }
      });
    };

    function transform(target, result) {
      var dp = [];
      for(var ts in result) {
        var item = result[ts];
        if(target.field) {
          var filterFn = filters[reports[target.report.id].filter];
          for(var dim in item) {
            if(filterFn(dim, target)) {
              var value = item[dim];
              dp.push([value[target.measure?target.measure:'hits'], ts*1000]);
            }
          }
        } else {
          dp.push([item[target.measure?target.measure:'hits'], ts*1000]);
        }
      }
      dp.sort(function(a,b) {
        return a[1] - b[1];
      });
      return {'target': target.alias, 'datapoints': dp};
    }

    this.query = function(options) {
      var self = this;
      var resolution = getResolution(options.range);
      var promises = options.targets.map(function(target) {
        var params = self._createParams(options.range, target, resolution);
        if(params) {
          return self._get('/data', params).then(function(result) {
            return transform(target, result.data.data);
          });
        } else {
          return $q.when(transform(target, {}));
        }
      });
      return $q.all(promises).then(function(res) {
        return {data: res};
      });
    };

    function getResolution(range) {
      var delta = range.to.unix() - range.from.unix();
      if(delta < res_secs.minute) {
        return 'minute';
      } else if(delta < res_secs.hour) {
        return 'hour';
      } else {
        return 'day';
      }
    }

    this._createParams = function(range, target, resolution) {
      if(!target.report) {
        return;
      }
      var report = reports[target.report.id];
      var dims = [resolution];
      if(target.field) {
        dims.push(report.dim);
      }
      return {'t0': range.from.unix(),
          't1': range.to.unix(),
          'dims' : dims.toString(),
          'measures': 'hits',
          'name': resolution+report.table
      };
    };

    this.metricFindQuery = function() {
      return $q.when([]);
    };

    //TODO to be implemented
    this.annotationQuery = function() {
      return $q.when([]);
    };

  }

  return {
    RedisDatasource: RedisDatasource
  };
});
