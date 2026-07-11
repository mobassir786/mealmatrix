const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Order = require('../models/Order');

// Uses an in-memory MongoDB so tests don't need a real database connection.
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Order.deleteMany({});
});

function buildOrder(overrides = {}) {
  return new Order({
    customer: new mongoose.Types.ObjectId(),
    restaurant: new mongoose.Types.ObjectId(),
    items: [{ menuItem: new mongoose.Types.ObjectId(), name: 'Paneer Tikka', price: 200, quantity: 2 }],
    pricing: { itemsTotal: 400, deliveryFee: 30, tax: 20, grandTotal: 450 },
    idempotencyKey: `test-${Date.now()}-${Math.random()}`,
    ...overrides,
  });
}

describe('Order state machine', () => {
  test('allows a valid transition: placed -> confirmed', () => {
    const order = buildOrder();
    order.transitionTo('confirmed');
    expect(order.status).toBe('confirmed');
    expect(order.statusHistory.at(-1).status).toBe('confirmed');
  });

  test('rejects an invalid transition: placed -> delivered', () => {
    const order = buildOrder();
    expect(() => order.transitionTo('delivered')).toThrow(/Invalid transition/);
  });

  test('rejects transitioning out of a terminal state', () => {
    const order = buildOrder();
    order.transitionTo('confirmed');
    order.transitionTo('preparing');
    order.transitionTo('out_for_delivery');
    order.transitionTo('delivered');
    expect(() => order.transitionTo('cancelled')).toThrow(/Invalid transition/);
  });

  test('allows cancellation only from placed or confirmed', () => {
    const order = buildOrder();
    order.transitionTo('confirmed');
    order.transitionTo('cancelled');
    expect(order.status).toBe('cancelled');
  });
});

describe('Idempotency', () => {
  test('two orders cannot share the same idempotencyKey', async () => {
    const key = 'duplicate-key-test';
    await buildOrder({ idempotencyKey: key }).save();
    await expect(buildOrder({ idempotencyKey: key }).save()).rejects.toThrow();
  });
});
