const prisma = require('../config/database');
const { uploadBuffer } = require('../config/cloudinary');
const asyncHandler = require('../utils/asyncHandler');

const MEMBER_INCLUDE = {
  members: {
    include: {
      user: {
        select: { id: true, username: true, avatarUrl: true, lastSeenAt: true },
      },
    },
  },
};

const getMyConversations = asyncHandler(async (req, res) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      members: { some: { userId: req.user.id } },
    },
    include: {
      ...MEMBER_INCLUDE,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: { select: { id: true, username: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  res.json({ conversations });
});

const getConversationById = asyncHandler(async (req, res) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: req.params.id },
    include: MEMBER_INCLUDE,
  });

  if (!conversation) {
    return res.status(404).json({ message: 'Conversation not found.' });
  };

  const isMember = conversation.members.some((m) => m.userId === req.user.id);
  if (!isMember) {
    return res.status(403).json({ message: 'You are not a member of this conversation.' });
  };

  res.json({ conversation });
});

const createConversation = asyncHandler(async (req, res) => {
  const { type, recipientId, name, memberIds } = req.body;

  if (type === 'dm') {
    return createDm(req, res, recipientId);
  };

  if (type === 'group') {
    return createGroup(req, res, name, memberIds);
  };

  return res.status(400).json({ message: 'type must be "dm" or "group".' });
});

const deleteConversation = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;

  const membership = await prisma.conversationMember.findUnique({
    where: {
      userId_conversationId: { userId: req.user.id, conversationId },
    },
  });

  if (!membership) {
    return res.status(404).json({ message: 'Conversation not found in your inbox.' });
  };

  await prisma.conversationMember.delete({
    where: {
      userId_conversationId: { userId: req.user.id, conversationId },
    },
  });

  const remainingMembers = await prisma.conversationMember.count({
    where: { conversationId },
  });

  if (remainingMembers === 0) {
    await prisma.conversation.delete({ where: { id: conversationId } });
  };

  res.json({ message: 'Conversation removed from your inbox.' });
});

const addGroupMember = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const conversation = await findGroupAndCheckAdmin(req.params.id, req.user.id);
  if (conversation.error) {
    return res.status(conversation.status).json({ message: conversation.error });
  };

  const alreadyMember = conversation.members.some((m) => m.userId === userId);
  if (alreadyMember) {
    return res.status(409).json({ message: 'User is already a member.' });
  };

  await prisma.conversationMember.create({
    data: { userId, conversationId: req.params.id },
  });

  const updated = await prisma.conversation.findUnique({
    where: { id: req.params.id },
    include: MEMBER_INCLUDE,
  });

  res.json({ conversation: updated });
});

const removeGroupMember = asyncHandler(async (req, res) => {
  const conversation = await findGroupAndCheckAdmin(req.params.id, req.user.id);
  if (conversation.error) {
    return res.status(conversation.status).json({ message: conversation.error });
  };

  await prisma.conversationMember.deleteMany({
    where: { conversationId: req.params.id, userId: req.params.userId },
  });

  res.json({ message: 'Member removed.' });
});

const createDm = async (req, res, recipientId) => {
  if (!recipientId) {
    return res.status(400).json({ message: 'recipientId is required for a DM.' });
  };

  if (recipientId === req.user.id) {
    return res.status(400).json({ message: 'You cannot start a DM with yourself.' });
  };

  const existing = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { members: { some: { userId: req.user.id } } },
        { members: { some: { userId: recipientId } } },
      ],
    },
    include: MEMBER_INCLUDE,
  });

  if (existing) {
    return res.status(200).json({ conversation: existing });
  };

  const conversation = await prisma.conversation.create({
    data: {
      isGroup: false,
      members: {
        create: [{ userId: req.user.id }, { userId: recipientId }],
      },
    },
    include: MEMBER_INCLUDE,
  });

  res.status(201).json({ conversation });
};

const createGroup = async (req, res, name, memberIds) => {
  if (!name || name.trim().length < 1) {
    return res.status(400).json({ message: 'A group name is required.' });
  };

  if (!Array.isArray(memberIds) || memberIds.length < 1) {
    return res.status(400).json({ message: 'At least one other member is required.' });
  };

  const allMemberIds = [...new Set([req.user.id, ...memberIds])];

  let avatarUrl = undefined;
  if (req.file) {
    const result = await uploadBuffer(req.file.buffer, 'messaging-app/groups');
    avatarUrl = result.secure_url;
  };

  const conversation = await prisma.conversation.create({
    data: {
      isGroup: true,
      name: name.trim(),
      avatarUrl,
      members: {
        create: allMemberIds.map((uid) => ({
          userId: uid,
          isAdmin: uid === req.user.id,
        })),
      },
    },
    include: MEMBER_INCLUDE,
  });

  res.status(201).json({ conversation });
};

const findGroupAndCheckAdmin = async (conversationId, userId) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { members: true },
  });

  if (!conversation) return { error: 'Conversation not found.', status: 404 };
  if (!conversation.isGroup) return { error: 'This is not a group conversation.', status: 400 };

  const member = conversation.members.find((m) => m.userId === userId);
  if (!member) return { error: 'You are not a member of this conversation.', status: 403 };
  if (!member.isAdmin) return { error: 'Only admins can perform this action.', status: 403 };

  return conversation;
};

module.exports = {
  getMyConversations,
  getConversationById,
  createConversation,
  deleteConversation,
  addGroupMember,
  removeGroupMember,
};