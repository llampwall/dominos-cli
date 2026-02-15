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
