import api from '../lib/axios';

export const articleService = {
  async listArticles({ programId = null, page = 1, perPage = 6 } = {}) {
    const response = await api.get('/articles', {
      params: {
        program_id: programId || undefined,
        page,
        per_page: perPage,
      },
    });
    return response.data;
  },

  async getArticle(slug) {
    const response = await api.get(`/articles/${slug}`);
    return response.data;
  },
};
