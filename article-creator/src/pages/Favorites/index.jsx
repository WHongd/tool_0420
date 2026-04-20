// 文件作用：收藏夹页面，直接渲染收藏的文章列表
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useArticleStore } from "../../stores/useArticleStore";
import { usePersonaStore } from "../../stores/usePersonaStore";
import { Eye, Trash2 } from "lucide-react";
import { PLATFORM_NAMES } from "../../constants/platforms";

export default function Favorites() {
  const { favorites, removeFavorite, loadFavorites } = useArticleStore();
  const { personas } = usePersonaStore();
  const [viewingArticle, setViewingArticle] = useState(null);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const getPersonaName = (personaId) => {
    const p = personas.find((p) => p.id === personaId);
    return p ? p.name : "未知人设";
  };

  if (!favorites || favorites.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        暂无收藏文章，在工作台点击星标收藏后显示在这里。
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">收藏夹</h1>

      <div className="space-y-4">
        {favorites.map((article) => (
          <div key={article.id} className="bg-white rounded-lg shadow-card p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                    {getPersonaName(article.personaId)}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                    {PLATFORM_NAMES[article.platform] || article.platform}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900">
                  {article.title}
                </h3>

                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {article.content?.replace(/<[^>]*>/g, "").substring(0, 150)}
                  ...
                </p>

                <div className="mt-3 flex flex-col gap-1 text-xs text-gray-500">
                  <span>
                    当前状态：
                    {article.publishedAt ? "已发布 / 已收藏" : "草稿 / 已收藏"}
                  </span>

                  <span>
                    收藏时间：
                    {article.favoritedAt
                      ? new Date(article.favoritedAt).toLocaleString()
                      : "未知"}
                  </span>

                  {article.publishedAt && (
                    <span>
                      发布时间：
                      {new Date(article.publishedAt).toLocaleString()}
                    </span>
                  )}

                  <span>
                    字数：
                    {(article.content || "").replace(/<[^>]*>/g, "").length}
                  </span>

                  <span>
                    AI：
                    {article.aiProvider === "deepseek"
                      ? "DeepSeek"
                      : article.aiProvider === "volc"
                        ? "豆包"
                        : "未知"}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setViewingArticle(article)}
                  className="p-2 text-gray-500 hover:text-brand-600"
                  title="查看全文"
                >
                  <Eye size={18} />
                </button>

                <button
                  onClick={async () => {
                    if (window.confirm("确定取消收藏吗？")) {
                      try {
                        await removeFavorite(article.id);
                        toast.success("已取消收藏");
                      } catch (error) {
                        toast.error(`取消收藏失败：${error.message}`);
                      }
                    }
                  }}
                  className="p-2 text-gray-500 hover:text-red-600"
                  title="取消收藏"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {viewingArticle && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setViewingArticle(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{viewingArticle.title}</h2>
              <button
                onClick={() => setViewingArticle(null)}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>

            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: viewingArticle.content }}
            />

            <div className="mt-4 text-right text-xs text-gray-400">
              发布于{" "}
              {new Date(
                viewingArticle.publishedAt || viewingArticle.createdAt,
              ).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}