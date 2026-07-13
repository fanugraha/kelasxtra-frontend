import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Sparkles, Settings2, Users, ArrowRight } from 'lucide-react';
import { classService } from '../../services/classService';
import { packageService } from '../../services/packageService';
import CategoryModal from '../../components/public/CategoryModal';

const STATUS_LABEL = {
    ongoing: 'Sedang Berjalan',
    upcoming: 'Segera Dimulai',
    finished: 'Selesai',
};

const STATUS_STYLE = {
    ongoing: 'bg-success-100 text-success-700',
    upcoming: 'bg-warning-100 text-warning-700',
    finished: 'bg-slate-100 text-slate-500',
};

export default function ClassList() {
    const navigate = useNavigate();

    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Kategori tersimpan dari Beranda/Packages (localStorage key sama),
    // supaya filter kategori konsisten di seluruh app.
    const [preferredProgramId, setPreferredProgramId] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [programs, setPrograms] = useState([]);
    const [loadingPrograms, setLoadingPrograms] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('preferred_program_id');
        if (stored) setPreferredProgramId(Number(stored));
    }, []);

    useEffect(() => {
        packageService.getPrograms().then(setPrograms).finally(() => setLoadingPrograms(false));
    }, []);

    useEffect(() => {
        classService
            .listClasses()
            .then((data) => setClasses(data.filter((c) => c.is_accessible)))
            .catch(() => setError('Gagal memuat daftar kelas online.'))
            .finally(() => setLoading(false));
    }, []);

    function handleSelectCategory(program) {
        localStorage.setItem('preferred_program_id', program.id);
        setPreferredProgramId(program.id);
        setShowCategoryModal(false);
    }

    function handleShowAllCategories() {
        localStorage.removeItem('preferred_program_id');
        setPreferredProgramId(null);
        setShowCategoryModal(false);
    }

    const activeProgramName = useMemo(
        () => programs.find((p) => p.id === preferredProgramId)?.name,
        [programs, preferredProgramId]
    );

    const visibleClasses = useMemo(
        () =>
            preferredProgramId === null
                ? classes
                : classes.filter((cls) => cls.program_id === preferredProgramId),
        [classes, preferredProgramId]
    );

    if (loading) {
        return (
            <div>
                <h1 className="text-2xl font-bold text-slate-800 mb-6">Kelas Online</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse h-40" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header — konsisten dengan halaman Mulai Belajar: judul + subtitle
          singkat + kategori aktif, disatukan dalam 1 baris dengan tombol
          Ganti Kategori. */}
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">Kelas Online</h1>
                    <p className="text-sm text-slate-500">
                        Belajar langsung bersama tutor lewat kelas terjadwal.
                        {activeProgramName && (
                            <span className="text-brand-600 font-semibold"> Kategori: {activeProgramName}</span>
                        )}
                    </p>
                </div>
                <button
                    onClick={() => setShowCategoryModal(true)}
                    className="shrink-0 flex items-center gap-1.5 bg-white border border-slate-200 hover:border-brand-300 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg transition"
                >
                    <Settings2 size={14} />
                    Ganti Kategori
                </button>
            </div>

            {/* Kategori Cepat */}
            {!loadingPrograms && programs.length > 0 && (
                <div className="flex flex-wrap gap-2.5 mb-6">
                    <button
                        onClick={handleShowAllCategories}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-sm font-semibold transition ${preferredProgramId === null
                                ? 'bg-brand-600 border-brand-600 text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                            }`}
                    >
                        <Sparkles size={14} />
                        Semua
                    </button>
                    {programs.map((program) => (
                        <button
                            key={program.id}
                            onClick={() => handleSelectCategory(program)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-sm font-semibold transition ${preferredProgramId === program.id
                                    ? 'bg-brand-600 border-brand-600 text-white'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                                }`}
                        >
                            <GraduationCap size={14} />
                            {program.name}
                        </button>
                    ))}
                </div>
            )}

            {error && <p className="text-sm text-danger-600 mb-4">{error}</p>}

            {visibleClasses.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
                    <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 text-brand-500 mb-4">
                        <GraduationCap size={26} strokeWidth={1.75} />
                    </span>
                    <p className="font-semibold text-slate-700 mb-1.5">Belum ada kelas untuk kategori ini</p>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                        Coba lihat kategori lain, atau jelajahi paket latihan soal sebagai gantinya.
                    </p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        {preferredProgramId !== null && (
                            <button
                                onClick={handleShowAllCategories}
                                className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
                            >
                                Lihat Semua Kategori
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/app/packages')}
                            className="bg-white border border-slate-200 hover:border-brand-300 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition"
                        >
                            Jelajahi Paket Latihan Soal
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {visibleClasses.map((cls) => (
                        <button
                            key={cls.id}
                            onClick={() => navigate(`/app/classes/${cls.id}`)}
                            className="text-left bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-brand-200 hover:shadow-md transition flex flex-col"
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                                    <GraduationCap size={18} className="text-brand-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-800 text-sm truncate">{cls.name}</p>
                                    {cls.program?.name && (
                                        <p className="text-xs text-brand-600 font-semibold uppercase mt-0.5">{cls.program.name}</p>
                                    )}
                                </div>
                            </div>

                            <span
                                className={`inline-flex w-fit items-center text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${STATUS_STYLE[cls.status] || 'bg-slate-100 text-slate-500'
                                    }`}
                            >
                                {STATUS_LABEL[cls.status] || cls.status}
                            </span>

                            {cls.tutor_name && (
                                <p className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                                    <Users size={12} />
                                    {cls.tutor_name}
                                </p>
                            )}

                            <span className="mt-auto flex items-center justify-center gap-2 bg-brand-50 text-brand-700 font-semibold text-sm py-2.5 rounded-lg">
                                Lihat Detail
                                <ArrowRight size={15} />
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {showCategoryModal && (
                <CategoryModal
                    programs={programs}
                    loading={loadingPrograms}
                    onSelect={handleSelectCategory}
                    onSkip={handleShowAllCategories}
                    onClose={() => setShowCategoryModal(false)}
                    title="Ganti Kategori"
                    subtitle="Pilih kategori baru untuk memfilter kelas yang tampil."
                    skipLabel="Tampilkan Semua Kategori →"
                />
            )}
        </div>
    );
}