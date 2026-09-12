import axios from 'axios';

// Shared Axios instance - sends the HTTP-only auth cookie on every request.
// Feature slices/thunks should import this instead of calling axios directly.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  withCredentials: true,
});
