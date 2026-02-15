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
