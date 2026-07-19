import api from '../lib/axios';

export const examService = {
  async startExam(examId, examBatchId = null, bankId = null) {
    const response = await api.post('/exams/start', {
      exam_id: examId,
      exam_batch_id: examBatchId,
      bank_id: bankId,
    });
    return response.data.data;
  },

  async getExamBanks(examId) {
    const response = await api.get(`/exams/${examId}/banks`);
    return response.data;
  },

  async getExamSummary(examId, bankId = null) {
    const response = await api.get(`/exams/${examId}/summary`, {
      params: bankId ? { bank_id: bankId } : {},
    });
    return response.data;
  },

  async getAttempt(attemptId) {
    const response = await api.get(`/exam-attempts/${attemptId}`);
    return response.data.data;
  },

  async listMyExams() {
    const response = await api.get('/my-exams');
    return response.data;
  },
  async getLatestAttemptedExamId() {
    const response = await api.get('/my-exams/latest-attempted');
    return response.data.exam_id;
  },

  async listAttempts(examId, bankId = null) {
    const response = await api.get(`/exams/${examId}/attempts`, {
      params: bankId ? { bank_id: bankId } : {},
    });
    return response.data;
  },

  async getAttemptReview(attemptId) {
    const response = await api.get(`/exam-attempts/${attemptId}/review`);
    return response.data;
  },

  async submitAnswer(attemptId, questionId, answer) {
    const response = await api.post(`/exam-attempts/${attemptId}/answer`, {
      question_id: questionId,
      ...answer,
    });
    return response.data;
  },

  async recordTabSwitch(attemptId) {
    const response = await api.post(`/exam-attempts/${attemptId}/tab-switch`);
    return response.data;
  },

  async finishExam(attemptId) {
    const response = await api.post(`/exam-attempts/${attemptId}/finish`);
    return response.data.data;
  },
};
