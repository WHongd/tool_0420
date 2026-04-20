// 文件作用：标题生成 + 评分 + 自动改写 的统一引擎
// 使用方式：
// 1. 可单独生成系统 Prompt，交给你的 AI 服务调用
// 2. 可对 AI 返回结果做兜底清洗
// 3. 可在前端统一管理“风格 / 评分 / 潜力等级 / 推荐标题”

export const TITLE_STYLES = {
  balanced: {
    key: "balanced",
    label: "稳健型",
    description: "理性、专业、克制，适合品牌感和长期信任",
  },
  conflict: {
    key: "conflict",
    label: "冲突型",
    description: "有反差、有张力、有冲突感，适合提升点击率",
  },
  practical: {
    key: "practical",
    label: "实用型",
    description: "强调方法、步骤、结果，适合收藏和转化",
  },
};

export const TITLE_TARGETS = {
  click: {
    key: "click",
    label: "提升点击",
    style: "conflict",
  },
  trust: {
    key: "trust",
    label: "提升信任",
    style: "balanced",
  },
  conversion: {
    key: "conversion",
    label: "提升转化",
    style: "practical",
  },
};

export const TITLE_SCORE_DIMENSIONS = [
  { key: "attraction", label: "吸引力", max: 20 },
  { key: "clarity", label: "清晰度", max: 15 },
  { key: "value", label: "价值感", max: 20 },
  { key: "conflict", label: "冲突感", max: 15 },
  { key: "specificity", label: "具体度", max: 15 },
  { key: "virality", label: "传播感", max: 15 },
];

export const TITLE_PLATFORMS = {
  wechat: "公众号",
  xiaohongshu: "小红书",
  douyin: "抖音",
  video号: "视频号",
  toutiao: "头条",
  zhihu: "知乎",
  generic: "通用平台",
};

const STYLE_RULES_TEXT = `
【风格规则】
1. 稳健型：
- 理性、克制、专业、不夸张
- 强调观点、判断、趋势、认知
- 适合品牌感、长期信任、公众号类表达

2. 冲突型：
- 要有反差、冲突、误区、打破认知
- 允许使用“你以为…其实… / 别再… / 最大误区 / 大多数人都错了”等结构
- 但不能低质标题党，不能失真夸大

3. 实用型：
- 突出方法、步骤、清单、路径、结果
- 用户一眼知道“点进去能学到什么”
- 适合收藏、转化、训练营/课程/干货内容
`;

const SCORE_RULES_TEXT = `
【评分规则】
请对每个标题按以下 6 个维度评分，总分 100 分：
1. 吸引力（20）：是否让人停下来，是否有点击冲动
2. 清晰度（15）：是否一眼看懂主题，不绕
3. 价值感（20）：是否明确体现收获、方法、收益或避坑
4. 冲突感（15）：是否有反差、张力、认知冲击
5. 具体度（15）：是否具体，有对象、场景、数字、结果
6. 传播感（15）：是否像平台上容易被点开、转发、收藏的标题

【爆款潜力等级】
- S：90-100
- A：80-89
- B：70-79
- C：60-69
- D：0-59
`;

const OUTPUT_SCHEMA_TEXT = `
【输出 JSON 格式要求】
请仅输出合法 JSON，不要输出 markdown，不要输出解释，不要输出多余文字。
JSON 结构如下：

{
  "platform": "公众号",
  "audience": "新手创作者",
  "topic": "用户输入的主题",
  "recommendedStyle": "balanced",
  "candidates": [
    {
      "title": "标题文案",
      "style": "balanced",
      "score": {
        "attraction": 16,
        "clarity": 14,
        "value": 17,
        "conflict": 9,
        "specificity": 13,
        "virality": 12,
        "overall": 81,
        "grade": "A"
      },
      "comment": "一句话点评",
      "weakness": "最大短板",
      "suggestion": "优化建议",
      "rewrittenTitle": "优化后的标题"
    }
  ],
  "bestTitle": {
    "title": "最推荐发布的标题",
    "style": "conflict",
    "reason": "为什么它最可能爆"
  }
}
`;

function safeTrim(value) {
  return String(value || "").trim();
}

export function normalizeTitleStyle(style) {
  if (!style) return "balanced";
  if (TITLE_STYLES[style]) return style;
  return "balanced";
}

export function inferStyleByTarget(target) {
  if (!target) return "balanced";
  return TITLE_TARGETS[target]?.style || "balanced";
}

export function scoreToGrade(score) {
  const num = Number(score || 0);
  if (num >= 90) return "S";
  if (num >= 80) return "A";
  if (num >= 70) return "B";
  if (num >= 60) return "C";
  return "D";
}

export function clampScore(value, min, max) {
  const num = Number(value);
  if (Number.isNaN(num)) return min;
  return Math.max(min, Math.min(max, Math.round(num)));
}

export function normalizeCandidate(candidate = {}) {
  const score = candidate.score || {};

  const normalizedScore = {
    attraction: clampScore(score.attraction, 0, 20),
    clarity: clampScore(score.clarity, 0, 15),
    value: clampScore(score.value, 0, 20),
    conflict: clampScore(score.conflict, 0, 15),
    specificity: clampScore(score.specificity, 0, 15),
    virality: clampScore(score.virality, 0, 15),
  };

  const overall =
    normalizedScore.attraction +
    normalizedScore.clarity +
    normalizedScore.value +
    normalizedScore.conflict +
    normalizedScore.specificity +
    normalizedScore.virality;

  return {
    title: safeTrim(candidate.title),
    style: normalizeTitleStyle(candidate.style),
    score: {
      ...normalizedScore,
      overall,
      grade: scoreToGrade(overall),
    },
    comment: safeTrim(candidate.comment),
    weakness: safeTrim(candidate.weakness),
    suggestion: safeTrim(candidate.suggestion),
    rewrittenTitle: safeTrim(candidate.rewrittenTitle),
  };
}

export function normalizeTitleAnalysisResult(rawResult = {}, fallback = {}) {
  const platform = safeTrim(rawResult.platform || fallback.platform || "通用平台");
  const audience = safeTrim(rawResult.audience || fallback.audience || "通用用户");
  const topic = safeTrim(rawResult.topic || fallback.topic || "");
  const recommendedStyle = normalizeTitleStyle(
    rawResult.recommendedStyle || fallback.recommendedStyle || "balanced",
  );

  const candidates = Array.isArray(rawResult.candidates)
    ? rawResult.candidates
        .map(normalizeCandidate)
        .filter((item) => item.title)
        .sort((a, b) => b.score.overall - a.score.overall)
    : [];

  const bestFromCandidates = candidates[0] || null;

  const bestTitle = rawResult.bestTitle
    ? {
        title: safeTrim(rawResult.bestTitle.title || bestFromCandidates?.rewrittenTitle || bestFromCandidates?.title),
        style: normalizeTitleStyle(rawResult.bestTitle.style || bestFromCandidates?.style || recommendedStyle),
        reason: safeTrim(rawResult.bestTitle.reason || ""),
      }
    : {
        title: safeTrim(bestFromCandidates?.rewrittenTitle || bestFromCandidates?.title),
        style: normalizeTitleStyle(bestFromCandidates?.style || recommendedStyle),
        reason: "基于综合评分、传播感和点击潜力自动推荐",
      };

  return {
    platform,
    audience,
    topic,
    recommendedStyle,
    candidates,
    bestTitle,
  };
}

export function buildTitleSystemPrompt({
  topic,
  platform = "generic",
  audience = "",
  preferredStyle = "balanced",
  candidateCountPerStyle = 3,
} = {}) {
  const cleanTopic = safeTrim(topic);
  const cleanAudience = safeTrim(audience || "通用用户");
  const cleanPlatformName =
    TITLE_PLATFORMS[platform] || safeTrim(platform) || "通用平台";
  const cleanStyle = normalizeTitleStyle(preferredStyle);

  return `
你是一个中文内容平台的标题策略专家，擅长：
1. 生成高质量标题
2. 对标题进行传播力评分
3. 找出短板并自动改写
4. 选出最值得发布的一条标题

你的任务：
围绕给定主题，分别生成“稳健型 / 冲突型 / 实用型”三种风格标题，
并对每个标题进行评分、点评、优化和改写。

【输入信息】
- 内容主题：${cleanTopic}
- 目标平台：${cleanPlatformName}
- 目标人群：${cleanAudience}
- 当前偏好风格：${TITLE_STYLES[cleanStyle]?.label || "稳健型"}
- 每种风格生成数量：${candidateCountPerStyle}

${STYLE_RULES_TEXT}

${SCORE_RULES_TEXT}

【生成要求】
1. 每种风格都要生成 ${candidateCountPerStyle} 个标题
2. 标题尽量控制在 20 字以内
3. 避免重复句式
4. 不要空泛，不要套话
5. 优化后的标题必须比原标题更适合传播
6. 需要优先考虑平台适配：
   - 公众号：更重观点、认知、信任
   - 小红书：更重情绪、经验、反差、收藏感
   - 抖音/视频号：更重钩子、结果、冲突
   - 头条：兼顾信息量、争议点和阅读欲
   - 知乎：更重问题意识、判断、认知升级

【推荐逻辑】
- 你需要在全部标题中，选出“最可能爆的一条”
- 推荐时综合考虑：吸引力、价值感、传播感、平台适配
- 如果两个标题接近，优先选更适合当前平台的那个

${OUTPUT_SCHEMA_TEXT}
`.trim();
}

export function buildTitleUserPrompt({
  topic,
  platform = "generic",
  audience = "",
  preferredStyle = "balanced",
  candidateCountPerStyle = 3,
} = {}) {
  const cleanTopic = safeTrim(topic);
  const cleanAudience = safeTrim(audience || "通用用户");
  const cleanPlatformName =
    TITLE_PLATFORMS[platform] || safeTrim(platform) || "通用平台";

  return `
请根据下面信息执行标题生成 + 评分 + 自动改写：

主题：
${cleanTopic}

平台：
${cleanPlatformName}

目标人群：
${cleanAudience}

偏好风格：
${TITLE_STYLES[normalizeTitleStyle(preferredStyle)]?.label || "稳健型"}

每种风格标题数量：
${candidateCountPerStyle}
`.trim();
}

export function buildTitleIntegratedPrompt(options = {}) {
  return {
    systemPrompt: buildTitleSystemPrompt(options),
    userPrompt: buildTitleUserPrompt(options),
  };
}

export function parseTitleAnalysisText(text) {
  if (!text) return null;

  const raw = String(text).trim();

  try {
    return JSON.parse(raw);
  } catch {
    // 尝试提取 JSON 代码块
    const match = raw.match(/```json\s*([\s\S]*?)```/i) || raw.match(/```([\s\S]*?)```/);
    if (!match) return null;

    try {
      return JSON.parse(match[1].trim());
    } catch {
      return null;
    }
  }
}

export function createFallbackTitleCandidates({
  topic,
  preferredStyle = "balanced",
} = {}) {
  const cleanTopic = safeTrim(topic || "这个主题");

  const templates = {
    balanced: [
      `关于${cleanTopic}的几个关键判断`,
      `为什么${cleanTopic}越来越重要`,
      `${cleanTopic}背后的底层逻辑`,
    ],
    conflict: [
      `你以为${cleanTopic}很简单，其实不是`,
      `大多数人做${cleanTopic}，一开始就错了`,
      `别再盲目做${cleanTopic}了`,
    ],
    practical: [
      `${cleanTopic}的完整方法`,
      `如何用${cleanTopic}解决实际问题`,
      `从0到1做好${cleanTopic}`,
    ],
  };

  const styleOrder = ["balanced", "conflict", "practical"];
  const candidates = styleOrder.flatMap((style) =>
    (templates[style] || []).map((title, index) =>
      normalizeCandidate({
        title,
        style,
        score: {
          attraction: style === "conflict" ? 17 : 14,
          clarity: 13,
          value: style === "practical" ? 17 : 14,
          conflict: style === "conflict" ? 14 : 8,
          specificity: 11 + (index % 2),
          virality: style === "conflict" ? 15 : 12,
        },
        comment: "这是基于模板生成的兜底候选标题。",
        weakness: "个性化不足",
        suggestion: "结合更具体的人群、场景和结果，可进一步提升表现。",
        rewrittenTitle: title,
      }),
    ),
  );

  const sortedCandidates = candidates.sort((a, b) => b.score.overall - a.score.overall);
  const best = sortedCandidates[0];

  return normalizeTitleAnalysisResult(
    {
      platform: "通用平台",
      audience: "通用用户",
      topic: cleanTopic,
      recommendedStyle: preferredStyle,
      candidates: sortedCandidates,
      bestTitle: {
        title: best?.rewrittenTitle || best?.title || "",
        style: best?.style || preferredStyle,
        reason: "AI 返回异常，已使用本地兜底标题方案。",
      },
    },
    {
      topic: cleanTopic,
      recommendedStyle: preferredStyle,
    },
  );
}