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

  var statDbTable = ':tag:confidence:severity:continent:country.hits';

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
                      'table': statDbTable},
                    'watchlist_vs_total_traffic':{ 'name':'Watch List vs Total Traffic',
                      'fields':[{'id':'watchlist_traffic','name':'Watchlist Traffic'},
                                {'id':'total_traffic','name':'Total Traffic'}],
                        'dim':'country',
                        'filter': 'watchDestFilter',
                        'table':statDbTable},
                     'top_security_dest':{ 'name':'Top Security Destinations by type',
                          'fields':[{'id':'DNST@IB','name':'DNST'},
                                    {'id':'Bot@IID','name':'Bot'},
                                    {'id':'ExploitKit@IID','name':'Exploit Kit'},
                                    {'id':'IllegalContent@IID','name':'Illegal Content'},
                                    {'id':'MaliciousNameserver@IID','name':'Malicious Nameserver'},
                                    {'id':'MalwareC2@IID','name':'Malware C2'},
                                    {'id':'MalwareC2DGA@IID','name':'Malware C2 DGA'},
                                    {'id':'MalwareDownload@IID','name':'Malware Download'},
                                    {'id':'Phishing@IID','name':'Phishing'},
                                    {'id': 'Scam@IID', 'name': 'Scam'},
                                    {'id':'UncategorizedThreat','name':'Uncategorized Threat'},
                                    {'id':'UnwantedContent@IID','name':'Unwanted Content'},
                                    {'id':'APT@IID','name':'APT'}],
                          'dim':'tag',
                          'filter': 'fieldFilter',
                          'table':statDbTable},
                       'known_vs_bad_traffic':{ 'name':'Known vs Bad Traffic',
                            'fields':[{'id':'bad_traffic','name':'Known Bad Traffic'},
                                      {'id':'total_traffic','name':'Total Traffic'}],
                              'dim':'tag',
                              'filter': 'badTrafficFilter',
                              'table':statDbTable},
                       'geo_map': { 'name':'Traffic Distribution on the world map',
                         'dim':'country',
                         'table':statDbTable}
    };

    this.reportList;

    var filters = {fieldFilter: fieldFilter, watchDestFilter: watchDestFilter,
                   badTrafficFilter: badTrafficFilter};

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

    function badTrafficFilter(dim, target) {
      if(target.field.id === 'total_traffic') {
        return true;
      }
      var fields = reports.top_security_dest.fields;
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
      var value, measure;
      for(var ts in result) {
        var item = result[ts];
        if(target.field) {
          measure = 0;
          var filterFn = filters[reports[target.report.id].filter];
          for(var dim in item) {
            if(filterFn(dim, target)) {
              value = item[dim];
              measure += value[target.measure?target.measure:'hits'];
            }
          }
          dp.push([measure, ts*1000]);
        } else {
          var dimParam = reports[target.report.id].dim;
          switch(dimParam) {
          case 'country':
            for(var iso2Code in item) {
              value = item[iso2Code];
              var coordinates = geoMap[iso2Code];
              if(!coordinates) {
                continue;
              }
              dp.push([value[target.measure?target.measure:'hits'], ts*1000, coordinates, iso2Code]);
            }
            break;
          default:
            dp.push([item[target.measure?target.measure:'hits'], ts*1000]);
          }
        }
      }
      dp.sort(function(a,b) {
        return a[1] - b[1];
      });
      return {'target': target.field?target.field.name:'unamed field', 'datapoints': dp};
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
          'measures': 'hits',
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
        'measures': 'hits',
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
