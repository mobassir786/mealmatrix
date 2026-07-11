const User = require('../models/User');
const Order = require('../models/Order');
const { AppError } = require('../middlewares/errorHandler');

// Haversine distance in km between two lat/lng points.
// Used instead of a full geo-index query here to keep this readable —
// in a bigger system you'd use MongoDB's $near operator directly.
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Finds the nearest available delivery partner to a restaurant, assigns
// them to the order, and flips their status so they can't be double-booked.
// Interview point: "I used findOneAndUpdate with a status filter as an
// atomic operation — this prevents two orders assigning the same delivery
// partner in a race condition, since MongoDB locks the document per update."
async function assignDeliveryPartner(orderId, restaurantLocation) {
  const candidates = await User.find({
    role: 'delivery_partner',
    deliveryPartnerStatus: 'available',
  }).lean();

  if (candidates.length === 0) {
    throw new AppError('No delivery partners available right now', 409);
  }

  const nearest = candidates
    .map((c) => ({
      ...c,
      distance: distanceKm(
        restaurantLocation.lat,
        restaurantLocation.lng,
        c.currentLocation?.lat || 0,
        c.currentLocation?.lng || 0
      ),
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  // Atomic: only succeeds if this partner is STILL 'available' at write time.
  // This is what prevents the race condition mentioned above.
  const lockedPartner = await User.findOneAndUpdate(
    { _id: nearest._id, deliveryPartnerStatus: 'available' },
    { deliveryPartnerStatus: 'on_delivery' },
    { new: true }
  );

  if (!lockedPartner) {
    // Someone else grabbed this partner between our read and write — retry.
    return assignDeliveryPartner(orderId, restaurantLocation);
  }

  const order = await Order.findById(orderId);
  order.deliveryPartner = lockedPartner._id;
  await order.save();

  return { order, deliveryPartner: lockedPartner };
}

// Called every few seconds by a simulated GPS ticker (or a real device in
// production) to move the delivery partner and broadcast the new position.
async function updateDeliveryPartnerLocation(userId, lat, lng, io) {
  const partner = await User.findByIdAndUpdate(
    userId,
    { currentLocation: { lat, lng } },
    { new: true }
  );

  // Find any order currently being delivered by this partner and broadcast
  // to that specific order's tracking room.
  const activeOrder = await Order.findOne({
    deliveryPartner: userId,
    status: 'out_for_delivery',
  });

  if (activeOrder && io) {
    io.to(`order:${activeOrder._id}`).emit('location_update', {
      orderId: activeOrder._id,
      lat,
      lng,
    });
  }

  return partner;
}

module.exports = { assignDeliveryPartner, updateDeliveryPartnerLocation, distanceKm };
