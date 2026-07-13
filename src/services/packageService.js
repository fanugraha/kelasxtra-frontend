import api from '../lib/axios';

export const packageService = {
    async listPackages(programId = null) {
        const response = await api.get('/packages', {
            params: programId ? { program_id: programId } : {},
        });
        return response.data;
    },

    async getRecommendedPackages() {
        const response = await api.get('/packages/recommended');
        return response.data;
    },

    async getPrograms() {
        const response = await api.get('/programs');
        return response.data;
    },

    async getPackage(id) {
        const response = await api.get(`/packages/${id}`);
        return response.data;
    },

    async validatePromo(code, packageId) {
        const response = await api.post('/promos/validate', { code, package_id: packageId });
        return response.data;
    },

    async checkout(packageId, promoCode = null) {
        const response = await api.post('/transactions/checkout', {
            package_id: packageId,
            promo_code: promoCode || undefined,
        });
        return response.data;
    },

    async getTransaction(id) {
        const response = await api.get(`/transactions/${id}`);
        return response.data;
    },

    async listTransactions() {
        const response = await api.get('/transactions');
        return response.data;
    },

    async resumeTransaction(id) {
        const response = await api.post(`/transactions/${id}/resume`);
        return response.data;
    },

    async listMyPackages() {
        const response = await api.get('/my-packages');
        return response.data;
    },

    async listMyExams() {
        const response = await api.get('/my-exams');
        return response.data;
    },

    async listPackageExams(packageId) {
        const response = await api.get(`/packages/${packageId}/exams`);
        return response.data;
    },

    async startExam(examId) {
        const response = await api.post('/exams/start', { exam_id: examId });
        return response.data;
    },
};
