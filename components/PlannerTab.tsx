
import React, { useState } from 'react';
import { ThemeType, PrayerEvent } from '../types';
import { THEMES } from '../constants';

interface PlannerTabProps {
    theme: ThemeType;
    events: PrayerEvent[];
    onAddEvent: (event: PrayerEvent) => void;
    onUpdateEvent: (event: PrayerEvent) => void;
    onDeleteEvent: (id: string) => void;
    onDeleteEvents: (ids: string[]) => void;
}

const PlannerTab: React.FC<PlannerTabProps> = ({ theme, events, onAddEvent, onUpdateEvent, onDeleteEvent, onDeleteEvents }) => {
    const activeTheme = THEMES[theme];
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [editingEvent, setEditingEvent] = useState<PrayerEvent | null>(null);

    const [newEvent, setNewEvent] = useState<Partial<PrayerEvent>>({
        title: '',
        time: '08:00',
        recurrence: 'Once',
        notify: true,
        completed: false
    });

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

    const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const calendarDays = [];
    const totalDays = daysInMonth(year, month);
    const offset = firstDayOfMonth(year, month);

    for (let i = 0; i < offset; i++) calendarDays.push(null);
    for (let i = 1; i <= totalDays; i++) calendarDays.push(i);

    const selectedDateEvents = events.filter(ev => ev.date === selectedDate);

    const handleAddSubmit = () => {
        if (!newEvent.title) return;

        if (editingEvent) {
            onUpdateEvent({
                ...editingEvent,
                title: newEvent.title!,
                time: newEvent.time || '08:00',
                recurrence: (newEvent.recurrence as any) || 'Once',
                notify: !!newEvent.notify
            });
        } else {
            const event: PrayerEvent = {
                id: crypto.randomUUID(),
                title: newEvent.title!,
                time: newEvent.time || '08:00',
                date: selectedDate,
                completed: false,
                recurrence: (newEvent.recurrence as any) || 'Once',
                notify: !!newEvent.notify
            };
            onAddEvent(event);
        }

        setShowAddModal(false);
        setEditingEvent(null);
        setNewEvent({ title: '', time: '08:00', recurrence: 'Once', notify: true, completed: false });
    };

    const handleEditClick = (ev: PrayerEvent) => {
        setEditingEvent(ev);
        setNewEvent({
            title: ev.title,
            time: ev.time,
            recurrence: ev.recurrence,
            notify: ev.notify,
            completed: ev.completed
        });
        setShowAddModal(true);
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkDelete = () => {
        onDeleteEvents(selectedIds);
        setSelectedIds([]);
        setShowDeleteConfirm(false);
    };

    return (
        <div className="p-6 space-y-6 pt-20 animate-fade-in relative min-h-full">
            <header>
                <h2 className="font-cinzel text-2xl font-bold tracking-tight">Prayer Planner</h2>
                <p className="opacity-60 text-xs italic font-medium">Schedule your sacred moments.</p>
            </header>

            {/* Calendar UI */}
            <section className={`rounded-[2rem] p-6 border ${activeTheme.card}`}>
                <div className="flex justify-between items-center mb-6">
                    <button onClick={handlePrevMonth} className="p-2 opacity-40 hover:opacity-100 transition-opacity">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h3 className="font-cinzel text-sm font-bold uppercase tracking-widest">{monthYear}</h3>
                    <button onClick={handleNextMonth} className="p-2 opacity-40 hover:opacity-100 transition-opacity">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="text-center text-[10px] font-bold opacity-30 py-2">{day}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, i) => {
                        if (day === null) return <div key={i} />;
                        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isSelected = selectedDate === dateKey;
                        const hasEvents = events.some(ev => ev.date === dateKey);

                        return (
                            <button
                                key={i}
                                onClick={() => {
                                    setSelectedDate(dateKey);
                                    setEditingEvent(null);
                                    setNewEvent({ title: '', time: '08:00', recurrence: 'Once', notify: true, completed: false });
                                    setShowAddModal(true);
                                }}
                                className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all relative ${isSelected ? activeTheme.button : 'hover:bg-amber-500/10'}`}
                            >
                                {day}
                                {hasEvents && !isSelected && (
                                    <div className="absolute bottom-1 w-1 h-1 bg-amber-600 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Daily Reminders */}
            <section className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-3">
                        <h3 className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                            {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        </h3>
                        {selectedIds.length > 0 && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="bg-red-500/10 text-red-500 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Delete ({selectedIds.length})
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            setEditingEvent(null);
                            setNewEvent({ title: '', time: '08:00', recurrence: 'Once', notify: true, completed: false });
                            setShowAddModal(true);
                        }}
                        className={`p-2 rounded-full transition-all ${activeTheme.accent} hover:scale-110 active:scale-95`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    </button>
                </div>

                {selectedDateEvents.length === 0 ? (
                    <div className={`p-10 rounded-3xl border border-dashed text-center space-y-3 opacity-40 ${activeTheme.card}`}>
                        <p className="text-xs font-medium">No spiritual activities planned.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {selectedDateEvents.sort((a, b) => a.time.localeCompare(b.time)).map(ev => (
                            <div
                                key={ev.id}
                                onClick={() => toggleSelect(ev.id)}
                                className={`p-4 rounded-3xl flex items-center gap-4 border group animate-slide-up cursor-pointer transition-all ${activeTheme.card} ${selectedIds.includes(ev.id) ? 'ring-2 ring-amber-500/50 scale-[0.98]' : ''}`}
                            >
                                <div className={`w-5 h-5 rounded-md flex-shrink-0 border flex items-center justify-center transition-all ${selectedIds.includes(ev.id) ? 'bg-amber-500 border-amber-600' : 'border-slate-300 opacity-40'}`}>
                                    {selectedIds.includes(ev.id) && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); onUpdateEvent({ ...ev, completed: !ev.completed }); }}
                                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all border ${ev.completed ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-transparent border-slate-200 opacity-40'}`}
                                >
                                    {ev.completed && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                </button>
                                <div className="flex-1">
                                    <h4 className={`text-sm font-bold ${ev.completed ? 'opacity-30 line-through' : ''}`}>{ev.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold opacity-40">{ev.time}</span>
                                        <span className="text-[10px] font-bold opacity-20">•</span>
                                        <span className="text-[10px] font-bold opacity-40">{ev.recurrence}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEditClick(ev); }}
                                    className="p-2 opacity-0 group-hover:opacity-40 hover:opacity-100 transition-all text-amber-600"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center p-6 backdrop-blur-md animate-fade-in">
                    <div className={`w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 shadow-2xl ${activeTheme.card}`}>
                        <h3 className="font-cinzel text-xl font-bold text-center">{editingEvent ? 'Edit Activity' : 'New Spiritual Activity'}</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold opacity-40 uppercase ml-2">Activity Name</label>
                                <input
                                    type="text"
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                    placeholder="e.g. Morning Rosary"
                                    className="w-full bg-slate-500/10 border-none rounded-2xl p-4 text-sm mt-1 focus:ring-1 focus:ring-amber-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold opacity-40 uppercase ml-2">Time</label>
                                    <input
                                        type="time"
                                        value={newEvent.time}
                                        onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                                        className="w-full bg-slate-500/10 border-none rounded-2xl p-4 text-sm mt-1 focus:ring-1 focus:ring-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold opacity-40 uppercase ml-2">Recurrence</label>
                                    <select
                                        value={newEvent.recurrence}
                                        onChange={e => setNewEvent({ ...newEvent, recurrence: e.target.value as any })}
                                        className="w-full bg-slate-500/10 border-none rounded-2xl p-4 text-sm mt-1 focus:ring-1 focus:ring-amber-500"
                                    >
                                        <option>Once</option>
                                        <option>Daily</option>
                                        <option>Weekly</option>
                                        <option>Monthly</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-slate-500/5 rounded-2xl">
                                <input
                                    type="checkbox"
                                    id="notify"
                                    checked={newEvent.notify}
                                    onChange={e => setNewEvent({ ...newEvent, notify: e.target.checked })}
                                    className="w-4 h-4 rounded border-amber-600 text-amber-600 focus:ring-amber-500"
                                />
                                <label htmlFor="notify" className="text-xs font-bold opacity-60">Notify me on device</label>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setEditingEvent(null);
                                    setNewEvent({ title: '', time: '08:00', recurrence: 'Once', notify: true, completed: false });
                                }}
                                className="flex-1 py-4 opacity-40 font-bold text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddSubmit}
                                disabled={!newEvent.title}
                                className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all ${newEvent.title ? activeTheme.button : 'bg-slate-500/20 opacity-50 cursor-not-allowed'}`}
                            >
                                {editingEvent ? 'Save Changes' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Confirm Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/80 z-[600] flex items-center justify-center p-6 backdrop-blur-md animate-fade-in">
                    <div className={`w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 shadow-2xl ${activeTheme.card} border-red-500/20`}>
                        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full mx-auto flex items-center justify-center">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h3 className="font-cinzel text-xl font-bold text-center">Confirm Deletion</h3>
                        <p className="text-sm opacity-60 text-center">Are you sure you want to delete {selectedIds.length} selected activities? This action cannot be undone.</p>

                        <div className="flex gap-4 pt-2">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-4 opacity-40 font-bold text-sm"
                            >
                                Keep them
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-900/20"
                            >
                                Delete All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlannerTab;
