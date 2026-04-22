/**
 * 内容生成服务
 * ----------------------------------------
 * 说明：
 * 1. 这是当前项目的核心内容生成层
 * 2. 保持现有接口不变，方便前端直接继续调用
 * 3. 公众号、今日头条、微头条分别走不同平台规则
 * 4. 公众号风格：类似“也评”——强调表达、判断、现实感，但不是照抄
 * 5. 今日头条：强调观点、争议、讨论感，结尾互动要和正文内容相关
 * 6. 微头条：短、直接、快速表达观点
 */

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

/**
 * 文本压缩
 * 用于把多余空白压成单空格，避免 prompt 或结果太散
 */
function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

/**
 * 输出清洗
 * 目的：
 * 1. 去掉 Markdown 痕迹（** / ## / ```）
 * 2. 合并过多空行
 */
function cleanModelOutput(text) {
  return String(text || "")
    .replace(/\*\*/g, "")
    .replace(/^###\s*/gm, "")
    .replace(/^##\s*/gm, "")
    .replace(/^#\s*/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * 人设风格说明
 * 用于 prompt 里控制语言倾向
 */
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

/**
 * 平台风格说明
 * 用于 prompt 区分平台差异
 */
function getPlatformStyle(platform) {
  const p = normalizePlatform(platform);

  if (p === "weitoutiao") {
    return {
      label: "微头条",
      goal: "短、狠、快，快速表达观点",
      lengthHint: "200-400字",
      structure: "开头钩子 + 核心观点 + 快速收束",
      avoid: "避免写成长文章，避免过多分标题",
    };
  }

  if (p === "toutiao") {
    return {
      label: "今日头条",
      goal: "观点鲜明，有信息量，有讨论感",
      lengthHint: "600-1200字",
      structure: "争议切入 + 拆解分析 + 观点收束",
      avoid: "避免公众号腔和过度抒情",
    };
  }

  return {
    label: "微信公众号",
    goal: "有阅读感、有表达感、有层次，不像说明文",
    lengthHint: "1000-1800字",
    structure: "观点切入 + 现实展开 + 判断收束",
    avoid: "避免过度模板化，避免像报告或教程",
  };
}

/**
 * 本地 fallback：标题候选
 * 用途：
 * 1. 没配模型时也能返回结果
 * 2. 模型异常时兜底
 */
function buildLocalTitleCandidates(topic, platform, persona, candidateCount = 4) {
  const safeTopic = compactText(topic) || "这个话题";
  const p = normalizePlatform(platform);
  const r = normalizePersona(persona);
  const count = Math.max(3, Number(candidateCount) || 4);

  const titlePools = {
    wechat: {
      normal: [
        `很多人都在聊“${safeTopic}”，但真正的问题还没说透`,
        `关于“${safeTopic}”，我越来越觉得重点不是表面`,
        `“${safeTopic}”背后，藏着一个更现实的真相`,
        `别急着判断“${safeTopic}”，真正该想的是这一步`,
      ],
      emotion: [
        `说实话，“${safeTopic}”最让人难受的，不只是结果`,
        `看到“${safeTopic}”，我终于明白很多人为什么沉默了`,
        `“${safeTopic}”这件事，越想越觉得不是小问题`,
        `很多人以为“${safeTopic}”只是巧合，其实不是`,
      ],
      professional: [
        `“${safeTopic}”为什么越讨论越乱？关键在这几点`,
        `拆开“${safeTopic}”看，真正值得关注的是这层逻辑`,
        `关于“${safeTopic}”，大多数讨论都忽略了核心变量`,
        `“${safeTopic}”背后真正的判断框架，我想讲清楚`,
      ],
    },
    toutiao: {
      normal: [
        `“${safeTopic}”为什么总能引发争议？真正的原因在后面`,
        `很多人都在谈“${safeTopic}”，但重点根本不是表面`,
        `“${safeTopic}”刷屏之后，我反而更想说这句实话`,
        `关于“${safeTopic}”，这几个问题不想清楚很容易看偏`,
      ],
      emotion: [
        `说实话，“${safeTopic}”这事，越看越让人不是滋味`,
        `“${safeTopic}”背后最扎心的，其实不是热搜上的那些话`,
        `很多人看到“${safeTopic}”在吵，我却想到了更现实的一面`,
        `“${safeTopic}”为什么能戳中那么多人？答案很现实`,
      ],
      professional: [
        `“${safeTopic}”到底该怎么看？这几点最关键`,
        `围绕“${safeTopic}”，真正值得分析的是这条逻辑链`,
        `关于“${safeTopic}”，表面争议背后其实是认知分歧`,
        `“${safeTopic}”争来争去，不如先把这几个问题讲明白`,
      ],
    },
    weitoutiao: {
      normal: [
        `“${safeTopic}”这事，真的没那么简单`,
        `关于“${safeTopic}”，我想说句不太讨好的实话`,
        `“${safeTopic}”别只看热闹，重点其实在后面`,
        `很多人讨论“${safeTopic}”，但真正想透的不多`,
      ],
      emotion: [
        `说实话，“${safeTopic}”越看越让人心里发堵`,
        `“${safeTopic}”这件事，最难受的是那种无力感`,
        `很多人看到“${safeTopic}”只是生气，我却觉得心酸`,
        `“${safeTopic}”看似只是个事，背后却是很多人的现实`,
      ],
      professional: [
        `“${safeTopic}”到底值不值得讨论？关键看这几点`,
        `围绕“${safeTopic}”，最该先想清楚的是逻辑`,
        `“${safeTopic}”这件事，别急着站队，先看清问题`,
        `关于“${safeTopic}”，我更关心背后的因果关系`,
      ],
    },
  };

  const personaKey = titlePools[p]?.[r] ? r : "normal";
  const pool = titlePools[p]?.[personaKey] || titlePools.wechat.normal;

  return pool.slice(0, count).map((title, index) => ({
    title,
    score: 96 - index * 3,
    reason:
      index === 0
        ? "冲突感更强，更容易吸引点击"
        : index === 1
        ? "更适合引发好奇和停留"
        : index === 2
        ? "更偏观点表达，适合建立作者风格"
        : "更自然，适合平台发布",
  }));
}

/**
 * 本地 fallback：微头条正文
 */
function buildLocalWeitoutiao({ topic, persona }) {
  const safeTopic = compactText(topic) || "这个话题";
  const r = normalizePersona(persona);

  if (r === "emotion") {
    return `说实话，关于“${safeTopic}”，很多人表面上在讨论一件事，实际上是在表达委屈、压力和不甘。你以为只是一个小话题，放到现实里才会发现，它真正影响的是情绪、判断和选择。很多时候，不是事情本身有多复杂，而是身处其中的人太容易被消耗。`;
  }

  if (r === "professional") {
    return `围绕“${safeTopic}”，如果只看表面现象，很容易得出片面结论。真正值得关注的是它背后的逻辑链条：问题为什么发生、影响了谁、会带来什么结果，以及普通人该如何判断和应对。把这几点想清楚，内容才有价值。`;
  }

  return `很多人聊“${safeTopic}”时，只停留在表面判断。但真正值得说的，不只是一个观点，而是它背后的现实处境、常见误区和实际影响。把这件事讲明白，往往比单纯表态更有价值。`;
}

/**
 * 本地 fallback：公众号大纲
 */
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
      title: "结尾：总结与判断",
      summary: "收束全文，给出更明确的判断。",
    },
  ];
}

/**
 * 本地 fallback：单段内容
 */
function buildLocalSection({ articleTitle, section, persona }) {
  const title = compactText(articleTitle) || "这个主题";
  const sectionTitle = compactText(section?.title) || "这一部分";
  const summary = compactText(section?.summary || "");
  const r = normalizePersona(persona);

  if (r === "emotion") {
    return `围绕“${title}”，这一部分最重要的不是把话说满，而是把真实感受说透。\n\n${summary}\n\n很多人遇到类似情况时，表面上看是在讨论一件事，实际上是在表达压力、委屈或者不甘。真正能打动人的内容，不是大道理，而是那种“我也经历过”的感觉。`;
  }

  if (r === "professional") {
    return `围绕“${title}”，这一部分重点分析“${sectionTitle}”。\n\n${summary}\n\n可以从问题定义、关键变量和实际影响三个层面展开，这样内容会更清晰。写作时尽量减少空泛判断，多给出可验证的场景、逻辑和结论。`;
  }

  return `围绕“${title}”，这一部分重点展开“${sectionTitle}”。\n\n${summary}\n\n可以从用户场景、核心问题和实际价值三个角度继续往下写，让内容更完整、更有层次。写作时尽量避免空泛描述，优先给出具体表达、简短判断和可执行的信息。`;
}

/**
 * 本地 fallback：头条结尾互动
 */
function buildLocalToutiaoEnding(title, content = "") {
  const safeTitle = compactText(title) || "这件事";
  const text = compactText(content);

  if (/误判|看偏|理解错|判断/.test(text)) {
    return "你觉得这件事真的是大家想多了，还是很多人一直看偏了？";
  }

  if (/压力|现实|无奈|代价|成本/.test(text)) {
    return "如果这件事真的发生在你身上，你会怎么选？";
  }

  if (/争议|站队|对立|吵/.test(text)) {
    return "这件事你更认同哪一种看法？";
  }

  return `对于“${safeTitle}”，你更认同哪种判断？`;
}

/**
 * 本地 fallback：整文
 */
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

  if (p === "toutiao") {
    content += `\n\n${buildLocalToutiaoEnding(title, content)}`;
  }

  return {
    outline,
    content: cleanModelOutput(content),
  };
}

/**
 * 读取模型配置
 */
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

/**
 * 调用模型
 */
async function callChatModel(messages, options = {}) {
  const config = getModelConfig();

  if (!config.apiKey) {
    return null;
  }

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
        temperature: options.temperature ?? 0.85,
        max_tokens: options.maxTokens ?? 1200,
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
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`模型请求超时（${config.timeoutMs}ms）`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 平台主 Prompt
 * 重点：
 * - 公众号：类似“也评”的表达型风格，但不是照抄
 * - 今日头条：观点+讨论感
 * - 微头条：短促直接
 */
function buildSystemPrompt(platform, persona) {
  const p = normalizePlatform(platform);
  const personaStyle = getPersonaStyle(persona);
  const platformStyle = getPlatformStyle(platform);

  if (p === "wechat") {
    return `
你是一个中文公众号写作助手，擅长写“有观点、有人味、带现实感”的内容。

你的公众号写作风格要求：
1. 更像一个有判断的作者在表达，而不是在做知识讲解。
2. 风格可以参考高阅读量观点号的表达方式：直接、有态度、有现实感，但不要模仿具体作者句子。
3. 开头不要铺垫太长，尽快进入真正想说的话。
4. 正文不要写成“首先、其次、最后”的说明文。
5. 多写判断、情绪、现实场景、人的处境，不要全是概念和套话。
6. 可以有节奏变化，句子长短自然，不要太整齐。
7. 不要输出 Markdown 标记，不要出现 **、##、```。
8. 只输出最终内容，不解释你的写法。

当前平台：
- 平台：${platformStyle.label}
- 目标：${platformStyle.goal}
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

  if (p === "toutiao") {
    return `
你是一个中文今日头条爆文写作助手。

要求：
1. 标题和正文都要更有讨论感、争议感、停留感。
2. 正文要有观点、有分析、有现实感，不要写成公众号随笔。
3. 结尾不要写固定互动句，应该根据正文内容自然生成一个能引发评论的收尾。
4. 句子要自然，不要模板腔。
5. 不要输出 Markdown 标记，不要出现 **、##、```。
6. 只输出最终内容，不解释过程。

当前平台：
- 平台：${platformStyle.label}
- 目标：${platformStyle.goal}
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

  return `
你是一个中文微头条写作助手。

要求：
1. 内容要短、直接、开头抓人。
2. 第一两句尽快进入观点。
3. 不要铺垫太多，不要写成长文。
4. 要有态度，但不要过度表演。
5. 不要输出 Markdown 标记，不要出现 **、##、```。
6. 只输出最终内容，不解释过程。

当前平台：
- 平台：${platformStyle.label}
- 目标：${platformStyle.goal}
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

/**
 * 安全提取 JSON
 */
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

/**
 * 生成今日头条结尾互动
 * 核心：
 * 1. 单独根据正文生成
 * 2. 不能写死成“你怎么看”
 */
async function generateToutiaoEnding({ title, content, persona }) {
  const systemPrompt = `
你是一个今日头条编辑。

任务：
基于文章正文内容，生成一句适合放在结尾的互动收尾。

要求：
1. 只能输出一句话。
2. 必须贴合正文核心观点。
3. 不能泛泛地只写“你怎么看”。
4. 要像自然收尾，不要太硬。
5. 不要输出 Markdown。
`.trim();

  const userPrompt = `
标题：${compactText(title) || "这个主题"}
人设：${getPersonaStyle(persona).label}

正文：
${compactText(content).slice(0, 1800)}

请写一句最适合放在结尾的互动收尾。
`.trim();

  try {
    const result = await callChatModel(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.85, maxTokens: 120 }
    );

    const cleaned = cleanModelOutput(result);
    if (cleaned) return cleaned;
  } catch {}

  return buildLocalToutiaoEnding(title, content);
}

/**
 * 如果今日头条正文最后没有互动句，就自动补一条
 */
async function appendToutiaoEndingIfNeeded({ title, content, persona }) {
  const cleaned = cleanModelOutput(content);
  if (!cleaned) return cleaned;

  const lastParagraph = cleaned.split(/\n+/).filter(Boolean).slice(-1)[0] || "";
  const alreadyInteractive =
    /[？?]/.test(lastParagraph) &&
    /(你|大家|评论区|怎么看|怎么选|更认同|会不会|觉得)/.test(lastParagraph);

  if (alreadyInteractive) {
    return cleaned;
  }

  const ending = await generateToutiaoEnding({
    title,
    content: cleaned,
    persona,
  });

  return `${cleaned}\n\n${ending}`.trim();
}

/**
 * 生成标题
 */
async function generateTitles({
  topic,
  platform,
  persona,
  candidateCount = 4,
}) {
  const count = Math.max(3, Number(candidateCount) || 4);

  try {
    const systemPrompt = buildSystemPrompt(platform, persona);

    const userPrompt =
      normalizePlatform(platform) === "wechat"
        ? `
请围绕主题“${compactText(topic) || "这个话题"}”，为微信公众号生成 ${count} 个标题候选。

要求：
1. 标题要有点击欲，但不要低俗标题党。
2. 更像观点型作者会起的标题，不要写成“关于XX的分析”“几点思考”。
3. 标题之间要尽量拉开差异。
4. 可以使用判断、反转、现实感、情绪感，但不要照搬具体作者句子。
5. 返回 JSON：
{
  "titles": [
    { "title": "标题1", "score": 95, "reason": "一句话说明理由" }
  ],
  "bestTitle": "最佳标题"
}
只返回 JSON。
`.trim()
        : `
请围绕主题“${compactText(topic) || "这个话题"}”，为 ${getPlatformStyle(platform).label} 生成 ${count} 个标题候选。

要求：
1. 标题要符合当前平台风格。
2. 每个标题都要有点击感，但不要夸张低俗。
3. 返回 JSON：
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
      { temperature: 0.92, maxTokens: 900 }
    );

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
        while (titles.length < 3) {
          titles.push(
            buildLocalTitleCandidates(topic, platform, persona, 4)[titles.length]
          );
        }

        return {
          titles,
          bestTitle:
            compactText(parsed.bestTitle) || compactText(titles[0]?.title) || "",
        };
      }
    }
  } catch {}

  const titles = buildLocalTitleCandidates(topic, platform, persona, count);
  return {
    titles,
    bestTitle: titles[0]?.title || "",
    fallback: true,
  };
}

/**
 * 生成微头条
 */
async function generateWeitoutiao({
  topic,
  platform = "weitoutiao",
  persona,
}) {
  try {
    const systemPrompt = buildSystemPrompt(platform, persona);
    const userPrompt = `
请围绕主题“${compactText(topic) || "这个话题"}”，写一篇适合微头条发布的短内容。

要求：
1. 200-400字。
2. 开头尽快进入观点。
3. 更像人在表达，不像说明书。
4. 只返回正文。
`.trim();

    const content = await callChatModel(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.9, maxTokens: 800 }
    );

    if (content) {
      return { content: cleanModelOutput(content) };
    }
  } catch {}

  return {
    content: buildLocalWeitoutiao({ topic, persona }),
    fallback: true,
  };
}

/**
 * 生成公众号大纲
 */
async function generateOutline({ title, platform, persona }) {
  try {
    const systemPrompt = buildSystemPrompt(platform, persona);

    const userPrompt =
      normalizePlatform(platform) === "wechat"
        ? `
请围绕标题“${compactText(title) || "这个主题"}”，生成一份更适合公众号表达型写作的大纲。

要求：
1. 4-5个部分。
2. 每个部分都要有标题和一句摘要。
3. 不要太像教程或报告。
4. 更强调“观点推进、现实展开、判断收束”。
5. 返回 JSON 数组：
[
  { "id": "section_1", "order": 1, "title": "部分标题", "summary": "一句摘要" }
]
只返回 JSON。
`.trim()
        : `
请围绕标题“${compactText(title) || "这个主题"}”，生成文章大纲。

要求：
1. 4-5个部分。
2. 每个部分都要有标题和一句摘要。
3. 返回 JSON 数组：
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
      { temperature: 0.8, maxTokens: 900 }
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

/**
 * 生成单段正文
 */
async function generateSection({
  articleTitle,
  platform,
  persona,
  section,
}) {
  try {
    const systemPrompt = buildSystemPrompt(platform, persona);

    const userPrompt =
      normalizePlatform(platform) === "wechat"
        ? `
请为公众号文章“${compactText(articleTitle) || "这个主题"}”写其中一个部分。

当前部分：
- 标题：${compactText(section?.title) || "这一部分"}
- 摘要：${compactText(section?.summary) || ""}

要求：
1. 更像真人在表达，不像材料总结。
2. 有观点、有现实感、有判断。
3. 不要使用 Markdown 小标题。
4. 只返回正文。
`.trim()
        : `
请为文章“${compactText(articleTitle) || "这个主题"}”写其中一个部分。

当前部分：
- 标题：${compactText(section?.title) || "这一部分"}
- 摘要：${compactText(section?.summary) || ""}

要求：
1. 内容具体。
2. 只返回正文。
`.trim();

    const content = await callChatModel(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.86, maxTokens: 1000 }
    );

    if (content) {
      return { content: cleanModelOutput(content) };
    }
  } catch {}

  return {
    content: cleanModelOutput(
      buildLocalSection({ articleTitle, section, persona })
    ),
    fallback: true,
  };
}

/**
 * 生成整篇文章
 * 平台处理：
 * - wechat：大纲 + 分段
 * - weitoutiao：直接短内容
 * - toutiao：直接整文 + 追加贴合内容的互动尾句
 */
async function generateArticle({
  title,
  platform,
  persona,
  withOutline = true,
}) {
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
        content: cleanModelOutput(blocks.join("\n\n")),
        fallback: Boolean(outlineResult.fallback),
      };
    }

    if (p === "weitoutiao") {
      const result = await generateWeitoutiao({ topic: title, platform, persona });
      return {
        outline: [],
        content: cleanModelOutput(result.content || ""),
        fallback: Boolean(result.fallback),
      };
    }

    const systemPrompt = buildSystemPrompt(platform, persona);

    const userPrompt =
      p === "toutiao"
        ? `
请围绕标题“${compactText(title) || "这个主题"}”，生成一篇适合今日头条发布的完整文章。

要求：
1. 开头要能把人拉住。
2. 中间有观点、有分析、有现实感。
3. 不要写成公众号腔。
4. 正文先不要自己硬加固定互动句，我会单独处理结尾互动。
5. 只返回正文。
`.trim()
        : `
请围绕标题“${compactText(title) || "这个主题"}”，生成一篇完整文章。

要求：
1. 更像真人写的，不要模板腔。
2. 只返回正文。
`.trim();

    const content = await callChatModel(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.88, maxTokens: 1800 }
    );

    if (content) {
      const finalContent =
        p === "toutiao"
          ? await appendToutiaoEndingIfNeeded({
              title,
              content,
              persona,
            })
          : cleanModelOutput(content);

      return {
        outline: [],
        content: finalContent,
      };
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