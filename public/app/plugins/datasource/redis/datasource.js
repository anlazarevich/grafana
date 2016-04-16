define([
  './country_latlon.csv!text',
],
function (iso2geo) {
  'use strict';

  var geoMap = {};

  function createGeoMap() {
    var lines = iso2geo.split('\n');
    for(var i=1; i < lines.length; i++) {
      var parts = lines[i].split(',');
      if(parts.length === 3) {
        geoMap[parts[0]] = [parseFloat(parts[1]), parseFloat(parts[2])];
      }
    }
  }

  createGeoMap();

  var statDbTable = ':continent:country:severity:confidence:tag.count';

  function RedisDatasource(instanceSettings, $q, backendSrv) {
    var baseUrl = '/api/v1/redis',
    res_secs = {'minute': 120*60, 'hour': 48*60*60, 'day': Number.POSITIVE_INFINITY};
    this.name = instanceSettings.name;
    this.type = instanceSettings.type;
    this.url = instanceSettings.url + baseUrl;

    var watchListFields = [{'id':'CH','name':'China'}, {'id':'RU','name':'Russia'},
                           {'id':'SY','name':'Syria'}, {'id':'IR','name':'Iran'},
                           {'id':'SI','name':'Slovenia'}],
        tagFields = [{'id':'DNST@IB','name':'DNST'},
                     {'id':'Bot@IID','name':'Bot'},
                     {'id':'ExploitKit@IID','name':'Exploit Kit'},
                     {'id':'IllegalContent@IID','name':'Illegal Content'},
                     {'id':'MaliciousNameserver@IID','name':'Malicious Nameserver'},
                     {'id':'MalwareC2@IID','name':'Malware C2'},
                     {'id':'MalwareC2DGA@IID','name':'Malware C2 DGA'},
                     {'id':'MalwareDownload@IID','name':'Malware Download'},
                     {'id':'Phishing@IID','name':'Phishing'},
                     {'id':'Scam@IID', 'name': 'Scam'},
                     {'id':'UncategorizedThreat','name':'Uncategorized Threat'},
                     {'id':'UnwantedContent@IID','name':'Unwanted Content'},
                     {'id':'APT@IID','name':'APT'}];

    var reports  = {'geo_dest_watch_list':{ 'name':'Geographic Destination Watch List',
                      'fields': watchListFields,
                      'dim':['country','tag'],
                      'transform': 'transform2GeoWatchList',
                      'table': statDbTable},
                    'watchlist_vs_total_traffic':{ 'name':'Watch List vs Total Traffic',
                      'fields':[{'id':'watchlist_traffic','name':'Watchlist Traffic'},
                                {'id':'total_traffic','name':'Total Traffic'}],
                        'dim':['country','tag'],
                        'transform': 'transform2WatchTotalTraffic',
                        'table':statDbTable},
                     'top_security_dest':{ 'name':'Top Security Destinations by type',
                          'fields': tagFields,
                          'dim': ['tag'],
                          'transform': 'transform2TopSecurity',
                          'table':statDbTable},
                       'known_vs_bad_traffic':{ 'name':'Known Bad vs Total Traffic',
                            'fields':[{'id':'bad_traffic','name':'Known Bad Traffic'},
                                      {'id':'total_traffic','name':'Total Traffic'}],
                              'dim':['tag'],
                              'transform': 'transform2KnowBadTraffic',
                              'table':statDbTable},
                       'geo_map': { 'name':'Traffic Distribution on the world map',
                         'dim':['country','tag'],
                         'transform': 'transform2GeoMap',
                         'table':statDbTable}
    };

    this.reportList;

    var transformers = {transform2GeoWatchList: transform2GeoWatchList, transform2WatchTotalTraffic: transform2WatchTotalTraffic,
        transform2TopSecurity: transform2TopSecurity, transform2KnowBadTraffic: transform2KnowBadTraffic,
        transform2GeoMap: transform2GeoMap};

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

    function transform2GeoWatchList(ts, item, target) {
      var measure = 0;
      for(var iso2Code in item) {
        var iso2CodeValue = item[iso2Code];
        for(var tag in iso2CodeValue) {
          var tagValue = iso2CodeValue[tag];
          if(tag != null && tag !== '' && iso2Code === target.field.id) {
            measure += getMeasure(tagValue, target);
          }
        }
      }
      if(measure === 0) {
        return null;
      } else {
        return [measure, ts];
      }
    }

    function transform2WatchTotalTraffic(ts, item, target) {
      var measure = 0;
      for(var iso2Code in item) {
        var iso2CodeValue = item[iso2Code];
        for(var tag in iso2CodeValue) {
          var tagValue = iso2CodeValue[tag];
          if(tag != null && tag !== '') {
            if(target.field.id === 'total_traffic') {
              measure += getMeasure(tagValue, target);
            } else if(watchListFilter(iso2Code)) {
              measure += getMeasure(tagValue, target);
            }
          }
        }
      }
      if(measure === 0) {
        return null;
      } else {
        return [measure, ts];
      }
    }

    function transform2TopSecurity(ts,item,target) {
      var measure = 0;
      for(var tag in item) {
        var tagValue = item[tag];
        if(target.field.id === tag) {
          measure += getMeasure(tagValue, target);
        }
      }
      if(measure === 0) {
        return null;
      } else {
        return [measure, ts];
      }
    }

    function transform2KnowBadTraffic(ts, item, target) {
      var measure = 0;
      for(var tag in item) {
        var tagValue = item[tag];
        if(target.field.id === 'total_traffic') {
          if(tag == null && tag === '') {
            measure += getMeasure(tagValue, target);
          }
        } else {
          if(tag != null && tag !== '') {
            measure += getMeasure(tagValue, target);
          }
        }
      }
      if(measure === 0) {
        return null;
      } else {
        return [measure, ts];
      }
    }

    function transform2GeoMap(ts, item, target) {
      var res = [];
      for(var iso2Code in item) {
        var iso2CodeValue = item[iso2Code];
        for(var tag in iso2CodeValue) {
          var tagValue = iso2CodeValue[tag];
          if(tag != null && tag !== '') {
            var coordinates = geoMap[iso2Code];
            if(!coordinates) {
              continue;
            }
            res.push([getMeasure(tagValue, target), ts, coordinates, iso2Code]);
          }
        }
      }
      if(res.length === 0) {
        return null;
      } else {
        return res;
      }
    }

    function watchListFilter(iso2Code) {
      for(var i in watchListFields) {
        var field = watchListFields[i];
        if(field.id === iso2Code) {
          return true;
        }
      }
      return false;
    }

    // FIXME - I think this function is obsolete w/ new format I left it here to review with Alex
    function getMeasure(value, target) {
      // Set target to keep grunt lint happy!
      target.measure = target.measure ? target.measure : 'count';
      return value;
    }

    function transform(target, result) {
      var dp = [];
      var value;
      for(var ts in result) {
        var item = result[ts];
        ts *= 1000;// cast unix timestamp to milliseconds
        // transform function must return array of data points
        // format of data points is [measure, ts, ..., ] where measure is a number, ts is timestamp in milliseconds
        // the format might be extended for geo data support
        var transformFn = transformers[reports[target.report.id].transform];
        if(transformFn) {
          value = transformFn(ts, item, target);
        } else { // none transformation is applied if transformation function is not defined or not found in the map
          value = [getMeasure(item, target), ts];
        }
        if(value) {
          // support multi value: array of arrays
          if(Array.isArray(value[0])) {
            for(var i in value) {
              dp.push(value[i]);
            }
          } else {
            dp.push(value);
          }
        }
      }
      dp.sort(function(a,b) {
        return a[1] - b[1];
      });
      return {'target': target.field ? target.field.name : 'unamed field', 'datapoints': dp};
    }

    this.query = function(options) {
      var self = this;
      var resolution = getResolution(options.range);
      if(!options.targets || options.targets.length === 0) {
        return emptyRs();
      }
      var target = options.targets[0];
      var params = self._createParams(options.range, target, resolution);
      if(params) {
        return self._get('/data', params).then(function(response) {
          var result = response.data.data;
          var rs = options.targets.map(function(target) {
            return transform(target, result);
          });
          return {data: rs};
        });
      } else {
        return emptyRs();
      }
    };

    function emptyRs() {
      return $q.when(transform({}, {}));
    }

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
      if(report.dim) {
        dims.push(report.dim);
      }
      return {'t0': range.from.unix(),
          't1': range.to.unix(),
          'dims' : dims.toString(),
          'measures': 'count',
          'name': resolution+report.table
      };
    };

    this.metricFindQuery = function() {
      return $q.when([]);
    };

    this.annotationQuery = function(options) {
      var range = options.range;
      var resolution = getResolution(range);
      var dims = [resolution, 'country', 'tag'];
      var params  = {'t0': range.from.unix(),
        't1': range.to.unix(),
        'dims' : dims.toString(),
        'measures': 'count',
        'name': resolution+statDbTable
      };
      return this._get('/data', params).then(function(result) {
        return makeAnnotations(result, options.annotation);
      });
    };

    function makeAnnotations(result, annotation) {
      var events = [];
      for(var ts in result) {
        var tag = '', title = '';
        var data = {
            annotation: annotation,
            time: ts * 1000,
            tag : tag,
            title: title};
        for(var iso2 in result[ts]) {
          title += iso2;
          var item = result[ts][iso2];
          for(var malTag in item) {
            tag += malTag;
          }
        }
        events.push(data);
      }
      return events;
    }

  }

  return {
    RedisDatasource: RedisDatasource
  };
});
