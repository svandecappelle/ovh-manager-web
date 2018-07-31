angular.module('App').controller(
  'DomainGeneralInformationsObfuscatedEmailCtrl',
  class DomainGeneralInformationsObfuscatedEmailCtrl {
    constructor() {
      this.regenerate = {
        owner: false,
        tech: false,
        billing: false,
        admin: false,
      };
    }

    canRegenerate() {
      return !_.any(this.regenerate);
    }

    regenerate() {

    }
  },
);
