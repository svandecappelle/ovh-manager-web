angular.module('App').controller(
  'controllers.Hosting.Runtimes.create',
  class HostingRuntimesCreateCtrl {
    constructor($scope, $stateParams, $translate, Alerter, HostingRuntimes) {
      this.$scope = $scope;
      this.$stateParams = $stateParams;
      this.$translate = $translate;

      this.Alerter = Alerter;
      this.HostingRuntimes = HostingRuntimes;
    }

    $onInit() {
      this.isLoading = true;
      this.entryToCreate = {
        name: null,
        type: null,
        publicDir: null,
        appEnv: null,
        appBootstrap: null,
      };

      this.$scope.create = () => this.create();
      this.$scope.isValid = () => this.isValid();

      return this.fetchAvailableTypes();
    }

    fetchAvailableTypes() {
      return this.HostingRuntimes.getAvailableTypes(this.$stateParams.productId)
        .then((types) => {
          this.availableTypes = types;
        })
        .catch(() => {
          this.Alerter.error(
            this.$translate.instant('hosting_tab_RUNTIMES_list_error'),
            this.$scope.alerts.main,
          );
          this.$scope.resetAction();
        })
        .finally(() => {
          this.isLoading = false;
        });
    }

    isValid() {
      if (
        this.entryToCreate
        && this.entryToCreate.type
        && this.entryToCreate.type.indexOf('nodejs') !== -1
      ) {
        return (
          this.entryToCreate
          && this.entryToCreate.name
          && this.entryToCreate.publicDir
          && this.entryToCreate.appEnv
          && this.entryToCreate.appBootstrap
        );
      }

      return (
        this.entryToCreate && this.entryToCreate.name && this.entryToCreate.type
      );
    }

    create() {
      this.isLoading = true;

      return this.HostingRuntimes.create(
        this.$stateParams.productId,
        this.entryToCreate,
      )
        .then(() => {
          this.Alerter.success(
            this.$translate.instant('hosting_tab_RUNTIMES_save_success'),
            this.$scope.alerts.main,
          );
        })
        .catch((err) => {
          this.Alerter.error(
            this.$translate.instant('hosting_tab_RUNTIMES_save_error') + err.message,
            this.$scope.alerts.main,
          );
        })
        .finally(() => {
          this.$scope.resetAction();
        });
    }
  },
);
