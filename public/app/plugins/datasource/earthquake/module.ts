import {EarthquakeDatasource} from './datasource';
import {EarthquakeQueryCtrl} from './query_ctrl';

class EarthquakeConfigCtrl {
  static templateUrl = 'partials/config.html';
}


export {
  EarthquakeDatasource as Datasource,
  EarthquakeQueryCtrl as QueryCtrl,
  EarthquakeConfigCtrl as ConfigCtrl,
};
