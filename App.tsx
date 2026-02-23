
import React, { useState, useEffect } from 'react';
import { TabType, ThemeType, PrayerEvent, Church, DailyReflection, Prayer, GroundingSource } from './types';
import Navigation from './components/Navigation';
import HomeTab from './components/HomeTab';
import PlannerTab from './components/PlannerTab';
import ChurchTab from './components/ChurchTab';
import { findChurches, findChurchesByPlaces, getGospelInsight, checkGeminiStatus } from './services/gemini';
import { THEMES } from './constants';
import DEFAULT_REFLECTIONS from './data/reflections.json';
import { storage, speech } from './utils/helpers';
import DEFAULT_PRAYERS from './data/prayers.json';
import DEFAULT_CHURCHES from './data/churches.json';
import LibraryTab from './components/LibraryTab';

// Initialize churches with isFavorite: false if missing
const INITIAL_DEFAULT_CHURCHES = DEFAULT_CHURCHES.map(c => ({ ...c, isFavorite: false }));

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('classic');
  const [reflection, setReflection] = useState<DailyReflection | null>(null);
  const [plannerEvents, setPlannerEvents] = useState<PrayerEvent[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [customChurches, setCustomChurches] = useState<Church[]>([]);
  const [allChurches, setAllChurches] = useState<Church[]>([]);
  const [customPrayers, setCustomPrayers] = useState<Prayer[]>([]);
  const [allPrayers, setAllPrayers] = useState<Prayer[]>([]);
  const [customReflections, setCustomReflections] = useState<DailyReflection[]>([]);
  const [allReflections, setAllReflections] = useState<DailyReflection[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAIPromptOpen, setIsAIPromptOpen] = useState(false);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [isGeminiAvailable, setIsGeminiAvailable] = useState<boolean | null>(null);
  const [aiInsight, setAiInsight] = useState<{ gospel: string; enlightenment: string; prayer: string; sources: GroundingSource[] } | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });
  const [fallbackPrompt, setFallbackPrompt] = useState<{ isOpen: boolean; lat: number; lng: number; resolve: (results: Church[]) => void } | null>(null);

  useEffect(() => {
    setPlannerEvents(storage.get('fiat_events', []));
    setCurrentTheme(storage.get('fiat_theme', 'classic'));
    const savedChurches = storage.get('fiat_favorite_churches', []);
    const favDefaultIds = storage.get('fiat_favorite_default_ids', []);

    setCustomChurches(savedChurches);
    setAllChurches([
      ...INITIAL_DEFAULT_CHURCHES.map(c => ({ ...c, isFavorite: favDefaultIds.includes(c.id) })),
      ...savedChurches
    ]);
    const savedCustom = storage.get('fiat_custom_prayers', []);
    setCustomPrayers(savedCustom);
    setAllPrayers([...DEFAULT_PRAYERS, ...savedCustom]);

    const savedReflections = storage.get('fiat_custom_reflections', []);
    setCustomReflections(savedReflections);
    const combinedReflections = [...DEFAULT_REFLECTIONS, ...savedReflections];
    setAllReflections(combinedReflections);

    const today = new Date();
    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    setReflection(combinedReflections[dateSeed % combinedReflections.length]);

    // Check Gemini health on load
    checkGeminiStatus().then(available => {
      setIsGeminiAvailable(available);
      if (!available) {
        console.warn("AI services are currently offline.");
      }
    });

    return () => speech.stop();
  }, []);

  useEffect(() => storage.set('fiat_events', plannerEvents), [plannerEvents]);
  useEffect(() => storage.set('fiat_theme', currentTheme), [currentTheme]);
  useEffect(() => {
    storage.set('fiat_favorite_churches', customChurches);
    const favDefaultIds = storage.get('fiat_favorite_default_ids', []);
    setAllChurches([
      ...INITIAL_DEFAULT_CHURCHES.map(c => ({ ...c, isFavorite: favDefaultIds.includes(c.id) })),
      ...customChurches
    ]);
  }, [customChurches]);
  useEffect(() => {
    storage.set('fiat_custom_prayers', customPrayers);
    setAllPrayers([...DEFAULT_PRAYERS, ...customPrayers]);
  }, [customPrayers]);

  useEffect(() => {
    storage.set('fiat_custom_reflections', customReflections);
    const combined = [...DEFAULT_REFLECTIONS, ...customReflections];
    setAllReflections(combined);
    // Also update current reflection if it was changed
  }, [customReflections]);

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      speech.stop();
      setIsSpeaking(false);
    } else {
      speech.speak(text, () => setIsSpeaking(true), () => setIsSpeaking(false));
    }
  };

  const handleSeekInsight = async () => {
    setIsAIPromptOpen(false);
    setIsGeneratingInsight(true);
    try {
      const insight = await getGospelInsight();
      setAiInsight(insight);
      setActiveTab('home');
    } catch (e) {
      setErrorModal({
        isOpen: true,
        title: "Service Busy",
        message: "The AI is currently busy and cannot be accessed at this time. Please try again after 10-30 minutes."
      });
    } finally { setIsGeneratingInsight(false); }
  };

  const handleFallbackSearch = async () => {
    if (!fallbackPrompt) return;
    const { lat, lng, resolve } = fallbackPrompt;
    setFallbackPrompt(null);
    setIsLoading(true);
    try {
      const results = await findChurchesByPlaces(lat, lng);
      resolve(results);
    } catch (e) {
      setErrorModal({
        isOpen: true,
        title: "Maps Service Unavailable",
        message: "Could not retrieve churches from Google Maps at this time. Please try again later."
      });
      resolve([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEvent = (event: PrayerEvent) => {
    setPlannerEvents(prev => [...prev, event]);
  };

  const handleUpdateEvent = (updatedEvent: PrayerEvent) => {
    setPlannerEvents(prev => prev.map(ev => ev.id === updatedEvent.id ? updatedEvent : ev));
  };

  const handleDeleteEvent = (id: string) => {
    setPlannerEvents(prev => prev.filter(ev => ev.id !== id));
  };

  const handleDeleteEvents = (ids: string[]) => {
    setPlannerEvents(prev => prev.filter(ev => !ids.includes(ev.id)));
  };

  const handleAddFavoriteChurch = (church: Church) => {
    setCustomChurches(prev => [...prev, { ...church, isDefault: false }]);
  };

  const handleUpdateFavoriteChurch = (updatedChurch: Church) => {
    setCustomChurches(prev => prev.map(c => c.id === updatedChurch.id ? updatedChurch : c));
  };

  const handleDeleteFavoriteChurches = (ids: string[]) => {
    setCustomChurches(prev => prev.filter(c => !ids.includes(c.id)));
  };

  const handleToggleFavoriteChurch = (id: string) => {
    // We update the isFavorite property in customChurches
    setCustomChurches(prev => prev.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c));

    // If it's a default church that was toggled, we need to handle it.
    // However, the simplest way to allow favoriting DEFAULT churches 
    // is to just allow the 'isFavorite' toggle on 'allChurches' and 
    // persist the 'favoriteDefaultIds'.
    const isDefault = INITIAL_DEFAULT_CHURCHES.some(c => c.id === id);
    if (isDefault) {
      const favIds = storage.get('fiat_favorite_default_ids', []);
      const newFavIds = favIds.includes(id)
        ? favIds.filter((fid: string) => fid !== id)
        : [...favIds, id];
      storage.set('fiat_favorite_default_ids', newFavIds);

      // Force refresh allChurches
      setAllChurches(prev => prev.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c));
    }
  };

  const handleAddPrayer = (prayer: Prayer) => {
    setCustomPrayers(prev => [...prev, prayer]);
  };

  const handleUpdatePrayer = (updatedPrayer: Prayer) => {
    setCustomPrayers(prev => prev.map(p => p.id === updatedPrayer.id ? updatedPrayer : p));
  };

  const handleDeletePrayers = (ids: string[]) => {
    setCustomPrayers(prev => prev.filter(p => !ids.includes(p.id)));
  };

  const handleAddReflection = (refl: DailyReflection) => {
    setCustomReflections(prev => [...prev, refl]);
  };

  const handleUpdateReflection = (updatedRefl: DailyReflection) => {
    setCustomReflections(prev => prev.map(r => r.id === updatedRefl.id ? updatedRefl : r));
    if (reflection?.id === updatedRefl.id) {
      setReflection(updatedRefl);
    }
  };

  const handleDeleteReflection = (id: string) => {
    setCustomReflections(prev => prev.filter(r => r.id !== id));
  };

  const activeTheme = THEMES[currentTheme];

  return (
    <main className={`flex flex-col flex-1 h-screen relative overflow-hidden transition-colors duration-500 ${activeTheme.main}`}>

      {/* Top Toolbar */}
      <nav className="fixed top-0 left-0 right-0 max-w-[500px] mx-auto h-16 flex items-center justify-between px-6 z-40 backdrop-blur-md bg-transparent/10 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-700 rounded-full animate-pulse shadow-[0_0_8px_rgba(180,83,9,0.5)]" />
          <span className="font-cinzel text-xs font-bold tracking-widest opacity-80 uppercase">Catholic Prayer Planner</span>
        </div>
        <div className="flex items-center gap-4">
          {isGeminiAvailable !== false && (
            <button
              onClick={() => setIsAIPromptOpen(true)}
              disabled={isGeminiAvailable === null}
              className={`p-2 rounded-full transition-all ${isGeneratingInsight ? 'animate-pulse text-amber-500' : 'opacity-40 hover:opacity-100'} ${isGeminiAvailable === null ? 'cursor-wait' : ''}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </button>
          )}
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 opacity-40 hover:opacity-100 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {isLoading && (
          <div className="fixed inset-0 z-[200] bg-inherit flex items-center justify-center">
            <div className="text-center space-y-6 animate-fade-in">
              <div className="w-16 h-16 bg-amber-700 rounded-full mx-auto flex items-center justify-center text-white shadow-2xl">
                <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              </div>
              <p className="font-cinzel text-xs font-bold tracking-[0.3em] opacity-40 uppercase">Agnus Dei...</p>
            </div>
          </div>
        )}

        {activeTab === 'home' && (
          <HomeTab
            theme={currentTheme}
            reflection={reflection}
            allReflections={allReflections}
            aiInsight={aiInsight}
            isGeneratingInsight={isGeneratingInsight}
            plannerEvents={plannerEvents}
            isSpeaking={isSpeaking}
            handleSpeak={handleSpeak}
            onClearInsight={() => setAiInsight(null)}
            onAddReflection={handleAddReflection}
            onUpdateReflection={handleUpdateReflection}
            onDeleteReflection={handleDeleteReflection}
            onSelectReflection={setReflection}
          />
        )}

        {activeTab === 'planner' && (
          <PlannerTab
            theme={currentTheme}
            events={plannerEvents}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onDeleteEvents={handleDeleteEvents}
          />
        )}

        {activeTab === 'churches' && (
          <ChurchTab
            theme={currentTheme}
            favoriteChurches={allChurches}
            isGeminiAvailable={!!isGeminiAvailable}
            onAddFavorite={handleAddFavoriteChurch}
            onUpdateFavorite={handleUpdateFavoriteChurch}
            onDeleteFavorites={handleDeleteFavoriteChurches}
            onToggleFavorite={handleToggleFavoriteChurch}
            onSearch={async () => {
              if (!navigator.geolocation) {
                alert("Geolocation not supported");
                return [];
              }
              return new Promise<Church[]>((resolve) => {
                navigator.geolocation.getCurrentPosition(
                  async (pos) => {
                    try {
                      const results = await findChurches(pos.coords.latitude, pos.coords.longitude);
                      resolve(results);
                    } catch (e) {
                      setFallbackPrompt({
                        isOpen: true,
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        resolve
                      });
                    }
                  },
                  () => {
                    alert("Location access denied.");
                    resolve([]);
                  }
                );
              });
            }}
          />
        )}

        {activeTab === 'library' && (
          <LibraryTab
            theme={currentTheme}
            prayers={allPrayers}
            onAddPrayer={handleAddPrayer}
            onUpdatePrayer={handleUpdatePrayer}
            onDeletePrayers={handleDeletePrayers}
            isSpeaking={isSpeaking}
            handleSpeak={handleSpeak}
          />
        )}
      </div>

      {/* Settings Modal (Simplified) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-6 backdrop-blur-md">
          <div className={`w-full max-w-sm rounded-[2.5rem] p-8 space-y-8 shadow-2xl ${activeTheme.card}`}>
            <h3 className="font-cinzel text-xl font-bold border-b border-slate-100/10 pb-4">Settings</h3>
            <div className="grid grid-cols-3 gap-3">
              {(['classic', 'dark', 'sepia'] as ThemeType[]).map(t => (
                <button key={t} onClick={() => setCurrentTheme(t)} className={`py-3 rounded-2xl text-[10px] font-bold uppercase border transition-all ${currentTheme === t ? 'bg-amber-700 text-white' : 'bg-slate-500/10'}`}>{t}</button>
              ))}
            </div>
            <button onClick={() => setIsSettingsOpen(false)} className={`w-full py-4 rounded-2xl font-bold ${activeTheme.button}`}>Close</button>
          </div>
        </div>
      )}

      {/* AI Prompt Modal (Simplified) */}
      {isAIPromptOpen && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-6 backdrop-blur-md">
          <div className={`w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 shadow-2xl ${activeTheme.card}`}>
            <h3 className="font-cinzel text-xl font-bold text-center">Divine Insight</h3>
            <p className="text-sm opacity-60 text-center">Generate a reflection based on today's readings?</p>
            <div className="flex gap-4">
              <button onClick={() => setIsAIPromptOpen(false)} className="flex-1 py-4 opacity-40 font-bold">Decline</button>
              <button onClick={handleSeekInsight} className={`flex-1 py-4 rounded-2xl font-bold ${activeTheme.button}`}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      {errorModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center p-6 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 shadow-2xl border border-red-500/20 ${activeTheme.card}`}>
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2 text-red-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-cinzel text-xl font-bold text-center text-red-500">{errorModal.title}</h3>
            <p className="text-sm opacity-70 text-center leading-relaxed">
              {errorModal.message}
            </p>
            <button
              onClick={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
              className={`w-full py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-lg ${activeTheme.button}`}
            >
              Acknowledged
            </button>
          </div>
        </div>
      )}

      {/* Fallback Prompt Modal */}
      {fallbackPrompt?.isOpen && (
        <div className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center p-6 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 shadow-2xl border border-amber-500/20 ${activeTheme.card}`}>
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-2 text-amber-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-cinzel text-xl font-bold text-center text-amber-500">AI Service Offline</h3>
            <p className="text-sm opacity-70 text-center leading-relaxed">
              The AI service is currently unavailable. Would you like to retry using the Google Maps service instead?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  fallbackPrompt.resolve([]);
                  setFallbackPrompt(null);
                }}
                className="flex-1 py-4 opacity-40 font-bold"
              >
                No Thanks
              </button>
              <button
                onClick={handleFallbackSearch}
                className={`flex-1 py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-lg ${activeTheme.button}`}
              >
                Retry with Maps
              </button>
            </div>
          </div>
        </div>
      )}

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </main>
  );
};

export default App;
