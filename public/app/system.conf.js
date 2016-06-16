System.config({
  defaultJSExtenions: true,
  baseURL: 'public',
  paths: {
    'tether': 'vendor/npm/tether/dist/js/tether.js',
    'tether-drop': 'vendor/npm/tether-drop/dist/js/drop.js',
    'moment': 'vendor/moment.js',
    "jquery": "vendor/jquery/dist/jquery.js",
    'lodash-src': 'vendor/lodash.js',
    "lodash": 'app/core/lodash_extended.js',
    "angular": "vendor/angular/angular.js",
    "bootstrap": "vendor/bootstrap/bootstrap.js",
    'angular-route':          'vendor/angular-route/angular-route.js',
    'angular-sanitize':       'vendor/angular-sanitize/angular-sanitize.js',
    "angular-ui":             "vendor/angular-ui/ui-bootstrap-tpls.js",
    "angular-strap":          "vendor/angular-other/angular-strap.js",
    "angular-dragdrop":       "vendor/angular-native-dragdrop/draganddrop.js",
    "angular-bindonce":       "vendor/angular-bindonce/bindonce.js",
    "spectrum": "vendor/spectrum.js",
    "bootstrap-tagsinput": "vendor/tagsinput/bootstrap-tagsinput.js",
    "jquery.flot": "vendor/flot/jquery.flot",
    "jquery.flot.pie": "vendor/flot/jquery.flot.pie",
    "jquery.flot.selection": "vendor/flot/jquery.flot.selection",
    "jquery.flot.stack": "vendor/flot/jquery.flot.stack",
    "jquery.flot.stackpercent": "vendor/flot/jquery.flot.stackpercent",
    "jquery.flot.time": "vendor/flot/jquery.flot.time",
    "jquery.flot.crosshair": "vendor/flot/jquery.flot.crosshair",
    "jquery.flot.fillbelow": "vendor/flot/jquery.flot.fillbelow",
    "jquery.flot.navigate": "vendor/flot/jquery.flot.navigate",
    "jquery.flot.tooltip": "vendor/flot.tooltip/js/jquery.flot.tooltip",
    "leaflet": "vendor/leaflet/dist/leaflet",
    "sigma": "vendor/sigma/build/sigma",
    "sigma.force2Atlas": "vendor/sigma/build/plugins/sigma.layout.forceAtlas2.min.js",
    "sigma.dragNodes": "vendor/sigma/build/plugins/sigma.plugins.dragNodes.min.js",
    "crypto-js": "vendor/crypto-js/md5.js",
    "jquery.paging": "vendor/paging/jquery.paging.js"
  },

  packages: {
    app: {
      defaultExtension: 'js',
    },
    vendor: {
      defaultExtension: 'js',
    },
    plugins: {
      defaultExtension: 'js',
    },
    test: {
      defaultExtension: 'js',
    },
  },

  map: {
    text: 'vendor/plugin-text/text.js',
    css: 'app/core/utils/css_loader.js'
  },

  meta: {
    'vendor/angular/angular.js': {
      format: 'global',
      deps: ['jquery'],
      exports: 'angular',
    },
    'vendor/sigma/build/sigma.js': {
      format: 'global',
      exports: 'sigma'
    },
    'vendor/sigma/build/plugins/sigma.layout.forceAtlas2.min.js': {
      format: 'global'
    },
    'vendor/crypto-js/md5.js': {
      format: 'global',
      exports: 'CryptoJS'
    }
  }
});
