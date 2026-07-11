const express = require('express');
const router = express.Router();
const {
  createRestaurant,
  listRestaurants,
  getRestaurantById,
  getPopularItems,
} = require('../controllers/restaurantController');
const { addMenuItem, updateMenuItem, deleteMenuItem } = require('../controllers/menuController');

router.post('/', createRestaurant);
router.get('/', listRestaurants); // supports ?search=&cuisine=&maxPrice=
router.get('/:id', getRestaurantById); // returns restaurant + its menu
router.get('/:id/popular-items', getPopularItems);

router.post('/:id/menu-items', (req, res, next) => {
  req.body.restaurant = req.params.id;
  addMenuItem(req, res, next);
});
router.patch('/menu-items/:id', updateMenuItem);
router.delete('/menu-items/:id', deleteMenuItem);

module.exports = router;
