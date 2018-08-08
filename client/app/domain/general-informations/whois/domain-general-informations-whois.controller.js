angular.module('App').controller(
  'DomainGeneralInformationsWhoisCtrl',
  class DomainGeneralInformationsWhoisCtrl {
    constructor() {
      const contactModel = {
        showEmail: false, // should we show email in whois?
        showCoordinates: false, // should we show other coordinates in whois?
        fieldByField: false, // should we detail coordinates (priority over 'showCoordinates' value)
        fields: { // list of coordinates to show/hide
          name: false,
          firstname: false,
          organisationName: false,
          address: false,
          tel: false,
        },
      };
      this.contactTypes = ['owner', 'admin', 'tech'];
      this.contacts = _.mapValues(_.mapKeys(this.contactTypes), () => _.cloneDeep(contactModel));
      this.fields = _.keys(contactModel.fields);
    }

    validate() {

    }
  },
);
