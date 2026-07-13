import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { articleService } from '../../services/articleService';

export default function ArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    articleService
      .getArticle(slug)
      .then(setArticle)
      .catch(() => setError('Artikel tidak ditemukan.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <p className="text-center py-16 text-slate-400">Memuat artikel...</p>;
  }

  if (error || !article) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-danger-600 mb-4">{error}</p>
        <Link to="/artikel" className="text-brand-600 hover:underline">
          ← Kembali ke daftar artikel
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-12">
        <Link to="/artikel" className="text-brand-600 hover:underline text-sm mb-6 inline-block">
          ← Kembali ke daftar artikel
        </Link>

        {article.thumbnail && (
          <img
            src={article.thumbnail}
            alt={article.title}
            className="w-full h-64 object-cover rounded-xl mb-6"
          />
        )}

        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">{article.title}</h1>
        {article.published_at && (
          <p className="text-sm text-slate-400 mb-6">
            {new Date(article.published_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}

        <div className="prose max-w-none text-slate-700 whitespace-pre-line">
          {article.content}
        </div>
      </div>
    </div>
  );
}
