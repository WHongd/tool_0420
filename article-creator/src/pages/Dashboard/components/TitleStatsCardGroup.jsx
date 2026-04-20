export default function TitleStatsCardGroup({ topic, articleTitle, result }) {
  const candidates = Array.isArray(result?.data?.candidates)
    ? result.data.candidates
    : Array.isArray(result?.candidates)
      ? result.candidates
      : [];

  const bestTitle =
    result?.data?.bestTitle?.title ||
    result?.data?.bestTitle ||
    result?.bestTitle?.title ||
    result?.bestTitle ||
    "";

  const cards = [
    { label: "当前主题", value: topic || "未填写" },
    { label: "候选标题数", value: String(candidates.length) },
    { label: "当前标题", value: articleTitle || "未选择" },
    { label: "推荐标题", value: bestTitle || "暂无" },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="text-sm text-gray-500">{card.label}</div>
          <div className="mt-2 break-words text-sm font-medium text-gray-900">
            {card.value}
          </div>
        </div>
      ))}
    </section>
  );
}