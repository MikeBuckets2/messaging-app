const BASE_URL = '/api';

const request = async (path, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = { ...options.headers };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) return null;

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = response.status;
    throw error;
  };

  return data;
};

export const get = (path) => request(path);

export const post = (path, body) =>
  request(path, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

export const patch = (path, body) =>
  request(path, {
    method: 'PATCH',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

export const del = (path) => request(path, { method: 'DELETE' });