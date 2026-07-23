import api from '../lib/axios';

export const topicPerformanceService = {
  async getTopicPerformance(programId) {
    const response = await api.get('/me/topic-performance', {
      params: { program_id: programId },
    });
    return response.data;
  },
};
