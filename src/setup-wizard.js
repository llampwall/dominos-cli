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
