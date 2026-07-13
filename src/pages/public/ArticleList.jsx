import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { articleService } from '../../services/articleService';

export default function ArticleList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    articleService
      .listArticles({ page, perPage: 9 })
      .then((res) => {
        setArticles(res.data || []);
        setLastPage(res.last_page || 1);
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-12">
        <Link to="/" className="text-brand-600 hover:underline text-sm mb-6 inline-block">
          ← Kembali ke Beranda
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-brand-600 mb-8">Semua Artikel</h1>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <p className="text-slate-400">Belum ada artikel.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/artikel/${article.slug}`}
                className="block rounded-xl border border-slate-100 overflow-hidden hover:shadow-md transition"
              >
                <div className="h-40 bg-slate-100">
                  {article.thumbnail && (
                    <img
                      src={article.thumbnail}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-800 leading-snug">{article.title}</h3>
                  {article.excerpt && (
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">{article.excerpt}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {lastPage > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: lastPage }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium ${
                  p === page ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
