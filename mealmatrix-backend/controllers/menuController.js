const MenuItem = require('../models/MenuItem');
const { AppError } = require('../middlewares/errorHandler');

async function addMenuItem(req, res, next) {
  try {
    const item = await MenuItem.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

async function updateMenuItem(req, res, next) {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) throw new AppError('Menu item not found', 404);
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

async function deleteMenuItem(req, res, next) {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) throw new AppError('Menu item not found', 404);
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { addMenuItem, updateMenuItem, deleteMenuItem };
