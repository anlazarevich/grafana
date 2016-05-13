define([
  './country_latlon.csv!text',
  './iso3166.csv!text'
],
function (iso2geo, isoCodeList) {
  'use strict';

  var geoMap = {}, countryList = [];

  function createGeoMap() {
    var lines = iso2geo.split('\n'),
    i, parts, item;
    for(i = 1; i < lines.length; i++) {
      parts = lines[i].split(',');
      if(parts.length === 3) {
        item = geoMap[parts[0]];
        if(!item) {
          item = {};
          geoMap[parts[0]] = item;
        }
        geoMap[parts[0]].coords = [parseFloat(parts[1]), parseFloat(parts[2])];
      }
    }
    lines = isoCodeList.split('\n');
    for(i = 1; i < lines.length; i++) {
      parts = lines[i].split(',"');
      if(parts.length === 2) {
        var title = parts[1].substring(0, parts[1].length -1);
        item = geoMap[parts[0]];
        if(!item) {
          item = {};
          geoMap[parts[0]] = item;
        }
        geoMap[parts[0]].title = title;
        countryList.push({'id':parts[0],'name':title});
      }
    }
    countryList.sort(function(a,b) {
      return (a.name < b.name ? -1 : (a.name > b.name ? 1 : 0));
    });
  }

  createGeoMap();

  var queryStatDbTable = ':continent:country:severity:confidence:tag.count',
      clientStatDbTable = ':client:severity:confidence:tag.count';

  function RedisDatasource(instanceSettings, $q, backendSrv) {
    var baseUrl = '/api/v1/redis';
    this.name = instanceSettings.name;
    this.type = instanceSettings.type;
    this.url = instanceSettings.url + baseUrl;

    var watchListFields = [{'id':'CN','name':'China'}, {'id':'RU','name':'Russia'},
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
                     {'id':'ExploitKit_Magnitude@IID','name':'ExploitKit Magnitude'},
                     {'id':'Phishing_Phish@IID', 'name': 'Phishing Phish'},
                     {'id':'UncategorizedThreat@IID','name':'Uncategorized Threat'},
                     {'id':'UnwantedContent@IID','name':'Unwanted Content'},
                     {'id':'APT@IID','name':'APT'},
                     {'id':'ExploitKit_Magnitude@IID','name':'ExploitKit Magnitude'},
                     {'id':'Phishing_Phish@IID', 'name': 'Phishing Phish'}];

    var reports  = {'geo_dest_watch_list':{ 'name':'Geographic Destination Watch List',
                      'fields': watchListFields,
                      'options': countryList,
                      'dim':['timestamp','country','tag'],
                      'sort': 'orderByTs',
                      'transform': 'transform2GeoWatchList',
                      'table': queryStatDbTable},
                    'watchlist_vs_total_traffic':{ 'name':'Watch List vs Total Traffic',
                      'fields':[{'id':'watchlist_traffic','name':'Watchlist Traffic'},
                                {'id':'total_traffic','name':'Total Traffic'}],
                        'dim':['timestamp','country','tag'],
                        'transform': 'transform2WatchTotalTraffic',
                        'table':queryStatDbTable},
                     'top_security_dest':{ 'name':'Top Security Destinations by type',
                          'fields': tagFields,
                          'dim': ['timestamp','tag'],
                          'sort': 'orderByTs',
                          'transform': 'transform2TopSecurity',
                          'table':queryStatDbTable},
                       'known_vs_bad_traffic':{ 'name':'Known Bad vs Total Traffic',
                            'fields':[{'id':'bad_traffic','name':'Known Bad Traffic'},
                                      {'id':'total_traffic','name':'Total Traffic'}],
                              'dim':['timestamp','tag'],
                              'transform': 'transform2KnowBadTraffic',
                              'table':queryStatDbTable},
                       'geo_map': { 'name':'Traffic Distribution on the world map',
                         'dim':['timestamp','country','tag'],
                         'transform': 'transform2GeoMap',
                         'table':queryStatDbTable},
                       'top_bad_traffic_users': { 'name':'Top Bad Trafic Users',
                         'dim':['client'],
                         'sort': 'orderByCount',
                         'transform': 'transform2TopClientList',
                         'table':clientStatDbTable},
                       'graph': { 'name':'Top Bad Trafic Users',
                         'dim':['client', 'tag'],
                         'hide': true,
                         'transform': 'transform2GraphList',
                         'table':clientStatDbTable}
    };

    this.reportList;

    var transformers = {transform2GeoWatchList: transform2GeoWatchList, transform2WatchTotalTraffic: transform2WatchTotalTraffic,
        transform2TopSecurity: transform2TopSecurity, transform2KnowBadTraffic: transform2KnowBadTraffic,
        transform2GeoMap: transform2GeoMap, transform2TopClientList: transform2TopClientList,
        transform2GraphList: transform2GraphList};
    var sorts = {orderByCount: orderByCount, orderByTs: orderByTs};

    this.getReportList = function() {
      if(this.reportList) {
        return this.reportList;
      }
      var res = [];
      for(var key in reports) {
        if(!reports[key].hide) {
          res.push({'label':reports[key].name, 'id': key});
        }
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

    this.getOptions = function(reportId) {
      var report = reports[reportId];
      if(!report) {
        return;
      }
      return report.options ? report.options : report.fields;
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

    function transform2GeoWatchList(dp, item, target) {
      for(var ts in item) {
        var tsValue = item[ts];
        ts *= 1000;// cast unix timestamp to milliseconds
        var measure = 0;
        for(var iso2Code in tsValue) {
          var iso2CodeValue = tsValue[iso2Code];
          for(var tag in iso2CodeValue) {
            var tagValue = iso2CodeValue[tag];
            if(tag != null && tag !== '' && iso2Code === target.field.id) {
              measure += tagValue;
            }
          }
        }
        dp.push([measure, ts]);
      }
    }

    function transform2WatchTotalTraffic(dp, item, target) {
      for(var ts in item) {
        var tsValue = item[ts];
        ts *= 1000;// cast unix timestamp to milliseconds
        var measure = 0;
        for(var iso2Code in tsValue) {
          var iso2CodeValue = tsValue[iso2Code];
          for(var tag in iso2CodeValue) {
            var tagValue = iso2CodeValue[tag];
            if(tag != null && tag !== '') {
              if(target.field.id === 'total_traffic') {
                measure += tagValue;
              } else if(watchListFilter(iso2Code)) {
                measure += tagValue;
              }
            }
          }
        }
        dp.push([measure, ts]);
      }
    }

    function transform2TopSecurity(dp, item, target) {
      for(var ts in item) {
        var tsValue = item[ts];
        ts *= 1000;// cast unix timestamp to milliseconds
        var measure = 0;
        for(var tag in tsValue) {
          var tagValue = tsValue[tag];
          if(target.field.id === tag) {
            measure += tagValue;
          }
        }
        dp.push([measure, ts]);
      }
    }

    function transform2KnowBadTraffic(dp, item, target) {
      for(var ts in item) {
        var tsValue = item[ts];
        ts *= 1000;// cast unix timestamp to milliseconds
        var measure = 0;
        for(var tag in tsValue) {
          var tagValue = tsValue[tag];
          if(target.field.id === 'total_traffic') {
            if(tag === 'Null') {
              measure += tagValue;
            }
          } else {
            if(tag !== 'Null') {
              measure += tagValue;
            }
          }
        }
        dp.push([measure, ts]);
      }
    }

    function transform2GeoMap(dp, item) {
      for(var ts in item) {
        var tsValue = item[ts];
        ts *= 1000;// cast unix timestamp to milliseconds
        for(var iso2Code in tsValue) {
          var iso2CodeValue = tsValue[iso2Code];
          for(var tag in iso2CodeValue) {
            var tagValue = iso2CodeValue[tag];
            if(tag != null && tag !== '') {
              var geo = geoMap[iso2Code];
              if(!geo || !geo.coords) {
                continue;
              }
              dp.push([tagValue, ts, geo.coords, iso2Code]);
            }
          }
        }
      }
    }

    function transform2TopClientList(dp, item) {
      for(var qip in item) {
        dp.push({qip: qip, count: item[qip]});
      }
    }

    function transform2GraphList(dp, item, target) {
      for(var qip in item) {
        if(qip !== target.qip) {
          continue;
        }
        dp.push(item[qip]);
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

    function transform(target, result) {
      var dp = [];
      for(var key in result) {
        var item = result[key];
        var transformFn = transformers[reports[target.report.id].transform];
        if(transformFn) {
          transformFn(dp, item, target);
        } else { // none transformation is applied if transformation function is not defined or not found in the map
          dp.push([key, item]);
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
      var self = this;
      if(!options.targets || options.targets.length === 0) {
        return emptyRs();
      }
      var target = options.targets[0];
      var params = self._createParams(options.range, target);
      if(params) {
        return self._get('/search', params).then(function(response) {
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

    this._createParams = function(range, target) {
      if(!target.report) {
        return;
      }
      var report = reports[target.report.id];
      return {'t0': range.from.unix(),
          't1': range.to.unix(),
          'dims' : report.dim.toString(),
          'measures': 'count',
          'name': report.table
      };
    };

    this.metricFindQuery = function() {
      return $q.when([]);
    };

    this.annotationQuery = function() {
      return $q.when([]);
    };

  }

  return {
    RedisDatasource: RedisDatasource
  };
});
