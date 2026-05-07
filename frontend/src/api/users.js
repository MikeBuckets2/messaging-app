import { get, patch } from './client';

export const searchUsers = (query) => get(`/users?search=${encodeURIComponent(query)}`);
export const getUserById = (id) => get(`/users/${id}`);
export const updateMe = (formData) => patch('/users/me', formData);
export const updateLastSeen = () => patch('/users/me/last-seen', {});