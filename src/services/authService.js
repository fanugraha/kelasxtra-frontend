import api from '../lib/axios';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return user;
  },

  async loginWithGoogle(credential) {
    const response = await api.post('/auth/google', { credential });
    const { token, user } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return user;
  },

  async register(payload) {
    // payload: { name, email, password, password_confirmation, ... }
    // Backend TIDAK lagi mengembalikan token di sini — user wajib
    // verifikasi email dulu sebelum bisa login. Responsnya { message, email }.
    const response = await api.post('/auth/register', payload);
    return response.data;
  },

  async resendVerification(email) {
    const response = await api.post('/email/verification-notification', { email });
    return response.data;
  },

  async forgotPassword(email) {
    const response = await api.post('/forgot-password', { email });
    return response.data;
  },

  async resetPassword(payload) {
    // payload: { token, email, password, password_confirmation }
    const response = await api.post('/reset-password', payload);
    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  async fetchMe() {
    const response = await api.get('/auth/me');
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};
