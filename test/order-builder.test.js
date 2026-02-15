// test/order-builder.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import OrderBuilder from '../src/order-builder.js';

describe('OrderBuilder', () => {
  const mockConfig = {
    customer: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '555-1234',
      address: {
        street: '123 Main St',
        city: 'Portland',
        region: 'OR',
        postalCode: '97201'
      }
    },
    payment: {
      number: '4111111111111111',
      expiration: '12/27',
      securityCode: '123',
      postalCode: '97201',
      tipAmount: 5
    },
    store: {
      storeID: '1234'
    },
    presets: {
      test: {
        name: 'Test Pizza',
        items: [
          { code: 'PIZZA123', qty: 1 }
        ]
      }
    }
  };

  it('should build order from preset', () => {
    const builder = new OrderBuilder(mockConfig);
    const order = builder.buildFromPreset('test');

    assert.ok(order);
    assert.strictEqual(order.customer.firstName, 'Test');
    assert.strictEqual(order.storeID, 1234);
  });

  it('should throw error for missing preset', () => {
    const builder = new OrderBuilder(mockConfig);
    assert.throws(
      () => builder.buildFromPreset('nonexistent'),
      /Preset.*not found/
    );
  });

  it('should add items from preset to order', () => {
    const builder = new OrderBuilder(mockConfig);
    const order = builder.buildFromPreset('test');

    assert.strictEqual(order.products.length, 1);
  });
});
