import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Trash2, Copy, RotateCcw, Search } from "lucide-react";

const HISTORY_KEY = "content_creator_history";
const DRAFT_KEY = "content_creator_draft";

const PLATFORM_OPTIONS = [
  { label: "全部平台", value: "all" },
  { label: "今日头条", value: "toutiao" },
  { label: "微头条", value: "weitoutiao" },
  { label: "百家号", value: "baijiahao" },
  { label: "微信公众号", value: "wechat" },
];

const PLATFORM_NAME_MAP = {
  toutiao: "今日头条",
  weitoutiao: "微头条",
  baijiahao: "百家号",
  wechat: "微信公众号",
};

function safeParse(raw, fallback = []) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function stripHtml(text) {
  return String(text || "").replace(/<[^>]*>/g, "");
}

function formatDate(dateValue) {
  if (!dateValue) return "未知时间";

  try {
    return new Date(dateValue).toLocaleString();
  } catch {
    return "未知时间";
  }
}

function getPreview(content, maxLength = 140) {
  const plain = stripHtml(content).trim();
  if (!plain) return "暂无内容";
  return plain.length > maxLength ? `${plain.slice(0, maxLength)}...` : plain;
}

function getWordCount(content) {
  return stripHtml(content).replace(/\s+/g, "").length;
}

function FilterButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1 text-sm font-medium transition",
        active
          ? "bg-gray-900 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ActionButton({ icon, label, onClick, danger = false }) {
  const Icon = icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
        danger
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-gray-200 text-gray-700 hover:bg-gray-50",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export default function ArticleLibrary() {
  const navigate = useNavigate();

  const [historyList, setHistoryList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [viewingArticle, setViewingArticle] = useState(null);

  const loadHistory = () => {
    const list = safeParse(localStorage.getItem(HISTORY_KEY), []);
    setHistoryList(Array.isArray(list) ? list : []);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredArticles = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return historyList.filter((item) => {
      const title = String(item?.title || "").toLowerCase();
      const topic = String(item?.topic || "").toLowerCase();
      const persona = String(item?.persona || "").toLowerCase();
      const content = stripHtml(item?.content || "").toLowerCase();

      const matchesSearch =
        !keyword ||
        title.includes(keyword) ||
        topic.includes(keyword) ||
        persona.includes(keyword) ||
        content.includes(keyword);

      const matchesPlatform =
        selectedPlatform === "all" || item?.platform === selectedPlatform;

      return matchesSearch && matchesPlatform;
    });
  }, [historyList, searchTerm, selectedPlatform]);

  const handleCopy = async (article) => {
    if (!article) return;

    const text = `${article.title || ""}\n\n${stripHtml(article.content || "")}`;

    try {
      await navigator.clipboard.writeText(text.trim());
      window.alert("已复制");
    } catch {
      window.alert("复制失败，请手动复制");
    }
  };

  const handleRegenerate = (article) => {
    if (!article) return;

    const draft = {
      platform: article.platform || "toutiao",
      persona: article.persona || "",
      topic: article.topic || article.title || "",
      contentType: article.contentType || "article",
      wordCount: article.wordCount || "800",
      createdAt: Date.now(),
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    navigate("/generate");
  };

  const handleDelete = (id) => {
    const confirmed = window.confirm("确定删除这条历史记录吗？");
    if (!confirmed) return;

    const nextList = historyList.filter((item) => item.id !== id);
    setHistoryList(nextList);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(nextList));

    if (viewingArticle?.id === id) {
      setViewingArticle(null);
    }
  };

  const handleClearAll = () => {
    if (historyList.length === 0) {
      window.alert("当前没有历史记录");
      return;
    }

    const confirmed = window.confirm("确定清空全部历史记录吗？此操作不可恢复。");
    if (!confirmed) return;

    localStorage.removeItem(HISTORY_KEY);
    setHistoryList([]);
    setViewingArticle(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">历史记录</h1>
          <p className="mt-2 text-sm leading-7 text-gray-500">
            查看你之前生成过的内容，支持搜索、复制和再次生成。
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate("/generate")}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
          >
            新建内容
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            清空历史
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map((item) => (
            <FilterButton
              key={item.value}
              active={selectedPlatform === item.value}
              onClick={() => setSelectedPlatform(item.value)}
            >
              {item.label}
            </FilterButton>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索标题、主题、人设、正文内容..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100"
          />
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
          <div className="mb-2 text-lg font-semibold text-gray-900">
            暂无历史记录
          </div>
          <p className="mx-auto max-w-xl text-sm leading-7 text-gray-500">
            先去生成一篇内容，生成完成后就会自动出现在这里。
          </p>

          <button
            type="button"
            onClick={() => navigate("/generate")}
            className="mt-5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
          >
            去生成内容
          </button>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {filteredArticles.map((article, index) => (
            <div
              key={article.id || index}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">
                  #{index + 1}
                </span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                  {PLATFORM_NAME_MAP[article.platform] || article.platform || "未知平台"}
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                  {article.persona || "未设置人设"}
                </span>
                <span className="rounded-full bg-purple-50 px-2.5 py-1 font-medium text-purple-700">
                  {article.contentType || "article"}
                </span>
              </div>

              <h3 className="mb-2 text-lg font-bold leading-8 text-gray-900">
                {article.title || "未命名标题"}
              </h3>

              <div className="mb-3 text-sm leading-7 text-gray-500">
                主题：{article.topic || "未填写主题"}
              </div>

              <p className="mb-4 text-sm leading-7 text-gray-700">
                {getPreview(article.content)}
              </p>

              <div className="mb-4 grid gap-2 text-sm text-gray-500 sm:grid-cols-2">
                <div>字数：{getWordCount(article.content)}</div>
                <div>时间：{formatDate(article.createdAt)}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <ActionButton
                  icon={Eye}
                  label="查看全文"
                  onClick={() => setViewingArticle(article)}
                />
                <ActionButton
                  icon={Copy}
                  label="复制"
                  onClick={() => handleCopy(article)}
                />
                <ActionButton
                  icon={RotateCcw}
                  label="再次生成"
                  onClick={() => handleRegenerate(article)}
                />
                <ActionButton
                  icon={Trash2}
                  label="删除"
                  danger
                  onClick={() => handleDelete(article.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingArticle ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setViewingArticle(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                    {PLATFORM_NAME_MAP[viewingArticle.platform] ||
                      viewingArticle.platform ||
                      "未知平台"}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                    {viewingArticle.persona || "未设置人设"}
                  </span>
                </div>

                <h2 className="text-2xl font-bold leading-9 text-gray-900">
                  {viewingArticle.title || "未命名标题"}
                </h2>

                <div className="mt-2 text-sm text-gray-500">
                  主题：{viewingArticle.topic || "未填写主题"} ｜ 创建时间：
                  {formatDate(viewingArticle.createdAt)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingArticle(null)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-50"
              >
                关闭
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <ActionButton
                icon={Copy}
                label="复制全文"
                onClick={() => handleCopy(viewingArticle)}
              />
              <ActionButton
                icon={RotateCcw}
                label="再次生成"
                onClick={() => handleRegenerate(viewingArticle)}
              />
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <div className="mb-3 text-sm font-semibold text-gray-500">正文</div>
              <div className="whitespace-pre-wrap text-sm leading-8 text-gray-800">
                {stripHtml(viewingArticle.content || "") || "暂无正文"}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}