const { getWechatPrompt } = require("../prompts/wechatPrompt");
const { getToutiaoPrompt } = require("../prompts/toutiaoPrompt");
const { getWeitoutiaoPrompt } = require("../prompts/weitoutiaoPrompt");
const { getWechatArticlePrompt } = require("../prompts/wechatArticlePrompt");

function normalizePlatform(platform) {
  const value = String(platform || "").trim().toLowerCase();
  if (value === "toutiao") return "toutiao";
  if (value === "weitoutiao") return "weitoutiao";
  return "wechat";
}

function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanModelOutput(text) {
  return String(text || "")
    .replace(/\*\*/g, "")
    .replace(/^###\s*/gm, "")
    .replace(/^##\s*/gm, "")
    .replace(/^#\s*/gm, "")
    .replace(new RegExp("`{3}[\\s\\S]*?`{3}", "g"), "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function safeExtractJson(text, fallback) {
  const rawText = String(text || "").trim();

  try {
    return JSON.parse(rawText);
  } catch {}

  const objectMatch = rawText.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch {}
  }

  const arrayMatch = rawText.match(/\[[\s\S]*\]/);
  if (arrayMatch?.[0]) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch {}
  }

  return fallback;
}

function getModelConfig() {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    baseUrl:
      process.env.DEEPSEEK_BASE_URL ||
      "https://api.deepseek.com/v1/chat/completions",
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    timeoutMs: Number(process.env.DEEPSEEK_TIMEOUT_MS || 20000),
  };
}

async function callChatModel(messages, options = {}) {
  const config = getModelConfig();

  if (!config.apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(config.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: options.temperature ?? 0.88,
        max_tokens: options.maxTokens ?? 1500,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`模型请求失败：${response.status} ${errorText}`);
    }

    const json = await response.json();
    return String(json?.choices?.[0]?.message?.content || "").trim();
  } catch (e) {
    console.error("模型调用失败:", e.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function getContextValue(input = {}) {
  return compactText(
    input.context ||
      input.newsContext ||
      input.newsFacts ||
      input.material ||
      input.materials ||
      ""
  );
}

function buildContextBlock(context) {
  const safeContext = compactText(context);

  if (safeContext) {
    return `
【新闻事实素材】
${safeContext}

【事实使用要求】
1. 标题和正文必须围绕以上事实展开，不能只围绕抽象主题发挥。
2. 可以分析、判断、延伸，但不能编造素材中没有提供的具体时间、地点、人物、职务、结果。
3. 如果素材里有明确时间、地点、人物、事件，可以使用；如果没有提供，就不要自行补充。
4. 涉及时政、领导人、战争、外交、政策时，宁可表达克制，也不要写错事实。
`.trim();
  }

  return `
【事实限制】
当前没有提供具体新闻事实素材。

要求：
1. 不要编造具体时间、地点、人物、职务、发言和事件结果。
2. 不要轻易使用“今天、刚刚、最新、目前”等确定性表达。
3. 可以使用“相关方、外界、决策层、高层、这类变化、相关表态”等稳妥表达。
4. 标题和正文要有现实判断，但不能假装掌握当天最新事实。
`.trim();
}

function normalizeOutlineSections(sections, title) {
  const safeTitle = compactText(title) || "这个主题";

  const fallbackSections = [
    {
      id: "section_1",
      order: 1,
      title: "这件事真正刺痛了什么",
      summary: `先从“${safeTitle}”背后的现实感受切入，不急着下结论。`,
    },
    {
      id: "section_2",
      order: 2,
      title: "表面问题之外，还有更深的一层",
      summary: "指出多数人容易看偏的地方，把真正的问题拎出来。",
    },
    {
      id: "section_3",
      order: 3,
      title: "普通人为什么也该关注",
      summary: "把话题落到现实影响、生活处境和普通人的判断上。",
    },
    {
      id: "section_4",
      order: 4,
      title: "最后真正要看的，不是谁喊得响",
      summary: "收束为一个克制但明确的判断，避免空泛总结。",
    },
  ];

  if (!Array.isArray(sections) || !sections.length) {
    return fallbackSections;
  }

  const normalized = sections
    .slice(0, 5)
    .map((item, index) => {
      const rawTitle =
        item?.title ||
        item?.sectionTitle ||
        item?.heading ||
        item?.name ||
        "";

      const rawSummary =
        item?.summary ||
        item?.description ||
        item?.desc ||
        item?.content ||
        item?.point ||
        "";

      return {
        id: item?.id || `section_${index + 1}`,
        order: Number(item?.order) || index + 1,
        title:
          compactText(rawTitle) ||
          fallbackSections[index]?.title ||
          `第${index + 1}部分`,
        summary:
          compactText(rawSummary) ||
          fallbackSections[index]?.summary ||
          "围绕这一部分继续展开观点和现实判断。",
      };
    });

  while (normalized.length < 4) {
    normalized.push(fallbackSections[normalized.length]);
  }

  return normalized;
}

function detectTitleType(title) {
  const t = String(title || "");

  if (/不安|难受|扎心|说实话|心酸|无力感/.test(t)) {
    return "emotion";
  }

  if (/很多人|问题不在|根本不在|看错|没看懂|但/.test(t)) {
    return "judgement";
  }

  if (/信号|不是偶然|意味着|变化在后面|接下来/.test(t)) {
    return "signal";
  }

  if (/普通人|吃亏|影响|代价|成本/.test(t)) {
    return "reality";
  }

  return "normal";
}

function buildArticlePrompt(title, platform, context = "") {
  const type = detectTitleType(title);
  const safeTitle = compactText(title) || "这个主题";
  const contextBlock = buildContextBlock(context);

  const commonRules = `
${contextBlock}

通用要求：
1. 写之前先在内部确定一个核心观点，但不要把“核心观点是”写出来。
2. 整篇文章必须围绕这个观点展开，不要东一段西一段。
3. 像人在表达，不要像 AI 总结材料。
4. 有观点、有现实感，但不要为了爆文感编造事实。
5. 不要输出 Markdown 格式。
`.trim();

  if (type === "emotion") {
    return `
请围绕标题“${safeTitle}”写一篇文章。

写法：
1. 从情绪或感受切入。
2. 写清楚为什么这件事让人不安、难受或有触动。
3. 多写普通人的现实处境。
4. 不要讲大道理，要像人在说话。
5. 结尾收回到一个明确判断。

${commonRules}

只返回正文。
`.trim();
  }

  if (type === "judgement") {
    return `
请围绕标题“${safeTitle}”写一篇文章。

写法：
1. 开头直接指出：很多人可能看错了。
2. 说明大家为什么会看错。
3. 再讲真正的问题在哪里。
4. 中间要有现实例子或具体处境。
5. 结尾给出明确判断。

${commonRules}

只返回正文。
`.trim();
  }

  if (type === "signal") {
    return `
请围绕标题“${safeTitle}”写一篇文章。

写法：
1. 解释这个“信号”到底是什么。
2. 说明它为什么不是偶然。
3. 推演可能带来的变化。
4. 让读者感觉“后面可能还有更大的变化”。
5. 结尾收束成判断，不要空泛总结。

${commonRules}

只返回正文。
`.trim();
  }

  if (type === "reality") {
    return `
请围绕标题“${safeTitle}”写一篇文章。

写法：
1. 从普通人的现实利益切入。
2. 写清楚这件事会影响谁。
3. 不要只讲宏大叙事，要落到生活、工作、钱、选择、压力。
4. 中间要有现实感。
5. 结尾给出一个克制但明确的判断。

${commonRules}

只返回正文。
`.trim();
  }

  return `
请围绕标题“${safeTitle}”写一篇文章。

写法：
1. 开头直接进入问题。
2. 中间围绕一个核心观点展开。
3. 多写判断、现实、人的处境。
4. 不要写成说明文。
5. 结尾自然收束。

${commonRules}

只返回正文。
`.trim();
}

function buildSystemPrompt(platform) {
  const p = normalizePlatform(platform);

  if (p === "toutiao") {
    return `
你是一个今日头条内容作者。
要求：标题和正文要有冲突感、判断感、现实感。
正文要直接、有观点、有讨论空间。
涉及当天时政热点时，必须尊重用户提供的事实素材；没有素材时不能编造具体事实。
结尾不要主动写固定互动句，系统会单独处理。
`.trim();
  }

  if (p === "weitoutiao") {
    return `
你是一个微头条作者。
要求：短、直接、有观点，开头尽快抓住人。
涉及事实信息时，不能编造具体人物、时间、地点。
`.trim();
  }

  return `
你是一个微信公众号作者。
要求：有观点、有人味、有现实感。
风格类似高阅读量观点号，但不要模仿具体作者句子。
文章要像人在表达判断，不要像说明文。
涉及时政热点时，必须围绕用户提供的新闻事实素材展开；没有素材时不能编造具体事实。
`.trim();
}

function buildLocalTitleFallback(topic) {
  const safeTopic = compactText(topic) || "这个话题";

  return {
    titles: [
      {
        title: `${safeTopic}这件事，可能没那么简单`,
        score: 90,
        reason: "有提醒感，容易引发继续阅读",
      },
      {
        title: `很多人都在聊${safeTopic}，但重点不在这`,
        score: 88,
        reason: "有反转感，能制造点击欲",
      },
      {
        title: `${safeTopic}背后，普通人更该看懂这一点`,
        score: 86,
        reason: "有现实代入感",
      },
    ],
    bestTitle: `${safeTopic}这件事，可能没那么简单`,
    fallback: true,
  };
}

async function generateTitles({
  topic,
  platform,
  persona,
  candidateCount = 4,
  context,
  newsContext,
  newsFacts,
  material,
  materials,
}) {
  const p = normalizePlatform(platform);
  const count = Math.max(3, Number(candidateCount) || 4);
  const finalContext = getContextValue({
    context,
    newsContext,
    newsFacts,
    material,
    materials,
  });

  let userPrompt = "";

  if (p === "wechat") {
    userPrompt = getWechatPrompt(topic, count, compactText);
  } else if (p === "toutiao") {
    userPrompt = getToutiaoPrompt(topic, count, compactText);
  } else {
    userPrompt = getWeitoutiaoPrompt(topic, count, compactText);
  }

  userPrompt = `
${userPrompt}

${buildContextBlock(finalContext)}

【标题额外要求】
1. 如果提供了新闻事实素材，标题必须围绕素材里的具体事件展开，不能只写成泛泛的“这件事不简单”。
2. 如果没有提供新闻事实素材，标题不要编造具体人物、时间、地点。
3. 标题要有点击欲，但不能牺牲事实准确性。
`.trim();

  try {
    const content = await callChatModel([{ role: "user", content: userPrompt }], {
      temperature: 0.9,
      maxTokens: 900,
    });

    const parsed = safeExtractJson(content, null);

    if (parsed && Array.isArray(parsed.titles)) {
      const titles = parsed.titles
        .map((item, index) => ({
          title: compactText(item?.title) || `标题候选 ${index + 1}`,
          score: Number(item?.score) || 95 - index * 3,
          reason: compactText(item?.reason) || "模型生成结果",
        }))
        .filter((item) => item.title)
        .slice(0, count);

      if (titles.length) {
        return {
          titles,
          bestTitle:
            compactText(parsed.bestTitle) || compactText(titles[0]?.title) || "",
        };
      }
    }
  } catch (error) {
    console.error("标题生成失败:", error.message);
  }

  return buildLocalTitleFallback(topic);
}

async function generateWeitoutiao({
  topic,
  platform = "weitoutiao",
  persona,
  context,
  newsContext,
  newsFacts,
  material,
  materials,
}) {
  const safeTopic = compactText(topic) || "这个话题";
  const finalContext = getContextValue({
    context,
    newsContext,
    newsFacts,
    material,
    materials,
  });

  const prompt = `
请围绕主题“${safeTopic}”写一篇微头条。

${buildContextBlock(finalContext)}

要求：
1. 200-400字。
2. 开头直接进入观点。
3. 语言自然，有态度。
4. 不要写成说明文。
5. 不要输出 Markdown。
`.trim();

  try {
    const content = await callChatModel(
      [
        { role: "system", content: buildSystemPrompt("weitoutiao") },
        { role: "user", content: prompt },
      ],
      { temperature: 0.86, maxTokens: 800 }
    );

    if (content) {
      return { content: cleanModelOutput(content) };
    }
  } catch {}

  return {
    content: `说实话，关于“${safeTopic}”，很多人看到的只是表面。真正值得关注的，是它背后对普通人的现实影响。`,
    fallback: true,
  };
}

async function generateOutline({
  title,
  platform,
  persona,
  context,
  newsContext,
  newsFacts,
  material,
  materials,
}) {
  const safeTitle = compactText(title) || "这个主题";
  const finalContext = getContextValue({
    context,
    newsContext,
    newsFacts,
    material,
    materials,
  });

  const prompt = `
请围绕标题“${safeTitle}”生成一份微信公众号文章大纲。

${buildContextBlock(finalContext)}

要求：
1. 必须返回 4 个部分。
2. 每个部分必须包含 id、order、title、summary。
3. title 必须是完整小标题，不能只写数字。
4. summary 必须是一句话摘要，说明这一部分要写什么。
5. 风格要有观点推进，不要像教程或报告。
6. 如果提供了新闻事实素材，大纲必须围绕素材里的事件展开。
7. 只返回 JSON 数组，不要解释。

返回格式必须严格如下：
[
  {
    "id": "section_1",
    "order": 1,
    "title": "这一部分的小标题",
    "summary": "这一部分要展开的核心内容"
  },
  {
    "id": "section_2",
    "order": 2,
    "title": "这一部分的小标题",
    "summary": "这一部分要展开的核心内容"
  }
]
`.trim();

  try {
    const content = await callChatModel(
      [
        { role: "system", content: getWechatArticlePrompt(safeTitle, compactText) },
        { role: "user", content: prompt },
      ],
      { temperature: 0.74, maxTokens: 1000 }
    );

    const parsed = safeExtractJson(content, null);
    const sections = normalizeOutlineSections(parsed, safeTitle);

    return {
      sections,
      fallback: !Array.isArray(parsed),
    };
  } catch {}

  return {
    sections: normalizeOutlineSections([], safeTitle),
    fallback: true,
  };
}

async function generateSection({
  articleTitle,
  platform,
  persona,
  section,
  context,
  newsContext,
  newsFacts,
  material,
  materials,
}) {
  const safeTitle = compactText(articleTitle) || "这个主题";
  const sectionTitle = compactText(section?.title) || "这一部分";
  const summary = compactText(section?.summary || "");
  const finalContext = getContextValue({
    context,
    newsContext,
    newsFacts,
    material,
    materials,
  });

  const prompt = `
请为微信公众号文章“${safeTitle}”写其中一个部分。

${buildContextBlock(finalContext)}

当前部分：
- 小标题：${sectionTitle}
- 摘要：${summary}

要求：
1. 这一段必须紧扣当前小标题，不要跑题。
2. 要像真人表达，不像材料总结。
3. 有判断、有现实感、有人的处境。
4. 不要使用 Markdown 小标题。
5. 不要写“首先、其次、最后”。
6. 如果提供了新闻事实素材，必须围绕素材展开，不要泛泛而谈。
7. 只返回正文。
`.trim();

  try {
    const content = await callChatModel(
      [
        { role: "system", content: getWechatArticlePrompt(safeTitle, compactText) },
        { role: "user", content: prompt },
      ],
      { temperature: 0.84, maxTokens: 1000 }
    );

    if (content) {
      return { content: cleanModelOutput(content) };
    }
  } catch {}

  return {
    content: `围绕“${safeTitle}”，这一部分最重要的是“${sectionTitle}”。${summary ? `\n\n${summary}` : ""}`,
    fallback: true,
  };
}

async function generateToutiaoEnding({ title, content }) {
  const prompt = `
基于下面这篇今日头条正文，生成一句适合放在结尾的互动收尾。

要求：
1. 只能输出一句话。
2. 必须贴合正文核心观点。
3. 不要只写“你怎么看”。
4. 要自然，能引发评论。

标题：${compactText(title)}
正文：${compactText(content).slice(0, 1600)}
`.trim();

  try {
    const result = await callChatModel([{ role: "user", content: prompt }], {
      temperature: 0.82,
      maxTokens: 120,
    });

    const cleaned = cleanModelOutput(result);
    if (cleaned) return cleaned;
  } catch {}

  return "这件事你更认同哪一种判断？";
}

async function appendToutiaoEndingIfNeeded({ title, content }) {
  const cleaned = cleanModelOutput(content);
  if (!cleaned) return cleaned;

  const lastParagraph = cleaned.split(/\n+/).filter(Boolean).slice(-1)[0] || "";

  const alreadyInteractive =
    /[？?]/.test(lastParagraph) &&
    /(你|大家|评论区|怎么看|怎么选|更认同|觉得)/.test(lastParagraph);

  if (alreadyInteractive) return cleaned;

  const ending = await generateToutiaoEnding({ title, content: cleaned });
  return `${cleaned}\n\n${ending}`.trim();
}

async function generateArticle({
  title,
  platform,
  persona,
  context,
  newsContext,
  newsFacts,
  material,
  materials,
  withOutline = true,
}) {
  const p = normalizePlatform(platform);
  const safeTitle = compactText(title) || "这个主题";
  const finalContext = getContextValue({
    context,
    newsContext,
    newsFacts,
    material,
    materials,
  });

  try {
    if (p === "wechat" && withOutline) {
      const outlineResult = await generateOutline({
        title,
        platform,
        persona,
        context: finalContext,
      });

      const sections = outlineResult.sections || [];
      const blocks = [];

      for (const section of sections) {
        const part = await generateSection({
          articleTitle: title,
          platform,
          persona,
          section,
          context: finalContext,
        });

        blocks.push(part.content || "");
      }

      return {
        outline: sections,
        content: cleanModelOutput(blocks.join("\n\n")),
        fallback: Boolean(outlineResult.fallback),
      };
    }

    if (p === "weitoutiao") {
      const result = await generateWeitoutiao({
        topic: title,
        platform,
        persona,
        context: finalContext,
      });

      return {
        outline: [],
        content: cleanModelOutput(result.content || ""),
        fallback: Boolean(result.fallback),
      };
    }

    const prompt = buildArticlePrompt(safeTitle, platform, finalContext);

    const content = await callChatModel(
      [
        { role: "system", content: buildSystemPrompt(platform) },
        { role: "user", content: prompt },
      ],
      { temperature: 0.84, maxTokens: 1800 }
    );

    if (content) {
      const finalContent =
        p === "toutiao"
          ? await appendToutiaoEndingIfNeeded({
              title: safeTitle,
              content,
            })
          : cleanModelOutput(content);

      return {
        outline: [],
        content: finalContent,
      };
    }
  } catch {}

  return {
    outline: [],
    content: `围绕“${safeTitle}”，这件事最值得讨论的不是表面，而是它背后对普通人的现实影响。`,
    fallback: true,
  };
}

module.exports = {
  normalizePlatform,
  generateTitles,
  generateWeitoutiao,
  generateOutline,
  generateSection,
  generateArticle,
};