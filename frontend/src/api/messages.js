import { get, post } from './client';

export const getMessages = (conversationId, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return get(`/conversations/${conversationId}/messages${query ? `?${query}` : ''}`);
};

export const sendMessage = (conversationId, formData) =>
  post(`/conversations/${conversationId}/messages`, formData);