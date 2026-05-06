const prisma = require('../config/database');
const { uploadBuffer } = require('../config/cloudinary');
const asyncHandler = require('../utils/asyncHandler');

const MESSAGE_INCLUDE = {
  sender: {
    select: { id: true, username: true, avatarUrl: true },
  },
};

const getMessages = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const { limit = 50, before, since } = req.query;

  const membership = await prisma.conversationMember.findUnique({
    where: { userId_conversationId: { userId: req.user.id, conversationId } },
  });

  if (!membership) {
    return res.status(403).json({ message: 'You are not a member of this conversation.' });
  };

  const where = { conversationId };

  if (since) {
    where.createdAt = { gt: new Date(since) };
  } else if (before) {
    where.createdAt = { lt: new Date(before) };
  };

  const messages = await prisma.message.findMany({
    where,
    include: MESSAGE_INCLUDE,
    orderBy: { createdAt: since ? 'asc' : 'desc' },
    take: since ? undefined : Number(limit),
  });

  const ordered = since ? messages : messages.reverse();

  res.json({ messages: ordered });
});

const sendMessage = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const { text } = req.body;

  if (!text && !req.file) {
    return res.status(400).json({ message: 'A message must have text or an image.' });
  };

  const membership = await prisma.conversationMember.findUnique({
    where: { userId_conversationId: { userId: req.user.id, conversationId } },
  });

  if (!membership) {
    return res.status(403).json({ message: 'You are not a member of this conversation.' });
  };

  let imageUrl = null;
  if (req.file) {
    const result = await uploadBuffer(req.file.buffer, 'messaging-app/messages');
    imageUrl = result.secure_url;
  };

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: req.user.id,
      text: text ? text.trim() : null,
      imageUrl,
    },
    include: MESSAGE_INCLUDE,
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  res.status(201).json({ message });
});

module.exports = { getMessages, sendMessage };