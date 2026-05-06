const { Router } = require('express');
const {
  getFriends,
  getFriendRequests,
  getSentRequests,
  sendFriendRequest,
  respondToRequest,
  removeFriend,
} = require('../controllers/friendController');
const { verifyToken } = require('../middleware/auth');

const router = Router();

router.use(verifyToken);

router.get('/', getFriends);
router.get('/requests', getFriendRequests);
router.get('/requests/sent', getSentRequests);
router.post('/requests', sendFriendRequest);
router.patch('/requests/:id', respondToRequest);
router.delete('/:id', removeFriend);

module.exports = router;