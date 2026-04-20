export default function TitleDetailPanel({ loading, detail, selectedTitle }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-gray-900">标题详情</h2>
        <p className="mt-1 text-sm text-gray-500">
          右侧详情只展示当前选中的标题信息。
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">加载中...</div>
      ) : !detail ? (
        <div className="rounded-xl bg-gray-50 px-4 py-6 text-sm text-gray-500">
          {selectedTitle ? "暂无详细分析" : "请选择一个标题查看详情"}
        </div>
      ) : (
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <div className="text-xs text-gray-500">标题</div>
            <div className="mt-1 break-words text-base font-medium text-gray-900">
              {detail.title || selectedTitle || "暂无标题"}
            </div>
          </div>

          {detail.reason ? (
            <div>
              <div className="text-xs text-gray-500">推荐理由</div>
              <div className="mt-1 leading-6">{detail.reason}</div>
            </div>
          ) : null}

          {detail.style ? (
            <div>
              <div className="text-xs text-gray-500">风格</div>
              <div className="mt-1">{detail.style}</div>
            </div>
          ) : null}

          {detail.platformFit ? (
            <div>
              <div className="text-xs text-gray-500">平台适配</div>
              <div className="mt-1 leading-6">{detail.platformFit}</div>
            </div>
          ) : null}

          {detail.suggestion ? (
            <div>
              <div className="text-xs text-gray-500">优化建议</div>
              <div className="mt-1 leading-6">{detail.suggestion}</div>
            </div>
          ) : null}
          {detail.score ? (
            <div>
              <div className="text-xs text-gray-500">评分</div>

              {typeof detail.score === "object" ? (
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  {Object.entries(detail.score).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span>{key}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-1">{detail.score}</div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}