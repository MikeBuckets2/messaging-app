const { Router } = require('express');
const { searchUsers, getUserById, updateMe, updateLastSeen } = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = Router();

router.use(verifyToken);

router.get('/', searchUsers);
router.get('/:id', getUserById);
router.patch('/me', upload.single('avatar'), updateMe);
router.patch('/me/last-seen', updateLastSeen);

module.exports = router;