import {RedisDatasource} from './datasource';
import {RedisQueryCtrl} from './query_ctrl';

class RedisConfigCtrl {
  static templateUrl = 'partials/config.html';
}


export {
  RedisDatasource as Datasource,
  RedisQueryCtrl as QueryCtrl,
  RedisConfigCtrl as ConfigCtrl,
};
