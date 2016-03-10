define([],
function () {
  'use strict';

  function RedisDatasource(instanceSettings, $q, backendSrv) {
    var baseUrl = '/api/v1/redis', catalog,
    res_secs = {'minute': 120*60, 'hour': 48*60*60, 'day': Number.POSITIVE_INFINITY};
    this.name = instanceSettings.name;
    this.type = instanceSettings.type;
    this.url = instanceSettings.url + baseUrl;

    this._get = function(action, params) {
      return backendSrv.datasourceRequest({
        method: 'GET',
        url: this.url + action,
        params: params,
        withCredentials: true
      });
    };

    this.catalog = function() {
      if (catalog) {
        return $q.when(catalog);
      } else {
        return this._get('/catalog').then(function(res) {
          catalog = {};
          res.data.catalog.forEach(function(item) {
            var name = item.name[0].substring(item.name[0].indexOf(':')+1) + '.' +item.name[1];
            var table = catalog[name];
            if(!table) {
              table = {};
              catalog[name] = table;
            } else {
              return;
            }
            table.dims = item.dims;
            table.measures = item.measures;
          });
          return catalog;
        });
      }
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

    function convert(target, result) {
      var dp = [];
      for(var ts in result) {
        var value = result[ts];
        dp.push([value[target.measure?target.measure:'hits'], ts*1000]);
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
            return convert(target, result.data.data);
          });
        } else {
          return $q.when(convert(target, {}));
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
      if(!target.table) {
        return;
      }
      return {'t0': range.from.unix(),
          't1': range.to.unix(),
          'dims' : resolution,
          'measures': 'hits',
          'name': resolution+':'+target.table
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
