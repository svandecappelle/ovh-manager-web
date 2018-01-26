angular.module("App").controller(
    "HostingLocalMarketingDeleteCtrl",
    class HostingLocalMarketingDeleteCtrl {
        constructor ($scope, Alerter, HostingLocalMarketing) {
            this.$scope = $scope;
            this.Alerter = Alerter;
            this.HostingLocalMarketing = HostingLocalMarketing;
        }

        $onInit () {
            this.location = angular.copy(this.$scope.currentActionData);
            this.loading = false;
        }

        deleteLocation () {
            this.loading = true;
            return this.HostingLocalMarketing
                .deleteLocation(this.location)
                .then(() => this.Alerter.success(this.$scope.tr("hosting_tab_LOCAL_MARKETING_delete_success"), this.$scope.alerts.main))
                .catch((err) => this.Alerter.alertFromSWS(this.$scope.tr("hosting_tab_LOCAL_MARKETING_delete_error"), err, this.$scope.alerts.main))
                .finally(() => {
                    this.loading = false;
                    this.$scope.resetAction();
                });
        }
    }
);
