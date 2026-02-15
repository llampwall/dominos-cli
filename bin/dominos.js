#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ConfigManager from '../src/config-manager.js';
import { configShow, configEdit, configValidate, configSetup } from '../src/commands/config.js';
import { orderCommand } from '../src/commands/order.js';

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
  .action(orderCommand);

const configCommand = program
  .command('config')
  .description('Manage configuration');

configCommand
  .command('show')
  .description('Display configuration (masks sensitive data)')
  .action(async () => {
    const configManager = new ConfigManager();
    await configShow(configManager);
  });

configCommand
  .command('edit')
  .description('Open configuration in $EDITOR')
  .action(async () => {
    const configManager = new ConfigManager();
    await configEdit(configManager);
  });

configCommand
  .command('validate')
  .description('Validate configuration')
  .action(async () => {
    const configManager = new ConfigManager();
    await configValidate(configManager);
  });

configCommand
  .command('setup')
  .description('Run setup wizard')
  .action(async () => {
    const configManager = new ConfigManager();
    await configSetup(configManager);
  });

program
  .command('track [phone]')
  .description('Track order status')
  .action((phone) => {
    console.log(`Track command: ${phone || 'from config'}`);
  });

program.parse();
