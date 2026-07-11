const express = require('express');
const router = express.Router();
const { createOrder, updateOrderStatus, getOrderById } = require('../controllers/orderController');
const { assignDeliveryPartner } = require('../controllers/deliveryService');
const { AppError } = require('../middlewares/errorHandler');
const Restaurant = require('../models/Restaurant');

router.post('/', createOrder);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);

// Called when a restaurant marks an order 'confirmed' — finds and locks
// the nearest available delivery partner for it.
router.post('/:id/assign-delivery', async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.body.restaurantId);
    if (!restaurant) throw new AppError('Restaurant not found', 404);

    const result = await assignDeliveryPartner(req.params.id, restaurant.address);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
