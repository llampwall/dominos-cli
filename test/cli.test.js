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
