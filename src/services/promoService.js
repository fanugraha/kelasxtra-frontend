import api from '../lib/axios';

export const promoService = {
  async listActive() {
    const response = await api.get('/promos/active');
    return response.data;
  },
};
