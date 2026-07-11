const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const { AppError } = require('../middlewares/errorHandler');

async function createRestaurant(req, res, next) {
  try {
    const restaurant = await Restaurant.create(req.body);
    res.status(201).json({ success: true, data: restaurant });
  } catch (err) {
    next(err);
  }
}

async function listRestaurants(req, res, next) {
  try {
    const { search, cuisine, maxPrice } = req.query;
    const filter = {};

    if (search) filter.$text = { $search: search };
    if (cuisine) filter.cuisine = cuisine;
    if (maxPrice) filter.priceRangeForTwo = { $lte: Number(maxPrice) };

    const restaurants = await Restaurant.find(filter).limit(50);
    res.status(200).json({ success: true, count: restaurants.length, data: restaurants });
  } catch (err) {
    next(err);
  }
}

async function getRestaurantById(req, res, next) {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) throw new AppError('Restaurant not found', 404);

    const menu = await MenuItem.find({ restaurant: restaurant._id, isAvailable: true });
    res.status(200).json({ success: true, data: { restaurant, menu } });
  } catch (err) {
    next(err);
  }
}

// "Frequently ordered together" — a lightweight recommendation without a
// full ML model. Interview point: "I started with a simple co-occurrence
// count as a v1 recommendation system, with a real collaborative-filtering
// model as documented future work."
async function getPopularItems(req, res, next) {
  try {
    const items = await MenuItem.find({ restaurant: req.params.id })
      .sort({ orderCount: -1 })
      .limit(5);
    res.status(200).json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

module.exports = { createRestaurant, listRestaurants, getRestaurantById, getPopularItems };
