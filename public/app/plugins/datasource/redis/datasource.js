define([
  './geoMap/geoMapService'
],
function () {
  'use strict';

  var queryStatDbTable = 'continent:country:severity:confidence:tag.count',
      clientStatDbTable = 'client:severity:confidence:tag.count';

  /** @ngInject */
  function RedisDatasource(instanceSettings, $q, backendSrv, geoMapService) {
    var baseUrl = '/api/v1/redis', threatMap, initDsState = 'start', nullTag = 'Null',
    totalEventsTag = 'TotalEvents@IB',
    res_secs = [{'name':'minute', 'range':2*60*60}, {'name':'hour', 'range':48*60*60},
                {'name':'day', 'range':61*24*60*60} ,{'name':'month', 'range':Number.POSITIVE_INFINITY}];
    this.name = instanceSettings.name;
    this.type = instanceSettings.type;
    var url = instanceSettings.url + baseUrl;

    var geoMap = geoMapService.getGeoMap();
    var countryList = geoMapService.getCountryList();

    var watchListFields = [{'id':'CN','name':'China'}, {'id':'RU','name':'Russia'},
                           {'id':'SY','name':'Syria'}, {'id':'IR','name':'Iran'},
                           {'id':'SI','name':'Slovenia'}];

    var reports  = {'geo_dest_watch_list':{ 'name':'Geographic Destination Watch List',
                      'fields': watchListFields,
                      'panelType': 'graph',
                      'options': countryList,
                      'dim':['timestamp','country','tag'],
                      'sort': 'orderByTs',
                      'transform': 'transform2GeoWatchList',
                      'table': queryStatDbTable},
                    'watchlist_vs_total_traffic':{ 'name':'Watch List vs Total Traffic',
                      'fields':[{'id':'watchlist_traffic','name':'Watchlist Traffic'},
                                {'id':'total_traffic','name':'Total Traffic'}],
                        'dim':['timestamp','country','tag'],
                        'panelType': 'piechart',
                        'transform': 'transform2WatchTotalTraffic',
                        'table':queryStatDbTable},
                     'top_security_dest':{ 'name':'Top Security Destinations by type',
                          'dim': ['tag', 'timestamp'],
                          'sort': 'orderByTs',
                          'panelType': 'graph',
                          'transform': 'transform2TopSecurity',
                          'table':queryStatDbTable},
                       'known_vs_bad_traffic':{ 'name':'Known Bad vs Total Traffic',
                            'fields':[{'id':'bad_traffic','name':'Known Bad Traffic'},
                                      {'id':'total_traffic','name':'Total Traffic'}],
                              'dim':['timestamp','tag'],
                              'panelType': 'piechart',
                              'transform': 'transform2KnowBadTraffic',
                              'table':queryStatDbTable},
                       'geo_map': { 'name':'All Traffic Distribution on the world map',
                         'dim':['timestamp','country','tag'],
                         'panelType': 'map',
                         'transform': 'transform2GeoMap',
                         'table':queryStatDbTable},
                       'detected_threat_geo_map': { 'name':'Detected Traffic Distribution on the world map',
                           'panelType': 'map',
                           'dim':['timestamp','country','tag'],
                           'transform': 'transform2DetectedThreatGeoMap',
                           'table':queryStatDbTable},
                       'top_bad_traffic_users': { 'name':'Top Bad Trafic Users',
                         'dim':['client'],
                         'sort': 'orderByCount',
                         'panelType': 'histogramgraph',
                         'transform': 'transform2TopClientList',
                         'table':clientStatDbTable},
                       'graph': { 'name':'Top Bad Trafic Users',
                         'dim':['client', 'tag'],
                         'hide': true,
                         'transform': 'transform2GraphList',
                         'table':clientStatDbTable}
    };

    var transformers = {transform2GeoWatchList: transform2GeoWatchList, transform2WatchTotalTraffic: transform2WatchTotalTraffic,
        transform2TopSecurity: transform2TopSecurity, transform2KnowBadTraffic: transform2KnowBadTraffic,
        transform2GeoMap: transform2GeoMap, transform2TopClientList: transform2TopClientList,
        transform2GraphList: transform2GraphList, transform2DetectedThreatGeoMap: transform2DetectedThreatGeoMap};
    var sorts = {orderByCount: orderByCount, orderByTs: orderByTs};

    this.getReportList = function(panelType) {
      var res = [];
      for(var key in reports) {
        var report = reports[key];
        if(!report.hide && report.panelType === panelType) {
          res.push({'label':report.name, 'id': key});
        }
      }
      return res;
    };

    this.getFields = function(reportId) {
      var report = reports[reportId];
      if(!report) {
        return;
      }
      return report.fields;
    };

    this.getOptions = function(reportId) {
      var report = reports[reportId];
      if(!report) {
        return;
      }
      return report.options ? report.options : report.fields;
    };

    function fetchData(action, params) {
      return backendSrv.datasourceRequest({
        method: 'GET',
        url: url + action,
        params: params,
        withCredentials: true
      });
    }

    this.testDatasource = function() {
      return fetchData('/catalog').then(function() {
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
      ts *= 1000;// cast unix timestamp to milliseconds
      var measure = 0;
      for(var iso2Code in item) {
        var iso2CodeValue = item[iso2Code];
        for(var tag in iso2CodeValue) {
          var tagValue = iso2CodeValue[tag];
          if(iso2Code === target.field.id) {
            measure += tagValue;
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
      ts *= 1000;// cast unix timestamp to milliseconds
      for(var iso2Code in item) {
        var iso2CodeValue = item[iso2Code];
        for(var tag in iso2CodeValue) {
          var tagValue = iso2CodeValue[tag];
          if(target.field.id === 'total_traffic' && tag === totalEventsTag) {
            measure += tagValue;
          } else if(watchListFilter(iso2Code)) {
            measure += tagValue;
          }
        }
      }
      if(measure === 0) {
        return null;
      } else {
        return [measure, ts];
      }
    }

    function transform2TopSecurity(data) {
      var res = [];
      for(var tag in data) {
        if(tag === nullTag || tag === totalEventsTag) {
          continue;
        }
        var dp  = [], tagItem = data[tag];
        for(var ts in tagItem) {
          dp.push([tagItem[ts], ts * 1000]);
        }
        res.push({'target': threatMap[tag], 'datapoints': dp});
      }
      return res;
    }

    function transform2KnowBadTraffic(ts, item, target) {
      var measure = 0;
      ts *= 1000;// cast unix timestamp to milliseconds
      for(var tag in item) {
        if(tag === totalEventsTag) {
          continue;
        }
        var tagValue = item[tag];
        if(target.field.id === 'total_traffic') {
          if(tag === nullTag) {
            measure += tagValue;
          }
        } else {
          if(tag !== nullTag) {
            measure += tagValue;
          }
        }
      }
      if(measure === 0) {
        return null;
      } else {
        return [measure, ts];
      }
    }

    function transform2GeoMap(ts, item) {
      var res = [];
      ts *= 1000;// cast unix timestamp to milliseconds
      for(var iso2Code in item) {
        var iso2CodeValue = item[iso2Code];
        for(var tag in iso2CodeValue) {
          var tagValue = iso2CodeValue[tag];
          if(tag != null && tag !== '') {
            var geo = geoMap[iso2Code];
            if(!geo || !geo.coords) {
              continue;
            }
            res.push([tagValue, ts, geo.coords, iso2Code, geo.title]);
          }
        }
      }
      if(res.length === 0) {
        return null;
      } else {
        return res;
      }
    }

    function transform2DetectedThreatGeoMap(ts, item) {
      var res = [];
      ts *= 1000;// cast unix timestamp to milliseconds
      for(var iso2Code in item) {
        var iso2CodeValue = item[iso2Code];
        for(var tag in iso2CodeValue) {
          var tagValue = iso2CodeValue[tag];
          if(tag !== nullTag && tag !== totalEventsTag) {
            var geo = geoMap[iso2Code];
            if(!geo || !geo.coords) {
              continue;
            }
            res.push([tagValue, ts, geo.coords, iso2Code, geo.title]);
          }
        }
      }
      if(res.length === 0) {
        return null;
      } else {
        return res;
      }
    }

    function transform2TopClientList(qip, count) {
      return {qip: qip, count: count};
    }

    function transform2GraphList(qip, item, target) {
      if(qip !== target.qip) {
        return;
      }
      return item;
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

    function transform(target, result) {
      var dp = [];
      var value;
      for(var key in result) {
        var item = result[key];
        var transformFn = transformers[reports[target.report.id].transform];
        if(transformFn) {
          value = transformFn(key, item, target);
        } else { // none transformation is applied if transformation function is not defined or not found in the map
          value = [key, item];
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
      if (dp.length > 1) {
        var sortFn = sorts[reports[target.report.id].sort];
        if (sortFn) {
          dp.sort(sortFn);
        }
      }
      return {'target': target.field ? target.field.name : 'unamed field', 'datapoints': dp};
    }

    function orderByTs(a,b) {
      return a[1] - b[1];
    }

    function orderByCount(a,b) {
      return b.count - a.count;
    }

    this.query = function(options) {
      var resolution = getResolution(options.range);
      if(!options.targets || options.targets.length === 0) {
        return emptyRs();
      }
      var target = options.targets[0];
      var params = createParams(options.range, target, resolution);
      if(params) {
        return $q.all([fetchData('/search', params), initDatasource()]).then(function(response) {
          var result = response[0].data.data, rs;
          if(target.report.id === 'top_security_dest') {
            rs = transform2TopSecurity(result);
          } else {
            rs = options.targets.map(function(target) {
              return transform(target, result);
            });
          }
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
      for(var i in res_secs) {
        var entry = res_secs[i];
        if(delta <= entry.range) {
          return entry.name;
        }
      }
    }

    function createParams(range, target, resolution) {
      if(!target.report) {
        return;
      }
      var report = reports[target.report.id];

      return {'t0': range.from.unix(),
          't1': range.to.unix(),
          'dims' : report.dim.toString(),
          'measures': 'count',
          'time_bucket': resolution,
          'name': report.table
      };
    }

    this.metricFindQuery = function() {
      return $q.when([]);
    };

    this.annotationQuery = function() {
      return $q.when([]);
    };

    function initDatasource() {
      if(initDsState === 'completed') {
        return $q.when();
      }
      if(initDsState === 'start') {
        initDsState = 'inprogress';
        return fetchData('/threat_categories').then(function(response) {
          threatMap = response.data.data;
          initDsState = 'completed';
        });
      }
    }

  }

  return {
    RedisDatasource: RedisDatasource
  };
});
