const express = require('express');
const router = express.Router();
const { createPaymentIntent, handleWebhook } = require('../controllers/paymentController');

router.post('/create-intent', createPaymentIntent);
router.post('/webhook', handleWebhook);

module.exports = router;
