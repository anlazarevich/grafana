///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import moment from 'moment';
import angular from 'angular';
import $cookies from 'ngCookies';
import config from 'app/core/config';
import $ from 'jquery';
import * as impressionStore from '../impression_store';

export class DashNavCtrl {

  /** @ngInject */
  constructor($scope, $rootScope, alertSrv, $location, playlistSrv, backendSrv, $timeout, $cookies) {

    $scope.init = function() {
      $scope.onAppEvent('save-dashboard', $scope.saveDashboard);
      $scope.onAppEvent('delete-dashboard', $scope.deleteDashboard);
      $scope.onAppEvent('export-dashboard', $scope.snapshot);
      $scope.onAppEvent('quick-snapshot', $scope.quickSnapshot);

      $scope.showSettingsMenu = $scope.dashboardMeta.canEdit || $scope.contextSrv.isEditor;
      $scope.xaasUrl = config.xaasUrl;
      $scope.xaasView = 'Services'; // xaas portal redirects to services by default
      var xaasLocation = $cookies.getObject('xaas_portal_loc');
      if (xaasLocation && xaasLocation.url){
        $scope.xaasUrl = xaasLocation.url;
      }
      if (xaasLocation && xaasLocation.view){
        $scope.xaasView = xaasLocation.view;
      }
      if ($scope.dashboardMeta.isSnapshot) {
        $scope.showSettingsMenu = false;
        var meta = $scope.dashboardMeta;
        $scope.titleTooltip = 'Created: &nbsp;' + moment(meta.created).calendar();
        if (meta.expires) {
          $scope.titleTooltip += '<br>Expires: &nbsp;' + moment(meta.expires).fromNow() + '<br>';
        }
      }
      $scope.userEmail = $scope.contextSrv.user.name.split(' ')[0];
    };

    $scope.openEditView = function(editview) {
      var search = _.extend($location.search(), {editview: editview});
      $location.search(search);
    };

    $scope.starDashboard = function() {
      if ($scope.dashboardMeta.isStarred) {
        backendSrv.delete('/api/user/stars/dashboard/' + $scope.dashboard.id).then(function() {
          $scope.dashboardMeta.isStarred = false;
        });
      } else {
        backendSrv.post('/api/user/stars/dashboard/' + $scope.dashboard.id).then(function() {
          $scope.dashboardMeta.isStarred = true;
        });
      }
    };

    $scope.shareDashboard = function(tabIndex) {
      var modalScope = $scope.$new();
      modalScope.tabIndex = tabIndex;

      $scope.appEvent('show-modal', {
        src: 'public/app/features/dashboard/partials/shareModal.html',
        scope: modalScope
      });
    };

    $scope.quickSnapshot = function() {
      $scope.shareDashboard(1);
    };

    $scope.openSearch = function() {
      $scope.appEvent('show-dash-search');
    };

    $scope.hideTooltip = function(evt) {
      angular.element(evt.currentTarget).tooltip('hide');
      $scope.appEvent('hide-dash-search');
    };

    $scope.makeEditable = function() {
      $scope.dashboard.editable = true;

      var clone = $scope.dashboard.getSaveModelClone();

      backendSrv.saveDashboard(clone, {overwrite: false}).then(function(data) {
        $scope.dashboard.version = data.version;
        $scope.appEvent('dashboard-saved', $scope.dashboard);
        $scope.appEvent('alert-success', ['Dashboard saved', 'Saved as ' + clone.title]);

        // force refresh whole page
        window.location.href = window.location.href;
      }, $scope.handleSaveDashError);
    };

    $scope.saveDashboard = function(options) {
      if ($scope.dashboardMeta.canSave === false) {
        return;
      }

      var clone = $scope.dashboard.getSaveModelClone();

      backendSrv.saveDashboard(clone, options).then(function(data) {
        $scope.dashboard.version = data.version;
        $scope.appEvent('dashboard-saved', $scope.dashboard);

        var dashboardUrl = '/dashboard/db/' + data.slug;

        if (dashboardUrl !== $location.path()) {
          $location.url(dashboardUrl);
        }

        $scope.appEvent('alert-success', ['Dashboard saved', 'Saved as ' + clone.title]);
      }, $scope.handleSaveDashError);
    };

    $scope.handleSaveDashError = function(err) {
      if (err.data && err.data.status === "version-mismatch") {
        err.isHandled = true;

        $scope.appEvent('confirm-modal', {
          title: 'Conflict',
          text: 'Someone else has updated this dashboard.',
          text2: 'Would you still like to save this dashboard?',
          yesText: "Save & Overwrite",
          icon: "fa-warning",
          onConfirm: function() {
            $scope.saveDashboard({overwrite: true});
          }
        });
      }

      if (err.data && err.data.status === "name-exists") {
        err.isHandled = true;

        $scope.appEvent('confirm-modal', {
          title: 'Conflict',
          text: 'Dashboard with the same name exists.',
          text2: 'Would you still like to save this dashboard?',
          yesText: "Save & Overwrite",
          icon: "fa-warning",
          onConfirm: function() {
            $scope.saveDashboard({overwrite: true});
          }
        });
      }
    };

    $scope.deleteDashboard = function() {
      $scope.appEvent('confirm-modal', {
        title: 'Delete',
        text: 'Do you want to delete this dashboard?',
        text2: $scope.dashboard.title,
        icon: 'fa-trash',
        yesText: 'Delete',
        onConfirm: function() {
          $scope.deleteDashboardConfirmed();
        }
      });
    };

    $scope.deleteDashboardConfirmed = function() {
      backendSrv.delete('/api/dashboards/db/' + $scope.dashboardMeta.slug).then(function() {
        impressionStore.impressions.deleteDashboardImpression($scope.dashboardMeta.slug);
        $scope.appEvent('alert-success', ['Dashboard Deleted', $scope.dashboard.title + ' has been deleted']);
        $location.url('/');
      });
    };

    $scope.saveDashboardAs = function() {
      var newScope = $rootScope.$new();
      newScope.clone = $scope.dashboard.getSaveModelClone();
      newScope.clone.editable = true;
      newScope.clone.hideControls = false;

      $scope.appEvent('show-modal', {
        src: 'public/app/features/dashboard/partials/saveDashboardAs.html',
        scope: newScope,
        modalClass: 'modal--narrow'
      });
    };

    $scope.exportDashboard = function() {
      var clone = $scope.dashboard.getSaveModelClone();
      var blob = new Blob([angular.toJson(clone, true)], { type: "application/json;charset=utf-8" });
      var wnd: any = window;
      wnd.saveAs(blob, $scope.dashboard.title + '-' + new Date().getTime() + '.json');
    };

    $scope.snapshot = function() {
      $scope.dashboard.snapshot = true;
      $rootScope.$broadcast('refresh');

      $timeout(function() {
        $scope.exportDashboard();
        $scope.dashboard.snapshot = false;
        $scope.appEvent('dashboard-snapshot-cleanup');
      }, 1000);

    };

    $scope.editJson = function() {
      var clone = $scope.dashboard.getSaveModelClone();
      $scope.appEvent('show-json-editor', { object: clone });
    };

    $scope.stopPlaylist = function() {
      playlistSrv.stop(1);
    };

    $scope.logout = function() {
        $.ajax('logout', {method: "DELETE"}).
        done(function() {
            window.location.assign($scope.xaasUrl);
        });
    };

    $scope.init();
  }
}

export function dashNavDirective() {
  return {
    restrict: 'E',
    templateUrl: 'public/app/features/dashboard/dashnav/dashnav.html',
    controller: DashNavCtrl,
    transclude: true,
  };
}

angular.module('grafana.directives').directive('dashnav', dashNavDirective);
