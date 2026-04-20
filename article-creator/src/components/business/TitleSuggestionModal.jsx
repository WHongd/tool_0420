import React, { useMemo, useState } from "react";

const STYLE_META = {
  balanced: {
    label: "稳健型",
    description: "理性、专业、克制，适合品牌感和长期信任",
  },
  conflict: {
    label: "冲突型",
    description: "有反差、有张力，适合提升点击率",
  },
  practical: {
    label: "实用型",
    description: "强调方法、步骤、结果，适合收藏和转化",
  },
};

const SCORE_LABELS = [
  { key: "attraction", label: "吸引力", max: 20 },
  { key: "clarity", label: "清晰度", max: 15 },
  { key: "value", label: "价值感", max: 20 },
  { key: "conflict", label: "冲突感", max: 15 },
  { key: "specificity", label: "具体度", max: 15 },
  { key: "virality", label: "传播感", max: 15 },
];

function safeText(value, fallback = "") {
  return String(value || fallback).trim();
}

function getStyleMeta(style) {
  return STYLE_META[style] || STYLE_META.balanced;
}

function getGradeText(grade) {
  if (!grade) return "未评级";
  return `${grade}级`;
}

function groupCandidatesByStyle(candidates = []) {
  return candidates.reduce(
    (acc, item) => {
      const style = item.style || "balanced";
      if (!acc[style]) acc[style] = [];
      acc[style].push(item);
      return acc;
    },
    {
      balanced: [],
      conflict: [],
      practical: [],
    },
  );
}

function ScoreBar({ value = 0, max = 100 }) {
  const percent = Math.max(0, Math.min(100, Math.round((value / max) * 100)));

  return (
    <div
      style={{
        height: 8,
        background: "#f0f2f5",
        borderRadius: 999,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: "100%",
          borderRadius: 999,
          background: "#111827",
          transition: "width 0.25s ease",
        }}
      />
    </div>
  );
}

function ModalShell({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(1180px, 100%)",
          maxHeight: "88vh",
          overflow: "auto",
          background: "#ffffff",
          borderRadius: 20,
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.18)",
          border: "1px solid #e5e7eb",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function HeaderSection({
  result,
  loading,
  errorMessage,
  onClose,
  onUseTitle,
}) {
  const bestTitle = result?.bestTitle?.title || "";
  const bestReason = result?.bestTitle?.reason || "";
  const bestStyle = result?.bestTitle?.style || "balanced";
  const styleMeta = getStyleMeta(bestStyle);

  return (
    <div
      style={{
        padding: 24,
        borderBottom: "1px solid #eef2f7",
        position: "sticky",
        top: 0,
        background: "#fff",
        zIndex: 3,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#111827",
              marginBottom: 8,
            }}
          >
            标题生成 + 评分 + 自动改写
          </div>

          {loading ? (
            <div style={{ fontSize: 14, color: "#6b7280" }}>
              正在生成并分析标题...
            </div>
          ) : (
            <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>
              {safeText(result?.platform, "通用平台")}
              {" · "}
              {safeText(result?.audience, "通用用户")}
              {" · "}
              推荐风格：{styleMeta.label}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "#f3f4f6",
            color: "#111827",
            borderRadius: 10,
            cursor: "pointer",
            padding: "10px 14px",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          关闭
        </button>
      </div>

      {!loading && errorMessage ? (
        <div
          style={{
            marginTop: 16,
            padding: "12px 14px",
            background: "#fff7ed",
            color: "#9a3412",
            border: "1px solid #fed7aa",
            borderRadius: 12,
            fontSize: 13,
            lineHeight: 1.7,
          }}
        >
          当前结果已使用兜底方案：{errorMessage}
        </div>
      ) : null}

      {!loading && bestTitle ? (
        <div
          style={{
            marginTop: 18,
            padding: 18,
            borderRadius: 16,
            background: "#f8fafc",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#6b7280",
              marginBottom: 10,
              letterSpacing: "0.04em",
            }}
          >
            最推荐发布标题
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#111827",
              lineHeight: 1.45,
              marginBottom: 10,
            }}
          >
            {bestTitle}
          </div>

          <div
            style={{
              fontSize: 14,
              color: "#4b5563",
              lineHeight: 1.8,
              marginBottom: 14,
            }}
          >
            {bestReason || "综合评分、传播感和平台适配后自动推荐。"}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => onUseTitle(bestTitle)}
              style={{
                border: "none",
                background: "#111827",
                color: "#ffffff",
                borderRadius: 10,
                cursor: "pointer",
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              使用这个标题
            </button>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                borderRadius: 999,
                padding: "8px 12px",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                fontSize: 13,
                color: "#374151",
              }}
            >
              风格：{styleMeta.label}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CandidateCard({
  item,
  onUseTitle,
  onUseRewrite,
}) {
  const score = item?.score || {};
  const overall = Number(score?.overall || 0);
  const grade = safeText(score?.grade, "C");

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        background: "#ffffff",
        padding: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.6,
              marginBottom: 8,
            }}
          >
            {safeText(item?.title, "未生成标题")}
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 28,
                padding: "0 10px",
                borderRadius: 999,
                background: "#f3f4f6",
                color: "#111827",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              总分 {overall}
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 28,
                padding: "0 10px",
                borderRadius: 999,
                background: "#eef2ff",
                color: "#3730a3",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {getGradeText(grade)}
            </span>
          </div>
        </div>

        <div
          style={{
            width: 100,
            minWidth: 100,
            textAlign: "right",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#111827",
              lineHeight: 1,
              marginBottom: 8,
            }}
          >
            {overall}
          </div>
          <ScoreBar value={overall} max={100} />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {SCORE_LABELS.map((dimension) => {
          const value = Number(score?.[dimension.key] || 0);

          return (
            <div
              key={dimension.key}
              style={{
                background: "#f8fafc",
                border: "1px solid #eef2f7",
                borderRadius: 12,
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 13, color: "#4b5563", fontWeight: 600 }}>
                  {dimension.label}
                </span>
                <span style={{ fontSize: 13, color: "#111827", fontWeight: 700 }}>
                  {value}/{dimension.max}
                </span>
              </div>
              <ScoreBar value={value} max={dimension.max} />
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #eef2f7",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            一句话点评
          </div>
          <div style={{ fontSize: 14, color: "#111827", lineHeight: 1.7 }}>
            {safeText(item?.comment, "暂无点评")}
          </div>
        </div>

        <div
          style={{
            background: "#fffaf0",
            border: "1px solid #fde68a",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#92400e",
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            最大短板
          </div>
          <div style={{ fontSize: 14, color: "#78350f", lineHeight: 1.7 }}>
            {safeText(item?.weakness, "暂无明显短板")}
          </div>
        </div>

        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#166534",
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            优化建议
          </div>
          <div style={{ fontSize: 14, color: "#166534", lineHeight: 1.7 }}>
            {safeText(item?.suggestion, "暂无优化建议")}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#f8fafc",
          border: "1px dashed #cbd5e1",
          borderRadius: 14,
          padding: 14,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "#6b7280",
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          自动改写标题
        </div>
        <div
          style={{
            fontSize: 18,
            color: "#111827",
            fontWeight: 800,
            lineHeight: 1.6,
          }}
        >
          {safeText(item?.rewrittenTitle, item?.title || "暂无改写结果")}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={() => onUseTitle(item?.title)}
          style={{
            border: "1px solid #d1d5db",
            background: "#ffffff",
            color: "#111827",
            borderRadius: 10,
            cursor: "pointer",
            padding: "10px 14px",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          使用原标题
        </button>

        <button
          onClick={() => onUseRewrite(item?.rewrittenTitle || item?.title)}
          style={{
            border: "none",
            background: "#111827",
            color: "#ffffff",
            borderRadius: 10,
            cursor: "pointer",
            padding: "10px 14px",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          使用改写标题
        </button>
      </div>
    </div>
  );
}

function StyleSection({
  title,
  description,
  items,
  onUseTitle,
  onUseRewrite,
}) {
  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: "#111827",
            marginBottom: 6,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>
          {description}
        </div>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            border: "1px dashed #d1d5db",
            borderRadius: 14,
            padding: 18,
            color: "#6b7280",
            fontSize: 14,
            background: "#fafafa",
          }}
        >
          暂无该风格标题
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {items.map((item, index) => (
            <CandidateCard
              key={`${item.title}-${index}`}
              item={item}
              onUseTitle={onUseTitle}
              onUseRewrite={onUseRewrite}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: 32,
        textAlign: "center",
        color: "#6b7280",
      }}
    >
      暂无标题结果
    </div>
  );
}

export default function TitleSuggestionModal({
  open,
  loading = false,
  result = null,
  error = null,
  onClose,
  onUseTitle,
}) {
  const [activeTab, setActiveTab] = useState("all");

  const grouped = useMemo(() => {
    const candidates = Array.isArray(result?.candidates) ? result.candidates : [];
    return groupCandidatesByStyle(candidates);
  }, [result]);

  const tabs = useMemo(() => {
    const allCount =
      grouped.balanced.length + grouped.conflict.length + grouped.practical.length;

    return [
      { key: "all", label: `全部 (${allCount})` },
      { key: "balanced", label: `稳健型 (${grouped.balanced.length})` },
      { key: "conflict", label: `冲突型 (${grouped.conflict.length})` },
      { key: "practical", label: `实用型 (${grouped.practical.length})` },
    ];
  }, [grouped]);

  const normalizedErrorMessage = safeText(
    typeof error === "string" ? error : error?.message,
    "",
  );

  const handleUseTitle = (title) => {
    const finalTitle = safeText(title);
    if (!finalTitle) return;
    onUseTitle?.(finalTitle);
  };

  const hasCandidates =
    grouped.balanced.length > 0 ||
    grouped.conflict.length > 0 ||
    grouped.practical.length > 0;

  return (
    <ModalShell open={open} onClose={onClose}>
      <HeaderSection
        result={result}
        loading={loading}
        errorMessage={normalizedErrorMessage}
        onClose={onClose}
        onUseTitle={handleUseTitle}
      />

      <div style={{ padding: 24 }}>
        {!loading ? (
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 22,
            }}
          >
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    border: active ? "none" : "1px solid #d1d5db",
                    background: active ? "#111827" : "#ffffff",
                    color: active ? "#ffffff" : "#111827",
                    borderRadius: 999,
                    cursor: "pointer",
                    padding: "10px 14px",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {loading ? (
          <div
            style={{
              padding: 36,
              textAlign: "center",
              color: "#6b7280",
              fontSize: 15,
            }}
          >
            正在生成标题、评分并自动改写，请稍候...
          </div>
        ) : !hasCandidates ? (
          <EmptyState />
        ) : (
          <>
            {(activeTab === "all" || activeTab === "balanced") && (
              <StyleSection
                title="稳健型"
                description={STYLE_META.balanced.description}
                items={grouped.balanced}
                onUseTitle={handleUseTitle}
                onUseRewrite={handleUseTitle}
              />
            )}

            {(activeTab === "all" || activeTab === "conflict") && (
              <StyleSection
                title="冲突型"
                description={STYLE_META.conflict.description}
                items={grouped.conflict}
                onUseTitle={handleUseTitle}
                onUseRewrite={handleUseTitle}
              />
            )}

            {(activeTab === "all" || activeTab === "practical") && (
              <StyleSection
                title="实用型"
                description={STYLE_META.practical.description}
                items={grouped.practical}
                onUseTitle={handleUseTitle}
                onUseRewrite={handleUseTitle}
              />
            )}
          </>
        )}
      </div>
    </ModalShell>
  );
}