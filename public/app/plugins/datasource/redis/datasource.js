define([],
function () {
  'use strict';

  function RedisDatasource(instanceSettings, $q, backendSrv) {
    var baseUrl = '/api/v1/redis';
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
      for(var ts in result.data) {
        var value = result.data[ts];
        dp.push([value[target.measure], ts*1000]);
      }
      dp.sort(function(a,b) {
        return a[1] - b[1];
      });
      return {'target': target.refId, 'datapoints': dp};
    }

    this.query = function(options) {
      var self = this;
      var promises = options.targets.map(function(target) {
        var params = createParams(options.range, target);
        if(params) {
          return self._get('/data', params).then(function(result) {
            return convert(target, result.data);
          });
        } else {
          return $q.when([]);
        }
      });
      return $q.all(promises).then(function(res) {
        return {data: res};
      });
    };

    function createParams(range, target) {
      if(!target.measure) {
        return;
      }
      return {'t0': range.from.unix(),
          't1': range.to.unix(),
          'dims' : 'minute',
          'measures': target.measure,
          'name': 'synth.minute:src:dst.hits:ff:dnst'
          };
    }

    this.metricFindQuery = function() {
      return $q.when([]);
    };

    //TODO to be implemented
    this.annotationQuery = function(options) {
      var params = {'starttime': options.range.from.unix(),
          'endtime': options.range.to.unix(),
          'minmagnitude' : 6,
          'format': 'geojson'};
      return this._get('/query', params).then(function(result) {
        return makeAnnotations(result, options.annotation);
      });
    };

    function makeAnnotations(result, annotation) {
      var events = [];
      result.data.features.forEach(function(row) {
        var props = row.properties;
        var data = {
            annotation: annotation,
            time: props.time,
            title: props.title,
            tags: row.id,
            text: null
          };
        events.push(data);
      });
      return events;
    }

  }

  return {
    RedisDatasource: RedisDatasource
  };
});
