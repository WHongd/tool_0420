import { getTitleText, normalizeTitleItem } from "../utils/dashboardTitleMappers";

function getStyleLabel(style) {
  const map = {
    conflict: "冲突",
    curiosity: "悬念",
    benefit: "收益",
    trust: "可信",
    balanced: "均衡",
  };

  return map[style] || "常规";
}

function getReadableReason(reason) {
  if (!reason) return "";

  if (reason.includes("AI 返回异常") || reason.includes("本地兜底")) {
    return "适合作为当前主题的切入标题";
  }

  return reason;
}

function getShortReason(reason) {
  const readable = getReadableReason(reason);
  if (!readable) return "";
  if (readable.length <= 18) return readable;
  return `${readable.slice(0, 18)}...`;
}

export default function TitleResultPanel({
  candidates = [],
  loading,
  error,
  onPickTitle,
  selectedTitle,
  bestTitleItem,
  onUseBestTitle,
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-gray-900">标题</div>

        {bestTitleItem?.title ? (
          <button
            type="button"
            onClick={onUseBestTitle}
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700"
          >
            用推荐标题
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
          生成中...
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {!loading && !error && !candidates.length ? (
        <div className="mt-3 rounded-xl bg-gray-50 px-4 py-5 text-sm text-gray-500">
          输入主题后生成标题
        </div>
      ) : null}

      {!!candidates.length ? (
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {candidates.map((item, index) => {
            const normalized = normalizeTitleItem(item);
            const title = getTitleText(item);
            const isSelected = selectedTitle === title;
            const isBest = bestTitleItem?.title === title;
            const shortReason = getShortReason(normalized.reason);

            return (
              <button
                key={`${title}-${index}`}
                type="button"
                onClick={() => onPickTitle(item)}
                className={`rounded-xl border p-4 text-left transition ${
                  isSelected
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-500">
                    {getStyleLabel(normalized.style)}
                  </span>

                  <div className="flex items-center gap-1">
                    {isBest ? (
                      <span className="rounded-full bg-gray-900 px-2 py-1 text-[10px] text-white">
                        推荐
                      </span>
                    ) : null}

                    {isSelected ? (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] text-gray-700">
                        当前
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 text-sm font-medium leading-6 text-gray-900">
                  {title}
                </div>

                {shortReason ? (
                  <div className="mt-2 text-[11px] text-gray-500">
                    {shortReason}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}