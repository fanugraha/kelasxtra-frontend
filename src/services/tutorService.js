import api from '../lib/axios';

// NOTE: backend belum punya endpoint publik untuk tutor. Perlu ditambah
// route baru, misalnya GET /tutors yang join ke tabel users supaya
// mengembalikan { id, name, photo, bio, expertise } per tutor.
export const tutorService = {
    async listFeatured() {
        const response = await api.get('/tutors');
        if (!Array.isArray(response.data)) return [];
        return response.data;
    },
};
