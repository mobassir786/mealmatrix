const Order = require('../models/Order');
const { AppError } = require('../middlewares/errorHandler');

// In a real deployment you'd install the `stripe` package and verify the
// webhook signature with `stripe.webhooks.constructEvent(...)`. Here we
// keep it dependency-free so this runs without needing real Stripe keys —
// swap in real Stripe verification before going to production.

// POST /api/payments/create-intent
// Frontend calls this before showing the Stripe payment form.
async function createPaymentIntent(req, res, next) {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);

    // MOCK: normally `stripe.paymentIntents.create({ amount, currency })`
    const fakePaymentIntentId = `pi_mock_${Date.now()}`;

    order.payment.paymentIntentId = fakePaymentIntentId;
    order.payment.status = 'pending';
    await order.save();

    res.status(200).json({
      success: true,
      clientSecret: `${fakePaymentIntentId}_secret`,
      amount: order.pricing.grandTotal,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/payments/webhook
// This is the endpoint Stripe calls directly (not your frontend) when a
// payment succeeds or fails. Interview point: "I never trust the frontend
// to tell me payment succeeded — only a server-to-server webhook call
// updates payment status, so a compromised or buggy client can't fake it."
async function handleWebhook(req, res, next) {
  try {
    const { type, paymentIntentId } = req.body; // real Stripe sends this nested differently

    const order = await Order.findOne({ 'payment.paymentIntentId': paymentIntentId });
    if (!order) throw new AppError('Order not found for this payment', 404);

    if (type === 'payment_intent.succeeded') {
      order.payment.status = 'paid';
      order.transitionTo('confirmed');
    } else if (type === 'payment_intent.payment_failed') {
      order.payment.status = 'failed';
    }

    await order.save();
    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPaymentIntent, handleWebhook };
