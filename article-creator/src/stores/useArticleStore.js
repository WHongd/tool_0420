// 文件作用：文章库与收藏夹的全局状态管理（发布、加载、收藏、删除、状态判断）
import { create } from 'zustand';
import { api } from '../services/apiClient';

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const normalizeArticle = (article) => {
  if (!article || typeof article !== 'object') return null;

  return {
    ...article,
    engagementMetrics: article.engagementMetrics || {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
    },
  };
};

const normalizeArticles = (articles) =>
  ensureArray(articles).map(normalizeArticle).filter(Boolean);

export const useArticleStore = create((set, get) => ({
  publishedArticles: [],
  favorites: [],
  isLoading: false,
  isPublishing: false,
  isFavoriting: false,
  isDeleting: false,
  error: null,

  loadArticles: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const articles = normalizeArticles(await api.getArticles(params));
      set({ publishedArticles: articles, isLoading: false });
      return articles;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  publishArticle: async (article) => {
    set({ isLoading: true, isPublishing: true, error: null });
    try {
      const createdArticle = normalizeArticle(await api.createArticle(article));
      await get().loadArticles();
      set({ isLoading: false, isPublishing: false });
      return createdArticle;
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
        isPublishing: false,
      });
      throw error;
    }
  },

  deletePublishedArticle: async (id) => {
    set({ isLoading: true, isDeleting: true, error: null });
    try {
      await api.deleteArticle(id);
      set((state) => ({
        publishedArticles: ensureArray(state.publishedArticles).filter(
          (a) => a.id !== id,
        ),
        favorites: ensureArray(state.favorites).filter((a) => a.id !== id),
        isLoading: false,
        isDeleting: false,
      }));
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
        isDeleting: false,
      });
      throw error;
    }
  },

  loadFavorites: async () => {
    set({ isLoading: true, error: null });
    try {
      const favorites = normalizeArticles(await api.getFavorites());
      set({ favorites, isLoading: false });
      return favorites;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  addFavorite: async (article) => {
    set({ isLoading: true, isFavoriting: true, error: null });
    try {
      await api.addFavorite(article);
      await get().loadFavorites();
      set({ isLoading: false, isFavoriting: false });
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
        isFavoriting: false,
      });
      throw error;
    }
  },

  removeFavorite: async (articleId) => {
    set({ isLoading: true, isFavoriting: true, error: null });
    try {
      await api.removeFavorite(articleId);
      await get().loadFavorites();
      set({ isLoading: false, isFavoriting: false });
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
        isFavoriting: false,
      });
      throw error;
    }
  },

  isFavorite: (articleId) => {
    const favorites = ensureArray(get().favorites);
    return favorites.some((item) => item?.id === articleId);
  },

  isPublished: (articleId) => {
    const publishedArticles = ensureArray(get().publishedArticles);
    return publishedArticles.some((item) => item?.id === articleId);
  },

  getArticleState: (article) => {
    if (!article) {
      return {
        isDraft: true,
        isPublished: false,
        isFavorited: false,
        label: '草稿',
      };
    }

    const isFavorited = get().isFavorite(article.id);

    // 当前编辑中的文章状态，只看 article.status
    const isPublished = article.status === 'published';
    const isDraft = !isPublished;

    let label = '草稿';
    if (isPublished && isFavorited) label = '已发布 / 已收藏';
    else if (isPublished) label = '已发布';
    else if (isFavorited) label = '草稿 / 已收藏';

    return {
      isDraft,
      isPublished,
      isFavorited,
      label,
    };
  },
}));