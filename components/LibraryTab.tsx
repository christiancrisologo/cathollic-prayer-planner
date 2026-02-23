
import React, { useState, useMemo } from 'react';
import { Prayer, ThemeType } from '../types';
import { THEMES } from '../constants';
import SpeakerIcon from './shared/SpeakerIcon';

interface LibraryTabProps {
    theme: ThemeType;
    prayers: Prayer[];
    onAddPrayer: (prayer: Prayer) => void;
    onUpdatePrayer: (prayer: Prayer) => void;
    onDeletePrayers: (ids: string[]) => void;
    isSpeaking: boolean;
    handleSpeak: (text: string) => void;
}

const LibraryTab: React.FC<LibraryTabProps> = ({
    theme,
    prayers,
    onAddPrayer,
    onUpdatePrayer,
    onDeletePrayers,
    isSpeaking,
    handleSpeak
}) => {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingPrayer, setEditingPrayer] = useState<Prayer | null>(null);
    const [newPrayer, setNewPrayer] = useState<Partial<Prayer>>({ title: '', content: '', category: 'Personal' });
    const [viewingPrayer, setViewingPrayer] = useState<Prayer | null>(null);

    const activeTheme = THEMES[theme];

    // Extract unique categories
    const categories = useMemo(() => {
        const cats = new Set(prayers.map(p => p.category));
        return ['All', ...Array.from(cats).sort()];
    }, [prayers]);

    const filteredPrayers = prayers.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.content.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this prayer?')) {
            onDeletePrayers([id]);
        }
    };

    const handleSave = () => {
        if (!newPrayer.title || !newPrayer.content || !newPrayer.category) return;

        if (editingPrayer) {
            onUpdatePrayer({ ...editingPrayer, ...newPrayer } as Prayer);
        } else {
            onAddPrayer({
                id: crypto.randomUUID(),
                title: newPrayer.title!,
                content: newPrayer.content!,
                category: newPrayer.category!,
                isDefault: false
            });
        }

        setIsAddModalOpen(false);
        setNewPrayer({ title: '', content: '', category: 'Personal' });
        setEditingPrayer(null);
    };

    const openEdit = (prayer: Prayer, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingPrayer(prayer);
        setNewPrayer(prayer);
        setIsAddModalOpen(true);
    };

    const isFormValid = !!(newPrayer.title?.trim() && newPrayer.content?.trim() && newPrayer.category?.trim());

    return (
        <div className="flex flex-col h-full p-6 pt-24 space-y-6 animate-fade-in no-scrollbar pb-24">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-cinzel text-3xl font-bold tracking-tight  ">Prayers</h2>
                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] mt-1">Faith Library</p>
                </div>
                <button
                    onClick={() => { setEditingPrayer(null); setNewPrayer({ title: '', content: '', category: 'Personal' }); setIsAddModalOpen(true); }}
                    className={`p-4 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 ${activeTheme.button}`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                </button>
            </div>

            <div className="space-y-4">
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Search prayers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-500/5 border border-slate-500/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700/20 transition-all font-medium"
                    />
                    <svg className="w-5 h-5 absolute right-6 top-1/2 -translate-y-1/2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                {/* Category Pills */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCategory === cat
                                ? 'bg-amber-700 text-white border-amber-800 shadow-md ring-2 ring-amber-700/20'
                                : 'bg-slate-500/5 text-slate-500 border-slate-500/10 hover:bg-slate-500/10'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {filteredPrayers.length === 0 ? (
                    <div className="py-20 text-center opacity-30 italic text-sm">No prayers found in this category.</div>
                ) : (
                    filteredPrayers.map(prayer => (
                        <div
                            key={prayer.id}
                            onClick={() => setViewingPrayer(prayer)}
                            className={`group flex items-center justify-between p-5 rounded-3xl border transition-all cursor-pointer ${activeTheme.card} hover:border-amber-700/30 hover:shadow-lg active:scale-[0.98]`}
                        >
                            <div className="flex flex-col gap-1 overflow-hidden mr-4">
                                <h3 className="font-cinzel font-bold text-base tracking-tight truncate group-hover:text-amber-800 dark:group-hover:text-amber-200 transition-colors">{prayer.title}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest group-hover:opacity-60 transition-all">{prayer.category}</span>
                                    {prayer.isDefault && <div className="w-1 h-1 rounded-full bg-amber-700 opacity-20" />}
                                </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                                {!prayer.isDefault && (
                                    <>
                                        <button
                                            onClick={(e) => openEdit(prayer, e)}
                                            className="p-2 opacity-20 hover:opacity-100 hover:text-amber-700 transition-all"
                                            title="Edit Prayer"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(prayer.id, e)}
                                            className="p-2 opacity-20 hover:opacity-100 hover:text-red-500 transition-all"
                                            title="Delete Prayer"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </>
                                )}
                                <div className="p-2 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* View Prayer Modal */}
            {viewingPrayer && (
                <div className="fixed inset-0 bg-black/95 z-[500] flex items-center justify-center p-6 backdrop-blur-2xl animate-fade-in" onClick={() => setViewingPrayer(null)}>
                    <div
                        className={`w-full max-w-sm max-h-[85vh] overflow-y-auto rounded-[3rem] p-8 space-y-8 shadow-2xl no-scrollbar border border-white/10 ${activeTheme.card} transform transition-all duration-350 ease-out scale-100`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start pt-2">
                            <div className="flex-1 mr-4">
                                <span className="text-[10px] font-bold opacity-30 uppercase tracking-[0.3em] font-cinzel mb-2 block">{viewingPrayer.category}</span>
                                <h3 className="font-cinzel text-2xl font-black tracking-tight leading-tight  ">{viewingPrayer.title}</h3>
                            </div>
                            <SpeakerIcon
                                isSpeaking={isSpeaking}
                                onSpeak={() => handleSpeak(`${viewingPrayer.title}. ${viewingPrayer.content}`)}
                            />
                        </div>

                        <div className="space-y-6">
                            {viewingPrayer.content.split('\n').filter(p => p.trim()).map((para, i) => (
                                <p key={i} className="text-lg leading-relaxed italic font-medium opacity-90   font-serif-elegant">
                                    {para.trim()}
                                </p>
                            ))}
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={() => setViewingPrayer(null)}
                                className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl ${activeTheme.button}`}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-[400] flex items-center justify-center p-6 backdrop-blur-md animate-fade-in">
                    <div className={`w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 space-y-6 shadow-2xl no-scrollbar ${activeTheme.card}`}>
                        <div className="flex justify-between items-center">
                            <h3 className="font-cinzel text-2xl font-bold">{editingPrayer ? 'Edit' : 'Add'} Prayer</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="opacity-40 hover:opacity-100">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-4 text-left">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider opacity-40 ml-1">Title</label>
                                <input
                                    value={newPrayer.title}
                                    onChange={e => setNewPrayer(p => ({ ...p, title: e.target.value }))}
                                    className="w-full bg-slate-500/5 border border-slate-500/10 rounded-2xl py-3 px-5 text-sm outline-none focus:border-amber-700/50 transition-colors"
                                    placeholder="e.g. Prayer for Peace"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider opacity-40 ml-1">Category</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Personal', 'Devotion', 'Petition', 'Gratitude'].map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setNewPrayer(p => ({ ...p, category: cat }))}
                                            className={`py-2 px-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${newPrayer.category === cat
                                                ? 'bg-amber-700 text-white border-amber-800'
                                                : 'bg-slate-500/5 text-slate-500 border-slate-500/10 hover:bg-slate-500/10'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={newPrayer.category === 'Personal' || newPrayer.category === 'Devotion' || newPrayer.category === 'Petition' || newPrayer.category === 'Gratitude' ? '' : newPrayer.category}
                                    onChange={e => setNewPrayer(p => ({ ...p, category: e.target.value }))}
                                    className="w-full bg-slate-500/5 border border-slate-500/10 rounded-2xl py-2 px-5 text-xs outline-none mt-2 italic"
                                    placeholder="Or type custom category..."
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider opacity-40 ml-1">Content</label>
                                <textarea
                                    value={newPrayer.content}
                                    onChange={e => setNewPrayer(p => ({ ...p, content: e.target.value }))}
                                    className="w-full bg-slate-500/5 border border-slate-500/10 rounded-2xl py-3 px-5 text-sm outline-none h-40 resize-none no-scrollbar shadow-inner focus:border-amber-700/50 transition-colors"
                                    placeholder="The words of the prayer..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button
                                onClick={handleSave}
                                disabled={!isFormValid}
                                className={`flex-1 py-4 rounded-2xl font-bold shadow-lg transition-all ${isFormValid ? activeTheme.button : 'bg-slate-500/20 text-slate-400 cursor-not-allowed'}`}
                            >
                                Save Prayer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LibraryTab;
