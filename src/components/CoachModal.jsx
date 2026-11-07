import { useEffect, useRef } from 'react';
import FeedbackBadge from './FeedbackBadge.jsx';
import GelBar from './GelBar.jsx';
import Avatar from './Avatar.jsx';
import { CardRow } from './PlayingCard.jsx';
import { GlossyButton } from './ui.jsx';

// Bubbly "Coach's Note" pop-up shown after a C, D or F decision.
export default function CoachModal({ note, onClose }) {
  const btnRef = useRef(null);
  useEffect(() => {
    if (!note) return undefined;
    btnRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [note, onClose]);

  if (!note) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-900/25 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="coach-title" onClick={onClose}>
      <div className="relative w-full max-w-lg animate-pop" onClick={(e) => e.stopPropagation()}>
        <div className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-lime-300/60 blur-[1px]" />
        <div className="pointer-events-none absolute -bottom-10 -right-6 h-36 w-36 rounded-full bg-fuchsia-300/50" />
        <div className="pointer-events-none absolute -right-4 top-10 h-12 w-12 rounded-full bg-cyan-300/70" />

        <div className="relative overflow-clip rounded-[2rem] border-4 border-white bg-gradient-to-b from-white via-white to-cyan-50 p-6 shadow-[0_30px_80px_-20px_rgba(8,145,178,0.7)]">
          <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-lime-400" />
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <Avatar color="orange" variant="coach" size={64} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="chip-label text-orange-500">coach&rsquo;s note</p>
              <h2 id="coach-title" className="text-2xl font-extrabold lowercase leading-tight text-slate-800">
                {note.headline}
              </h2>
              <p className="mt-0.5 text-sm font-semibold text-slate-500">
                you chose <span className="text-slate-800">{note.actionLabel}</span> on the {note.street}
              </p>
            </div>
            <FeedbackBadge grade={note.grade} size="md" />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <CardRow cards={note.hand} size="sm" />
            {note.board?.length > 0 && (
              <>
                <span className="text-slate-300">|</span>
                <CardRow cards={note.board} size="sm" gap="gap-1" />
              </>
            )}
          </div>

          <div className="relative mt-4 rounded-3xl border-2 border-cyan-100 bg-white/90 p-4 text-[15px] leading-relaxed text-slate-700 shadow-inner">
            <span className="absolute -top-2 left-8 h-4 w-4 rotate-45 border-l-2 border-t-2 border-cyan-100 bg-white" />
            {note.coach.map((para, i) => (
              <p key={i} className={i ? 'mt-2' : ''}>
                {para}
              </p>
            ))}
          </div>

          {note.bar && (
            <GelBar
              className="mt-4"
              value={note.bar.value}
              marker={note.bar.marker}
              markerLabel={`need ${Math.round(note.bar.marker * 100)}%`}
              color={note.bar.value >= note.bar.marker ? 'lime' : 'magenta'}
              label={note.bar.label}
              valueLabel={`${Math.round(note.bar.value * 100)}%`}
            />
          )}

          {note.stats?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {note.stats.map((s) => (
                <span key={s.label} className="rounded-full border-2 border-white bg-gradient-to-b from-slate-50 to-slate-200 px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                  {s.label}: <span className="text-slate-900">{s.value}</span>
                </span>
              ))}
            </div>
          )}

          {note.tip && (
            <p className="mt-4 rounded-2xl bg-gradient-to-r from-lime-100 to-cyan-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <span className="mr-1">{'✨'}</span>
              {note.tip}
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <GlossyButton ref={btnRef} color="lime" size="lg" onClick={onClose}>
              got it!
            </GlossyButton>
          </div>
        </div>
      </div>
    </div>
  );
}
