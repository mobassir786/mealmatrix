const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String }, // "Starters", "Main Course", "Desserts"
    isVeg: { type: Boolean, default: true },
    imageUrl: { type: String },
    isAvailable: { type: Boolean, default: true },
    // Used by the "frequently ordered together" feature in Phase 2
    orderCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

menuItemSchema.index({ restaurant: 1, category: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
