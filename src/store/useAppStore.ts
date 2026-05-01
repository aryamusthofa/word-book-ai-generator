import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  // Theme
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;

  // Language
  appLang: string;
  setAppLang: (lang: string) => void;

  // API Keys (client-side storage for quick access)
  apiKeys: Record<string, string>;
  setApiKey: (provider: string, key: string) => void;
  removeApiKey: (provider: string) => void;

  // Selected Model
  selectedModel: string;
  setSelectedModel: (model: string) => void;

  // Generation Settings
  settings: {
    authorName: string;
    writingStyle: string;
    audience: string;
    bookLang: string;
    customPromptEnabled: boolean;
    customPromptContent: string;
  };
  updateSetting: (key: string, value: any) => void;

  // Guest
  guestId: string | null;
  setGuestId: (id: string | null) => void;

  // Generation State
  isGenerating: boolean;
  generationProgress: number;
  generationTopic: string;
  setGenerating: (val: boolean) => void;
  setGenerationProgress: (val: number) => void;
  setGenerationTopic: (val: string) => void;

  // UI
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),

      appLang: "en",
      setAppLang: (lang) => set({ appLang: lang }),

      apiKeys: {},
      setApiKey: (provider, key) =>
        set((state) => ({ apiKeys: { ...state.apiKeys, [provider]: key } })),
      removeApiKey: (provider) =>
        set((state) => {
          const { [provider]: _, ...rest } = state.apiKeys;
          return { apiKeys: rest };
        }),

      selectedModel: "auto:auto",
      setSelectedModel: (model) => set({ selectedModel: model }),

      settings: {
        authorName: "",
        writingStyle: "educational",
        audience: "high_school",
        bookLang: "en",
        customPromptEnabled: false,
        customPromptContent: "",
      },
      updateSetting: (key, value) =>
        set((state) => ({ settings: { ...state.settings, [key]: value } })),

      guestId: null,
      setGuestId: (id) => set({ guestId: id }),

      isGenerating: false,
      generationProgress: 0,
      generationTopic: "",
      setGenerating: (val) => set({ isGenerating: val }),
      setGenerationProgress: (val) => set({ generationProgress: val }),
      setGenerationTopic: (val) => set({ generationTopic: val }),

      sidebarOpen: false,
      setSidebarOpen: (val) => set({ sidebarOpen: val }),
    }),
    {
      name: "wordai-storage",
      partialize: (state) => ({
        theme: state.theme,
        appLang: state.appLang,
        apiKeys: state.apiKeys,
        selectedModel: state.selectedModel,
        settings: state.settings,
        guestId: state.guestId,
      }),
    }
  )
);
