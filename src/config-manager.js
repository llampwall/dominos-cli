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
}

export default ConfigManager;
