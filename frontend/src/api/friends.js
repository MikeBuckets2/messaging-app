import { get, post, patch, del } from './client';

export const getFriends = () => get('/friends');
export const getFriendRequests = () => get('/friends/requests');
export const getSentRequests = () => get('/friends/requests/sent');
export const sendFriendRequest = (receiverId) => post('/friends/requests', { receiverId });
export const respondToRequest = (id, action) => patch(`/friends/requests/${id}`, { action });
export const removeFriend = (id) => del(`/friends/${id}`);