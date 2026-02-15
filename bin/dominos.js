#!/usr/bin/env node

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
