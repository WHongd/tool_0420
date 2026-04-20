import { PLATFORM_NAMES, PLATFORM_COLORS } from "../../constants/platforms";

const getPlainText = (html = "") => {
  return String(html)
    .replace(/<\/p>/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .trim();
};

export default function PlatformPreview({ article, persona }) {
  const platform = article?.platform || persona?.platform || "toutiao";
  const platformName = PLATFORM_NAMES[platform] || "内容平台";
  const accentColor = PLATFORM_COLORS[platform] || "#3b82f6";

  const title = article?.title || "未填写标题";
  const plainText = getPlainText(article?.content || "");
  const paragraphs = plainText
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (platform === "weitoutiao") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold"
              style={{ backgroundColor: accentColor }}
            >
              {persona?.name?.[0] || "微"}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {persona?.name || "当前作者"}
              </div>
              <div className="text-xs text-gray-500">{platformName}</div>
            </div>
          </div>

          <div className="px-4 py-4">
            <div className="text-[17px] leading-7 text-gray-900 whitespace-pre-wrap">
              {plainText || "暂无内容"}
            </div>
          </div>

          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
            <span>微头条预览</span>
            <span>{plainText.length} 字</span>
          </div>
        </div>
      </div>
    );
  }

  if (platform === "baijiahao") {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="text-sm text-gray-500 mb-2">{platformName}</div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            {title}
          </h1>
          <div className="mt-4 flex items-center space-x-3">
            <div
              className="w-9 h-9 rounded-full text-white flex items-center justify-center font-bold"
              style={{ backgroundColor: accentColor }}
            >
              {persona?.name?.[0] || "百"}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {persona?.name || "当前作者"}
              </div>
              <div className="text-xs text-gray-500">
                {persona?.occupation || "经验分享作者"}
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-8">
          <div className="space-y-5 text-[17px] leading-8 text-gray-800">
            {(paragraphs.length ? paragraphs : ["暂无内容"]).map((p, index) => (
              <p key={index}>{p}</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 默认：今日头条
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-gray-100">
        <div className="text-sm text-gray-500 mb-2">{platformName}</div>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
          {title}
        </h1>
        <div className="mt-4 flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold"
            style={{ backgroundColor: accentColor }}
          >
            {persona?.name?.[0] || "头"}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {persona?.name || "当前作者"}
            </div>
            <div className="text-xs text-gray-500">
              {persona?.occupation || "观察型作者"}
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="space-y-6 text-[18px] leading-9 text-gray-800">
          {(paragraphs.length ? paragraphs : ["暂无内容"]).map((p, index) => (
            <p key={index}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  );
}