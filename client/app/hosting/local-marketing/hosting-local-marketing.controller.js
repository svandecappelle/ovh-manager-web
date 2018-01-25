angular.module("App").controller(
    "HostingTabLocalMarketingCtrl",
    class HostingTabLocalMarketingCtrl {
        constructor ($scope, $stateParams, HostingLocalMarketing) {
            this.$scope = $scope;
            this.$stateParams = $stateParams;
            this.HostingLocalMarketing = HostingLocalMarketing;
        }

        $onInit () {
            this.loading = {
                accounts: true,
                locations: false
            };
            this.productId = this.$stateParams.productId;

            this.accounts = null;
            this.locations = null;
            this.locationDetails = null;

            this.getAccounts()
                .then((accounts) => {
                    this.accounts = accounts;
                    if (!_.isEmpty(accounts)) {
                        return this.getLocations().then((locations) => {
                            this.locations = locations;
                        });
                    }
                })
                .finally(() => {
                    this.loading.accounts = false;
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

        transformItem (locationId) {
            this.loading.locations = true;
            return this.HostingLocalMarketing.getLocation(this.productId, locationId);
        }

        transformItemDone (locations) {
            this.loading.locations = false;
        }
    }
);
