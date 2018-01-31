angular.module("App").controller(
    "HostingCtrl",
    class HostingCtrl {

        constructor ($scope, $rootScope, $q, $timeout, $stateParams,
                     Hosting, Alerter, constants, User,
                     HostingDomain) {

            this.$scope = $scope;
            this.$rootScope = $rootScope;
            this.$q = $q;
            this.$timeout = $timeout;
            this.$stateParams = $stateParams;
            this.Hosting = Hosting;
            this.Alerter = Alerter;
            this.constants = constants;
            this.User = User;
            this.HostingDomain = HostingDomain;

            this.loading = {
                hostingInformations: true,
                hostingError: false
            };

            this.productId = null;
            this.hosting = null;

            this.editing = false;
            this.newDisplayName = "";

            this.$scope.stepPath = "";
            this.$scope.currentAction = null;
            this.$scope.currentActionData = null;

            this.$scope.alerts = {
                page: "app.alerts.page",
                tabs: "app.alerts.tabs",
                main: "app.alerts.main"
            };

            this.$scope.urlDomainOrder = null;

            this.$scope.resetAction = function () {
                this.$scope.setAction(false);
            }.bind(this);

            this.$scope.setAction = function (action, data) {
                this.$scope.currentAction = action;
                this.$scope.currentActionData = data;

                if (action) {
                    this.$scope.stepPath = `hosting/${this.$scope.currentAction}.html`;
                    $("#currentAction").modal({
                        keyboard: true,
                        backdrop: "static"
                    });
                } else {
                    $("#currentAction").modal("hide");
                    this.$scope.currentActionData = null;
                    $timeout(() => {
                        this.$scope.stepPath = "";
                    }, 300);
                }
            }.bind(this);
        }

        $onInit () {
            this.productId = this.$stateParams.productId;

            this.$scope.$on(this.Hosting.events.dashboardRefresh, () => {
                this.loadHosting();
            });

            this.$scope.$on("$locationChangeStart", () => {
                this.$scope.resetAction();
            });

            this.User.getUrlOf("domainOrder")
                .then((url) => {
                    this.$scope.urlDomainOrder = url;
                });

            this.loadHosting().then(() => {
                this.setupPolling();
            });
        }

        setupPolling () {
            this.$scope.$on("hostingDomain.attachDomain.start", () => {
                this.Alerter.success(this.$scope.tr("hosting_tab_DOMAINS_configuration_add_success_progress"), this.$scope.alerts.main);
            });

            this.$scope.$on("hostingDomain.attachDomain.done", () => {
                this.Alerter.success(this.$scope.tr("hosting_tab_DOMAINS_configuration_add_success_finish"), this.$scope.alerts.main);
            });

            this.$scope.$on("hostingDomain.attachDomain.error", (event, err) => {
                this.Alerter.alertFromSWS(this.$scope.tr("hosting_tab_DOMAINS_configuration_add_failure"), _.get(err, "data", err), this.$scope.alerts.main);
            });

            this.$scope.$on("hostingDomain.modifyDomain.start", () => {
                this.Alerter.success(this.$scope.tr("hosting_tab_DOMAINS_configuration_modify_success_progress"), this.$scope.alerts.main);
            });

            this.$scope.$on("hostingDomain.modifyDomain.done", () => {
                this.$scope.$broadcast("paginationServerSide.reload");
                this.Alerter.success(this.$scope.tr("hosting_tab_DOMAINS_configuration_modify_success_finish"), this.$scope.alerts.main);
            });

            this.$scope.$on("hostingDomain.modifyDomain.error", (err) => {
                this.$scope.$broadcast("paginationServerSide.reload");
                this.Alerter.alertFromSWS(this.$scope.tr("hosting_tab_DOMAINS_configuration_modify_failure"), _.get(err, "data", err), this.$scope.alerts.main);
            });

            function startPolling () {
                this.$q.all([
                    this.HostingDomain.getTaskIds({ fn: "attachedDomain/create" }, this.productId),
                    this.HostingDomain.getTaskIds({ fn: "attachedDomain/update" }, this.productId)])
                    .then((tasks) => {
                        const taskIds = _.union(tasks[0], tasks[1]);
                        ["attachedDomain/create", "attachedDomain/update"].forEach((name, key) => {
                            if (tasks[key].length > 0) {
                                this.HostingDomain.pollRequest({
                                    taskIds,
                                    namespace: name,
                                    serviceName: this.hosting.serviceName
                                });
                            }
                        });
                    });
            }

            startPolling();
        }

        $onDestroy () {
            this.HostingDomain.killAllPolling();
        }

        loadHosting () {
            return this.Hosting.getSelected(this.productId, true)
                .then((hosting) => {
                    this.hosting = this.$scope.hosting = hosting;
                    this.hosting.displayName = hosting.displayName || hosting.serviceDisplayName;

                    this.getServiceInfos();

                    this.Hosting.getHosting(this.productId)
                        .then((hostingProxy) => {
                            this.hostingProxy = this.$scope.hostingProxy = hostingProxy;
                        })
                        .finally(() => {
                            this.loading.hostingInformations = false;
                        });

                    if (hosting.messages.length > 0) {
                        this.Alerter.error(this.$scope.tr("hosting_dashboard_loading_error"), this.$scope.alerts.page);
                        if (!this.hosting.name) {
                            this.loading.hostingError = true;
                        }
                    }
                })
                .catch(() => {
                    this.loading.hostingInformations = false;
                    this.loading.hostingError = true;
                });
        }

        getServiceInfos () {
            this.Hosting.getServiceInfos(this.productId)
                .then((serviceInfos) => {
                    this.hosting.serviceInfos = serviceInfos;
                })
                .catch((err) => {
                    this.hosting.serviceInfos = {};
                    this.Alerter.error(err);
                });
        }

        editDisplayName () {
            this.newDisplayName = this.hosting.displayName || this.hosting.serviceName;
            this.editing = true;
        }

        saveDisplayName () {
            const displayName = this.newDisplayName || this.hosting.serviceName;
            this.Hosting.updateHosting(this.productId, {
                body: {
                    displayName
                }
            }).then(() => {
                this.$rootScope.$broadcast("change.displayName", [this.hosting.serviceName, displayName]);
                this.$timeout(() => (this.hosting.displayName = displayName), 0);
            }).catch((err) => {
                _.set(err, "type", err.type || "ERROR");
                this.Alerter.alertFromSWS(this.$scope.tr("hosting_dashboard_loading_error"), err, this.$scope.alerts.main);
            }).finally(() => {
                this.editing = false;
            });
        }

        resetDisplayName () {
            this.editing = false;
        }
    });
