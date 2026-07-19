import api from '../lib/axios';

// GET /promos/active — sudah ada di backend (PromoController::active,
// terdaftar di routes/api.php). Mengembalikan promo dengan valid_until
// >= hari ini, diurutkan dari yang paling cepat berakhir.
export const promoService = {
    async listActive() {
        const response = await api.get('/promos/active');
        return response.data;
    },
};