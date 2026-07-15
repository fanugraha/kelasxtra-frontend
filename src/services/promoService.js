import api from '../lib/axios';

// NOTE: backend belum punya endpoint publik untuk listing promo aktif
// (yang ada baru POST /promos/validate). Perlu ditambah route baru,
// misalnya GET /promos/active yang mengembalikan promo dengan
// valid_until >= hari ini.
export const promoService = {
    async listActive() {
        const response = await api.get('/promos/active');
        return response.data;
    },
};
