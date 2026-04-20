import React from "react";

export default function TitleBriefForm({
  topic,
  setTopic,
  platform,
  setPlatform,
  platformOptions,
  loading,
  onGenerate,
  onReset,
}) {
  const isWeitoutiao = platform === "weitoutiao";

  return (
    <div className="bg-white border rounded-xl p-4">
      {/* 输入 */}
      <div className="mb-3">
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="请输入你要创作的主题..."
          className="w-full border rounded p-3 text-sm h-[90px]"
        />
      </div>

      {/* 平台选择 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {platformOptions.map((item) => {
            const active = platform === item.value;

            return (
              <button
                key={item.value}
                onClick={() => setPlatform(item.value)}
                className={`text-xs px-3 py-1.5 rounded border ${
                  active
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* 按钮区 */}
        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="text-xs px-3 py-1.5 rounded border hover:bg-gray-50"
          >
            重置
          </button>

          <button
            onClick={onGenerate}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded bg-black text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading
              ? "生成中..."
              : isWeitoutiao
              ? "生成内容"
              : "生成标题"}
          </button>
        </div>
      </div>
    </div>
  );
}