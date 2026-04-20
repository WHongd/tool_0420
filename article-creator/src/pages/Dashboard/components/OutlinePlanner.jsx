import React from "react";

export default function OutlinePlanner({
  articleTitle,
  outlineSections,
  outlineLoading,
  activeOutlineId,
  setActiveOutlineId,
  generateOutlineByTitle,
  generateSectionContent,
  generateAndInsertSection,
  generateStructuredArticle,
  resetOutline,
}) {
  if (!articleTitle) return null;

  return (
    <div className="mt-6 border rounded-xl p-4 bg-white shadow-sm">
      {/* 顶部 */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="text-sm font-medium text-gray-700">
          正文结构引导
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => generateOutlineByTitle(articleTitle)}
            className="text-xs px-3 py-1.5 rounded-md bg-black text-white"
          >
            {outlineLoading ? "生成中..." : "生成大纲"}
          </button>

          <button
            onClick={generateStructuredArticle}
            className="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white font-medium"
          >
            一键生成整篇
          </button>

          <button
            onClick={resetOutline}
            className="text-xs px-3 py-1.5 rounded-md border"
          >
            清空
          </button>
        </div>
      </div>

      {/* 空状态 */}
      {!outlineSections?.length && (
        <div className="text-xs text-gray-400">
          点击“生成大纲”或“一键生成整篇”
        </div>
      )}

      {/* ✅ 限高滚动（关键优化） */}
      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
        {outlineSections.map((section) => {
          const isActive = activeOutlineId === section.id;

          return (
            <div
              key={section.id}
              className={`border rounded-lg p-3 transition ${
                isActive
                  ? "bg-green-50 border-green-300"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              {/* 标题（可点击） */}
              <div
                className="text-sm font-medium text-gray-800 cursor-pointer flex justify-between items-center"
                onClick={() => setActiveOutlineId(section.id)}
              >
                <span>
                  {section.order}. {section.title}
                </span>

                <span className="text-[10px] text-gray-400">
                  {isActive ? "收起" : "展开"}
                </span>
              </div>

              {/* 只展开当前 */}
              {isActive && (
                <>
                  {/* 描述 */}
                  <div className="text-xs text-gray-500 mt-1">
                    {section.summary}
                  </div>

                  {/* 内容预览 */}
                  {section.content && (
                    <div className="mt-2 text-xs bg-white border rounded p-2 whitespace-pre-line line-clamp-4">
                      {section.content}
                    </div>
                  )}

                  {/* 操作 */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => generateSectionContent(section.id)}
                      className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                    >
                      {section.status === "generating"
                        ? "生成中..."
                        : "生成"}
                    </button>

                    <button
                      onClick={() =>
                        generateAndInsertSection(section.id)
                      }
                      className={`text-xs px-2 py-1 rounded text-white ${
                        section.inserted
                          ? "bg-gray-400"
                          : "bg-black"
                      }`}
                    >
                      {section.inserted ? "已插入" : "插入正文"}
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}