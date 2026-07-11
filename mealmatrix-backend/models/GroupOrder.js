const mongoose = require('mongoose');

// Generates a short, shareable code like "AB3XZ9" — this is what a host
// shares with friends/colleagues so they can join the same group order.
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusing 0/O/1/I
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const participantItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const participantSchema = new mongoose.Schema({
  name: { type: String, required: true }, // display name — no full auth needed for demo
  items: [participantItemSchema],
  isLocked: { type: Boolean, default: false }, // "I'm done adding items"
  joinedAt: { type: Date, default: Date.now },
});

const groupOrderSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, required: true, default: generateCode },
    hostName: { type: String, required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    participants: [participantSchema],
    status: { type: String, enum: ['open', 'finalized', 'cancelled'], default: 'open' },
    deliveryLocation: { lat: Number, lng: Number },
    finalOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    // Group orders auto-expire so abandoned ones don't sit open forever —
    // interview point: "I used a TTL index so stale group orders clean
    // themselves up instead of needing a cron job."
    expiresAt: { type: Date, default: () => new Date(Date.now() + 60 * 60 * 1000) }, // 1 hour
  },
  { timestamps: true }
);

groupOrderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('GroupOrder', groupOrderSchema);
module.exports.generateCode = generateCode;
