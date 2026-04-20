const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`请求失败 ${res.status}: ${text}`);
  }

  return res.json();
}

export const api = {
  // 人设
  getPersonas: () => request("/api/personas"),
  createPersona: (data) =>
    request("/api/personas", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updatePersona: (id, data) =>
    request(`/api/personas/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deletePersona: (id) =>
    request(`/api/personas/${id}`, {
      method: "DELETE",
    }),

  // 文章
  getArticles: () => request("/api/articles"),
  createArticle: (data) =>
    request("/api/articles", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteArticle: (id) =>
    request(`/api/articles/${id}`, {
      method: "DELETE",
    }),

  // 收藏
  getFavorites: () => request("/api/favorites"),
  addFavorite: (article) =>
    request(`/api/favorites/${article.id}`, {
      method: "POST",
      body: JSON.stringify({ article }),
    }),
  removeFavorite: (id) =>
    request(`/api/favorites/${id}`, {
      method: "DELETE",
    }),
};