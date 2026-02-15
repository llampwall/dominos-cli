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
