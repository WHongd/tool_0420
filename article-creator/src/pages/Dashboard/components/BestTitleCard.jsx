export default function BestTitleCard({
  articleTitle,
  result,
  bestTitleItem,
  onUseBestTitle,
}) {
  const bestTitle =
    bestTitleItem?.title ||
    result?.data?.bestTitle?.title ||
    result?.data?.bestTitle ||
    result?.bestTitle?.title ||
    result?.bestTitle ||
    "";

  const bestReason =
    bestTitleItem?.reason ||
    result?.data?.bestTitle?.reason ||
    result?.bestTitle?.reason ||
    "";

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-gray-900">推荐标题</h2>
        <p className="mt-1 text-sm text-gray-500">
          推荐标题也走和候选标题同一套状态同步。
        </p>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="text-sm text-gray-500">当前文章标题</div>
          <div className="mt-1 break-words text-sm font-medium text-gray-900">
            {articleTitle || "尚未选择标题"}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">推荐标题</div>
          <div className="mt-1 break-words text-base font-semibold text-gray-900">
            {bestTitle || "暂无推荐标题"}
          </div>

          {bestReason ? (
            <div className="mt-2 text-sm text-gray-500">{bestReason}</div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onUseBestTitle}
          disabled={!bestTitle}
          className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          使用推荐标题
        </button>
      </div>
    </section>
  );
}