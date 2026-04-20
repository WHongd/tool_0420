const path = require("path");
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3001;

// 数据库路径：保持你当前项目风格不变
const dbPath = path.resolve(__dirname, "../database.sqlite");
const db = new sqlite3.Database(dbPath);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapPersona(row) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    intro: row.intro,
    tone: row.tone,
    audience: row.audience,
    prompt: row.prompt,
    tags: row.tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapArticle(row) {
  if (!row) return row;
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    personaId: row.persona_id,
    personaName: row.persona_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapFavorite(row) {
  if (!row) return row;
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    createdAt: row.created_at,
  };
}

function mapDraft(row) {
  if (!row) return null;
  return {
    draftId: row.id,
    id: row.id,
    topic: row.topic || "",
    title: row.title || "",
    content: row.content || "",
    platform: row.platform || "wechat",
    persona: row.persona || "normal",
    personaId: row.persona_id,
    personaName: row.persona_name || "",
    outline: safeJsonParse(row.outline, []),
    metadata: safeJsonParse(row.metadata, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function initDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS personas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      intro TEXT,
      tone TEXT,
      audience TEXT,
      prompt TEXT NOT NULL,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      persona_id INTEGER,
      persona_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT,
      title TEXT,
      content TEXT,
      platform TEXT DEFAULT 'wechat',
      persona TEXT DEFAULT 'normal',
      persona_id INTEGER,
      persona_name TEXT,
      outline TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("数据库初始化完成。");
}

/* -----------------------------
 * 基础工具
 * ----------------------------- */

function normalizePlatform(platform) {
  const value = String(platform || "").trim().toLowerCase();
  if (value === "weitoutiao") return "weitoutiao";
  if (value === "toutiao") return "toutiao";
  return "wechat";
}

function normalizePersona(persona) {
  const value = String(persona || "").trim().toLowerCase();
  if (value === "emotion") return "emotion";
  if (value === "professional") return "professional";
  return "normal";
}

function getPersonaStyle(persona) {
  const p = normalizePersona(persona);

  if (p === "emotion") {
    return {
      label: "情绪共鸣型",
      opening: "先抓情绪，再讲观点",
      language: "口语化、真实、带温度",
      avoid: "避免鸡汤和喊口号",
    };
  }

  if (p === "professional") {
    return {
      label: "专业分析型",
      opening: "先定义问题，再拆逻辑",
      language: "清晰、克制、信息密度高",
      avoid: "避免空泛表达和大词堆砌",
    };
  }

  return {
    label: "自然表达型",
    opening: "从现实感受切入",
    language: "自然、简洁、接地气",
    avoid: "避免机械句式和模板腔",
  };
}

function getPlatformStyle(platform) {
  const p = normalizePlatform(platform);

  if (p === "weitoutiao") {
    return {
      label: "微头条",
      goal: "短、狠、快，快速表达观点",
      lengthHint: "200-400字",
      structure: "开头钩子 + 核心观点 + 一句收尾",
      avoid: "避免写成长文章，避免过多分标题",
    };
  }

  if (p === "toutiao") {
    return {
      label: "今日头条",
      goal: "观点鲜明，有信息量，有讨论感",
      lengthHint: "600-1200字",
      structure: "争议切入 + 拆解分析 + 结论",
      avoid: "避免公众号腔和过度抒情",
    };
  }

  return {
    label: "微信公众号",
    goal: "可读性强，有层次，有代入感",
    lengthHint: "1000-1800字",
    structure: "引子 + 大纲展开 + 总结收束",
    avoid: "避免太碎，避免过度像AI报告",
  };
}

function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function createJsonResponse(res, data) {
  res.json({
    success: true,
    data,
  });
}

function createErrorResponse(res, error, message = "服务器处理失败") {
  console.error(message, error);
  res.status(500).json({
    success: false,
    error: error?.message || message,
  });
}

/* -----------------------------
 * 本地 fallback（即使模型暂时不可用，也能返回结果）
 * ----------------------------- */

function buildLocalTitleCandidates(topic, platform, persona, candidateCount = 3) {
  const safeTopic = compactText(topic) || "这个话题";
  const p = normalizePlatform(platform);
  const r = normalizePersona(persona);

  const personaPrefixMap = {
    normal: ["很多人忽略了", "别低估了", "真正值得想清楚的"],
    emotion: ["说实话", "越来越多人开始意识到", "最让人难受的是"],
    professional: ["从结果来看", "真正需要拆开的", "最值得分析的"],
  };

  const platformSuffixMap = {
    wechat: [
      `为什么“${safeTopic}”值得认真聊一聊？`,
      `关于“${safeTopic}”，很多人其实一直想浅了`,
      `“${safeTopic}”背后，藏着一个更现实的问题`,
    ],
    toutiao: [
      `“${safeTopic}”为什么总能引发争议？`,
      `关于“${safeTopic}”，这几点很关键`,
      `很多人都在谈“${safeTopic}”，但重点不是表面`,
    ],
    weitoutiao: [
      `“${safeTopic}”这件事，真的越来越明显了`,
      `关于“${safeTopic}”，我有几句实话想说`,
      `“${safeTopic}”背后，其实很现实`,
    ],
  };

  const prefixes = personaPrefixMap[r] || personaPrefixMap.normal;
  const suffixes = platformSuffixMap[p] || platformSuffixMap.wechat;

  return Array.from({ length: Math.max(1, Number(candidateCount) || 3) }).map(
    (_, index) => ({
      title: `${prefixes[index % prefixes.length]}：${suffixes[index % suffixes.length]}`,
      score: 92 - index * 4,
      reason: "后端 fallback 结果",
    })
  );
}

function buildLocalWeitoutiao({ topic, persona }) {
  const safeTopic = compactText(topic) || "这个话题";
  const r = normalizePersona(persona);

  if (r === "emotion") {
    return `说实话，关于“${safeTopic}”，很多人表面上在讨论一件事，实际上是在表达委屈、压力和不甘。你以为只是小问题，放到现实里才会发现，它真正影响的是情绪、判断和选择。很多时候，不是事情本身有多复杂，而是身处其中的人太容易被消耗。`;
  }

  if (r === "professional") {
    return `围绕“${safeTopic}”，如果只看表面现象，很容易得出片面结论。真正值得关注的是它背后的逻辑链条：问题为什么发生、影响了谁、会带来什么结果，以及普通人该如何判断和应对。把这几点想清楚，内容才有价值。`;
  }

  return `很多人聊“${safeTopic}”时，只停留在表面判断。但真正值得说的，不只是一个观点，而是它背后的现实处境、常见误区和实际影响。把这件事讲明白，往往比单纯表态更有价值。`;
}

function buildLocalOutline({ title, persona }) {
  const safeTitle = compactText(title) || "这个主题";
  const r = normalizePersona(persona);

  if (r === "emotion") {
    return [
      {
        id: "section_1",
        order: 1,
        title: "开头：先把情绪拉进来",
        summary: `直接点出“${safeTitle}”最让人有感触的地方。`,
      },
      {
        id: "section_2",
        order: 2,
        title: "问题为什么会发生",
        summary: "说明背后的原因，不只是发泄情绪。",
      },
      {
        id: "section_3",
        order: 3,
        title: "现实里最常见的场景",
        summary: "用典型场景让读者对号入座。",
      },
      {
        id: "section_4",
        order: 4,
        title: "我的判断",
        summary: "明确表达你的态度，不要模糊。",
      },
    ];
  }

  if (r === "professional") {
    return [
      {
        id: "section_1",
        order: 1,
        title: "背景与定义",
        summary: `先把“${safeTitle}”的讨论边界讲清楚。`,
      },
      {
        id: "section_2",
        order: 2,
        title: "核心问题拆解",
        summary: "拆出 2-3 个关键点。",
      },
      {
        id: "section_3",
        order: 3,
        title: "原因与影响",
        summary: "解释为什么会这样，以及会带来什么结果。",
      },
      {
        id: "section_4",
        order: 4,
        title: "结论与建议",
        summary: "给出清晰结论和可执行建议。",
      },
    ];
  }

  return [
    {
      id: "section_1",
      order: 1,
      title: "开头：背景与问题",
      summary: `用简短语言引出“${safeTitle}”为什么值得讨论。`,
    },
    {
      id: "section_2",
      order: 2,
      title: "核心观点一",
      summary: "先讲最重要的切入点。",
    },
    {
      id: "section_3",
      order: 3,
      title: "核心观点二",
      summary: "补充第二层分析和细节。",
    },
    {
      id: "section_4",
      order: 4,
      title: "结尾：总结与行动",
      summary: "收束全文，给出总结或提醒。",
    },
  ];
}

function buildLocalSection({ articleTitle, section, persona }) {
  const title = compactText(articleTitle) || "这个主题";
  const sectionTitle = compactText(section?.title) || "这一部分";
  const summary = compactText(section?.summary || "");
  const r = normalizePersona(persona);

  if (r === "emotion") {
    return `## ${sectionTitle}

围绕“${title}”，这一部分最重要的不是把话说满，而是把真实感受说透。

${summary}

很多人遇到类似情况时，表面上看是在讨论一件事，实际上是在表达压力、委屈或者不甘。真正能打动人的内容，不是大道理，而是那种“我也经历过”的感觉。`;
  }

  if (r === "professional") {
    return `## ${sectionTitle}

围绕“${title}”，这一部分重点分析 ${sectionTitle}。

${summary}

可以从问题定义、关键变量和实际影响三个层面展开，这样内容会更清晰。写作时尽量减少空泛判断，多给出可验证的场景、逻辑和结论。`;
  }

  return `## ${sectionTitle}

围绕“${title}”，这一部分重点展开 ${sectionTitle}。

${summary}

可以从用户场景、核心问题和实际价值三个角度继续往下写，让内容更完整、更有层次。写作时尽量避免空泛描述，优先给出具体表达、简短判断和可执行的信息。`;
}

function buildLocalArticle({ title, platform, persona }) {
  const p = normalizePlatform(platform);
  const outline = p === "wechat" ? buildLocalOutline({ title, persona }) : [];

  const opening =
    normalizePersona(persona) === "emotion"
      ? `说实话，看到“${title}”这个话题，我第一反应不是复杂，而是很多人真的一直没把它想明白。`
      : normalizePersona(persona) === "professional"
      ? `围绕“${title}”这个主题，如果只做表层表达，很容易失去内容价值。`
      : `很多人一开始看到“${title}”这个问题时，往往只会停留在表面理解。`;

  let content = opening;

  if (p === "wechat") {
    outline.forEach((section) => {
      content += `\n\n${buildLocalSection({
        articleTitle: title,
        section,
        persona,
      })}`;
    });
  } else {
    content += `\n\n${buildLocalWeitoutiao({ topic: title, persona })}`;
  }

  return {
    outline,
    content,
  };
}

/* -----------------------------
 * LLM 调用
 * 说明：
 * 1）优先走你已配置的 DeepSeek
 * 2）如果没配，自动 fallback
 * 3）不额外引入依赖，直接用 fetch
 * ----------------------------- */

function getModelConfig() {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    baseUrl:
      process.env.DEEPSEEK_BASE_URL ||
      "https://api.deepseek.com/v1/chat/completions",
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
  };
}

async function callChatModel(messages, options = {}) {
  const config = getModelConfig();

  if (!config.apiKey) {
    return null;
  }

  const response = await fetch(config.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: options.temperature ?? 0.8,
      max_tokens: options.maxTokens ?? 1200,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`模型请求失败：${response.status} ${errorText}`);
  }

  const json = await response.json();
  const content =
    json?.choices?.[0]?.message?.content ||
    json?.data?.choices?.[0]?.message?.content ||
    "";

  return String(content || "").trim();
}

function buildSystemPrompt(platform, persona) {
  const personaStyle = getPersonaStyle(persona);
  const platformStyle = getPlatformStyle(platform);

  return `
你是一个中文内容创作助手，要帮助用户生成“更像真人写的爆文内容”。

写作总原则：
1. 强调真人表达，减少AI味，避免模板腔、空话、正确废话。
2. 句子长短要自然变化，不要每句都很工整。
3. 优先写“观点 + 解释 + 场景感”，不要堆术语。
4. 可以带一点主观判断，但不要极端。
5. 不要写“首先、其次、最后”这种很重的AI痕迹，除非真的必要。
6. 不要输出解释过程，只输出最终结果。
7. 默认使用简体中文。

当前平台：
- 平台：${platformStyle.label}
- 平台目标：${platformStyle.goal}
- 建议长度：${platformStyle.lengthHint}
- 结构偏好：${platformStyle.structure}
- 要避免：${platformStyle.avoid}

当前人设：
- 人设类型：${personaStyle.label}
- 开头方式：${personaStyle.opening}
- 表达风格：${personaStyle.language}
- 要避免：${personaStyle.avoid}
`.trim();
}

function safeExtractJson(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {}

  const match = String(text || "").match(/```json\s*([\s\S]*?)\s*```|(\{[\s\S]*\})|(\[[\s\S]*\])/);
  const raw = match?.[1] || match?.[2] || match?.[3];
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function generateTitlesWithModel({ topic, platform, persona, candidateCount }) {
  const systemPrompt = buildSystemPrompt(platform, persona);
  const userPrompt = `
请围绕主题“${compactText(topic) || "这个话题"}”，为 ${getPlatformStyle(platform).label} 生成 ${candidateCount} 个标题候选。

要求：
1. 每个标题都要有点击感，但不要夸张低俗。
2. 明显区分平台风格。
3. 明显体现人设表达。
4. 尽量降低AI味，像真人会写的标题。
5. 返回 JSON，格式如下：
{
  "titles": [
    { "title": "标题1", "score": 95, "reason": "一句话说明理由" }
  ],
  "bestTitle": "最佳标题"
}
只返回 JSON。
`.trim();

  const content = await callChatModel(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.9, maxTokens: 1200 }
  );

  if (!content) return null;

  const parsed = safeExtractJson(content, null);
  if (!parsed || !Array.isArray(parsed.titles)) return null;

  return {
    titles: parsed.titles.map((item, index) => ({
      title: compactText(item?.title) || `标题候选 ${index + 1}`,
      score: Number(item?.score) || 90 - index * 3,
      reason: compactText(item?.reason) || "模型生成结果",
    })),
    bestTitle:
      compactText(parsed.bestTitle) ||
      compactText(parsed.titles?.[0]?.title) ||
      "",
  };
}

async function generateWeitoutiaoWithModel({ topic, platform, persona }) {
  const systemPrompt = buildSystemPrompt(platform, persona);
  const userPrompt = `
请围绕主题“${compactText(topic) || "这个话题"}”，写一篇适合 ${getPlatformStyle("weitoutiao").label} 发布的短内容。

要求：
1. 200-400字左右。
2. 开头就进入观点，不要铺垫太长。
3. 允许有情绪、有态度，但不要极端。
4. 降低AI味，不要像说明书。
5. 只返回正文，不要加标题，不要解释。
`.trim();

  const content = await callChatModel(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.9, maxTokens: 800 }
  );

  return content || null;
}

async function generateOutlineWithModel({ title, platform, persona }) {
  const systemPrompt = buildSystemPrompt(platform, persona);
  const userPrompt = `
请围绕标题“${compactText(title) || "这个主题"}”，生成一份适合 ${getPlatformStyle(platform).label} 的文章大纲。

要求：
1. 4-6个部分。
2. 每个部分都要有标题和一句摘要。
3. 要体现平台差异和人设差异。
4. 返回 JSON 数组，格式如下：
[
  { "id": "section_1", "order": 1, "title": "部分标题", "summary": "一句摘要" }
]
只返回 JSON。
`.trim();

  const content = await callChatModel(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.8, maxTokens: 1200 }
  );

  if (!content) return null;

  const parsed = safeExtractJson(content, null);
  if (!Array.isArray(parsed)) return null;

  return parsed.map((item, index) => ({
    id: item?.id || `section_${index + 1}`,
    order: Number(item?.order) || index + 1,
    title: compactText(item?.title) || `第${index + 1}部分`,
    summary: compactText(item?.summary) || "",
  }));
}

async function generateSectionWithModel({ articleTitle, platform, persona, section }) {
  const systemPrompt = buildSystemPrompt(platform, persona);
  const userPrompt = `
请为文章“${compactText(articleTitle) || "这个主题"}”写其中一个部分。

当前部分：
- 标题：${compactText(section?.title) || "这一部分"}
- 摘要：${compactText(section?.summary) || ""}

要求：
1. 输出这一部分的正文。
2. 内容要具体，不要空泛。
3. 有场景感、观点感，降低AI味。
4. 可使用 markdown 小标题。
5. 只返回正文，不要解释。
`.trim();

  const content = await callChatModel(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.85, maxTokens: 1200 }
  );

  return content || null;
}

async function generateArticleWithModel({ title, platform, persona, withOutline }) {
  const p = normalizePlatform(platform);

  if (p === "wechat" && withOutline) {
    const sections =
      (await generateOutlineWithModel({ title, platform, persona })) ||
      buildLocalOutline({ title, persona });

    const contents = [];
    for (const section of sections) {
      const part =
        (await generateSectionWithModel({
          articleTitle: title,
          platform,
          persona,
          section,
        })) ||
        buildLocalSection({
          articleTitle: title,
          section,
          persona,
        });

      contents.push(part);
    }

    return {
      outline: sections,
      content: contents.join("\n\n"),
    };
  }

  if (p === "weitoutiao") {
    const content =
      (await generateWeitoutiaoWithModel({ topic: title, platform, persona })) ||
      buildLocalWeitoutiao({ topic: title, persona });

    return {
      outline: [],
      content,
    };
  }

  const systemPrompt = buildSystemPrompt(platform, persona);
  const userPrompt = `
请围绕标题“${compactText(title) || "这个主题"}”，生成一篇完整文章。

要求：
1. 符合 ${getPlatformStyle(platform).label} 风格。
2. 明显体现 ${getPersonaStyle(persona).label} 的写法。
3. 有观点，有展开，有结论。
4. 尽量像真人写的，不要有重AI味。
5. 只返回正文，不要解释。
`.trim();

  const content = await callChatModel(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.85, maxTokens: 2200 }
  );

  if (!content) {
    return buildLocalArticle({ title, platform, persona });
  }

  return {
    outline: [],
    content,
  };
}

/* -----------------------------
 * 健康检查
 * ----------------------------- */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    modelEnabled: Boolean(process.env.DEEPSEEK_API_KEY),
  });
});

/* -----------------------------
 * Drafts
 * ----------------------------- */

app.post("/api/drafts/save", async (req, res) => {
  try {
    const {
      topic = "",
      title = "",
      content = "",
      platform = "wechat",
      persona = "normal",
      personaId = null,
      personaName = "",
      outline = [],
      metadata = {},
    } = req.body || {};

    const result = await run(
      `
      INSERT INTO drafts (
        topic,
        title,
        content,
        platform,
        persona,
        persona_id,
        persona_name,
        outline,
        metadata,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [
        String(topic || ""),
        String(title || ""),
        String(content || ""),
        normalizePlatform(platform),
        normalizePersona(persona),
        personaId ?? null,
        String(personaName || ""),
        JSON.stringify(Array.isArray(outline) ? outline : []),
        JSON.stringify(metadata && typeof metadata === "object" ? metadata : {}),
      ]
    );

    const row = await get(`SELECT * FROM drafts WHERE id = ?`, [result.lastID]);

    createJsonResponse(res, {
      draftId: row.id,
      draft: mapDraft(row),
    });
  } catch (error) {
    createErrorResponse(res, error, "保存草稿失败");
  }
});

app.get("/api/drafts/latest", async (req, res) => {
  try {
    const row = await get(`
      SELECT *
      FROM drafts
      ORDER BY updated_at DESC, id DESC
      LIMIT 1
    `);

    createJsonResponse(res, row ? mapDraft(row) : null);
  } catch (error) {
    createErrorResponse(res, error, "获取最近草稿失败");
  }
});

/* -----------------------------
 * Content
 * ----------------------------- */

app.post("/api/content/generate-titles", async (req, res) => {
  try {
    const {
      topic = "",
      platform = "wechat",
      persona = "normal",
      candidateCount = 3,
    } = req.body || {};

    const modelResult = await generateTitlesWithModel({
      topic,
      platform,
      persona,
      candidateCount,
    });

    if (modelResult) {
      return createJsonResponse(res, modelResult);
    }

    const titles = buildLocalTitleCandidates(
      topic,
      platform,
      persona,
      candidateCount
    );

    createJsonResponse(res, {
      titles,
      bestTitle: titles?.[0]?.title || "",
    });
  } catch (error) {
    const {
      topic = "",
      platform = "wechat",
      persona = "normal",
      candidateCount = 3,
    } = req.body || {};

    const titles = buildLocalTitleCandidates(
      topic,
      platform,
      persona,
      candidateCount
    );

    createJsonResponse(res, {
      titles,
      bestTitle: titles?.[0]?.title || "",
      fallback: true,
    });
  }
});

app.post("/api/content/generate-weitoutiao", async (req, res) => {
  try {
    const { topic = "", platform = "weitoutiao", persona = "normal" } = req.body || {};

    const content = await generateWeitoutiaoWithModel({
      topic,
      platform,
      persona,
    });

    createJsonResponse(res, {
      content: content || buildLocalWeitoutiao({ topic, persona }),
    });
  } catch (error) {
    const { topic = "", persona = "normal" } = req.body || {};

    createJsonResponse(res, {
      content: buildLocalWeitoutiao({ topic, persona }),
      fallback: true,
    });
  }
});

app.post("/api/content/generate-outline", async (req, res) => {
  try {
    const { title = "", platform = "wechat", persona = "normal" } = req.body || {};

    const sections = await generateOutlineWithModel({
      title,
      platform,
      persona,
    });

    createJsonResponse(res, {
      sections: sections || buildLocalOutline({ title, persona }),
    });
  } catch (error) {
    const { title = "", persona = "normal" } = req.body || {};

    createJsonResponse(res, {
      sections: buildLocalOutline({ title, persona }),
      fallback: true,
    });
  }
});

app.post("/api/content/generate-section", async (req, res) => {
  try {
    const {
      articleTitle = "",
      platform = "wechat",
      persona = "normal",
      section = {},
    } = req.body || {};

    const content = await generateSectionWithModel({
      articleTitle,
      platform,
      persona,
      section,
    });

    createJsonResponse(res, {
      content:
        content ||
        buildLocalSection({
          articleTitle,
          section,
          persona,
        }),
    });
  } catch (error) {
    const {
      articleTitle = "",
      section = {},
      persona = "normal",
    } = req.body || {};

    createJsonResponse(res, {
      content: buildLocalSection({
        articleTitle,
        section,
        persona,
      }),
      fallback: true,
    });
  }
});

app.post("/api/content/generate-article", async (req, res) => {
  try {
    const {
      title = "",
      platform = "wechat",
      persona = "normal",
      withOutline = true,
    } = req.body || {};

    const result = await generateArticleWithModel({
      title,
      platform,
      persona,
      withOutline,
    });

    createJsonResponse(res, result);
  } catch (error) {
    const {
      title = "",
      platform = "wechat",
      persona = "normal",
    } = req.body || {};

    createJsonResponse(res, {
      ...buildLocalArticle({ title, platform, persona }),
      fallback: true,
    });
  }
});

/* -----------------------------
 * Personas
 * ----------------------------- */

app.get("/api/personas", async (req, res) => {
  try {
    const rows = await all(`
      SELECT *
      FROM personas
      ORDER BY updated_at DESC, id DESC
    `);
    res.json(rows.map(mapPersona));
  } catch (error) {
    res.status(500).json({ error: error.message || "获取人设失败" });
  }
});

app.get("/api/personas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const row = await get(`SELECT * FROM personas WHERE id = ?`, [id]);

    if (!row) {
      return res.status(404).json({ error: "Persona not found" });
    }

    res.json(mapPersona(row));
  } catch (error) {
    res.status(500).json({ error: error.message || "获取人设详情失败" });
  }
});

app.post("/api/personas", async (req, res) => {
  try {
    const {
      name,
      role,
      intro = "",
      tone = "",
      audience = "",
      prompt = "",
      tags = "",
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "name is required" });
    }

    if (!role || !String(role).trim()) {
      return res.status(400).json({ error: "role is required" });
    }

    const finalPrompt =
      String(prompt).trim() ||
      [
        `角色定位：${role}`,
        intro ? `角色简介：${intro}` : "",
        tone ? `语气风格：${tone}` : "",
        audience ? `目标受众：${audience}` : "",
      ]
        .filter(Boolean)
        .join("\n");

    const result = await run(
      `
      INSERT INTO personas (
        name,
        role,
        intro,
        tone,
        audience,
        prompt,
        tags,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [name.trim(), role.trim(), intro, tone, audience, finalPrompt, tags]
    );

    const row = await get(`SELECT * FROM personas WHERE id = ?`, [result.lastID]);
    res.json(mapPersona(row));
  } catch (error) {
    res.status(500).json({ error: error.message || "创建人设失败" });
  }
});

app.put("/api/personas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      role,
      intro = "",
      tone = "",
      audience = "",
      prompt = "",
      tags = "",
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "name is required" });
    }

    if (!role || !String(role).trim()) {
      return res.status(400).json({ error: "role is required" });
    }

    const finalPrompt =
      String(prompt).trim() ||
      [
        `角色定位：${role}`,
        intro ? `角色简介：${intro}` : "",
        tone ? `语气风格：${tone}` : "",
        audience ? `目标受众：${audience}` : "",
      ]
        .filter(Boolean)
        .join("\n");

    const result = await run(
      `
      UPDATE personas
      SET
        name = ?,
        role = ?,
        intro = ?,
        tone = ?,
        audience = ?,
        prompt = ?,
        tags = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [name.trim(), role.trim(), intro, tone, audience, finalPrompt, tags, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Persona not found" });
    }

    const row = await get(`SELECT * FROM personas WHERE id = ?`, [id]);
    res.json(mapPersona(row));
  } catch (error) {
    res.status(500).json({ error: error.message || "更新人设失败" });
  }
});

app.delete("/api/personas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await run(`DELETE FROM personas WHERE id = ?`, [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Persona not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message || "删除人设失败" });
  }
});

/* -----------------------------
 * Articles
 * ----------------------------- */

app.get("/api/articles", async (req, res) => {
  try {
    const rows = await all(`
      SELECT *
      FROM articles
      ORDER BY updated_at DESC, id DESC
    `);
    res.json(rows.map(mapArticle));
  } catch (error) {
    res.status(500).json({ error: error.message || "获取文章失败" });
  }
});

app.get("/api/articles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const row = await get(`SELECT * FROM articles WHERE id = ?`, [id]);

    if (!row) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.json(mapArticle(row));
  } catch (error) {
    res.status(500).json({ error: error.message || "获取文章详情失败" });
  }
});

app.post("/api/articles", async (req, res) => {
  try {
    const {
      title = "未命名文章",
      content = "",
      personaId = null,
      personaName = "",
    } = req.body;

    if (!String(content).trim()) {
      return res.status(400).json({ error: "content is required" });
    }

    const result = await run(
      `
      INSERT INTO articles (
        title,
        content,
        persona_id,
        persona_name,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [title, content, personaId, personaName]
    );

    const row = await get(`SELECT * FROM articles WHERE id = ?`, [result.lastID]);
    res.json(mapArticle(row));
  } catch (error) {
    res.status(500).json({ error: error.message || "创建文章失败" });
  }
});

app.put("/api/articles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title = "未命名文章",
      content = "",
      personaId = null,
      personaName = "",
    } = req.body;

    if (!String(content).trim()) {
      return res.status(400).json({ error: "content is required" });
    }

    const result = await run(
      `
      UPDATE articles
      SET
        title = ?,
        content = ?,
        persona_id = ?,
        persona_name = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [title, content, personaId, personaName, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Article not found" });
    }

    const row = await get(`SELECT * FROM articles WHERE id = ?`, [id]);
    res.json(mapArticle(row));
  } catch (error) {
    res.status(500).json({ error: error.message || "更新文章失败" });
  }
});

app.delete("/api/articles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await run(`DELETE FROM articles WHERE id = ?`, [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message || "删除文章失败" });
  }
});

/* -----------------------------
 * Favorites
 * ----------------------------- */

app.get("/api/favorites", async (req, res) => {
  try {
    const rows = await all(`
      SELECT *
      FROM favorites
      ORDER BY created_at DESC, id DESC
    `);
    res.json(rows.map(mapFavorite));
  } catch (error) {
    res.status(500).json({ error: error.message || "获取收藏失败" });
  }
});

app.post("/api/favorites", async (req, res) => {
  try {
    const { targetType, targetId } = req.body;

    if (!targetType || !String(targetType).trim()) {
      return res.status(400).json({ error: "targetType is required" });
    }

    if (targetId === undefined || targetId === null) {
      return res.status(400).json({ error: "targetId is required" });
    }

    const exists = await get(
      `
      SELECT *
      FROM favorites
      WHERE target_type = ? AND target_id = ?
      `,
      [targetType, targetId]
    );

    if (exists) {
      return res.json(mapFavorite(exists));
    }

    const result = await run(
      `
      INSERT INTO favorites (target_type, target_id, created_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      `,
      [targetType, targetId]
    );

    const row = await get(`SELECT * FROM favorites WHERE id = ?`, [result.lastID]);
    res.json(mapFavorite(row));
  } catch (error) {
    res.status(500).json({ error: error.message || "创建收藏失败" });
  }
});

app.delete("/api/favorites/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await run(`DELETE FROM favorites WHERE id = ?`, [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message || "删除收藏失败" });
  }
});

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("数据库初始化失败：", error);
    process.exit(1);
  });