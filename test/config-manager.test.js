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
