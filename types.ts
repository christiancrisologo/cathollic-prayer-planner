export interface PrayerEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  completed: boolean;
  recurrence: 'Once' | 'Daily' | 'Weekly' | 'Monthly';
  notify: boolean;
}

export interface Church {
  id: string;
  name: string;
  address: string;
  distance?: string;
  uri?: string;
  snippet?: string;
  massSchedule?: string[];
  isDefault?: boolean;
  isFavorite?: boolean;
}

export interface Prayer {
  id: string;
  title: string;
  content: string;
  category: string;
  isDefault?: boolean;
}

export type TabType = 'home' | 'planner' | 'churches' | 'library';
export type ThemeType = 'classic' | 'dark' | 'sepia';

export interface DailyReflection {
  id: string;
  verse: string;
  citation: string;
  reflection: string;
  isDefault?: boolean;
}

// Grounding source interface for Gemini API search results
export interface GroundingSource {
  web?: {
    uri?: string;
    title?: string;
  };
  maps?: {
    uri?: string;
    title?: string;
  };
}