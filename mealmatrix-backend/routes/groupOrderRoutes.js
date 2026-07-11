const express = require('express');
const router = express.Router();
const {
  createGroupOrder,
  joinGroupOrder,
  getGroupOrder,
  updateParticipantItems,
  lockParticipant,
  finalizeGroupOrder,
} = require('../controllers/groupOrderController');

router.post('/', createGroupOrder);
router.get('/:code', getGroupOrder);
router.post('/:code/join', joinGroupOrder);
router.patch('/:code/items', updateParticipantItems);
router.patch('/:code/lock', lockParticipant);
router.post('/:code/finalize', finalizeGroupOrder);

module.exports = router;
