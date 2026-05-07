import { get, post, del } from './client';

export const getMyConversations = () => get('/conversations');
export const getConversationById = (id) => get(`/conversations/${id}`);
export const createConversation = (data) => post('/conversations', data);
export const addGroupMember = (convId, userId) =>
  post(`/conversations/${convId}/members`, { userId });
export const removeGroupMember = (convId, userId) =>
  del(`/conversations/${convId}/members/${userId}`);