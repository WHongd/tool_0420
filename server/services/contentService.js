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

function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
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
      { id: "section_1", order: 1, title: "开头：先把情绪拉进来", summary: `直接点出“${safeTitle}”最让人有感触的地方。` },
      { id: "section_2", order: 2, title: "问题为什么会发生", summary: "说明背后的原因，不只是发泄情绪。" },
      { id: "section_3", order: 3, title: "现实里最常见的场景", summary: "用典型场景让读者对号入座。" },
      { id: "section_4", order: 4, title: "我的判断", summary: "明确表达你的态度，不要模糊。" },
    ];
  }

  if (r === "professional") {
    return [
      { id: "section_1", order: 1, title: "背景与定义", summary: `先把“${safeTitle}”的讨论边界讲清楚。` },
      { id: "section_2", order: 2, title: "核心问题拆解", summary: "拆出 2-3 个关键点。" },
      { id: "section_3", order: 3, title: "原因与影响", summary: "解释为什么会这样，以及会带来什么结果。" },
      { id: "section_4", order: 4, title: "结论与建议", summary: "给出清晰结论和可执行建议。" },
    ];
  }

  return [
    { id: "section_1", order: 1, title: "开头：背景与问题", summary: `用简短语言引出“${safeTitle}”为什么值得讨论。` },
    { id: "section_2", order: 2, title: "核心观点一", summary: "先讲最重要的切入点。" },
    { id: "section_3", order: 3, title: "核心观点二", summary: "补充第二层分析和细节。" },
    { id: "section_4", order: 4, title: "结尾：总结与行动", summary: "收束全文，给出总结或提醒。" },
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
      content += `\n\n${buildLocalSection({ articleTitle: title, section, persona })}`;
    });
  } else {
    content += `\n\n${buildLocalWeitoutiao({ topic: title, persona })}`;
  }

  return { outline, content };
}

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
  return String(json?.choices?.[0]?.message?.content || "").trim();
}

function buildSystemPrompt(platform, persona) {
  const personaStyle = getPersonaStyle(persona);
  const platformStyle = getPlatformStyle(platform);

  return `
你是一个中文内容创作助手，要帮助用户生成更像真人写的内容。

要求：
1. 减少AI味，避免模板腔。
2. 句子长短自然变化。
3. 多写观点、场景和判断。
4. 不要输出解释过程。
5. 默认使用简体中文。

平台：
- ${platformStyle.label}
- 目标：${platformStyle.goal}
- 长度：${platformStyle.lengthHint}
- 结构：${platformStyle.structure}
- 避免：${platformStyle.avoid}

人设：
- ${personaStyle.label}
- 开头：${personaStyle.opening}
- 风格：${personaStyle.language}
- 避免：${personaStyle.avoid}
`.trim();
}

function safeExtractJson(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {}

  const match = String(text || "").match(
    /```json\s*([\s\S]*?)\s*```|(\{[\s\S]*\})|(\[[\s\S]*\])/
  );
  const raw = match?.[1] || match?.[2] || match?.[3];
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function generateTitles({ topic, platform, persona, candidateCount = 3 }) {
  try {
    const systemPrompt = buildSystemPrompt(platform, persona);
    const userPrompt = `
请围绕主题“${compactText(topic) || "这个话题"}”，为 ${getPlatformStyle(platform).label} 生成 ${candidateCount} 个标题候选。

返回 JSON：
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

    const parsed = safeExtractJson(content, null);
    if (parsed && Array.isArray(parsed.titles)) {
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
  } catch {}

  const titles = buildLocalTitleCandidates(topic, platform, persona, candidateCount);
  return {
    titles,
    bestTitle: titles[0]?.title || "",
    fallback: true,
  };
}

async function generateWeitoutiao({ topic, platform = "weitoutiao", persona }) {
  try {
    const systemPrompt = buildSystemPrompt(platform, persona);
    const userPrompt = `
请围绕主题“${compactText(topic) || "这个话题"}”，写一篇适合微头条发布的短内容。
要求：
1. 200-400字
2. 开头直接进入观点
3. 只返回正文
`.trim();

    const content = await callChatModel(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.9, maxTokens: 800 }
    );

    if (content) {
      return { content };
    }
  } catch {}

  return {
    content: buildLocalWeitoutiao({ topic, persona }),
    fallback: true,
  };
}

async function generateOutline({ title, platform, persona }) {
  try {
    const systemPrompt = buildSystemPrompt(platform, persona);
    const userPrompt = `
请围绕标题“${compactText(title) || "这个主题"}”，生成文章大纲。
返回 JSON 数组：
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

    const parsed = safeExtractJson(content, null);
    if (Array.isArray(parsed)) {
      return {
        sections: parsed.map((item, index) => ({
          id: item?.id || `section_${index + 1}`,
          order: Number(item?.order) || index + 1,
          title: compactText(item?.title) || `第${index + 1}部分`,
          summary: compactText(item?.summary) || "",
        })),
      };
    }
  } catch {}

  return {
    sections: buildLocalOutline({ title, persona }),
    fallback: true,
  };
}

async function generateSection({ articleTitle, platform, persona, section }) {
  try {
    const systemPrompt = buildSystemPrompt(platform, persona);
    const userPrompt = `
请为文章“${compactText(articleTitle) || "这个主题"}”写其中一个部分。

当前部分：
- 标题：${compactText(section?.title) || "这一部分"}
- 摘要：${compactText(section?.summary) || ""}

只返回正文。
`.trim();

    const content = await callChatModel(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.85, maxTokens: 1200 }
    );

    if (content) {
      return { content };
    }
  } catch {}

  return {
    content: buildLocalSection({ articleTitle, section, persona }),
    fallback: true,
  };
}

async function generateArticle({ title, platform, persona, withOutline = true }) {
  try {
    const p = normalizePlatform(platform);

    if (p === "wechat" && withOutline) {
      const outlineResult = await generateOutline({ title, platform, persona });
      const sections = outlineResult.sections || [];
      const blocks = [];

      for (const section of sections) {
        const part = await generateSection({
          articleTitle: title,
          platform,
          persona,
          section,
        });
        blocks.push(part.content || "");
      }

      return {
        outline: sections,
        content: blocks.join("\n\n"),
        fallback: Boolean(outlineResult.fallback),
      };
    }

    if (p === "weitoutiao") {
      const result = await generateWeitoutiao({ topic: title, platform, persona });
      return {
        outline: [],
        content: result.content || "",
        fallback: Boolean(result.fallback),
      };
    }

    const systemPrompt = buildSystemPrompt(platform, persona);
    const userPrompt = `
请围绕标题“${compactText(title) || "这个主题"}”，生成一篇完整文章。
只返回正文。
`.trim();

    const content = await callChatModel(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.85, maxTokens: 2200 }
    );

    if (content) {
      return { outline: [], content };
    }
  } catch {}

  return {
    ...buildLocalArticle({ title, platform, persona }),
    fallback: true,
  };
}

module.exports = {
  normalizePlatform,
  normalizePersona,
  generateTitles,
  generateWeitoutiao,
  generateOutline,
  generateSection,
  generateArticle,
};