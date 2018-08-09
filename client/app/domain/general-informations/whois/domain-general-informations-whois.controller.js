angular.module('App').controller(
  'DomainGeneralInformationsWhoisCtrl',
  class DomainGeneralInformationsWhoisCtrl {
    constructor(domainOperationService) {
      this.DomainOperation = domainOperationService;

      this.getContactFields().then((fields) => {
        this.fields = fields;
        const contactModel = {
          showEmail: false, // should we show email in whois?
          showCoordinates: false, // should we show other coordinates in whois?
          fieldByField: false, // should we detail coordinates (priority over 'showCoordinates')
          fields: _.mapValues(_.mapKeys(fields), () => false),
        };
        this.contactTypes = ['owner', 'admin', 'tech'];
        this.contacts = _.mapValues(_.mapKeys(this.contactTypes), () => _.cloneDeep(contactModel));
      });
    }

    validate() {

    }

    getContactFields() {
      const except = ['id', 'email'];
      return this.DomainOperation.getOperationModels()
        .then(model => _.keys(model.models['contact.Contact'].properties))
        .then(fields => _.difference(fields, except));
    }
  },
);
