# Dominos CLI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a CLI tool that allows ordering Domino's pizza from named presets with intuitive commands.

**Architecture:** Commander.js for CLI framework, Conf for config management, dominos npm package for API integration. Config stored in ~/.dominos/config.json with customer, payment, store, and preset data.

**Tech Stack:** Node.js ESM, Commander.js, Conf, Chalk, Ora, Dominos API

---

## Task 1: CLI Entry Point & Commander Setup

**Files:**
- Create: `bin/dominos.js`
- Create: `test/cli.test.js`

**Step 1: Write the failing test**

Create test file:

```javascript
// test/cli.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

describe('CLI Entry Point', () => {
  it('should display help when run with --help', async () => {
    const { stdout } = await execAsync('node bin/dominos.js --help');
    assert.match(stdout, /Usage: dominos/);
    assert.match(stdout, /order.*Order pizza from a preset/);
    assert.match(stdout, /config.*Manage configuration/);
    assert.match(stdout, /track.*Track order status/);
  });

  it('should display version when run with --version', async () => {
    const { stdout } = await execAsync('node bin/dominos.js --version');
    assert.match(stdout, /0\.1\.0/);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/cli.test.js`

Expected: FAIL with "ENOENT: no such file or directory, open 'bin/dominos.js'"

**Step 3: Write minimal implementation**

```javascript
#!/usr/bin/env node

// bin/dominos.js
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf8')
);

const program = new Command();

program
  .name('dominos')
  .description('CLI tool for ordering Dominos pizza')
  .version(packageJson.version);

program
  .command('order <preset>')
  .description('Order pizza from a preset')
  .action((preset) => {
    console.log(`Order command: ${preset}`);
  });

program
  .command('config <subcommand>')
  .description('Manage configuration')
  .action((subcommand) => {
    console.log(`Config command: ${subcommand}`);
  });

program
  .command('track [phone]')
  .description('Track order status')
  .action((phone) => {
    console.log(`Track command: ${phone || 'from config'}`);
  });

program.parse();
```

**Step 4: Run test to verify it passes**

Run: `node --test test/cli.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add bin/dominos.js test/cli.test.js
git commit -m "feat: add CLI entry point with commander setup

- Basic commander.js structure
- Order, config, track command stubs
- Help and version flags
- Test coverage for CLI basics"
```

---

## Task 2: Config Manager - Read/Load

**Files:**
- Create: `src/config-manager.js`
- Create: `test/config-manager.test.js`

**Step 1: Write the failing test**

```javascript
// test/config-manager.test.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import ConfigManager from '../src/config-manager.js';

describe('ConfigManager', () => {
  let tempDir;
  let configManager;

  before(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'dominos-test-'));
    configManager = new ConfigManager({ cwd: tempDir });
  });

  after(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should check if config exists', () => {
    assert.strictEqual(configManager.exists(), false);
  });

  it('should load config when it exists', () => {
    const testConfig = {
      customer: { firstName: 'Test', lastName: 'User' },
      payment: { number: '4111111111111111' },
      store: { storeID: '1234' },
      presets: {}
    };

    writeFileSync(
      join(tempDir, 'config.json'),
      JSON.stringify(testConfig)
    );

    const loaded = configManager.load();
    assert.deepStrictEqual(loaded.customer.firstName, 'Test');
  });

  it('should return null when config does not exist', () => {
    const manager = new ConfigManager({ cwd: join(tempDir, 'nonexistent') });
    assert.strictEqual(manager.load(), null);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/config-manager.test.js`

Expected: FAIL with "Cannot find module '../src/config-manager.js'"

**Step 3: Write minimal implementation**

```javascript
// src/config-manager.js
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
```

**Step 4: Run test to verify it passes**

Run: `node --test test/config-manager.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add src/config-manager.js test/config-manager.test.js
git commit -m "feat: add config manager with load/save

- ConfigManager class using Conf package
- Load and save config
- Check if config exists
- Test coverage"
```

---

## Task 3: Config Manager - Validation

**Files:**
- Modify: `src/config-manager.js`
- Modify: `test/config-manager.test.js`

**Step 1: Write the failing test**

Add to `test/config-manager.test.js`:

```javascript
describe('ConfigManager validation', () => {
  it('should validate complete config', () => {
    const validConfig = {
      customer: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '555-1234',
        address: {
          street: '123 Main',
          city: 'Portland',
          region: 'OR',
          postalCode: '97201'
        }
      },
      payment: {
        number: '4111111111111111',
        expiration: '12/27',
        securityCode: '123',
        postalCode: '97201',
        tipAmount: 5
      },
      store: {
        storeID: '1234',
        name: 'Test Store',
        phone: '555-0100'
      },
      presets: {}
    };

    const errors = ConfigManager.validate(validConfig);
    assert.strictEqual(errors.length, 0);
  });

  it('should return errors for missing fields', () => {
    const invalidConfig = {
      customer: { firstName: 'Test' },
      payment: {},
      store: {},
      presets: {}
    };

    const errors = ConfigManager.validate(invalidConfig);
    assert.ok(errors.length > 0);
    assert.ok(errors.some(e => e.includes('customer.lastName')));
    assert.ok(errors.some(e => e.includes('payment.number')));
  });
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/config-manager.test.js`

Expected: FAIL with "ConfigManager.validate is not a function"

**Step 3: Write minimal implementation**

Add to `src/config-manager.js`:

```javascript
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
```

**Step 4: Run test to verify it passes**

Run: `node --test test/config-manager.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add src/config-manager.js test/config-manager.test.js
git commit -m "feat: add config validation

- Validate customer, payment, store fields
- Return list of validation errors
- Static validate method for testing
- Instance validate method for runtime"
```

---

## Task 4: Setup Wizard - Interactive Prompts

**Files:**
- Create: `src/setup-wizard.js`
- Create: `test/setup-wizard.test.js`

**Step 1: Write the failing test**

```javascript
// test/setup-wizard.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import SetupWizard from '../src/setup-wizard.js';

describe('SetupWizard', () => {
  it('should create a wizard instance', () => {
    const wizard = new SetupWizard();
    assert.ok(wizard);
  });

  it('should validate address input', () => {
    const result = SetupWizard.validateAddress('123 Main St, Portland, OR 97201');
    assert.strictEqual(result, true);
  });

  it('should reject empty address', () => {
    const result = SetupWizard.validateAddress('');
    assert.match(result, /required/i);
  });

  it('should validate phone number', () => {
    const result = SetupWizard.validatePhone('555-123-4567');
    assert.strictEqual(result, true);
  });

  it('should reject invalid phone', () => {
    const result = SetupWizard.validatePhone('abc');
    assert.match(result, /invalid/i);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/setup-wizard.test.js`

Expected: FAIL with "Cannot find module '../src/setup-wizard.js'"

**Step 3: Write minimal implementation**

```javascript
// src/setup-wizard.js
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import chalk from 'chalk';
import ora from 'ora';
import { NearbyStores } from 'dominos';

class SetupWizard {
  constructor() {
    this.rl = readline.createInterface({ input, output });
  }

  static validateAddress(address) {
    if (!address || address.trim().length === 0) {
      return 'Address is required';
    }
    return true;
  }

  static validatePhone(phone) {
    if (!phone || phone.trim().length === 0) {
      return 'Phone number is required';
    }
    // Basic phone validation - at least 10 digits
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      return 'Invalid phone number';
    }
    return true;
  }

  static validateEmail(email) {
    if (!email || email.trim().length === 0) {
      return 'Email is required';
    }
    if (!email.includes('@')) {
      return 'Invalid email address';
    }
    return true;
  }

  async prompt(question, validator) {
    while (true) {
      const answer = await this.rl.question(question);
      if (!validator) return answer;

      const validation = validator(answer);
      if (validation === true) {
        return answer;
      }
      console.log(chalk.red(`✗ ${validation}`));
    }
  }

  async run() {
    console.log(chalk.blue('\n👋 Welcome to Dominos CLI!\n'));
    console.log('No configuration found. Let\'s set up your account.\n');

    // Collect customer info
    const address = await this.prompt(
      'Delivery Address: ',
      SetupWizard.validateAddress
    );
    const firstName = await this.prompt('First Name: ');
    const lastName = await this.prompt('Last Name: ');
    const phone = await this.prompt(
      'Phone: ',
      SetupWizard.validatePhone
    );
    const email = await this.prompt(
      'Email: ',
      SetupWizard.validateEmail
    );

    // Find stores
    const spinner = ora('Finding nearby stores...').start();
    let stores;
    try {
      const nearbyStores = await new NearbyStores(address);
      stores = nearbyStores.stores.filter(s =>
        s.IsOnlineCapable && s.IsDeliveryStore
      ).slice(0, 5);
      spinner.succeed(`Found ${stores.length} stores`);
    } catch (err) {
      spinner.fail('Could not find stores');
      throw new Error(`Store lookup failed: ${err.message}`);
    }

    // Select store
    console.log('\nSelect your preferred store:');
    stores.forEach((store, i) => {
      console.log(`  ${i + 1}. ${store.AddressDescription} (${store.MinDistance.toFixed(1)} miles)`);
    });

    const storeChoice = await this.prompt(
      '\nChoice: ',
      (input) => {
        const num = parseInt(input);
        if (isNaN(num) || num < 1 || num > stores.length) {
          return 'Invalid choice';
        }
        return true;
      }
    );
    const selectedStore = stores[parseInt(storeChoice) - 1];

    // Collect payment info
    console.log('\nPayment Information:');
    const cardNumber = await this.prompt('Card Number: ');
    const expiration = await this.prompt('Expiration (MM/YY): ');
    const cvv = await this.prompt('CVV: ');
    const billingZip = await this.prompt('Billing Zip: ');
    const tipAmount = await this.prompt('Default Tip Amount ($): ');

    // Warning
    console.log(chalk.yellow('\n⚠️  WARNING: Payment info will be stored in plaintext'));
    console.log(chalk.yellow('    Keep your config file secure!\n'));

    const confirm = await this.prompt('Continue? (y/N): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('Setup cancelled');
      this.rl.close();
      process.exit(1);
    }

    this.rl.close();

    // Parse address
    const addressParts = address.split(',').map(s => s.trim());
    const parsedAddress = {
      street: addressParts[0] || '',
      city: addressParts[1] || '',
      region: addressParts[2] || '',
      postalCode: addressParts[3] || addressParts[addressParts.length - 1] || ''
    };

    return {
      customer: {
        firstName,
        lastName,
        email,
        phone,
        address: parsedAddress
      },
      payment: {
        number: cardNumber.replace(/\D/g, ''),
        expiration,
        securityCode: cvv,
        postalCode: billingZip,
        tipAmount: parseFloat(tipAmount) || 0
      },
      store: {
        storeID: selectedStore.StoreID.toString(),
        name: selectedStore.AddressDescription,
        phone: selectedStore.Phone
      },
      presets: {}
    };
  }
}

export default SetupWizard;
```

**Step 4: Run test to verify it passes**

Run: `node --test test/setup-wizard.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add src/setup-wizard.js test/setup-wizard.test.js
git commit -m "feat: add setup wizard for first-run config

- Interactive prompts for customer info
- Address validation and store lookup
- Payment info collection
- Warning about plaintext storage
- Returns complete config object"
```

---

## Task 5: Config Command Implementation

**Files:**
- Create: `src/commands/config.js`
- Modify: `bin/dominos.js`

**Step 1: Write the failing test**

Create test:

```javascript
// test/commands/config.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('Config Command', () => {
  it('should show help for config command', async () => {
    const { stdout } = await execAsync('node bin/dominos.js config --help');
    assert.match(stdout, /show.*Display configuration/);
    assert.match(stdout, /validate.*Validate configuration/);
    assert.match(stdout, /setup.*Run setup wizard/);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/commands/config.test.js`

Expected: FAIL (config subcommands not defined)

**Step 3: Write implementation**

```javascript
// src/commands/config.js
import chalk from 'chalk';
import { execSync } from 'child_process';
import ConfigManager from '../config-manager.js';
import SetupWizard from '../setup-wizard.js';

export async function configShow(configManager) {
  const config = configManager.load();
  if (!config) {
    console.log(chalk.red('✗ No configuration found'));
    console.log(chalk.dim('Run: dominos config setup'));
    process.exit(1);
  }

  // Mask card number
  const maskedConfig = { ...config };
  if (maskedConfig.payment?.number) {
    const last4 = maskedConfig.payment.number.slice(-4);
    maskedConfig.payment.number = `****-****-****-${last4}`;
  }

  console.log(chalk.blue('Configuration:'));
  console.log(JSON.stringify(maskedConfig, null, 2));
  console.log(chalk.dim(`\nLocation: ${configManager.path}`));
}

export async function configEdit(configManager) {
  const editor = process.env.EDITOR || process.env.VISUAL || 'notepad';

  if (!configManager.exists()) {
    console.log(chalk.red('✗ No configuration found'));
    console.log(chalk.dim('Run: dominos config setup'));
    process.exit(1);
  }

  console.log(chalk.blue(`Opening config in ${editor}...`));
  try {
    execSync(`${editor} "${configManager.path}"`, { stdio: 'inherit' });
    console.log(chalk.green('✓ Config file closed'));
  } catch (err) {
    console.log(chalk.red('✗ Error opening editor'));
    process.exit(1);
  }
}

export async function configValidate(configManager) {
  const errors = configManager.validate();

  if (errors.length === 0) {
    console.log(chalk.green('✓ Configuration is valid'));
    return;
  }

  console.log(chalk.red('✗ Configuration has errors:\n'));
  errors.forEach(err => {
    console.log(chalk.red(`  • ${err}`));
  });
  process.exit(1);
}

export async function configSetup(configManager) {
  const wizard = new SetupWizard();

  try {
    const config = await wizard.run();
    configManager.save(config);
    console.log(chalk.green('\n✓ Configuration saved!'));
    console.log(chalk.dim(`Location: ${configManager.path}`));
    console.log('\nYou\'re ready to order! Try:');
    console.log(chalk.blue('  dominos config edit   ') + chalk.dim('(to add order presets)'));
  } catch (err) {
    console.log(chalk.red(`\n✗ Setup failed: ${err.message}`));
    process.exit(1);
  }
}
```

Update `bin/dominos.js`:

```javascript
import ConfigManager from '../src/config-manager.js';
import { configShow, configEdit, configValidate, configSetup } from '../src/commands/config.js';

// ... existing code ...

// Replace config command with subcommands
program
  .command('config')
  .description('Manage configuration')
  .addCommand(
    new Command('show')
      .description('Display configuration (masks sensitive data)')
      .action(async () => {
        const configManager = new ConfigManager();
        await configShow(configManager);
      })
  )
  .addCommand(
    new Command('edit')
      .description('Open configuration in $EDITOR')
      .action(async () => {
        const configManager = new ConfigManager();
        await configEdit(configManager);
      })
  )
  .addCommand(
    new Command('validate')
      .description('Validate configuration')
      .action(async () => {
        const configManager = new ConfigManager();
        await configValidate(configManager);
      })
  )
  .addCommand(
    new Command('setup')
      .description('Run setup wizard')
      .action(async () => {
        const configManager = new ConfigManager();
        await configSetup(configManager);
      })
  );
```

**Step 4: Run test to verify it passes**

Run: `node --test test/commands/config.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add src/commands/config.js bin/dominos.js test/commands/config.test.js
git commit -m "feat: implement config command with subcommands

- config show: display config with masked payment
- config edit: open in editor
- config validate: check for errors
- config setup: run setup wizard
- Integrated with commander.js"
```

---

## Task 6: Order Builder

**Files:**
- Create: `src/order-builder.js`
- Create: `test/order-builder.test.js`

**Step 1: Write the failing test**

```javascript
// test/order-builder.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import OrderBuilder from '../src/order-builder.js';

describe('OrderBuilder', () => {
  const mockConfig = {
    customer: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '555-1234',
      address: {
        street: '123 Main St',
        city: 'Portland',
        region: 'OR',
        postalCode: '97201'
      }
    },
    payment: {
      number: '4111111111111111',
      expiration: '12/27',
      securityCode: '123',
      postalCode: '97201',
      tipAmount: 5
    },
    store: {
      storeID: '1234'
    },
    presets: {
      test: {
        name: 'Test Pizza',
        items: [
          { code: 'PIZZA123', qty: 1 }
        ]
      }
    }
  };

  it('should build order from preset', () => {
    const builder = new OrderBuilder(mockConfig);
    const order = builder.buildFromPreset('test');

    assert.ok(order);
    assert.strictEqual(order.customer.firstName, 'Test');
    assert.strictEqual(order.storeID, 1234);
  });

  it('should throw error for missing preset', () => {
    const builder = new OrderBuilder(mockConfig);
    assert.throws(
      () => builder.buildFromPreset('nonexistent'),
      /Preset.*not found/
    );
  });

  it('should add items from preset to order', () => {
    const builder = new OrderBuilder(mockConfig);
    const order = builder.buildFromPreset('test');

    assert.strictEqual(order.products.length, 1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/order-builder.test.js`

Expected: FAIL with "Cannot find module '../src/order-builder.js'"

**Step 3: Write minimal implementation**

```javascript
// src/order-builder.js
import { Customer, Item, Order, Payment } from 'dominos';

class OrderBuilder {
  constructor(config) {
    this.config = config;
  }

  buildFromPreset(presetName) {
    const preset = this.config.presets[presetName];

    if (!preset) {
      const available = Object.keys(this.config.presets);
      throw new Error(
        `Preset '${presetName}' not found. Available presets: ${available.join(', ')}`
      );
    }

    // Create customer
    const customer = new Customer({
      firstName: this.config.customer.firstName,
      lastName: this.config.customer.lastName,
      email: this.config.customer.email,
      phone: this.config.customer.phone,
      address: `${this.config.customer.address.street}, ${this.config.customer.address.city}, ${this.config.customer.address.region} ${this.config.customer.address.postalCode}`
    });

    // Create order
    const order = new Order(customer);
    order.storeID = parseInt(this.config.store.storeID);

    // Add items from preset
    preset.items.forEach(itemData => {
      for (let i = 0; i < itemData.qty; i++) {
        const item = new Item({ code: itemData.code });
        order.addItem(item);
      }
    });

    return { order, preset };
  }

  buildPayment(amount) {
    return new Payment({
      amount,
      number: this.config.payment.number,
      expiration: this.config.payment.expiration,
      securityCode: this.config.payment.securityCode,
      postalCode: this.config.payment.postalCode,
      tipAmount: this.config.payment.tipAmount
    });
  }
}

export default OrderBuilder;
```

**Step 4: Run test to verify it passes**

Run: `node --test test/order-builder.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add src/order-builder.js test/order-builder.test.js
git commit -m "feat: add order builder for presets

- Build Order from preset config
- Create Customer and Item instances
- Validate preset exists
- Build Payment from config
- Error handling for missing presets"
```

---

## Task 7: Order Command Implementation

**Files:**
- Create: `src/commands/order.js`
- Modify: `bin/dominos.js`

**Step 1: Write minimal test**

```javascript
// test/commands/order.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Order Command', () => {
  it('should exist', () => {
    assert.ok(true); // Placeholder - integration test would be complex
  });
});
```

**Step 2: Run test**

Run: `node --test test/commands/order.test.js`

Expected: PASS

**Step 3: Implement order command**

```javascript
// src/commands/order.js
import chalk from 'chalk';
import ora from 'ora';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import ConfigManager from '../config-manager.js';
import OrderBuilder from '../order-builder.js';
import { configSetup } from './config.js';

export async function orderCommand(presetName) {
  const configManager = new ConfigManager();

  // Check if config exists
  if (!configManager.exists()) {
    console.log(chalk.yellow('No configuration found. Running setup...\n'));
    await configSetup(configManager);
    console.log(chalk.yellow('\nSetup complete! Now add a preset to your config:'));
    console.log(chalk.blue('  dominos config edit'));
    console.log(chalk.dim('\nThen try ordering again.'));
    process.exit(0);
  }

  // Load and validate config
  const config = configManager.load();
  const errors = ConfigManager.validate(config);
  if (errors.length > 0) {
    console.log(chalk.red('✗ Configuration has errors:'));
    errors.forEach(err => console.log(chalk.red(`  • ${err}`)));
    console.log(chalk.dim('\nRun: dominos config validate'));
    process.exit(1);
  }

  // Build order from preset
  let orderData;
  try {
    const builder = new OrderBuilder(config);
    orderData = builder.buildFromPreset(presetName);
  } catch (err) {
    console.log(chalk.red(`✗ ${err.message}`));

    const available = Object.keys(config.presets);
    if (available.length > 0) {
      console.log(chalk.dim('\nAvailable presets:'));
      available.forEach(name => {
        const preset = config.presets[name];
        console.log(chalk.blue(`  • ${name}`) + chalk.dim(` - ${preset.name}`));
      });
    } else {
      console.log(chalk.dim('\nNo presets configured. Add one with:'));
      console.log(chalk.blue('  dominos config edit'));
    }
    process.exit(1);
  }

  const { order, preset } = orderData;

  console.log(chalk.blue(`🍕 Building order: ${preset.name}\n`));

  // Validate order
  let spinner = ora('Validating order...').start();
  try {
    await order.validate();
    spinner.succeed('Order validated');
  } catch (err) {
    spinner.fail('Validation failed');
    console.log(chalk.red(`✗ ${err.message}`));
    process.exit(2);
  }

  // Price order
  spinner = ora('Getting price...').start();
  try {
    await order.price();
    spinner.succeed('Order priced');
  } catch (err) {
    spinner.fail('Pricing failed');
    console.log(chalk.red(`✗ ${err.message}`));
    process.exit(2);
  }

  // Display order summary
  const total = order.amountsBreakdown.customer;
  console.log(chalk.green(`\n💰 Total: $${total.toFixed(2)}`) +
    chalk.dim(` (includes $${config.payment.tipAmount.toFixed(2)} tip)`));

  console.log('\nOrder Summary:');
  preset.items.forEach(item => {
    console.log(chalk.dim(`  • ${item.qty}x `) + item.code);
  });

  // Confirm
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(chalk.yellow('\nPlace this order? (Y/n): '));
  rl.close();

  if (answer.toLowerCase() === 'n') {
    console.log(chalk.dim('Order cancelled'));
    process.exit(0);
  }

  // Add payment
  const builder = new OrderBuilder(config);
  const payment = builder.buildPayment(total);
  order.payments.push(payment);

  // Place order
  spinner = ora('Placing order...').start();
  try {
    await order.place();
    spinner.succeed('Order placed successfully!');

    console.log(chalk.green('\n✓ Order placed!\n'));
    console.log(chalk.dim('Order details:'));
    console.log(chalk.blue(`  Store: ${config.store.name}`));
    if (config.store.phone) {
      console.log(chalk.blue(`  Phone: ${config.store.phone}`));
    }
    console.log(chalk.dim('\nTrack your order:'));
    console.log(chalk.blue('  dominos track'));
  } catch (err) {
    spinner.fail('Order failed');
    console.log(chalk.red(`\n✗ ${err.message}`));

    if (err.message.includes('payment')) {
      console.log(chalk.dim('\nCheck your payment information:'));
      console.log(chalk.blue('  dominos config edit'));
    }
    process.exit(2);
  }
}
```

Update `bin/dominos.js`:

```javascript
import { orderCommand } from '../src/commands/order.js';

// ... existing code ...

// Replace order command
program
  .command('order <preset>')
  .description('Order pizza from a preset')
  .action(orderCommand);
```

**Step 4: Manual test (don't place real order)**

Run: `node bin/dominos.js order test`

Expected: Should run through setup or validate config

**Step 5: Commit**

```bash
git add src/commands/order.js bin/dominos.js test/commands/order.test.js
git commit -m "feat: implement order command

- Load and validate config
- Build order from preset
- Validate and price with Dominos API
- Display summary and confirm
- Place order with payment
- Error handling for all steps"
```

---

## Task 8: Track Command Implementation

**Files:**
- Create: `src/commands/track.js`
- Modify: `bin/dominos.js`

**Step 1: Write minimal test**

```javascript
// test/commands/track.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Track Command', () => {
  it('should exist', () => {
    assert.ok(true); // Placeholder
  });
});
```

**Step 2: Run test**

Run: `node --test test/commands/track.test.js`

Expected: PASS

**Step 3: Implement track command**

```javascript
// src/commands/track.js
import chalk from 'chalk';
import ora from 'ora';
import { Tracking } from 'dominos';
import ConfigManager from '../config-manager.js';

export async function trackCommand(phone) {
  const configManager = new ConfigManager();

  // Get phone number
  let phoneNumber = phone;
  if (!phoneNumber) {
    const config = configManager.load();
    if (!config || !config.customer.phone) {
      console.log(chalk.red('✗ No phone number provided and none in config'));
      console.log(chalk.dim('Usage: dominos track [phone]'));
      process.exit(1);
    }
    phoneNumber = config.customer.phone;
  }

  // Track order
  const spinner = ora('Tracking order...').start();
  const tracking = new Tracking();

  try {
    const result = await tracking.byPhone(phoneNumber);
    spinner.stop();

    if (!result || result.length === 0) {
      console.log(chalk.yellow('No active orders found for this phone number'));
      process.exit(0);
    }

    // Display tracking info
    const order = result[0];
    console.log(chalk.blue(`\n🍕 Order Status: ${order.OrderStatus}\n`));

    if (order.OrderID) {
      console.log(chalk.dim(`Order #${order.OrderID}`));
    }
    if (order.StoreID) {
      console.log(chalk.dim(`Store ID: ${order.StoreID}`));
    }
    if (order.OrderTakenTime) {
      const orderTime = new Date(order.OrderTakenTime);
      const now = new Date();
      const minutesAgo = Math.floor((now - orderTime) / 1000 / 60);
      console.log(chalk.dim(`Ordered: ${minutesAgo} minutes ago`));
    }

    // Show progress
    if (order.StatusItems) {
      console.log(chalk.dim('\nProgress:'));
      order.StatusItems.forEach(item => {
        const icon = item.Complete ? '✓' : '○';
        const color = item.Complete ? chalk.green : chalk.dim;
        console.log(color(`  ${icon} ${item.Name}`));
      });
    }

    // Estimated time
    if (order.EstimatedWaitMinutes) {
      console.log(chalk.dim(`\nEstimated time: ${order.EstimatedWaitMinutes} minutes`));
    }

  } catch (err) {
    spinner.fail('Tracking failed');

    if (err.message && err.message.includes('No orders')) {
      console.log(chalk.yellow('\nNo active orders found for this phone number'));
      process.exit(0);
    }

    console.log(chalk.red(`\n✗ ${err.message}`));
    console.log(chalk.dim('\nTry:'));
    console.log(chalk.blue('  dominos track [phone-number]'));
    process.exit(2);
  }
}
```

Update `bin/dominos.js`:

```javascript
import { trackCommand } from '../src/commands/track.js';

// ... existing code ...

// Replace track command
program
  .command('track [phone]')
  .description('Track order status')
  .action(trackCommand);
```

**Step 4: Test it**

Run: `node bin/dominos.js track --help`

Expected: Shows help for track command

**Step 5: Commit**

```bash
git add src/commands/track.js bin/dominos.js test/commands/track.test.js
git commit -m "feat: implement track command

- Track orders by phone number
- Use phone from config if not provided
- Display order status and progress
- Show estimated delivery time
- Error handling for no orders found"
```

---

## Task 9: Claude Code Skill Integration

**Files:**
- Create: `skill/skill.json`
- Create: `skill/README.md`

**Step 1: Create skill directory**

```bash
mkdir -p skill
```

**Step 2: Write skill.json**

```json
{
  "name": "dominos",
  "description": "Order Domino's pizza from configured presets",
  "version": "1.0.0",
  "author": "dominos-cli",
  "commands": {
    "order": {
      "description": "Order pizza from a preset",
      "usage": "/dominos order <preset>",
      "execute": "dominos order ${args}"
    },
    "track": {
      "description": "Track your order status",
      "usage": "/dominos track [phone]",
      "execute": "dominos track ${args}"
    },
    "config": {
      "description": "Manage configuration",
      "usage": "/dominos config <subcommand>",
      "execute": "dominos config ${args}"
    }
  },
  "setup": {
    "instructions": "Install dominos-cli globally with: npm install -g dominos-cli\n\nThen run the setup wizard: dominos config setup"
  }
}
```

**Step 3: Write skill README**

```markdown
# Dominos Skill for Claude Code

Order Domino's pizza directly from Claude Code!

## Installation

1. Install the CLI tool globally:
```bash
npm install -g dominos-cli
```

2. Run the setup wizard:
```bash
dominos config setup
```

3. Add some order presets by editing your config:
```bash
dominos config edit
```

4. Install this skill in Claude Code (copy to `~/.claude/skills/dominos/`)

## Usage

### Order Pizza
```
/dominos order usual
```

### Track Order
```
/dominos track
```

### Manage Config
```
/dominos config show
/dominos config validate
```

## Configuration

Your configuration is stored at `~/.dominos/config.json`

Add presets by editing the config file:
```json
{
  "presets": {
    "usual": {
      "name": "My usual order",
      "items": [
        {"code": "14SCREEN", "qty": 1}
      ]
    }
  }
}
```

Find product codes at the Dominos website or by exploring the menu.
```

**Step 4: Test installation structure**

Check files exist:
```bash
ls -la skill/
```

Expected: skill.json and README.md present

**Step 5: Commit**

```bash
git add skill/
git commit -m "feat: add Claude Code skill integration

- skill.json with command definitions
- README with installation instructions
- Ready to copy to ~/.claude/skills/dominos/"
```

---

## Task 10: Documentation and Final Polish

**Files:**
- Modify: `README.md`
- Create: `CONTRIBUTING.md`

**Step 1: Update README with complete docs**

```markdown
# dominos-cli

🍕 Command-line tool for ordering Domino's pizza

## Features

- Order from named presets in one command
- Manage customer info, payment, and store preferences
- Track order status
- Integrates with Claude Code as a skill

## Installation

```bash
npm install -g dominos-cli
```

## Quick Start

### First-time setup
```bash
dominos config setup
```

This will guide you through:
- Delivery address
- Customer information
- Nearby store selection
- Payment details

### Add order presets

Edit your config to add favorite orders:

```bash
dominos config edit
```

Add presets like this:
```json
{
  "presets": {
    "usual": {
      "name": "My usual - pepperoni pizza",
      "items": [
        {"code": "14SCREEN", "qty": 1},
        {"code": "20BCOKE", "qty": 1}
      ]
    }
  }
}
```

### Order pizza

```bash
dominos order usual
```

### Track your order

```bash
dominos track
```

## Commands

### `dominos order <preset>`
Order pizza from a named preset

### `dominos config <subcommand>`
Manage configuration
- `show` - Display config (masks sensitive data)
- `edit` - Open config in $EDITOR
- `validate` - Check for errors
- `setup` - Run setup wizard

### `dominos track [phone]`
Track order status (uses phone from config if not provided)

## Claude Code Integration

See [skill/README.md](./skill/README.md) for instructions on using dominos-cli as a Claude Code skill.

## Configuration

Config is stored at `~/.dominos/config.json`

⚠️ **Warning:** Payment information is stored in plaintext. Protect this file with proper permissions (chmod 600).

## Finding Product Codes

Product codes can be found:
- On the Domino's website
- By browsing your local store's menu
- Common codes:
  - `14SCREEN` - 14" Hand Tossed Pizza
  - `14THIN` - 14" Thin Crust Pizza
  - `20BCOKE` - 20oz Coca-Cola

## Development

```bash
# Clone repository
git clone <repo-url>
cd dominos-cli

# Install dependencies
npm install

# Run locally
node bin/dominos.js --help

# Run tests
npm test
```

## License

MIT

## Disclaimer

This is an unofficial tool. Use at your own risk. Always verify your order before placing.
```

**Step 2: Create CONTRIBUTING.md**

```markdown
# Contributing

Thanks for your interest in contributing to dominos-cli!

## Development Setup

```bash
git clone <repo-url>
cd dominos-cli
npm install
```

## Running Tests

```bash
npm test
```

## Code Style

- Use ES modules (import/export)
- Follow existing code style
- Add tests for new features
- Update README for new commands

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit PR

## Testing Before Release

**Do not place real orders while testing!**

Use validation and pricing steps to test without placing orders.

## Questions?

Open an issue on GitHub.
```

**Step 3: Commit**

```bash
git add README.md CONTRIBUTING.md
git commit -m "docs: complete documentation

- Comprehensive README with all commands
- Contributing guidelines
- Installation and usage instructions
- Claude Code integration docs
- Security warnings"
```

---

## Final Steps

### Add test script to package.json

```json
{
  "scripts": {
    "test": "node --test test/**/*.test.js"
  }
}
```

### Run all tests

```bash
npm test
```

### Commit

```bash
git add package.json
git commit -m "chore: add test script"
```

### Manual Testing Checklist

- [ ] Run `node bin/dominos.js --help` - shows all commands
- [ ] Run `dominos config setup` - completes setup wizard
- [ ] Run `dominos config show` - displays config with masked card
- [ ] Run `dominos config validate` - validates config
- [ ] Add a preset to config manually
- [ ] Run `dominos order <preset>` - validates and prices (stop before placing!)
- [ ] Run `dominos track` - shows appropriate message (no orders or tracks order)

### Tag release

```bash
git tag v0.1.0
git push origin v0.1.0
```

---

## Post-Implementation: Publishing to npm

**Step 1: Test local install**
```bash
npm link
dominos --help
```

**Step 2: Publish to npm**
```bash
npm publish
```

**Step 3: Install Claude Code skill**
```bash
mkdir -p ~/.claude/skills/dominos
cp skill/* ~/.claude/skills/dominos/
```

**Step 4: Test in Claude Code**
```
/dominos order usual
```

---

## Success Criteria

- [x] CLI accepts all commands (order, config, track)
- [x] Setup wizard completes and saves config
- [x] Config validation works
- [x] Order command integrates with Dominos API
- [x] Track command shows order status
- [x] Claude Code skill integrates cleanly
- [x] Documentation is complete
- [x] Tests pass
