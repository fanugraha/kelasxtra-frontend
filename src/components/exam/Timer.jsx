import { useState, useEffect, useRef } from 'react';

function TimeBox({ value, label, tone }) {
  const toneClasses = {
    normal: 'bg-brand-600',
    warning: 'bg-warning-500',
    critical: 'bg-danger-600',
  };
  return (
    <div className={`${toneClasses[tone]} rounded-xl px-4 py-3 text-center min-w-[64px] flex-1 transition-colors`}>
      <div className="text-2xl font-bold text-white">{String(value).padStart(2, '0')}</div>
      <div className="text-[11px] text-white/80 mt-0.5">{label}</div>
    </div>
  );
}

export default function Timer({ remainingSeconds, onExpire }) {
  const [seconds, setSeconds] = useState(Math.floor(remainingSeconds));
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setSeconds(Math.floor(remainingSeconds));
  }, [remainingSeconds]);

  useEffect(() => {
    if (seconds <= 0) {
      onExpireRef.current?.();
      return;
    }
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds > 0]);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const isCritical = seconds <= 60;
  const isWarning = !isCritical && seconds <= 300;
  const tone = isCritical ? 'critical' : isWarning ? 'warning' : 'normal';

  const labelClass = isCritical
    ? 'text-danger-600'
    : isWarning
    ? 'text-warning-700'
    : 'text-slate-700';

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border p-5 transition-colors ${
        isCritical ? 'border-danger-300' : isWarning ? 'border-warning-300' : 'border-slate-200'
      }`}
    >
      <p className={`text-sm font-semibold mb-3 ${labelClass}`}>
        {isCritical ? 'Waktu hampir habis!' : 'Sisa Waktu'}
      </p>
      <div className={`flex gap-2 ${isCritical ? 'animate-pulse' : ''}`}>
        {hours > 0 && <TimeBox value={hours} label="Jam" tone={tone} />}
        <TimeBox value={minutes} label="Menit" tone={tone} />
        <TimeBox value={secs} label="Detik" tone={tone} />
      </div>
    </div>
  );
}