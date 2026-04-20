import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/apiClient';

function ensureArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(/[,\n、]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function resolvePersonaId(persona) {
  if (!persona) return '';
  return String(persona.id || persona.personaId || '').trim();
}

export const createEmptyPersona = () => ({
  id: crypto.randomUUID(),
  name: '',
  platform: 'toutiao',
  role: '',
  intro: '',
  tone: 'professional',
  audience: '',
  titleStyle: '',
  contentAngles: [],
  keywords: [],
  taboo: '',
  prompt: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  // 兼容旧结构
  bio: '',
  description: '',
  tabooWords: [],
  occupation: '',
  writingStyle: {
    tone: 'professional',
    emojiUsage: 'minimal',
    dialect: '',
    tabooWords: [],
    description: '',
  },
  contentPreference: 'mixed',
  age: 0,
});

function normalizePersona(persona) {
  if (!persona) return null;

  let ws = persona.writingStyle;
  if (typeof ws === 'string') {
    try {
      ws = JSON.parse(ws);
    } catch {
      ws = {};
    }
  }
  ws = ws || {};

  const id = resolvePersonaId(persona);
  const role = persona.role || persona.occupation || '';
  const intro = persona.intro || persona.bio || '';
  const tone = persona.tone || ws.tone || 'professional';
  const audience = persona.audience || '';
  const titleStyle = persona.titleStyle || persona.headlineStyle || '';
  const contentAngles = ensureArray(persona.contentAngles);
  const keywords = ensureArray(persona.keywords);
  const tabooArray = ensureArray(persona.tabooWords || ws.tabooWords);
  const taboo = persona.taboo || tabooArray.join('、') || '';
  const prompt =
    persona.prompt ||
    persona.systemPrompt ||
    persona.description ||
    ws.description ||
    '';

  return {
    id,
    name: persona.name || '',
    platform: persona.platform || 'toutiao',
    role,
    intro,
    tone,
    audience,
    titleStyle,
    contentAngles,
    keywords,
    taboo,
    prompt,
    createdAt: persona.createdAt || new Date().toISOString(),
    updatedAt: persona.updatedAt || new Date().toISOString(),

    // 兼容旧结构
    bio: intro,
    description: prompt,
    tabooWords: tabooArray.length > 0 ? tabooArray : ensureArray(taboo),
    occupation: role,
    writingStyle: {
      tone,
      emojiUsage: ws.emojiUsage || 'minimal',
      dialect: ws.dialect || '',
      tabooWords: tabooArray.length > 0 ? tabooArray : ensureArray(taboo),
      description: prompt,
    },
    contentPreference: persona.contentPreference || 'mixed',
    age: Number(persona.age) || 0,
  };
}

function toApiPayload(persona) {
  const p = normalizePersona(persona);

  return {
    id: p.id,
    name: p.name,
    platform: p.platform,
    role: p.role,
    intro: p.intro,
    tone: p.tone,
    audience: p.audience,
    titleStyle: p.titleStyle,
    contentAngles: p.contentAngles,
    keywords: p.keywords,
    taboo: p.taboo,
    prompt: p.prompt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,

    // 兼容旧 API / 旧数据库字段
    occupation: p.role,
    bio: p.intro,
    description: p.prompt,
    tabooWords: ensureArray(p.taboo),
    writingStyle: {
      tone: p.tone,
      emojiUsage: 'minimal',
      dialect: '',
      tabooWords: ensureArray(p.taboo),
      description: p.prompt,
    },
    contentPreference: p.contentPreference || 'mixed',
    age: Number(p.age) || 0,
  };
}

export const usePersonaStore = create(
  persist(
    (set, get) => ({
      personas: [],
      activePersonaId: null,
      isLoading: false,
      error: null,

      loadPersonas: async () => {
        set({ isLoading: true, error: null });

        try {
          let personas = await api.getPersonas();
          if (!Array.isArray(personas)) personas = [];

          personas = personas.map(normalizePersona).filter(Boolean);

          set({
            personas,
            activePersonaId: get().activePersonaId || personas[0]?.id || null,
            isLoading: false,
          });
        } catch (err) {
          set({
            error: err?.message || "加载人设失败",
            isLoading: false,
          });
        }
      },

      setActivePersona: (id) => {
        set({ activePersonaId: String(id) });
      },
      addPersona: async (persona) => {
        const base = createEmptyPersona();

        const payload = toApiPayload({
          ...base,
          ...persona,
          id:
            persona?.id && String(persona.id).trim()
              ? String(persona.id).trim()
              : base.id,
          updatedAt: new Date().toISOString(),
        });

        const res = await api.createPersona(payload);
        const newPersona = normalizePersona(res || payload);

        set((state) => ({
          personas: [...state.personas, newPersona],
          activePersonaId: newPersona.id,
        }));
      },

      updatePersona: async (id, updates) => {
        const resolvedId = resolvePersonaId({ id, ...updates });

        if (!resolvedId) {
          throw new Error("当前人设缺少 id，无法更新。请刷新页面后重试。");
        }

        const current =
          get().personas.find((p) => p.id === resolvedId) ||
          createEmptyPersona();

        const payload = toApiPayload({
          ...current,
          ...updates,
          id: resolvedId,
          updatedAt: new Date().toISOString(),
        });

        const res = await api.updatePersona(resolvedId, payload);
        const updated = normalizePersona(res || payload);

        set((state) => ({
          personas: state.personas.map((p) =>
            p.id === resolvedId ? updated : p,
          ),
        }));
      },

      deletePersona: async (id) => {
        const resolvedId = resolvePersonaId({ id });

        if (!resolvedId) {
          throw new Error("当前人设缺少 id，无法删除。");
        }

        await api.deletePersona(resolvedId);

        set((state) => {
          const next = state.personas.filter((p) => p.id !== resolvedId);

          return {
            personas: next,
            activePersonaId:
              state.activePersonaId === resolvedId
                ? next[0]?.id || null
                : state.activePersonaId,
          };
        });
      },
    }),
    {
      name: "persona-storage",
    },
  ),
);

export const useActivePersona = () =>
  usePersonaStore((state) =>
    state.personas.find((p) => p.id === state.activePersonaId)
  );