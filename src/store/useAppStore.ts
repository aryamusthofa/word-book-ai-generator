import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ApiKeyEntry {
  id: string;        // nanoid
  key: string;       // actual key (stored locally, never sent to cloud)
  label: string;     // user-defined label e.g. "Key 1", "Main Key"
  addedAt: number;   // timestamp
}

export interface GuestBook {
  id: string;
  topic: string;
  lang: string;
  pages: number;
  structure: any[];
  content: Record<string, string>;
  wordCount: number;
  pageCount: number;
  status: "generating" | "completed" | "interrupted";
  providerUsed?: string;
  modelUsed?: string;
  createdAt: number;
}

interface AppState {
  // Theme
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;

  // Language
  appLang: string;
  setAppLang: (lang: string) => void;

  // API Keys - multi-key per provider, stored ONLY locally
  apiKeys: Record<string, ApiKeyEntry[]>;
  addApiKey: (provider: string, key: string, label?: string) => string; // returns id
  removeApiKey: (provider: string, id: string) => void;
  updateApiKeyLabel: (provider: string, id: string, label: string) => void;
  getFirstKey: (provider: string) => string | undefined;
  getAllKeysFlat: () => Record<string, string>; // legacy compat

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
  guestBooksUsed: number;
  incrementGuestBooks: () => void;

  // Guest Books (local storage for guest users)
  guestBooks: GuestBook[];
  addGuestBook: (book: Omit<GuestBook, "id" | "createdAt">) => string; // returns id
  updateGuestBook: (id: string, data: Partial<GuestBook>) => void;
  deleteGuestBook: (id: string) => void;

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

  // Cached user tier (refreshed on login)
  cachedTier: "guest" | "free" | "premium" | null;
  setCachedTier: (tier: "guest" | "free" | "premium" | null) => void;
}

const generateId = () => Math.random().toString(36).slice(2, 10);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),

      appLang: "en",
      setAppLang: (lang) => set({ appLang: lang }),

      // Multi-key API keys
      apiKeys: {},
      addApiKey: (provider, key, label) => {
        const id = generateId();
        const existing = get().apiKeys[provider] || [];
        const keyLabel = label || `Key ${existing.length + 1}`;
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [provider]: [...(state.apiKeys[provider] || []), { id, key, label: keyLabel, addedAt: Date.now() }],
          },
        }));
        return id;
      },
      removeApiKey: (provider, id) =>
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [provider]: (state.apiKeys[provider] || []).filter((e) => e.id !== id),
          },
        })),
      updateApiKeyLabel: (provider, id, label) =>
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [provider]: (state.apiKeys[provider] || []).map((e) =>
              e.id === id ? { ...e, label } : e
            ),
          },
        })),
      getFirstKey: (provider) => {
        const keys = get().apiKeys[provider];
        return keys && keys.length > 0 ? keys[0].key : undefined;
      },
      getAllKeysFlat: () => {
        const result: Record<string, string> = {};
        const allKeys = get().apiKeys;
        for (const [provider, entries] of Object.entries(allKeys)) {
          if (entries.length > 0) {
            result[provider] = entries[0].key;
          }
        }
        return result;
      },

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
      guestBooksUsed: 0,
      incrementGuestBooks: () => set((s) => ({ guestBooksUsed: s.guestBooksUsed + 1 })),

      guestBooks: [],
      addGuestBook: (book) => {
        const id = generateId();
        set((s) => ({
          guestBooks: [
            ...s.guestBooks,
            { ...book, id, createdAt: Date.now() },
          ],
        }));
        return id;
      },
      updateGuestBook: (id, data) =>
        set((s) => ({
          guestBooks: s.guestBooks.map((b) => (b.id === id ? { ...b, ...data } : b)),
        })),
      deleteGuestBook: (id) =>
        set((s) => ({ guestBooks: s.guestBooks.filter((b) => b.id !== id) })),

      isGenerating: false,
      generationProgress: 0,
      generationTopic: "",
      setGenerating: (val) => set({ isGenerating: val }),
      setGenerationProgress: (val) => set({ generationProgress: val }),
      setGenerationTopic: (val) => set({ generationTopic: val }),

      sidebarOpen: false,
      setSidebarOpen: (val) => set({ sidebarOpen: val }),

      cachedTier: null,
      setCachedTier: (tier) => set({ cachedTier: tier }),
    }),
    {
      name: "wordai-storage-v2",
      partialize: (state) => ({
        theme: state.theme,
        appLang: state.appLang,
        apiKeys: state.apiKeys,
        selectedModel: state.selectedModel,
        settings: state.settings,
        guestId: state.guestId,
        guestBooksUsed: state.guestBooksUsed,
        guestBooks: state.guestBooks,
        cachedTier: state.cachedTier,
      }),
    }
  )
);
