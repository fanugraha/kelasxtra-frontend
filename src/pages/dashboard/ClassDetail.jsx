import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Video, Clock, Link2, User, ArrowLeft } from 'lucide-react';
import { classService } from '../../services/classService';

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function ClassDetail() {
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    classService
      .getClass(classId)
      .then(setClassData)
      .catch((err) => setError(err.response?.data?.message || 'Gagal memuat kelas.'))
      .finally(() => setLoading(false));
  }, [classId]);

  if (loading) {
    return <p className="text-slate-500">Memuat kelas...</p>;
  }

  if (error || !classData) {
    return (
      <div>
        <Link to="/app/dashboard" className="text-sm text-brand-600 hover:underline flex items-center gap-1 mb-4">
          <ArrowLeft size={14} /> Kembali ke Beranda
        </Link>
        <p className="text-danger-600">{error || 'Kelas tidak ditemukan.'}</p>
      </div>
    );
  }

  return (
    <div>
      <Link to="/app/dashboard" className="text-sm text-brand-600 hover:underline flex items-center gap-1 mb-4">
        <ArrowLeft size={14} /> Kembali ke Beranda
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">{classData.name}</h1>
        {classData.tutor && classData.tutor.user && classData.tutor.user.name && (
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <User size={14} />
            Tutor: {classData.tutor.user.name}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-800 mb-4">Jadwal Kelas</h2>
          {(!classData.schedules || classData.schedules.length === 0) ? (
            <p className="text-slate-500 text-sm">Belum ada jadwal untuk kelas ini.</p>
          ) : (
            <div className="space-y-3">
              {classData.schedules.map((s) => (
                <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                  <Clock size={16} className="text-brand-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      {DAY_NAMES[s.day_of_week]} · {s.start_time ? s.start_time.slice(0, 5) : ''}
                      –{s.end_time ? s.end_time.slice(0, 5) : ''}
                    </p>
                    {s.meeting_link && (
                      <a
                        href={s.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-brand-600 hover:underline mt-1"
                      >
                        <Link2 size={12} /> Link Meeting
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-800 mb-4">Materi</h2>
          {(!classData.materials || classData.materials.length === 0) ? (
            <p className="text-slate-500 text-sm">Belum ada materi yang diunggah.</p>
          ) : (
            <div className="space-y-2">
              {classData.materials.map((m) => (
                <a
                  key={m.id}
                  href={m.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-slate-100"
                >
                  {m.type === 'video_link' ? (
                    <Video size={18} className="text-brand-600" />
                  ) : (
                    <FileText size={18} className="text-brand-600" />
                  )}
                  <span className="text-sm font-medium text-slate-700">{m.title}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}