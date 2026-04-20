import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set) => ({
      aiProvider: 'deepseek', // 'deepseek' 或 'volc'
      setAiProvider: (provider) => set({ aiProvider: provider }),
    }),
    {
      name: 'app-settings', // localStorage key
    }
  )
);