const { Router } = require('express');
const { getMessages, sendMessage } = require('../controllers/messageController');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = Router({ mergeParams: true });

router.use(verifyToken);

router.get('/', getMessages);
router.post('/', upload.single('image'), sendMessage);

module.exports = router;