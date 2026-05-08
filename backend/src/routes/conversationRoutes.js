const { Router } = require('express');
const {
  getMyConversations,
  getConversationById,
  createConversation,
  deleteConversation,
  addGroupMember,
  removeGroupMember,
} = require('../controllers/conversationController');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = Router();

router.use(verifyToken);

router.get('/', getMyConversations);
router.post('/', upload.single('avatar'), createConversation);
router.get('/:id', getConversationById);
router.delete('/:id', deleteConversation);
router.post('/:id/members', addGroupMember);
router.delete('/:id/members/:userId', removeGroupMember);

module.exports = router;