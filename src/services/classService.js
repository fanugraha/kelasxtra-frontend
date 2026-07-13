import api from '../lib/axios';

export const classService = {
    async listClasses() {
        const response = await api.get('/classes');
        return response.data;
    },

    async getClass(id) {
        const response = await api.get(`/classes/${id}`);
        return response.data;
    },
};
