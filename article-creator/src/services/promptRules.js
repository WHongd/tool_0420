// src/services/promptRules.js

const PLATFORM_META = {
  toutiao: {
    label: '今日头条',
    mission: '适合发布完整主文，重点是观点清晰、信息增量、结构完整、可读性强。',
    audience: '对热点、生活、社会、职场有阅读兴趣的泛资讯读者。',
    structure: '推荐使用“结论先行 -> 原因拆解 -> 例子补充 -> 观点收束”的结构。',
    openingStyle: '开头直接抛出判断、现象或冲突，不要绕弯子。',
    titleStyle: '标题要具体、有信息量、有吸引力，但不要夸张低俗。',
    endingStyle: '结尾做判断、总结或提出一个自然的问题。',
    tone: '理性、克制、有态度、有分析感。',
    length: '正文建议 600-1200 字；如果是短文，至少也要结构完整。',
    avoid: [
      '不要空话套话',
      '不要严重标题党',
      '不要编造事实',
      '不要使用诱导转发评论的话术',
      '不要只堆情绪，没有信息增量',
    ],
    preferredAngles: [
      '社会现象观察',
      '热点拆解',
      '职场与生活判断',
      '普通人视角复盘',
      '趋势变化分析',
    ],
    hooks: [
      '先说结论',
      '这件事很多人看反了',
      '真正值得注意的不是表面热闹',
      '问题不在事件本身，而在背后的逻辑',
    ],
  },

  weitoutiao: {
    label: '微头条',
    mission: '适合短平快表达观点、情绪和观察，重点是抓人、直接、易读。',
    audience: '刷信息流、需要快速获得判断和情绪共鸣的读者。',
    structure: '推荐使用“现象/冲突 -> 一句判断 -> 两三句展开 -> 一句收尾”的结构。',
    openingStyle: '开头要快，第一句就让人知道你想说什么。',
    titleStyle: '如果需要标题，尽量短；很多场景可直接用第一句做钩子。',
    endingStyle: '结尾轻收，不要硬引导互动。',
    tone: '直接、口语化、有情绪温度，但不要过火。',
    length: '正文建议 80-220 字，尽量短句分行。',
    avoid: [
      '不要灌水',
      '不要强行制造对立',
      '不要诱导评论、打卡、转发',
      '不要像长文章压缩版',
      '不要一堆空泛感叹词',
    ],
    preferredAngles: [
      '热点短评',
      '生活观察',
      '情绪共鸣',
      '一针见血的判断',
      '小切口即时表达',
    ],
    hooks: [
      '说真的',
      '最扎心的地方其实在这',
      '很多人没意识到这一点',
      '这事表面看简单，其实很典型',
    ],
  },

  baijiahao: {
    label: '百家号',
    mission: '适合实用型、经验型、教程型内容，重点是解决问题、可信、可收藏。',
    audience: '希望快速获得方法、步骤、建议、避坑经验的读者。',
    structure: '推荐使用“先说结论 -> 分点讲步骤/情况 -> 总结注意事项”的结构。',
    openingStyle: '开头先给答案，再解释原因或步骤。',
    titleStyle: '标题清晰、实用、具体，突出“解决什么问题”。',
    endingStyle: '结尾给建议、提醒或适用场景。',
    tone: '靠谱、耐心、清楚、少情绪、多方法。',
    length: '正文建议 500-1000 字，结构清晰，分点明确。',
    avoid: [
      '不要伪干货',
      '不要故弄玄虚',
      '不要只讲概念，不给方法',
      '不要模糊结论',
      '不要过度夸张承诺',
    ],
    preferredAngles: [
      '教程指南',
      '经验复盘',
      '避坑清单',
      '工具方法',
      '对比建议',
    ],
    hooks: [
      '先说结论',
      '这件事分三种情况看',
      '新手最容易踩的坑有这几个',
      '如果你只记住一条，就记这一条',
    ],
  },
};

const PLATFORM_PERSONA_PRESETS = {
  toutiao: {
    name: '头条｜社会观察者',
    platform: 'toutiao',
    role: '社会观察型作者',
    bio: '从普通人视角解读热点，给出有价值的判断。',
    tone: 'sharp',
    description: '先给结论，再拆原因，语言直接，有观点。',
    contentAngles: ['社会观察', '热点解读', '普通人视角'],
    openingStyle: '先抛结论',
    endingStyle: '总结+观点',
    audience: '普通大众读者',
    tabooWords: ['绝对', '保证赚钱', '内幕消息'],
    keywords: ['现实', '普通人', '变化', '趋势'],
  },

  weitoutiao: {
    name: '微头条｜情绪短评',
    platform: 'weitoutiao',
    role: '情绪表达型作者',
    bio: '用短内容表达观点，引发共鸣。',
    tone: 'emotional',
    description: '短句多，情绪明显，有观点。',
    contentAngles: ['热点评论', '情绪表达', '共鸣观点'],
    openingStyle: '先抛情绪',
    endingStyle: '轻收尾',
    audience: '泛信息流用户',
    tabooWords: ['绝对', '内幕', '评论区扣1', '都来打卡'],
    keywords: ['太真实', '无语', '离谱', '看懂了'],
  },

  baijiahao: {
    name: '百家号｜经验分享',
    platform: 'baijiahao',
    role: '实用经验作者',
    bio: '提供具体方法和步骤，帮助读者解决问题。',
    tone: 'professional',
    description: '结构清晰，步骤明确，逻辑强。',
    contentAngles: ['方法总结', '经验分享', '教程类'],
    openingStyle: '先给答案',
    endingStyle: '总结+建议',
    audience: '想解决问题的人',
    tabooWords: ['保证', '必赚', '绝对有效'],
    keywords: ['方法', '步骤', '建议', '实操'],
  },
};

function safeJoin(value, separator = '、') {
  if (Array.isArray(value)) return value.filter(Boolean).join(separator);
  if (typeof value === 'string') return value;
  return '';
}

function ensureArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(/[,\n、]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function getPlatformTemplate(platform) {
  return PLATFORM_META[platform] || PLATFORM_META.toutiao;
}

export function getPersonaPreset(platform) {
  return PLATFORM_PERSONA_PRESETS[platform] || PLATFORM_PERSONA_PRESETS.toutiao;
}

export function normalizePersonaForPrompt(persona) {
  const platform = persona?.platform || 'toutiao';
  const preset = getPersonaPreset(platform);

  if (!persona) {
    return {
      ...preset,
      platform,
    };
  }

  return {
    ...preset,
    ...persona,
    platform,
    role: persona.role || preset.role,
    bio: persona.bio || preset.bio,
    tone: persona.tone || preset.tone,
    description: persona.description || preset.description,
    contentAngles:
      ensureArray(persona.contentAngles).length > 0
        ? ensureArray(persona.contentAngles)
        : preset.contentAngles,
    openingStyle: persona.openingStyle || preset.openingStyle,
    endingStyle: persona.endingStyle || preset.endingStyle,
    audience: persona.audience || preset.audience,
    tabooWords:
      ensureArray(persona.tabooWords).length > 0
        ? ensureArray(persona.tabooWords)
        : preset.tabooWords,
    keywords:
      ensureArray(persona.keywords).length > 0
        ? ensureArray(persona.keywords)
        : preset.keywords,
  };
}

export function buildPlatformRules(platform) {
  const meta = getPlatformTemplate(platform);

  return `
【平台定位】
- 平台：${meta.label}
- 内容目标：${meta.mission}
- 读者画像：${meta.audience}
- 推荐结构：${meta.structure}
- 平台推荐开头：${meta.openingStyle}
- 平台标题风格：${meta.titleStyle}
- 平台结尾方式：${meta.endingStyle}
- 平台语气要求：${meta.tone}
- 建议篇幅：${meta.length}

【平台优先创作角度】
- ${meta.preferredAngles.join('\n- ')}

【平台推荐开头钩子】
- ${meta.hooks.join('\n- ')}

【平台必须避免】
- ${meta.avoid.join('\n- ')}
`.trim();
}

export function buildPersonaRules(persona) {
  const normalized = normalizePersonaForPrompt(persona);

  return `
【创作者人设】
- 名称：${normalized.name || '未命名人设'}
- 角色定位：${normalized.role || '内容创作者'}
- 人设简介：${normalized.bio || '无'}
- 目标读者：${normalized.audience || '泛内容读者'}
- 语气风格：${normalized.tone || 'natural'}
- 风格描述：${normalized.description || '自然、清楚、有真人感'}

【写作控制项】
- 常写角度：${safeJoin(normalized.contentAngles) || '按平台主流方向发挥'}
- 开头方式：${normalized.openingStyle || '自然进入主题'}
- 结尾方式：${normalized.endingStyle || '自然收尾'}
- 关键词：${safeJoin(normalized.keywords) || '无特别要求'}
- 禁忌词：${safeJoin(normalized.tabooWords) || '无'}

【强制写作原则】
- 必须像这个人本人在写，不要像AI助手
- 优先使用这个人的关注点、表达方式和判断习惯
- 开头要遵守设定的开头方式，不要随意换掉
- 结尾要遵守设定的结尾方式，不要乱加生硬互动
- 尽量自然融入关键词，但不要堆砌
- 禁忌词和禁忌表达不要出现
- 不要脱离平台风格单独炫技
- 不要编造事实，不要为了刺激而过度夸张
`.trim();
}

export function buildPromptRules(persona, taskDescription = '') {
  const normalized = normalizePersonaForPrompt(persona);
  const platformRules = buildPlatformRules(normalized.platform);
  const personaRules = buildPersonaRules(normalized);

  return `
${platformRules}

${personaRules}

${taskDescription ? `【当前任务补充】\n${taskDescription}` : ''}
`.trim();
}

export function getRecommendedPersonaIdeas() {
  return {
    toutiao: getPersonaPreset('toutiao'),
    weitoutiao: getPersonaPreset('weitoutiao'),
    baijiahao: getPersonaPreset('baijiahao'),
  };
}