import {CassandraDatasource} from './datasource';
import {CassandraQueryCtrl} from './query_ctrl';

class CassandraConfigCtrl {
  static templateUrl = 'partials/config.html';
}


export {
  CassandraDatasource as Datasource,
  CassandraQueryCtrl as QueryCtrl,
  CassandraConfigCtrl as ConfigCtrl,
};
