import api from '../lib/axios';

export const weeklyLeaderboardService = {
  listRanked: () =>
    api.get('/exams/leaderboard/ranked').then((res) => res.data),
  getLeaderboard: (examId) =>
    api.get(`/exams/${examId}/leaderboard`).then((res) => res.data),
  getMyPosition: (examId) =>
    api.get(`/exams/${examId}/leaderboard/me`).then((res) => res.data),
};
