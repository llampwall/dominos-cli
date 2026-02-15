// src/order-builder.js
import { Customer, Item, Order, Payment } from 'dominos';

class OrderBuilder {
  constructor(config) {
    this.config = config;
  }

  buildFromPreset(presetName) {
    const preset = this.config.presets[presetName];

    if (!preset) {
      const available = Object.keys(this.config.presets);
      throw new Error(
        `Preset '${presetName}' not found. Available presets: ${available.join(', ')}`
      );
    }

    // Create customer
    const customer = new Customer({
      firstName: this.config.customer.firstName,
      lastName: this.config.customer.lastName,
      email: this.config.customer.email,
      phone: this.config.customer.phone,
      address: `${this.config.customer.address.street}, ${this.config.customer.address.city}, ${this.config.customer.address.region} ${this.config.customer.address.postalCode}`
    });

    // Create order
    const order = new Order(customer);
    order.customer = customer;
    order.storeID = parseInt(this.config.store.storeID);

    // Add items from preset
    preset.items.forEach(itemData => {
      for (let i = 0; i < itemData.qty; i++) {
        const item = new Item({ code: itemData.code });
        order.addItem(item);
      }
    });

    return order;
  }

  buildPayment(amount) {
    return new Payment({
      amount,
      number: this.config.payment.number,
      expiration: this.config.payment.expiration,
      securityCode: this.config.payment.securityCode,
      postalCode: this.config.payment.postalCode,
      tipAmount: this.config.payment.tipAmount
    });
  }
}

export default OrderBuilder;
