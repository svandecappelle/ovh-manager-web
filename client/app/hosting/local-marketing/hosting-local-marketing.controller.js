angular.module("App").controller(
    "HostingTabLocalMarketingCtrl",
    class HostingTabLocalMarketingCtrl {
        constructor ($scope, $stateParams, HostingLocalMarketing) {
            this.$scope = $scope;
            this.$stateParams = $stateParams;
            this.HostingLocalMarketing = HostingLocalMarketing;
        }

        $onInit () {
            this.loading = true;
            this.productId = this.$stateParams.productId;

            this.accounts = null;
            this.locations = null;

            this.getAccounts()
                .then((accounts) => {
                    this.accounts = accounts;
                    if (!_.isEmpty(accounts)) {
                        this.locations = this.getLocations();
                        return this.locations;
                    }
                })
                .finally(() => {
                    this.loading = false;
                });
        }

        getAccounts () {
            return this.HostingLocalMarketing.getAccounts(this.productId);
        }

        getLocations () {
            return this.HostingLocalMarketing.getLocations(this.productId);
        }

        hasAccounts () {
            return !_.isEmpty(this.accounts);
        }

        hasLocations () {
            return !_.isEmpty(this.locations);
        }
    }
);
