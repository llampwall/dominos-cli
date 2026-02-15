import Conf from 'conf';

class ConfigManager {
  constructor(options = {}) {
    this.conf = new Conf({
      projectName: 'dominos',
      cwd: options.cwd,
      defaults: {}
    });
  }

  exists() {
    return this.conf.size > 0;
  }

  load() {
    if (!this.exists()) {
      return null;
    }
    return this.conf.store;
  }

  save(config) {
    this.conf.store = config;
  }

  get path() {
    return this.conf.path;
  }

  static validate(config) {
    const errors = [];

    // Customer validation
    if (!config.customer) {
      errors.push('Missing customer configuration');
      return errors;
    }
    if (!config.customer.firstName) errors.push('Missing customer.firstName');
    if (!config.customer.lastName) errors.push('Missing customer.lastName');
    if (!config.customer.email) errors.push('Missing customer.email');
    if (!config.customer.phone) errors.push('Missing customer.phone');

    if (!config.customer.address) {
      errors.push('Missing customer.address');
    } else {
      if (!config.customer.address.street) errors.push('Missing customer.address.street');
      if (!config.customer.address.city) errors.push('Missing customer.address.city');
      if (!config.customer.address.region) errors.push('Missing customer.address.region');
      if (!config.customer.address.postalCode) errors.push('Missing customer.address.postalCode');
    }

    // Payment validation
    if (!config.payment) {
      errors.push('Missing payment configuration');
      return errors;
    }
    if (!config.payment.number) errors.push('Missing payment.number');
    if (!config.payment.expiration) errors.push('Missing payment.expiration');
    if (!config.payment.securityCode) errors.push('Missing payment.securityCode');
    if (!config.payment.postalCode) errors.push('Missing payment.postalCode');

    // Store validation
    if (!config.store) {
      errors.push('Missing store configuration');
      return errors;
    }
    if (!config.store.storeID) errors.push('Missing store.storeID');

    // Presets validation
    if (!config.presets || typeof config.presets !== 'object') {
      errors.push('Missing or invalid presets configuration');
    }

    return errors;
  }

  validate() {
    const config = this.load();
    if (!config) {
      return ['No configuration found'];
    }
    return ConfigManager.validate(config);
  }
}

export default ConfigManager;
