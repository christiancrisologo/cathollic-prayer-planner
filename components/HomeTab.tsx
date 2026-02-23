
import React, { useState } from 'react';
import { DailyReflection, GroundingSource, ThemeType, PrayerEvent } from '../types';
import { THEMES } from '../constants';
import SpeakerIcon from './shared/SpeakerIcon';

interface HomeTabProps {
  theme: ThemeType;
  reflection: DailyReflection | null;
  allReflections: DailyReflection[];
  aiInsight: { gospel: string; enlightenment: string; prayer: string; sources: GroundingSource[] } | null;
  isGeneratingInsight: boolean;
  plannerEvents: PrayerEvent[];
  isSpeaking: boolean;
  handleSpeak: (text: string) => void;
  onClearInsight: () => void;
  onAddReflection: (refl: DailyReflection) => void;
  onUpdateReflection: (refl: DailyReflection) => void;
  onDeleteReflection: (id: string) => void;
  onSelectReflection: (refl: DailyReflection) => void;
}

const HomeTab: React.FC<HomeTabProps> = ({
  theme, reflection, allReflections, aiInsight, isGeneratingInsight, plannerEvents, isSpeaking, handleSpeak, onClearInsight,
  onAddReflection, onUpdateReflection, onDeleteReflection, onSelectReflection
}) => {
  const activeTheme = THEMES[theme];
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysEvents = plannerEvents.filter(ev => ev.date === todayStr);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRefl, setEditingRefl] = useState<DailyReflection | null>(null);
  const [newRefl, setNewRefl] = useState<Partial<DailyReflection>>({ verse: '', citation: '', reflection: '' });

  const currentIndex = reflection ? allReflections.findIndex(r => r.id === reflection.id) : -1;

  const handleNext = () => {
    if (allReflections.length === 0) return;
    const nextIndex = (currentIndex + 1) % allReflections.length;
    onSelectReflection(allReflections[nextIndex]);
  };

  const handlePrev = () => {
    if (allReflections.length === 0) return;
    const prevIndex = (currentIndex - 1 + allReflections.length) % allReflections.length;
    onSelectReflection(allReflections[prevIndex]);
  };

  const openEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!reflection) return;
    setEditingRefl(reflection);
    setNewRefl({ ...reflection });
    setIsModalOpen(true);
  };

  const openAdd = () => {
    setEditingRefl(null);
    setNewRefl({ verse: '', citation: '', reflection: '' });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!newRefl.verse || !newRefl.reflection || !newRefl.citation) return;

    if (editingRefl) {
      onUpdateReflection({ ...editingRefl, ...newRefl } as DailyReflection);
    } else {
      onAddReflection({
        id: crypto.randomUUID(),
        verse: newRefl.verse!,
        citation: newRefl.citation!,
        reflection: newRefl.reflection!,
        isDefault: false
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!reflection || reflection.isDefault) return;
    if (window.confirm('Delete this reflection?')) {
      onDeleteReflection(reflection.id);
      // Select another reflection
      const remaining = allReflections.filter(r => r.id !== reflection.id);
      if (remaining.length > 0) onSelectReflection(remaining[0]);
    }
  };

  const isFormValid = !!(newRefl.verse?.trim() && newRefl.citation?.trim() && newRefl.reflection?.trim());

  return (
    <div className="p-6 space-y-8 animate-fade-in pt-20 no-scrollbar pb-24">
      <header className="pt-4 flex justify-between items-start">
        <div>
          <h1 className="font-cinzel text-3xl font-bold tracking-tight">Catholic Prayer Planner</h1>
          <p className="opacity-60 text-sm font-medium italic">Your daily spiritual commitment.</p>
        </div>
        <button
          onClick={openAdd}
          className={`p-3 rounded-full transition-all hover:scale-110 active:scale-95 shadow-lg ${activeTheme.button}`}
          title="Create Custom Reflection"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
        </button>
      </header>

      {reflection && (
        <section className={`rounded-[2.5rem] p-8 border animate-slide-up relative group transition-all ${activeTheme.card} hover:border-amber-700/20 shadow-xl shadow-amber-900/5`}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <h2 className={`text-[10px] font-bold uppercase tracking-widest font-cinzel ${activeTheme.accent}`}>Daily Reflection</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={openEdit}
                className="p-1.5 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-all hover:text-amber-700"
                title="Edit Reflection"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              {!reflection.isDefault && (
                <button
                  onClick={handleDelete}
                  className="p-1.5 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-all hover:text-red-500"
                  title="Delete Reflection"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
              <div className="w-px h-3 bg-slate-500/10 mx-1" />
              <SpeakerIcon isSpeaking={isSpeaking} onSpeak={() => handleSpeak(`${reflection.verse}. Reflection: ${reflection.reflection}`)} />
            </div>
          </div>

          <blockquote className="border-l-4 border-amber-500/30 pl-6 mb-6">
            <p className="font-serif-elegant italic text-2xl leading-relaxed">"{reflection.verse}"</p>
            <cite className="text-[10px] font-bold opacity-40 mt-3 block uppercase tracking-widest">— {reflection.citation}</cite>
          </blockquote>

          <p className="text-sm leading-relaxed font-medium opacity-70 italic">
            {reflection.reflection}
          </p>

          {allReflections.length > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-500/5">
              <button onClick={handlePrev} className="p-2 opacity-30 hover:opacity-100 hover:text-amber-700 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="flex gap-1.5">
                {allReflections.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? 'bg-amber-700 w-4' : 'bg-slate-500/20'}`} />
                ))}
              </div>
              <button onClick={handleNext} className="p-2 opacity-30 hover:opacity-100 hover:text-amber-700 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </section>
      )}

      {aiInsight && (
        <section className={`rounded-[2.5rem] p-8 border relative animate-slide-up shadow-xl ${activeTheme.card} ${theme === 'classic' ? 'bg-amber-50/50 border-amber-100' : ''}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-[10px] font-bold uppercase tracking-widest font-cinzel ${activeTheme.accent}`}>Today's Gospel Insight</h2>
            <button onClick={onClearInsight} className="text-amber-300 hover:text-amber-500 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-tighter mb-2">The Word</p>
              <p className="text-sm font-serif-elegant italic leading-relaxed">{aiInsight.gospel}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-tighter mb-2">Enlightenment</p>
              <p className="text-sm leading-relaxed font-medium opacity-90">{aiInsight.enlightenment}</p>
            </div>
            <div className="pt-2">
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-tighter mb-2">Spirit-Led Prayer</p>
              <p className={`text-base italic font-serif-elegant whitespace-pre-line p-6 rounded-3xl ${theme === 'dark' ? 'bg-slate-700 text-amber-100' : 'bg-white/40 shadow-inner'}`}>
                {aiInsight.prayer}
              </p>
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="flex flex-wrap gap-2">
                {aiInsight.sources.map((s, i) => (
                  <a key={i} href={s.web?.uri} target="_blank" rel="noopener noreferrer" className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded hover:bg-amber-200 transition-colors">
                    {s.web?.title?.slice(0, 15)}...
                  </a>
                ))}
              </div>
              <SpeakerIcon isSpeaking={isSpeaking} onSpeak={() => handleSpeak(`${aiInsight.gospel}. ${aiInsight.enlightenment}. ${aiInsight.prayer}`)} />
            </div>
          </div>
        </section>
      )}

      {isGeneratingInsight && (
        <div className={`p-10 rounded-[2.5rem] border border-dashed flex flex-col items-center justify-center space-y-4 ${activeTheme.card} opacity-50`}>
          <svg className="animate-spin h-8 w-8 text-amber-700" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <p className="font-cinzel text-xs font-bold uppercase tracking-widest text-center">Sanctifying the moment...</p>
        </div>
      )}

      <section className="space-y-4 pb-4">
        <h3 className="text-[10px] font-bold opacity-40 uppercase tracking-widest ml-1">Today's Schedule</h3>
        {todaysEvents.length === 0 ? (
          <div className={`text-center py-10 rounded-3xl border border-dashed opacity-40 ${activeTheme.card}`}>
            <p className="text-xs font-medium">No prayers scheduled for today.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaysEvents.map(ev => (
              <div key={ev.id} className={`p-5 rounded-[2rem] flex items-center gap-4 border transition-all ${activeTheme.card} hover:border-amber-700/20 shadow-lg shadow-amber-900/5`}>
                <div className={`w-2 h-2 rounded-full ${ev.completed ? 'bg-amber-700 shadow-[0_0_8px_rgba(180,83,9,0.5)]' : 'bg-slate-500/20'}`} />
                <span className={`text-sm font-bold flex-1 ${ev.completed ? 'opacity-30 line-through' : 'opacity-90'}`}>{ev.title}</span>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">{ev.time}</span>
                  {ev.notify && <svg className="w-3.5 h-3.5 text-amber-600 mt-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add/Edit Reflection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center p-6 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 space-y-6 shadow-2xl no-scrollbar ${activeTheme.card}`}>
            <h3 className="font-cinzel text-2xl font-bold text-center">{editingRefl ? 'Edit' : 'Create'} Reflection</h3>

            <div className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold opacity-40 uppercase tracking-wider ml-1">Scripture Verse</label>
                <textarea
                  value={newRefl.verse}
                  onChange={e => setNewRefl({ ...newRefl, verse: e.target.value })}
                  className="w-full bg-slate-500/5 border border-slate-500/10 rounded-2xl py-3 px-5 text-sm outline-none italic h-24 no-scrollbar resize-none"
                  placeholder="e.g. The Lord is my shepherd..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold opacity-40 uppercase tracking-wider ml-1">Citation</label>
                <input
                  type="text"
                  value={newRefl.citation}
                  onChange={e => setNewRefl({ ...newRefl, citation: e.target.value })}
                  className="w-full bg-slate-500/5 border border-slate-500/10 rounded-2xl py-3 px-5 text-sm outline-none"
                  placeholder="e.g. Psalm 23:1"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold opacity-40 uppercase tracking-wider ml-1">Meditation / Reflection</label>
                <textarea
                  value={newRefl.reflection}
                  onChange={e => setNewRefl({ ...newRefl, reflection: e.target.value })}
                  className="w-full bg-slate-500/5 border border-slate-500/10 rounded-2xl py-3 px-5 text-sm outline-none h-32 no-scrollbar resize-none"
                  placeholder="Share a short meditation on this verse..."
                />
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 opacity-40 font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isFormValid}
                className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all shadow-lg ${isFormValid ? activeTheme.button : 'bg-slate-500/20 text-slate-400 cursor-not-allowed'}`}
              >
                {editingRefl ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeTab;
