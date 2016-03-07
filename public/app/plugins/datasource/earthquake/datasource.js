define([],
function () {
  'use strict';

  function EarthquakeDatasource(instanceSettings, $q, backendSrv) {
    this.name = instanceSettings.name;
    this.type = instanceSettings.type;
    this.url = instanceSettings.url;

    var isoFormat = "YYYY-MM-DD";

    this._get = function(relativeUrl, params) {
      return backendSrv.datasourceRequest({
        method: 'GET',
        url: this.url + (!relativeUrl ? '' : relativeUrl),
        params: params,
      });
    };

    this.testDatasource = function() {
      return this._get().then(function() {
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
      result.data.features.forEach(function(row) {
        var props = row.properties;
        dp.push([props.mag, props.time, row.geometry, row.id]);
      });
      dp.sort(function(a,b) {
        return a[1] - b[1];
      });
      return {'target': target.refId, 'datapoints': dp};
    }

    this.query = function(options) {
      var self = this;
      var promises = options.targets.map(function(target) {
        return self._get('/query', createParams(options.range, target)).then(function(result) {
          return convert(target, result);
        });
      });
      return $q.all(promises).then(function(res) {
        return {data: res};
      });
    };

    function createParams(range, target) {
      var params = {'starttime': range.from.format(isoFormat),
          'endtime': range.to.format(isoFormat),
          'minmagnitude' : 6, // set 6 by default to narrow search result
          'format': 'geojson'};
      if(target.magn) {
        params.minmagnitude = parseInt(target.magn);
      }
      if(target.alert_level) {
        params.alertlevel = target.alert_level;
      }
      return params;
    }

    this.metricFindQuery = function() {
      return $q.when([]);
    };

    this.annotationQuery = function(options) {
      var params = {'starttime': options.range.from.format(isoFormat),
          'endtime': options.range.to.format(isoFormat),
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
    EarthquakeDatasource: EarthquakeDatasource
  };
});
