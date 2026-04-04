
import React, { useState, useMemo } from 'react';
import { ThemeType, Church } from '../types';
import { THEMES } from '../constants';

interface ChurchTabProps {
    theme: ThemeType;
    isDesktop: boolean;
    favoriteChurches: Church[];
    onAddFavorite: (church: Church) => void;
    onUpdateFavorite: (church: Church) => void;
    onDeleteFavorites: (ids: string[]) => void;
    onToggleFavorite: (id: string) => void;
    onSearch: () => Promise<Church[]>;
    isGeminiAvailable: boolean;
}

const ChurchTab: React.FC<ChurchTabProps> = ({
    theme,
    isDesktop,
    favoriteChurches,
    onAddFavorite,
    onUpdateFavorite,
    onDeleteFavorites,
    onToggleFavorite,
    onSearch,
    isGeminiAvailable
}) => {
    const activeTheme = THEMES[theme];
    const [searchResults, setSearchResults] = useState<Church[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingChurch, setEditingChurch] = useState<Church | null>(null);
    const [newChurch, setNewChurch] = useState<Partial<Church>>({
        name: '',
        address: '',
        massSchedule: [],
        uri: ''
    });
    const [showSearchPrompt, setShowSearchPrompt] = useState(false);
    const [expandedChurchId, setExpandedChurchId] = useState<string | null>(null);

    const sortedChurches = useMemo(() => {
        return [...favoriteChurches].sort((a, b) => {
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            return 0;
        });
    }, [favoriteChurches]);

    const handleSearch = async () => {
        setShowSearchPrompt(false);
        setIsSearching(true);
        try {
            const results = await onSearch();
            setSearchResults(results);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedChurchId(prev => prev === id ? null : id);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this church?')) {
            onDeleteFavorites([id]);
        }
    };

    const handleSave = () => {
        if (!newChurch.name || !newChurch.address) return;

        const churchData = {
            ...newChurch,
            massSchedule: newChurch.massSchedule?.filter(s => s.trim() !== '') || []
        };

        if (editingChurch) {
            onUpdateFavorite({ ...editingChurch, ...churchData } as Church);
        } else {
            onAddFavorite({
                id: crypto.randomUUID(),
                name: newChurch.name!,
                address: newChurch.address!,
                uri: newChurch.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(newChurch.name! + ' ' + newChurch.address!)}`,
                massSchedule: churchData.massSchedule,
                isDefault: false,
                isFavorite: false
            });
        }

        setIsAddModalOpen(false);
        setNewChurch({ name: '', address: '', massSchedule: [], uri: '' });
        setEditingChurch(null);
    };

    const openEdit = (church: Church, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingChurch(church);
        setNewChurch({ ...church, massSchedule: church.massSchedule || [] });
        setIsAddModalOpen(true);
    };

    const handleAddSchedule = () => {
        setNewChurch(prev => ({
            ...prev,
            massSchedule: [...(prev.massSchedule || []), '']
        }));
    };

    const handleUpdateSchedule = (index: number, value: string) => {
        setNewChurch(prev => {
            const updated = [...(prev.massSchedule || [])];
            updated[index] = value;
            return { ...prev, massSchedule: updated };
        });
    };

    const handleRemoveSchedule = (index: number) => {
        setNewChurch(prev => ({
            ...prev,
            massSchedule: (prev.massSchedule || []).filter((_, i) => i !== index)
        }));
    };

    const isFormValid = !!(newChurch.name?.trim() && newChurch.address?.trim());

    return (
        <div className={`p-6 space-y-8 ${isDesktop ? '' : 'pt-20'} animate-fade-in relative min-h-full no-scrollbar pb-24`}>
            <header className="flex justify-between items-start">
                <div>
                    <h2 className="font-cinzel text-3xl font-bold tracking-tight ">Parish Finder</h2>
                    <p className="opacity-60 text-[10px] font-bold uppercase tracking-widest mt-1">Locate your spiritual home</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setEditingChurch(null);
                            setNewChurch({ name: '', address: '', massSchedule: [''], uri: '' });
                            setIsAddModalOpen(true);
                        }}
                        className={`p-3 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 ${activeTheme.button}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    </button>
                    <button
                        onClick={() => isGeminiAvailable && setShowSearchPrompt(true)}
                        className={`p-3 rounded-full transition-all ${isGeminiAvailable ? activeTheme.accent + ' bg-slate-500/5 hover:scale-110 active:scale-95' : 'bg-slate-500/10 opacity-30 cursor-not-allowed'}`}
                        title={isGeminiAvailable ? "Find Parishes with AI" : "AI Search is currently offline"}
                    >
                        <svg className={`w-6 h-6 ${isSearching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>
                </div>
            </header>

            {!isGeminiAvailable && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">AI search is not available</p>
                </div>
            )}

            <section className="space-y-4">
                <h3 className="text-[10px] font-bold opacity-40 uppercase tracking-widest px-1">Saved Parishes</h3>

                {sortedChurches.length === 0 ? (
                    <div className={`p-10 rounded-3xl border border-dashed text-center space-y-3 opacity-40 ${activeTheme.card}`}>
                        <p className="text-xs font-medium">No parishes saved yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedChurches.map(church => (
                            <div
                                key={church.id}
                                onClick={() => toggleExpand(church.id)}
                                className={`p-5 rounded-[2rem] border flex flex-col gap-3 group animate-slide-up transition-all cursor-pointer ${activeTheme.card} ${expandedChurchId === church.id ? 'border-amber-700/40 shadow-lg' : 'hover:border-amber-700/20'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-4 flex-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(church.id); }}
                                            className={`mt-1 transition-all transform active:scale-125 ${church.isFavorite ? 'text-red-500 scale-110' : 'opacity-20 hover:opacity-100 hover:text-red-400'}`}
                                            title={church.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                                        >
                                            <svg className={`w-5 h-5 ${church.isFavorite ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        </button>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold ">{church.name}</h4>
                                                {church.isDefault && <span className="text-[9px] font-bold opacity-30 uppercase bg-slate-500/10 px-1.5 py-0.5 rounded">Standard</span>}
                                            </div>
                                            <p className="text-[10px] opacity-40 font-medium">{church.address}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={(e) => openEdit(church, e)}
                                            className="p-2 opacity-40 hover:opacity-100 hover:text-amber-700 transition-all"
                                            title="Edit Parish"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        {!church.isDefault && (
                                            <button
                                                onClick={(e) => handleDelete(church.id, e)}
                                                className="p-2 opacity-40 hover:opacity-100 hover:text-red-500 transition-all"
                                                title="Delete Parish"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {expandedChurchId === church.id && (
                                    <div className="space-y-4 animate-slide-down border-t border-slate-500/5 pt-4 mt-2">
                                        {church.uri && (
                                            <a
                                                href={church.uri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-xl w-fit transition-all ${activeTheme.accent} bg-slate-500/5 hover:bg-slate-500/10`}
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                Directions
                                            </a>
                                        )}

                                        {church.massSchedule && church.massSchedule.length > 0 && (
                                            <div className="bg-slate-500/5 rounded-2xl p-4 space-y-2">
                                                <p className="text-[9px] font-black opacity-30 uppercase tracking-tighter">Mass Schedule</p>
                                                <ul className="space-y-1">
                                                    {church.massSchedule.map((time, i) => (
                                                        <li key={i} className="text-xs opacity-60 font-medium leading-relaxed italic">• {time}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* AI Search Results */}
            {searchResults.length > 0 && (
                <section className="space-y-4 pt-4 border-t border-slate-500/10">
                    <h3 className="text-[10px] font-bold opacity-40 uppercase tracking-widest px-1">AI Search Results</h3>
                    <div className="space-y-4">
                        {searchResults.map(church => {
                            const isSaved = favoriteChurches.some(f => f.name === church.name);
                            return (
                                <div
                                    key={church.id}
                                    onClick={() => toggleExpand(church.id)}
                                    className={`p-5 rounded-[2rem] border flex flex-col gap-3 animate-slide-up transition-all cursor-pointer ${activeTheme.card} ${expandedChurchId === church.id ? 'border-amber-700/40 shadow-lg' : 'hover:border-amber-700/20'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-sm font-bold ">{church.name}</h4>
                                            <p className="text-[10px] opacity-40 font-medium">{church.address}</p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); !isSaved && onAddFavorite(church); }}
                                            className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all ${isSaved ? 'opacity-30 bg-green-500/10 text-green-500' : activeTheme.button}`}
                                        >
                                            {isSaved ? 'Saved' : 'Save as Favorite'}
                                        </button>
                                    </div>
                                    <p className="text-xs opacity-60 leading-relaxed italic">"{church.snippet}"</p>

                                    {expandedChurchId === church.id && (
                                        <div className="animate-slide-down space-y-3 pt-3 border-t border-slate-500/5 mt-1">
                                            {church.massSchedule && church.massSchedule.length > 0 && (
                                                <div className="bg-slate-500/5 rounded-2xl p-4">
                                                    <p className="text-[9px] font-black opacity-30 uppercase tracking-tighter mb-1">Detected Mass Schedule</p>
                                                    <ul className="space-y-1">
                                                        {church.massSchedule.map((time, i) => (
                                                            <li key={i} className="text-xs opacity-50 leading-relaxed italic">• {time}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Search Prompt Modal */}
            {showSearchPrompt && (
                <div className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center p-6 backdrop-blur-md animate-fade-in">
                    <div className={`w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 shadow-2xl ${activeTheme.card}`}>
                        <div className="w-16 h-16 bg-amber-700/10 text-amber-700 rounded-full mx-auto flex items-center justify-center">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <h3 className="font-cinzel text-xl font-bold text-center">AI Parish Finder</h3>
                        <p className="text-sm opacity-60 text-center">I will use AI to scan your local area for Catholic churches, their mass schedules, and other liturgical information.</p>

                        <div className="flex gap-4 pt-2">
                            <button
                                onClick={() => setShowSearchPrompt(false)}
                                className="flex-1 py-4 opacity-40 font-bold text-sm"
                            >
                                Not now
                            </button>
                            <button
                                onClick={handleSearch}
                                className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all ${activeTheme.button}`}
                            >
                                Find Parishes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center p-6 backdrop-blur-md animate-fade-in">
                    <div className={`w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 space-y-6 shadow-2xl no-scrollbar ${activeTheme.card}`}>
                        <h3 className="font-cinzel text-2xl font-bold text-center">{editingChurch ? 'Edit' : 'Add'} Parish</h3>

                        <div className="space-y-4 text-left">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold opacity-40 uppercase tracking-wider ml-1">Parish Name</label>
                                <input
                                    type="text"
                                    value={newChurch.name}
                                    onChange={e => setNewChurch({ ...newChurch, name: e.target.value })}
                                    className="w-full bg-slate-500/5 border border-slate-500/10 rounded-2xl py-3 px-5 text-sm outline-none"
                                    placeholder="e.g. St. Peter's Basilica"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold opacity-40 uppercase tracking-wider ml-1">Address</label>
                                <input
                                    type="text"
                                    value={newChurch.address}
                                    onChange={e => setNewChurch({ ...newChurch, address: e.target.value })}
                                    className="w-full bg-slate-500/5 border border-slate-500/10 rounded-2xl py-3 px-5 text-sm outline-none"
                                    placeholder="Street, City, Postcode"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold opacity-40 uppercase tracking-wider ml-1">Directions URL (Optional)</label>
                                <input
                                    type="text"
                                    value={newChurch.uri}
                                    onChange={e => setNewChurch({ ...newChurch, uri: e.target.value })}
                                    className="w-full bg-slate-500/5 border border-slate-500/10 rounded-2xl py-3 px-5 text-sm outline-none"
                                    placeholder="https://google.com/maps/..."
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[10px] font-bold opacity-40 uppercase tracking-wider">Mass Schedule</label>
                                    <button
                                        onClick={handleAddSchedule}
                                        className={`text-[10px] font-bold uppercase tracking-wider ${activeTheme.accent}`}
                                    >
                                        + Add Time
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {(newChurch.massSchedule || []).map((time, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={time}
                                                onChange={e => handleUpdateSchedule(index, e.target.value)}
                                                className="flex-1 bg-slate-500/5 border border-slate-500/10 rounded-xl py-2 px-4 text-xs outline-none"
                                                placeholder="e.g. Sun: 9:00 AM"
                                            />
                                            <button
                                                onClick={() => handleRemoveSchedule(index)}
                                                className="p-2 text-red-500 opacity-40 hover:opacity-100"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                    {(newChurch.massSchedule || []).length === 0 && (
                                        <p className="text-[10px] opacity-30 italic ml-1">No mass times added yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button
                                onClick={() => { setIsAddModalOpen(false); setEditingChurch(null); }}
                                className="flex-1 py-4 opacity-40 font-bold text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!isFormValid}
                                className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all shadow-lg ${isFormValid ? activeTheme.button : 'bg-slate-500/20 text-slate-400 cursor-not-allowed'}`}
                            >
                                Save Parish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChurchTab;
