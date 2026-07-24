import api from '../lib/axios';

export const performanceSummaryService = {
  async getPerformanceSummary(programId) {
    const response = await api.get('/me/performance-summary', {
      params: { program_id: programId },
    });
    return response.data;
  },
};
