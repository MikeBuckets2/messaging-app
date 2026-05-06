const prisma = require('../config/database');
const { uploadBuffer } = require('../config/cloudinary');
const asyncHandler = require('../utils/asyncHandler');
const bcrypt = require('bcrypt');

const USER_SELECT = {
  id: true,
  username: true,
  email: true,
  avatarUrl: true,
  bio: true,
  lastSeenAt: true,
  createdAt: true,
};

const searchUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;

  if (!search || search.trim().length < 1) {
    return res.status(400).json({ message: 'A search query is required.' });
  };

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: req.user.id } },
        {
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      ],
    },
    select: USER_SELECT,
    take: 20,
  });

  res.json({ users });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: USER_SELECT,
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  };

  res.json({ user });
});

const updateMe = asyncHandler(async (req, res) => {
  const { username, bio, currentPassword, newPassword } = req.body;
  const updateData = {};

  if (username !== undefined) {
    if (username.trim().length < 2) {
      return res.status(400).json({ message: 'Username must be at least 2 characters.' });
    };
    updateData.username = username.trim();
  };

  if (bio !== undefined) {
    updateData.bio = bio.trim();
  };

  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ message: 'Current password is required to set a new one.' });
    };

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const matches = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!matches) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    };

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    };

    updateData.passwordHash = await bcrypt.hash(newPassword, 10);
  };

  if (req.file) {
    const result = await uploadBuffer(req.file.buffer, 'messaging-app/avatars');
    updateData.avatarUrl = result.secure_url;
  };

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
    select: USER_SELECT,
  });

  res.json({ user: updated });
});

const updateLastSeen = asyncHandler(async (req, res) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { lastSeenAt: new Date() },
  });

  res.json({ message: 'Last seen updated.' });
});

module.exports = { searchUsers, getUserById, updateMe, updateLastSeen };