import api from '../lib/axios';

export const leaderboardEventService = {
  me: () => api.get('/leaderboard-events/me').then((res) => res.data),
  feed: (sinceIso) =>
    api
      .get('/leaderboard-events/feed', { params: sinceIso ? { since: sinceIso } : {} })
      .then((res) => res.data),
  updatePrivacy: (hideFromFeed) =>
    api
      .patch('/user/privacy', { hide_from_leaderboard_feed: hideFromFeed })
      .then((res) => res.data),
};
