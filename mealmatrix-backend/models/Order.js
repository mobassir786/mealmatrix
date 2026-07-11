const mongoose = require('mongoose');

const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true }, // snapshot at order time (price/name can change later)
    price: { type: Number, required: true }, // snapshot price, NOT a live reference
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    items: [orderItemSchema],

    pricing: {
      itemsTotal: { type: Number, required: true },
      deliveryFee: { type: Number, required: true },
      surgeFee: { type: Number, default: 0 }, // Phase 4 dynamic pricing hooks in here
      tax: { type: Number, required: true },
      grandTotal: { type: Number, required: true },
    },

    status: { type: String, enum: ORDER_STATUSES, default: 'placed' },

    // Every status change is logged here — this is what lets you show a
    // full order timeline on the tracking screen, and it's your audit trail.
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATUSES },
        at: { type: Date, default: Date.now },
      },
    ],

    deliveryLocation: {
      lat: Number,
      lng: Number,
    },

    // Prevents duplicate order creation from double-clicks or client retries.
    // Interview point: "I generate an idempotency key client-side per checkout
    // attempt; the server rejects a second insert with the same key."
    idempotencyKey: { type: String, required: true, unique: true },

    payment: {
      provider: { type: String, default: 'stripe' },
      paymentIntentId: { type: String },
      status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    },

    estimatedDeliveryAt: { type: Date },
  },
  { timestamps: true }
);

// --- The state machine itself ---
// Only these transitions are legal. Anything else throws, no matter who calls it.
const ALLOWED_TRANSITIONS = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

orderSchema.methods.transitionTo = function (newStatus) {
  const allowed = ALLOWED_TRANSITIONS[this.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid transition: ${this.status} -> ${newStatus}`);
  }
  this.status = newStatus;
  this.statusHistory.push({ status: newStatus, at: new Date() });
  return this;
};

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
module.exports.ALLOWED_TRANSITIONS = ALLOWED_TRANSITIONS;
