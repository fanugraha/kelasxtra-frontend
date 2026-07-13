import api from '../lib/axios';

export const examBatchService = {
    async listRanked() {
        const response = await api.get('/exam-batches');
        return response.data;
    },

    async getLeaderboard(batchId) {
        const response = await api.get(`/exam-batches/${batchId}/leaderboard`);
        return response.data;
    },

    async getMyPosition(batchId) {
        const response = await api.get(`/exam-batches/${batchId}/leaderboard/me`);
        return response.data;
    },
};
