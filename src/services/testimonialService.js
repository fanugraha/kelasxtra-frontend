import api from '../lib/axios';

// NOTE: backend belum punya endpoint publik untuk testimoni. Perlu
// ditambah route baru, misalnya GET /testimonials.
export const testimonialService = {
    async listFeatured() {
        const response = await api.get('/testimonials');
        if (!Array.isArray(response.data)) return [];
        return response.data;
    },
};
