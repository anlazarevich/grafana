define([
  'angular',
  './country_latlon.csv!text',
  './iso3166.csv!text'
],
function (angular, iso2geo, isoCodeList) {
  'use strict';

  var module = angular.module('grafana.services');

  module.service('geoMapService', function() {

    this.geoMap = {};
    this.countryList = [];

    this.init = function() {
      var lines = iso2geo.split('\n'),
      i, parts, item;
      for(i = 1; i < lines.length; i++) {
        parts = lines[i].split(',');
        if(parts.length === 3) {
          item = this.geoMap[parts[0]];
          if(!item) {
            item = {};
            this.geoMap[parts[0]] = item;
          }
          this.geoMap[parts[0]].coords = [parseFloat(parts[1]), parseFloat(parts[2])];
        }
      }
      lines = isoCodeList.split('\n');
      for(i = 1; i < lines.length; i++) {
        parts = lines[i].split(',"');
        if(parts.length === 2) {
          var title = parts[1].substring(0, parts[1].length -1);
          item = this.geoMap[parts[0]];
          if(!item) {
            item = {};
            this.geoMap[parts[0]] = item;
          }
          this.geoMap[parts[0]].title = title;
          this.countryList.push({'id':parts[0],'name':title});
        }
      }
      this.countryList.sort(function(a,b) {
        return (a.name < b.name ? -1 : (a.name > b.name ? 1 : 0));
      });
    };

    this.init();

    this.getGeoMap = function() {
      return this.geoMap;
    };

    this.getCountryList = function() {
      return this.countryList;
    };

  });

});
