const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

const USER_SELECT = {
  id: true,
  username: true,
  avatarUrl: true,
  bio: true,
  lastSeenAt: true,
};

const getFriends = asyncHandler(async (req, res) => {
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ userAId: req.user.id }, { userBId: req.user.id }],
    },
    include: {
      userA: { select: USER_SELECT },
      userB: { select: USER_SELECT },
    },
  });

  const friends = friendships.map((f) => {
    const friend = f.userAId === req.user.id ? f.userB : f.userA;
    return {
      ...friend,
      isOnline: isOnline(friend.lastSeenAt),
      friendshipId: f.id,
    };
  });

  res.json({ friends });
});

const getFriendRequests = asyncHandler(async (req, res) => {
  const requests = await prisma.friendRequest.findMany({
    where: { receiverId: req.user.id, status: 'PENDING' },
    include: {
      sender: { select: USER_SELECT },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ requests });
});

const getSentRequests = asyncHandler(async (req, res) => {
  const requests = await prisma.friendRequest.findMany({
    where: { senderId: req.user.id, status: 'PENDING' },
    include: {
      receiver: { select: USER_SELECT },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ requests });
});

const sendFriendRequest = asyncHandler(async (req, res) => {
  const { receiverId } = req.body;

  if (!receiverId) {
    return res.status(400).json({ message: 'receiverId is required.' });
  };

  if (receiverId === req.user.id) {
    return res.status(400).json({ message: 'You cannot send a friend request to yourself.' });
  };

  const alreadyFriends = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userAId: req.user.id, userBId: receiverId },
        { userAId: receiverId, userBId: req.user.id },
      ],
    },
  });

  if (alreadyFriends) {
    return res.status(409).json({ message: 'You are already friends with this user.' });
  };

  const existingRequest = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: req.user.id, receiverId },
        { senderId: receiverId, receiverId: req.user.id },
      ],
      status: 'PENDING',
    },
  });

  if (existingRequest) {
    return res.status(409).json({ message: 'A friend request already exists between you two.' });
  };

  const request = await prisma.friendRequest.create({
    data: { senderId: req.user.id, receiverId },
    include: { receiver: { select: USER_SELECT } },
  });

  res.status(201).json({ request });
});

const respondToRequest = asyncHandler(async (req, res) => {
  const { action } = req.body;

  if (!['accept', 'decline'].includes(action)) {
    return res.status(400).json({ message: 'action must be "accept" or "decline".' });
  };

  const friendRequest = await prisma.friendRequest.findUnique({
    where: { id: req.params.id },
  });

  if (!friendRequest) {
    return res.status(404).json({ message: 'Friend request not found.' });
  };

  if (friendRequest.receiverId !== req.user.id) {
    return res.status(403).json({ message: 'This request was not sent to you.' });
  };

  if (friendRequest.status !== 'PENDING') {
    return res.status(400).json({ message: 'This request has already been responded to.' });
  };

  if (action === 'decline') {
    await prisma.friendRequest.update({
      where: { id: req.params.id },
      data: { status: 'DECLINED' },
    });
    return res.json({ message: 'Friend request declined.' });
  };

  await prisma.$transaction([
    prisma.friendRequest.update({
      where: { id: req.params.id },
      data: { status: 'ACCEPTED' },
    }),
    prisma.friendship.create({
      data: {
        userAId: friendRequest.senderId,
        userBId: friendRequest.receiverId,
      },
    }),
  ]);

  res.json({ message: 'Friend request accepted.' });
});

const removeFriend = asyncHandler(async (req, res) => {
  const deleted = await prisma.friendship.deleteMany({
    where: {
      OR: [
        { id: req.params.id },
        { userAId: req.user.id, userBId: req.params.id },
        { userAId: req.params.id, userBId: req.user.id },
      ],
    },
  });

  if (deleted.count === 0) {
    return res.status(404).json({ message: 'Friendship not found.' });
  };

  res.json({ message: 'Friend removed.' });
});

const isOnline = (lastSeenAt) => {
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
};

module.exports = {
  getFriends,
  getFriendRequests,
  getSentRequests,
  sendFriendRequest,
  respondToRequest,
  removeFriend,
};