angular.module('App').controller(
  'DomainGeneralInformationsWhoisCtrl',
  class DomainGeneralInformationsWhoisCtrl {
    constructor() {
      this.contacts = {
        owner: { showEmail: false, showCoordinates: false },
        admin: { showEmail: false, showCoordinates: false },
        tech: { showEmail: false, showCoordinates: false },
      };
      this.contactTypes = _.keys(this.contacts);
    }

    validate() {

    }
  },
);
