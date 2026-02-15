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
