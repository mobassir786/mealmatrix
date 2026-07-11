const mongoose = require('mongoose');

// A single "User" model handles customers, restaurant owners, and delivery
// partners via a "role" field. This is simpler than 3 separate collections
// for a fresher/portfolio project, and is easy to explain in an interview:
// "I used a discriminator-style role field instead of separate schemas
// because the core auth fields are identical across roles."
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false }, // never returned by default
    phone: { type: String, required: true },
    role: {
      type: String,
      enum: ['customer', 'restaurant_owner', 'delivery_partner', 'admin'],
      default: 'customer',
    },
    address: {
      street: String,
      city: String,
      lat: Number,
      lng: Number,
    },
    // Only relevant if role === 'delivery_partner'
    deliveryPartnerStatus: {
      type: String,
      enum: ['offline', 'available', 'on_delivery'],
      default: 'offline',
    },
    currentLocation: {
      lat: Number,
      lng: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
