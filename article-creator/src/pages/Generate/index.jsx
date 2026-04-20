import React, { useEffect, useMemo, useState } from "react";
import aiService from "../../services/aiService";

function SectionCard({ title, description, children }) {
  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 20,
        padding: 20,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "#111827",
            marginBottom: 6,
          }}
        >
          {title}
        </div>
        {description ? (
          <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>
            {description}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function FieldLabel({ children, required = false }) {
  return (
    <div
      style={{
        fontSize: 14,
        fontWeight: 700,
        color: "#111827",
        marginBottom: 8,
      }}
    >
      {children}
      {required ? <span style={{ color: "#dc2626", marginLeft: 4 }}>*</span> : null}
    </div>
  );
}

function Input({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%",
        border: "1px solid #d1d5db",
        borderRadius: 12,
        padding: "12px 14px",
        fontSize: 14,
        boxSizing: "border-box",
      }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 8 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%",
        border: "1px solid #d1d5db",
        borderRadius: 12,
        padding: "12px 14px",
        fontSize: 14,
        lineHeight: 1.7,
        boxSizing: "border-box",
        resize: "vertical",
      }}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        border: "1px solid #d1d5db",
        borderRadius: 12,
        padding: "12px 14px",
        fontSize: 14,
        background: "#fff",
      }}
    >
      {options.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

function CopyButton({ text }) {
  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      window.alert("已复制");
    } catch {
      window.alert("复制失败，请手动复制");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        border: "1px solid #d1d5db",
        background: "#fff",
        color: "#111827",
        borderRadius: 10,
        padding: "8px 12px",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      复制
    </button>
  );
}

function safeParse(raw, fallback = null) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function mapPlatformValue(rawPlatform) {
  if (!rawPlatform) return "";

  const value = String(rawPlatform).toLowerCase();

  if (
    value.includes("头条") &&
    !value.includes("微头条") &&
    !value.includes("weitoutiao")
  ) {
    return "toutiao";
  }

  if (value.includes("微头条") || value.includes("weitoutiao")) {
    return "weitoutiao";
  }

  if (value.includes("百家")) {
    return "baijiahao";
  }

  if (value.includes("微信") || value.includes("公众号") || value.includes("wechat")) {
    return "wechat";
  }

  if (["toutiao", "weitoutiao", "baijiahao", "wechat"].includes(value)) {
    return value;
  }

  return "";
}

function humanizePlatformLabel(platform) {
  const map = {
    toutiao: "今日头条",
    weitoutiao: "微头条",
    baijiahao: "百家号",
    wechat: "微信公众号",
  };
  return map[platform] || platform || "未知平台";
}

function extractPersonaName(personaObj) {
  return (
    personaObj?.name ||
    personaObj?.title ||
    personaObj?.personaName ||
    personaObj?.label ||
    ""
  );
}

function extractPersonaPrompt(personaObj) {
  return (
    personaObj?.prompt ||
    personaObj?.systemPrompt ||
    personaObj?.description ||
    personaObj?.intro ||
    personaObj?.profile ||
    personaObj?.bio ||
    ""
  );
}

function extractPersonaPlatform(personaObj) {
  if (personaObj?.platform) return mapPlatformValue(personaObj.platform);

  if (Array.isArray(personaObj?.platforms) && personaObj.platforms.length > 0) {
    return mapPlatformValue(personaObj.platforms[0]);
  }

  return "";
}

function extractPersonaMeta(personaObj) {
  return {
    tone:
      personaObj?.tone ||
      personaObj?.style ||
      personaObj?.writingStyle ||
      personaObj?.toneStyle ||
      "",
    audience:
      personaObj?.audience ||
      personaObj?.targetAudience ||
      personaObj?.targetUser ||
      personaObj?.readerType ||
      "",
    titleStyle:
      personaObj?.titleStyle ||
      personaObj?.headlineStyle ||
      "",
    intro:
      personaObj?.description ||
      personaObj?.intro ||
      personaObj?.bio ||
      "",
    keywords: Array.isArray(personaObj?.keywords)
      ? personaObj.keywords.join("、")
      : personaObj?.keywords || "",
    contentAngles: Array.isArray(personaObj?.contentAngles)
      ? personaObj.contentAngles.join("、")
      : personaObj?.contentAngles || "",
    taboo:
      personaObj?.taboo ||
      personaObj?.avoid ||
      personaObj?.forbiddenWords ||
      "",
    role:
      personaObj?.role ||
      personaObj?.occupation ||
      "",
  };
}

function buildPersonaPrompt(personaObj) {
  if (!personaObj) return "";

  const name = extractPersonaName(personaObj);
  const prompt = extractPersonaPrompt(personaObj);
  const meta = extractPersonaMeta(personaObj);

  const sections = [
    name ? `你当前采用的人设名称是：${name}` : "",
    meta.role ? `人设定位：${meta.role}` : "",
    meta.intro ? `人设简介：${meta.intro}` : "",
    meta.tone ? `语气风格：${meta.tone}` : "",
    meta.audience ? `目标读者：${meta.audience}` : "",
    meta.titleStyle ? `标题偏好：${meta.titleStyle}` : "",
    meta.keywords ? `常用关键词：${meta.keywords}` : "",
    meta.contentAngles ? `常写内容方向：${meta.contentAngles}` : "",
    meta.taboo ? `尽量避免：${meta.taboo}` : "",
    prompt ? `补充设定：${prompt}` : "",
  ].filter(Boolean);

  return sections.join("\n");
}

function buildPlatformInstruction(platform) {
  switch (platform) {
    case "toutiao":
      return [
        "请按今日头条风格输出。",
        "标题要更抓人，但不要低质夸张。",
        "正文开头尽快进入主题。",
        "段落不要太长，观点要明确。",
      ].join("\n");
    case "weitoutiao":
      return [
        "请按微头条风格输出。",
        "内容更短、更直接、更像强观点表达。",
        "可以更口语化，开头要迅速抓人。",
        "避免大段铺垫。",
      ].join("\n");
    case "baijiahao":
      return [
        "请按百家号风格输出。",
        "内容更工整、更解释型，适合教程和分析。",
        "逻辑要清晰，少一点情绪，多一点信息。",
      ].join("\n");
    case "wechat":
      return [
        "请按微信公众号风格输出。",
        "更适合完整长文表达，结构更完整。",
        "允许适度观点展开，结尾可以加入总结或行动建议。",
      ].join("\n");
    default:
      return "";
  }
}

function buildGenerationInstruction({
  platform,
  topic,
  contentType,
  wordCount,
  extraPrompt,
  personaPrompt,
}) {
  const typeMap = {
    article: "长文",
    short: "短内容",
    opinion: "观点文",
  };

  return [
    `本次写作平台：${humanizePlatformLabel(platform)}`,
    `本次主题：${topic}`,
    `内容类型：${typeMap[contentType] || contentType}`,
    `目标字数：${wordCount}字左右`,
    buildPlatformInstruction(platform),
    personaPrompt ? `请严格参考以下人设设定：\n${personaPrompt}` : "",
    extraPrompt ? `用户补充要求：\n${extraPrompt}` : "",
    "请输出一个标题和一篇可直接发布的正文。",
    "正文要结构清晰、语言自然，不要写成机械提示词。",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildFallbackContent(params) {
  const {
    topic,
    platform,
    persona,
    contentType,
    wordCount,
    extraPrompt,
    personaPrompt,
  } = params;

  const titleMap = {
    toutiao: `普通人做${topic}，最容易忽略的3个关键点`,
    weitoutiao: `关于“${topic}”，我只说3句实话`,
    baijiahao: `${topic}怎么做？一篇讲清楚`,
    wechat: `普通人如何通过${topic}，搭建自己的内容生产系统`,
  };

  const personaIntro = persona
    ? `下面这篇内容会尽量采用“${persona}”的人设表达方式。`
    : `下面这篇内容采用清晰、易读、可直接发布的表达方式。`;

  const body = `很多人一开始做“${topic}”，最容易犯的错，就是把时间花在不重要的地方。

${personaIntro}

第一，先把目标定清楚。你到底是为了涨粉、变现，还是为了持续输出？目标不一样，写法就不同。

第二，先把内容结构搭起来。不要一上来追求华丽表达，而是先把“问题—分析—建议—结论”写完整。

第三，根据平台去调整表达方式。今日头条更适合直接、有观点的表达；微头条更适合短句和强结论；百家号更偏解释型；微信公众号更适合完整长文。

如果你准备长期做内容，真正应该追求的不是一次爆，而是建立稳定的内容生产流程。

${personaPrompt ? `本次已参考人设规则：${personaPrompt}` : ""}
${extraPrompt ? `补充要求已考虑：${extraPrompt}` : ""}`;

  return {
    title: titleMap[platform] || `${topic}怎么做`,
    content:
      contentType === "short"
        ? `做“${topic}”这件事，别一上来求快，先把结构想明白，再谈放大。`
        : `${body}\n\n（目标字数：${wordCount}字左右）`,
  };
}

function adaptContentByPlatform(baseTitle, baseContent) {
  return {
    toutiao: {
      label: "今日头条版",
      title: baseTitle || "今日头条标题",
      content: `${baseContent}\n\n【头条版优化】开头更直接，段落更短，强调观点与冲突感。`,
    },
    weitoutiao: {
      label: "微头条版",
      title: baseTitle ? `微头条｜${baseTitle}` : "微头条标题",
      content: `说句实话：${baseContent.slice(0, 100)}……\n\n核心就一句，先把内容做对，再谈放大。`,
    },
    baijiahao: {
      label: "百家号版",
      title: baseTitle || "百家号标题",
      content: `${baseContent}\n\n【百家号版优化】结构更工整，信息更明确，更适合教程式表达。`,
    },
    wechat: {
      label: "微信公众号版",
      title: baseTitle || "公众号标题",
      content: `${baseContent}\n\n【公众号版优化】保留完整逻辑，适合长文发布与沉淀观点。`,
    },
  };
}

export default function Generate() {
  const [platform, setPlatform] = useState("toutiao");
  const [persona, setPersona] = useState("");
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState("article");
  const [wordCount, setWordCount] = useState("800");
  const [extraPrompt, setExtraPrompt] = useState("");

  const [linkedPersona, setLinkedPersona] = useState(null);
  const [personaPrompt, setPersonaPrompt] = useState("");

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [platformVersions, setPlatformVersions] = useState(null);

  useEffect(() => {
    const draft = safeParse(localStorage.getItem("content_creator_draft"), {});
    const selectedPersona = safeParse(
      localStorage.getItem("selected_persona_for_generate"),
      null,
    );

    if (draft?.platform) setPlatform(draft.platform);
    if (draft?.persona) setPersona(draft.persona);
    if (draft?.topic) setTopic(draft.topic);
    if (draft?.contentType) setContentType(draft.contentType);
    if (draft?.wordCount) setWordCount(draft.wordCount);

    if (selectedPersona) {
      const personaName = extractPersonaName(selectedPersona);
      const personaPlatform = extractPersonaPlatform(selectedPersona);
      const meta = extractPersonaMeta(selectedPersona);
      const builtPrompt = buildPersonaPrompt(selectedPersona);

      if (personaName) setPersona(personaName);
      if (personaPlatform) setPlatform(personaPlatform);
      if (builtPrompt) setPersonaPrompt(builtPrompt);

      setLinkedPersona({
        name: personaName,
        ...meta,
      });
    }
  }, []);

  const canGenerate = useMemo(() => topic.trim().length > 0, [topic]);

  const generationInstruction = useMemo(() => {
    return buildGenerationInstruction({
      platform,
      topic,
      contentType,
      wordCount,
      extraPrompt,
      personaPrompt,
    });
  }, [platform, topic, contentType, wordCount, extraPrompt, personaPrompt]);

  const handleGenerate = async () => {
    if (!canGenerate) {
      window.alert("请先输入主题");
      return;
    }

    setLoading(true);

    try {
      let nextTitle = "";
      let nextContent = "";

      if (typeof aiService?.generateArticle === "function") {
        const res = await aiService.generateArticle({
          platform,
          persona,
          topic,
          contentType,
          wordCount,
          extraPrompt,
          personaPrompt,
          instruction: generationInstruction,
        });

        nextTitle = res?.data?.title || "";
        nextContent = res?.data?.content || "";
      }

      if (!nextTitle || !nextContent) {
        const fallback = buildFallbackContent({
          platform,
          persona,
          topic,
          contentType,
          wordCount,
          extraPrompt,
          personaPrompt,
        });

        nextTitle = fallback.title;
        nextContent = fallback.content;
      }

      setTitle(nextTitle);
      setContent(nextContent);

      const history = safeParse(
        localStorage.getItem("content_creator_history"),
        [],
      );

      history.unshift({
        id: Date.now(),
        topic,
        title: nextTitle,
        content: nextContent,
        platform,
        persona,
        contentType,
        wordCount,
        extraPrompt,
        personaPrompt,
        createdAt: new Date().toISOString(),
      });

      localStorage.setItem(
        "content_creator_history",
        JSON.stringify(history.slice(0, 100)),
      );
    } catch (error) {
      console.error(error);
      window.alert("生成失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlatformVersions = () => {
    if (!content.trim()) {
      window.alert("请先生成正文");
      return;
    }
    setPlatformVersions(adaptContentByPlatform(title, content));
  };

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#f8fafc",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(320px, 420px) minmax(0, 1fr)",
          gap: 20,
          alignItems: "start",
        }}
      >
        <div style={{ display: "grid", gap: 20 }}>
          <SectionCard
            title="输入参数"
            description="配置平台、人设与主题，生成正文与平台适配版本。"
          >
            <div style={{ marginBottom: 16 }}>
              <FieldLabel>发文平台</FieldLabel>
              <Select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                options={[
                  { label: "今日头条", value: "toutiao" },
                  { label: "微头条", value: "weitoutiao" },
                  { label: "百家号", value: "baijiahao" },
                  { label: "微信公众号", value: "wechat" },
                ]}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <FieldLabel>人设</FieldLabel>
              <Input
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="例如：理性副业教练 / 毒舌情感博主"
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <FieldLabel required>主题</FieldLabel>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例如：普通人如何用AI提高内容生产效率"
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <FieldLabel>内容类型</FieldLabel>
                <Select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  options={[
                    { label: "长文", value: "article" },
                    { label: "短内容", value: "short" },
                    { label: "观点文", value: "opinion" },
                  ]}
                />
              </div>

              <div>
                <FieldLabel>字数</FieldLabel>
                <Select
                  value={wordCount}
                  onChange={(e) => setWordCount(e.target.value)}
                  options={[
                    { label: "300字", value: "300" },
                    { label: "500字", value: "500" },
                    { label: "800字", value: "800" },
                    { label: "1200字", value: "1200" },
                  ]}
                />
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <FieldLabel>补充要求</FieldLabel>
              <Textarea
                value={extraPrompt}
                onChange={(e) => setExtraPrompt(e.target.value)}
                placeholder="例如：更口语化、更强观点、适合新手阅读、结尾带行动建议"
                rows={7}
              />
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                style={{
                  border: "none",
                  background: loading ? "#9ca3af" : "#111827",
                  color: "#ffffff",
                  borderRadius: 12,
                  cursor: loading ? "not-allowed" : "pointer",
                  padding: "12px 16px",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                {loading ? "生成中..." : "生成正文"}
              </button>

              <button
                type="button"
                onClick={handleGeneratePlatformVersions}
                style={{
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  color: "#111827",
                  borderRadius: 12,
                  cursor: "pointer",
                  padding: "12px 16px",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                生成四平台版本
              </button>
            </div>
          </SectionCard>

          <SectionCard
            title="当前人设"
            description="这里展示本次写作实际采用的人设规则。"
          >
            {!linkedPersona ? (
              <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.8 }}>
                当前还没有从人设库带入人设，你也可以手动输入。
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
                    人设名称
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>
                    {linkedPersona.name || "-"}
                  </div>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
                    风格 / 目标读者
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.8, color: "#111827" }}>
                    {linkedPersona.tone || "未设置风格"}
                    {linkedPersona.audience ? ` ｜ ${linkedPersona.audience}` : ""}
                  </div>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
                    内容定位
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.8, color: "#111827" }}>
                    {linkedPersona.role || linkedPersona.intro || "暂无定位说明"}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="本次生成规则"
            description="这里显示系统实际用于生成的组合规则，方便你后续调优。"
          >
            <div
              style={{
                whiteSpace: "pre-wrap",
                fontSize: 13,
                lineHeight: 1.8,
                color: "#374151",
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: 14,
              }}
            >
              {generationInstruction || "暂无生成规则"}
            </div>
          </SectionCard>
        </div>

        <div style={{ display: "grid", gap: 20 }}>
          <SectionCard
            title="生成结果"
            description="先看主标题与正文，满意后再生成多平台版本。"
          >
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <FieldLabel>标题</FieldLabel>
                <CopyButton text={title} />
              </div>
              <div
                style={{
                  minHeight: 52,
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 14,
                  lineHeight: 1.7,
                  color: "#111827",
                  fontWeight: 700,
                }}
              >
                {title || "生成后，这里显示标题"}
              </div>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <FieldLabel>正文</FieldLabel>
                <CopyButton text={content} />
              </div>
              <div
                style={{
                  minHeight: 320,
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 16,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.9,
                  color: "#111827",
                }}
              >
                {content || "生成后，这里显示正文"}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="多平台版本"
            description="基于当前正文，输出适合手动发布的不同平台版本。"
          >
            {!platformVersions ? (
              <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.8 }}>
                先生成正文，再点击“生成四平台版本”。
              </div>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {Object.entries(platformVersions).map(([key, item]) => (
                  <div
                    key={key}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: 16,
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>
                        {item.label}
                      </div>
                      <CopyButton text={`${item.title}\n\n${item.content}`} />
                    </div>

                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#111827",
                        lineHeight: 1.7,
                        marginBottom: 8,
                      }}
                    >
                      {item.title}
                    </div>

                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        color: "#374151",
                        lineHeight: 1.9,
                        fontSize: 14,
                      }}
                    >
                      {item.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}