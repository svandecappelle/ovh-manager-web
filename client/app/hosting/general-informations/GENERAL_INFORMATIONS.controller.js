angular.module("App").controller(
    "GeneralInformationsCtrl",
    class GeneralInformationsCtrl {
        constructor ($scope, $stateParams, $q, $timeout, constants, Screenshot, Alerter,
                     Hosting, HostingOvhConfig, User, ConverterService, Navigator,
                     HostingTask, HostingDatabase, PrivateDatabase) {
            this.$scope = $scope;
            this.$stateParams = $stateParams;
            this.$q = $q;
            this.$timeout = $timeout;
            this.constants = constants;
            this.Screenshot = Screenshot;
            this.Alerter = Alerter;
            this.Hosting = Hosting;
            this.HostingOvhConfig = HostingOvhConfig;
            this.User = User;
            this.ConverterService = ConverterService;
            this.Navigator = Navigator;
            this.HostingTask = HostingTask;
            this.HostingDatabase = HostingDatabase;
            this.PrivateDatabase = PrivateDatabase;

            this.loading = {
                screenshot: true
            };

            this.showPrivateDbList = false;

            this.productId = null;
            this.hosting = null;
            this.ovhConfig = null;
            this.phpVersionSupport = null;
            this.userLogsToken = null;
            this.flushCdnState = "";
        }

        $onInit () {
            this.productId = this.$stateParams.productId;
            this.hosting = this.$scope.hosting;
            this.hostingProxy = this.$scope.hostingProxy;

            this.screenshot = this.Screenshot.getScreenshot(this.productId)
                .finally(() => {
                    this.loading.screenshot = false;
                });

            this.$scope.$on(this.HostingOvhConfig.events.ovhConfigNeedRefresh, () => {
                this.loadOvhConfig();
            });

            this.$scope.$on("hosting.cdn.flush.refresh", () => {
                this.checkFlushCdnState();
            });

            this.$scope.$on("hosting.database.privateDb", () => {
                this.checkPrivateDbState();
            });

            this.$scope.convertBytesSize = this.ConverterService.convertBytesSize.bind(this.ConverterService);
            this.$scope.goToPrivateDb = () => this.goToPrivateDb();
            this.$scope.getStateBadgeClass = () => this.getStateBadgeClass();

            this.$scope.ftp = this.hostingProxy.serviceManagementAccess.ftp;
            this.$scope.ftpUrl = `ftp://${this.hostingProxy.serviceManagementAccess.ftp.url}:${this.hostingProxy.serviceManagementAccess.ftp.port}/`;
            this.$scope.http = this.hostingProxy.serviceManagementAccess.http;
            this.$scope.httpUrl = `http://${this.hostingProxy.serviceManagementAccess.http.url}:${this.hostingProxy.serviceManagementAccess.http.port}/`;
            this.$scope.ssh = this.hostingProxy.serviceManagementAccess.ssh;
            this.$scope.sshUrl = `ssh://${this.hostingProxy.serviceManagementAccess.ssh.url}:${this.hostingProxy.serviceManagementAccess.ssh.port}/`;

            this.HostingOvhConfig.ovhConfigRefresh(this.productId)
                .finally(() => this.loadOvhConfig());

            this.getGuides();
            this.getUrchin();
            this.getPrivateDatabasesLinked();
            this.getUserLogsToken();
            this.loadSsl();
            this.checkFlushCdnState();
            this.checkPrivateDbState();
            this.getOfferPrivateDbInfo();
        }

        $onDestroy () {
            this.Hosting.killPollFlushCdn();
            this.Hosting.killPollPrivateDb();
        }

        getGuides () {
            this.User.getUrlOf("guides")
                .then((guides) => {
                    if (!guides) {
                        return;
                    }

                    // GLOBAL ALERT TO UPGRADE APACHE
                    if (_.indexOf(this.hosting.updates, "APACHE24") >= 0) {
                        this.$timeout(() => {
                            this.Alerter.alertFromSWS(this.$scope.tr("hosting_global_php_version_pending_update_apache",
                                                                     [guides.works.apache, "http://travaux.ovh.net/?do=details&id=25601"]),
                                                      null,
                                                      this.$scope.alerts.tabs);
                        }, 100);
                    }

                    switch (this.hosting.serviceState) {
                    case "BLOQUED":
                        if (guides.hostingHackState) {
                            this.guideHostingState = guides.hostingHackState;
                        }
                        break;
                    case "MAINTENANCE":
                        if (guides.hostingDisabledState) {
                            this.guideHostingState = guides.hostingDisabledState;
                        }
                        break;
                    default:
                        break;
                    }
                });
        }

        getUrchin () {
            if (this.hostingProxy && this.hostingProxy.cluster && parseInt(this.hostingProxy.cluster.split("cluster")[1], 10) >= 20) { // FOR GRAVELINE
                this.urchin = URI.expand(this.constants.urchin_gra, {
                    serviceName: this.hosting.serviceName,
                    cluster: this.hostingProxy.cluster
                }).toString();
            } else {
                this.urchin = URI.expand(this.constants.urchin, {
                    serviceName: this.hosting.serviceName,
                    cluster: this.hostingProxy.cluster
                }).toString();
            }
        }

        getPrivateDatabasesLinked () {
            this.Hosting.getPrivateDatabasesLinked(this.productId)
                .then((databasesId) =>
                    this.$q.all(_.map(databasesId, (dbName) =>
                            this.isAdminPrivateDb(dbName).then((isAdmin) => ({
                                name: dbName,
                                isAdmin
                            })))))
                .then((databases) => (this.privateDatabasesLinked = databases))
                .catch((err) => this.Alerter.error(err));
        }

        isAdminPrivateDb (privateDb) {
            let userInfos;
            return this.User.getUser()
                .then((user) => {
                    userInfos = user;
                })
                .then(() => this.PrivateDatabase.getServiceInfos(privateDb))
                .then((privateDbInfo) => _.some([privateDbInfo.contactBilling, privateDbInfo.contactTech, privateDbInfo.contactAdmin],
                                                (contactName) => userInfos.nichandle === contactName))
                .catch((err) => {
                    this.Alerter.alertFromSWS(this.$scope.tr("common_serviceinfos_error", [privateDb]), err, this.$scope.alerts.main);
                    return false;
                });
        }

        loadOvhConfig () {
            this.HostingOvhConfig.getCurrent(this.productId).then((ovhConfig) => {
                this.ovhConfig = _.merge(ovhConfig, {
                    taskPending: _.get(this.ovhConfig, "taskPending", false),
                    taskPendingError: _.get(this.ovhConfig, "taskPendingError", false)
                });

                this.phpVersionSupport = this.getPhpVersionSupport(this.ovhConfig.engineVersion);

                this.refreshPendingTasks();
                this.refreshErrorTasks();
            });
        }

        refreshPendingTasks () {
            this.HostingTask.getPending(this.productId)
                .then((tasks) => {
                    let queue;
                    if (tasks && tasks.length > 0) {
                        const taskPendingMessage = this.$scope.i18n[`hosting_global_php_version_pending_task_${tasks[0].function.replace(/ovhConfig\//, "")}`];
                        _.set(this.ovhConfig, "taskPending", taskPendingMessage || this.$scope.i18n.hosting_global_php_version_pending_task_common);

                        queue = _.map(tasks, (task) =>
                            this.HostingTask.poll(this.productId, task).catch(() => {
                                _.set(this.ovhConfig, "taskPendingError", false);
                            })
                        );

                        this.$q.all(queue).then(() => {
                            this.loadOvhConfig();
                        });
                    } else {
                        _.set(this.ovhConfig, "taskPending", false);
                    }
                }).catch(() => {
                    _.set(this.ovhConfig, "taskPending", false);
                });
        }

        refreshErrorTasks () {
            this.HostingTask.getError(this.productId)
                .then((tasks) => {
                    if (this.ovhConfig) {
                        if (tasks && tasks.length > 0) {
                            const taskErrorMessage = this.$scope.i18n[`hosting_global_php_version_pending_task_error_${tasks[0].function.replace(/ovhConfig\//, "")}`];
                            _.set(this.ovhConfig, "taskPendingError", taskErrorMessage || this.$scope.i18n.hosting_global_php_version_pending_task_error_common);
                        } else {
                            _.set(this.ovhConfig, "taskPendingError", false);
                        }
                    }
                }).catch(() => {
                    _.set(this.ovhConfig, "taskPendingError", false);
                });
        }

        getPhpVersionSupport (engineVersion) {
            return _.find(this.hosting.phpVersions, (version) => {
                if (!~version.version.indexOf(".")) {
                    version.version = `${version.version}.0`;
                }
                return version.version === engineVersion;
            });
        }

        getUserLogsToken () {
            this.Hosting.getUserLogsToken(this.productId, {
                params: {
                    remoteCheck: true,
                    ttl: 3600
                }
            }).then((token) => {
                this.userLogsToken = token;
            });
        }

        loadSsl () {
            this.Hosting.getSslState(this.productId).then((ssl) => {
                this.ssl = ssl;
            });
        }

        canOrderSSL () {
            return !this.$scope.hosting.hasHostedSsl && this.$scope.ssl == null;
        }

        alreadyHasSSL () {
            return this.$scope.ssl != null && this.$scope.ssl.status !== "creating" && this.$scope.ssl.status !== "deleting" && this.$scope.ssl.status !== "regenerating";
        }

        canRegenerateSSL () {
            return this.alreadyHasSSL() && this.$scope.ssl.regenerable && this.$scope.ssl.provider !== "COMODO";
        }

        canDeleteSSL () {
            // hasHostedSsl is true only for legacy SSL offers
            // the new system is through the ssl API
            return _.get(this, "$scope.hosting.hasHostedSsl") || this.alreadyHasSSL();
        }

        checkFlushCdnState () {
            this.flushCdnState = "check";
            this.Hosting.checkTaskUnique(this.productId, "web/flushCache").then((taskIds) => {
                if (taskIds && taskIds.length) {
                    this.flushCdnState = "doing";
                    this.$rootScope.$broadcast(this.Hosting.events.tasksChanged);
                    this.Hosting.pollFlushCdn(this.productId, taskIds).then(() => {
                        this.$rootScope.$broadcast(this.Hosting.events.tasksChanged);
                        this.flushCdnState = "ok";
                        this.Alerter.success(this.$scope.tr("hosting_dashboard_cdn_flush_done_success"), this.$scope.alerts.main);
                    });
                } else {
                    this.flushCdnState = "ok";
                }
            });
        }

        checkPrivateDbState () {
            this.privateDbState = "check";
            this.Hosting.checkTaskUnique(this.productId, "hosting/activate/privateDatabase").then((taskIds) => {
                if (taskIds && taskIds.length) {
                    this.privateDbState = "doing";
                    this.Hosting.pollPrivateDb(this.productId, taskIds).then(() => {
                        this.privateDbState = "ok";
                        this.Alerter.success(this.$scope.tr("hosting_dashboard_database_active_success_done"));
                    });
                } else {
                    this.privateDbState = "ok";
                }
            });
        }

        goToPrivateDb (privateDb) {
            this.$rootScope.$broadcast("leftNavigation.selectProduct.fromName", {
                name: privateDb,
                type: "PRIVATE_DATABASE"
            });
            this.Navigator.navigate(`configuration/private_database/${privateDb}`);
        }

        getOfferPrivateDbInfo () {
            this.hosting.privateDbInfo = {
                nbDataBaseActive: 0,
                nbDataBaseInclude: 0
            };

            this.HostingDatabase.getPrivateDatabaseCapabilities(this.productId).then((privateDbCapabilities) => {
                this.hosting.privateDbInfo.nbDataBaseInclude = this.hosting.offerCapabilities.privateDatabases.length;
                this.hosting.privateDbInfo.nbDataBaseActive = this.hosting.privateDbInfo.nbDataBaseInclude - privateDbCapabilities.length;
            });
        }

        getStateBadgeClass () {
            switch (_.get(this.$scope.hosting, "serviceState")) {
            case "ACTIVE":
                return "label-success";
            case "MAINTENANCE":
                return "label-warning";
            case "BLOQUED":
                return "label-important";
            default:
                return null;
            }
        }
    });
