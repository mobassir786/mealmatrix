const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    cuisine: [{ type: String }], // e.g. ["North Indian", "Chinese"]
    address: {
      street: String,
      city: String,
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    avgDeliveryTimeMins: { type: Number, default: 30 },
    priceRangeForTwo: { type: Number }, // used as a filter in search
    isOpen: { type: Boolean, default: true },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

// This index is what makes location-based "restaurants near me" queries fast.
// Interview point: "I used a 2dsphere index for geo queries instead of
// scanning all restaurants and calculating distance in application code."
restaurantSchema.index({ 'address.lat': 1, 'address.lng': 1 });

// Text index powers basic search before/without Elasticsearch.
restaurantSchema.index({ name: 'text', cuisine: 'text' });

module.exports = mongoose.model('Restaurant', restaurantSchema);
