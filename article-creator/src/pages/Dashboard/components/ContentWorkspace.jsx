import React from "react";

function getPrimaryButtonText(platform, contentLoading) {
  if (!contentLoading) {
    if (platform === "weitoutiao") return "生成内容";
    if (platform === "toutiao") return "一键生成全文";
    return "一键生成整篇";
  }

  if (platform === "weitoutiao") return "正在生成内容...";
  if (platform === "toutiao") return "正在生成全文...";
  return "正在生成整篇...";
}

function getStatusText(contentLoading, isSaving) {
  if (contentLoading) return "AI 正在生成中，请稍等...";
  if (isSaving) return "正在自动保存...";
  return "内容已自动保存";
}

export default function ContentWorkspace({
  articleTitle,
  articleContent,
  setArticleContent,
  contentLoading,
  onGenerateOpening,
  onGenerateFullArticle,
  isSaving,
  platform = "wechat",
}) {
  if (!articleTitle) return null;

  const primaryText = getPrimaryButtonText(platform, contentLoading);
  const statusText = getStatusText(contentLoading, isSaving);

  return (
    <div className="bg-white border rounded-2xl p-4 md:p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="text-lg md:text-xl font-semibold text-gray-900 leading-8 break-words">
            {articleTitle}
          </div>
          <div className="mt-2 inline-flex items-center rounded-full bg-blue-50 text-blue-700 text-xs px-3 py-1">
            {contentLoading ? "正在生成正文" : "正文编辑区"}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onGenerateOpening}
            disabled={contentLoading}
            className={`text-sm px-4 py-2 rounded-xl border transition ${
              contentLoading
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {contentLoading ? "请稍候..." : "写开头"}
          </button>

          <button
            onClick={onGenerateFullArticle}
            disabled={contentLoading}
            className={`text-sm px-4 py-2 rounded-xl transition ${
              contentLoading
                ? "bg-gray-300 text-white cursor-not-allowed"
                : "bg-black text-white hover:opacity-90"
            }`}
          >
            {primaryText}
          </button>
        </div>
      </div>

      <div
        className={`mb-3 rounded-xl border px-3 py-2 text-sm flex items-center gap-2 ${
          contentLoading
            ? "bg-blue-50 border-blue-200 text-blue-700"
            : isSaving
            ? "bg-yellow-50 border-yellow-200 text-yellow-700"
            : "bg-green-50 border-green-200 text-green-700"
        }`}
      >
        <span className="inline-block w-2 h-2 rounded-full bg-current opacity-70" />
        <span>{statusText}</span>
      </div>

      <textarea
        value={articleContent}
        onChange={(e) => setArticleContent(e.target.value)}
        className="w-full min-h-[320px] border rounded-xl p-4 text-sm leading-7 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        placeholder="这里是正文内容..."
      />

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>
          {contentLoading
            ? "生成中时请不要频繁重复点击按钮"
            : "你可以在这里继续手动修改正文"}
        </span>
        <span>{articleContent?.length || 0} 字</span>
      </div>
    </div>
  );
}