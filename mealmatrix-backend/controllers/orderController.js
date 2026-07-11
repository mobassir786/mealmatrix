const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { AppError } = require('../middlewares/errorHandler');

// --- Pricing helper (Phase 4 dynamic pricing hooks in right here) ---
function calculatePricing(items, { isPeakHour = false } = {}) {
  const itemsTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const baseDeliveryFee = 30;
  const surgeFee = isPeakHour ? Math.round(baseDeliveryFee * 0.5) : 0; // simple 50% surge
  const tax = Math.round(itemsTotal * 0.05); // 5% GST-style tax
  const grandTotal = itemsTotal + baseDeliveryFee + surgeFee + tax;

  return { itemsTotal, deliveryFee: baseDeliveryFee, surgeFee, tax, grandTotal };
}

// POST /api/orders
// Creates an order. Idempotency key comes from the client (generated once
// per checkout attempt) so a double-click or network retry can't create
// two orders for the same cart.
async function createOrder(req, res, next) {
  try {
    const { customerId, restaurantId, items, idempotencyKey, deliveryLocation } = req.body;

    if (!idempotencyKey) throw new AppError('idempotencyKey is required', 400);

    const existing = await Order.findOne({ idempotencyKey });
    if (existing) {
      // Not an error — this IS the point of idempotency. Return the
      // already-created order instead of making a duplicate.
      return res.status(200).json({ success: true, data: existing, deduped: true });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) throw new AppError('Restaurant not found', 404);
    if (!restaurant.isOpen) throw new AppError('Restaurant is currently closed', 400);

    const hour = new Date().getHours();
    const isPeakHour = (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);
    const pricing = calculatePricing(items, { isPeakHour });

    const order = await Order.create({
      customer: customerId,
      restaurant: restaurantId,
      items,
      pricing,
      idempotencyKey,
      deliveryLocation,
      statusHistory: [{ status: 'placed', at: new Date() }],
      estimatedDeliveryAt: new Date(Date.now() + restaurant.avgDeliveryTimeMins * 60000),
    });

    // In the full build: emit an "order.placed" event here to a message
    // queue (RabbitMQ) so NotificationService and DeliveryService pick it
    // up asynchronously, instead of calling them directly from this request.

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/orders/:id/status
// This is the ONLY place order status changes. No route or script should
// ever do Order.updateOne({ status: 'delivered' }) directly.
async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { newStatus } = req.body;

    const order = await Order.findById(id);
    if (!order) throw new AppError('Order not found', 404);

    order.transitionTo(newStatus); // throws if the transition is invalid
    await order.save();

    // Broadcast the new status to anyone watching this order's tracking room.
    const io = req.app.get('io');
    if (io) {
      io.to(`order:${order._id}`).emit('status_update', {
        orderId: order._id,
        status: order.status,
      });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function getOrderById(req, res, next) {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurant', 'name address')
      .populate('deliveryPartner', 'name phone currentLocation');
    if (!order) throw new AppError('Order not found', 404);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, updateOrderStatus, getOrderById, calculatePricing };
