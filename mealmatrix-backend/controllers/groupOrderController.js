const GroupOrder = require('../models/GroupOrder');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { AppError } = require('../middlewares/errorHandler');
const { calculatePricing } = require('./orderController');

// POST /api/group-orders
// Host creates a group order for a specific restaurant. Host is
// automatically the first participant.
async function createGroupOrder(req, res, next) {
  try {
    const { hostName, restaurantId, deliveryLocation } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) throw new AppError('Restaurant not found', 404);

    const groupOrder = await GroupOrder.create({
      hostName,
      restaurant: restaurantId,
      deliveryLocation,
      participants: [{ name: hostName, items: [] }],
    });

    res.status(201).json({ success: true, data: groupOrder });
  } catch (err) {
    next(err);
  }
}

// POST /api/group-orders/:code/join
// A friend joins using the shareable code.
async function joinGroupOrder(req, res, next) {
  try {
    const { name } = req.body;
    const groupOrder = await GroupOrder.findOne({ code: req.params.code.toUpperCase() });

    if (!groupOrder) throw new AppError('Group order not found or has expired', 404);
    if (groupOrder.status !== 'open') throw new AppError('This group order is no longer open', 400);

    const alreadyJoined = groupOrder.participants.some((p) => p.name === name);
    if (!alreadyJoined) {
      groupOrder.participants.push({ name, items: [] });
      await groupOrder.save();
    }

    res.status(200).json({ success: true, data: groupOrder });
  } catch (err) {
    next(err);
  }
}

// GET /api/group-orders/:code
async function getGroupOrder(req, res, next) {
  try {
    const groupOrder = await GroupOrder.findOne({ code: req.params.code.toUpperCase() }).populate(
      'restaurant',
      'name'
    );
    if (!groupOrder) throw new AppError('Group order not found or has expired', 404);
    res.status(200).json({ success: true, data: groupOrder });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/group-orders/:code/items
// A participant updates their own item list. Sends their full item list
// each time (simpler than incremental add/remove for a demo project).
async function updateParticipantItems(req, res, next) {
  try {
    const { name, items } = req.body;
    const groupOrder = await GroupOrder.findOne({ code: req.params.code.toUpperCase() });
    if (!groupOrder) throw new AppError('Group order not found', 404);
    if (groupOrder.status !== 'open') throw new AppError('This group order is no longer open', 400);

    const participant = groupOrder.participants.find((p) => p.name === name);
    if (!participant) throw new AppError('You have not joined this group order', 404);
    if (participant.isLocked) throw new AppError('You already marked your order as done', 400);

    participant.items = items;
    await groupOrder.save();

    res.status(200).json({ success: true, data: groupOrder });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/group-orders/:code/lock
// Participant marks "I'm done adding items" — locks their list so nobody
// can edit it out from under them right before checkout.
async function lockParticipant(req, res, next) {
  try {
    const { name } = req.body;
    const groupOrder = await GroupOrder.findOne({ code: req.params.code.toUpperCase() });
    if (!groupOrder) throw new AppError('Group order not found', 404);

    const participant = groupOrder.participants.find((p) => p.name === name);
    if (!participant) throw new AppError('You have not joined this group order', 404);

    participant.isLocked = true;
    await groupOrder.save();

    res.status(200).json({ success: true, data: groupOrder });
  } catch (err) {
    next(err);
  }
}

// POST /api/group-orders/:code/finalize
// Host triggers this once everyone is locked. Merges every participant's
// items into ONE real Order — this is the actual "group ordering" payoff:
// one delivery, one delivery fee, split across everyone who joined.
// Interview point: "I reused the existing order-creation pricing logic
// instead of duplicating it, so group orders and solo orders are priced
// with identical rules."
async function finalizeGroupOrder(req, res, next) {
  try {
    const groupOrder = await GroupOrder.findOne({ code: req.params.code.toUpperCase() });
    if (!groupOrder) throw new AppError('Group order not found', 404);
    if (groupOrder.status !== 'open') throw new AppError('This group order is already finalized', 400);

    const notLocked = groupOrder.participants.filter((p) => !p.isLocked);
    if (notLocked.length > 0) {
      throw new AppError(
        `Waiting on: ${notLocked.map((p) => p.name).join(', ')} to mark their order as done`,
        400
      );
    }

    // Merge all participants' items into one flat list. Interview point:
    // "I merge by menuItem ID so if two people order the same dish, it
    // combines into one line with a summed quantity instead of duplicating."
    const merged = new Map();
    for (const participant of groupOrder.participants) {
      for (const item of participant.items) {
        const key = String(item.menuItem);
        if (merged.has(key)) {
          merged.get(key).quantity += item.quantity;
        } else {
          merged.set(key, { ...item.toObject() });
        }
      }
    }
    const mergedItems = Array.from(merged.values());

    if (mergedItems.length === 0) throw new AppError('Nobody added any items yet', 400);

    const pricing = calculatePricing(mergedItems, {});
    // Group orders split the SAME delivery fee across N people instead of
    // each person paying their own — this is the actual cost benefit that
    // makes group ordering worth using over everyone ordering separately.
    const perPersonDeliveryShare = Math.round(pricing.deliveryFee / groupOrder.participants.length);

    const order = await Order.create({
      customer: '000000000000000000000001', // demo customer — swap for real host auth later
      restaurant: groupOrder.restaurant,
      items: mergedItems,
      pricing,
      idempotencyKey: `group_${groupOrder.code}_${Date.now()}`,
      deliveryLocation: groupOrder.deliveryLocation,
      statusHistory: [{ status: 'placed', at: new Date() }],
    });

    groupOrder.status = 'finalized';
    groupOrder.finalOrder = order._id;
    await groupOrder.save();

    res.status(200).json({
      success: true,
      data: {
        order,
        perPersonDeliveryShare,
        participantCount: groupOrder.participants.length,
        breakdown: groupOrder.participants.map((p) => ({
          name: p.name,
          items: p.items,
          itemsTotal: p.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createGroupOrder,
  joinGroupOrder,
  getGroupOrder,
  updateParticipantItems,
  lockParticipant,
  finalizeGroupOrder,
};
