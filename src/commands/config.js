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
