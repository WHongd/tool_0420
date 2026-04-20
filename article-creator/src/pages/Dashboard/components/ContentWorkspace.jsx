import React from "react";

export default function ContentWorkspace({
  articleTitle,
  articleContent,
  setArticleContent,
  contentLoading,
  onGenerateOpening,
  onGenerateFullArticle, // ✅ 新增
  isSaving,
}) {
  if (!articleTitle) return null;

  return (
    <div className="bg-white border rounded-xl p-4 mt-6">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium">{articleTitle}</span>

        <div className="flex gap-2">
          <button
            onClick={onGenerateOpening}
            className="text-xs px-3 py-1.5 rounded border hover:bg-gray-50"
          >
            写开头
          </button>

          {/* ✅ 核心按钮 */}
          <button
            onClick={onGenerateFullArticle}
            className="text-xs px-3 py-1.5 rounded bg-black text-white hover:opacity-90"
          >
            一键生成全文
          </button>
        </div>
      </div>

      <textarea
        value={articleContent}
        onChange={(e) => setArticleContent(e.target.value)}
        className="w-full h-[260px] border rounded p-3 text-sm"
        placeholder="这里是正文内容..."
      />

      <div className="text-[10px] text-gray-400 mt-2">
        {contentLoading ? "生成中..." : isSaving ? "保存中..." : "已保存"}
      </div>
    </div>
  );
}