import {RedisDatasource} from './datasource';
import {RedisQueryCtrl} from './query_ctrl';

class RedisConfigCtrl {
  static templateUrl = 'partials/config.html';
}

class RedisAnnotationsQueryCtrl {
  static templateUrl = 'partials/annotations.editor.html';
}

export {
  RedisDatasource as Datasource,
  RedisQueryCtrl as QueryCtrl,
  RedisConfigCtrl as ConfigCtrl,
  RedisAnnotationsQueryCtrl as AnnotationsQueryCtrl
};
