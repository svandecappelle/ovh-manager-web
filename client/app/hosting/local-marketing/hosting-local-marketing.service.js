angular
    .module("services")
    .service("HostingLocalMarketing", class HostingDomain {

        constructor ($rootScope, $q, Hosting, OvhHttp) {
            this.$rootScope = $rootScope;
            this.$q = $q;
            this.Hosting = Hosting;
            this.OvhHttp = OvhHttp;
        }

        getAccounts (serviceName) {
            return this.OvhHttp.get(`/hosting/web/${serviceName}/localSeo/account`, {
                rootPath: "apiv6"
            });
        }

        getLocations (serviceName) {
            return this.OvhHttp.get(`/hosting/web/${serviceName}/localSeo/location`, {
                rootPath: "apiv6"
            });
        }
    }
);
