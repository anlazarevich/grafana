import {Neo4jDatasource} from './datasource';
import {Neo4jQueryCtrl} from './query_ctrl';

class Neo4jConfigCtrl {
  static templateUrl = 'partials/config.html';
}


export {
  Neo4jDatasource as Datasource,
  Neo4jQueryCtrl as QueryCtrl,
  Neo4jConfigCtrl as ConfigCtrl,
};
