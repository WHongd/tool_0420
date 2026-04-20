import { useEffect, useMemo, useRef, useState } from "react";
import aiService from "../../../services/aiService";
import {
  getBestTitleItem,
  getTitleCandidates,
  getTitleText,
  getTopThreeCandidates,
  normalizeTitleItem,
} from "../utils/dashboardTitleMappers";

const PLATFORM_OPTIONS = [
  { value: "toutiao", label: "今日头条" },
  { value: "weitoutiao", label: "微头条" },
  { value: "wechat", label: "微信公众号" },
];

const PERSONA_OPTIONS = [
  { value: "normal", label: "普通分享" },
  { value: "emotion", label: "情绪表达" },
  { value: "professional", label: "专业分析" },
];

const DEFAULT_PLATFORM = "wechat";
const DEFAULT_PERSONA = "normal";
const FIXED_CANDIDATE_COUNT = 3;
const STORAGE_KEY = "dashboard_v2_creation_session";

function buildOpeningDraft({ articleTitle, persona }) {
  if (persona === "emotion") {
    return `说实话，看到“${articleTitle}”这个话题，我第一反应不是复杂，而是很多人真的一直没把它想明白。表面上看只是一个普通问题，真正写出来才会发现，它背后牵扯的是认知、选择和现实结果。`;
  }

  if (persona === "professional") {
    return `围绕“${articleTitle}”这个主题，如果只做表层表达，很容易失去内容价值。更有效的写法，是把问题背景、关键变量、实际影响和可执行结论拆开来讲。`;
  }

  return `很多人一开始看到“${articleTitle}”这个问题时，往往只会停留在表面理解。但真正值得写出来的内容，不只是一个判断，而是它背后的原因、场景和实际价值。`;
}

function loadPersistedState() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    return {
      topic: parsed.topic || "",
      platform: parsed.platform || DEFAULT_PLATFORM,
      persona: parsed.persona || DEFAULT_PERSONA,
      articleTitle: parsed.articleTitle || "",
      articleContent: parsed.articleContent || "",
      selectedTitle: parsed.selectedTitle || "",
      contentDraftMap: parsed.contentDraftMap || {},
      outlineSections: parsed.outlineSections || [],
      activeOutlineId: parsed.activeOutlineId || "",
      draftId: parsed.draftId || "",
    };
  } catch {
    return null;
  }
}

function mergeContentWithBlock(currentContent, block) {
  const safeCurrent = String(currentContent || "").trim();
  const safeBlock = String(block || "").trim();

  if (!safeBlock) return safeCurrent;
  if (!safeCurrent) return safeBlock;

  return `${safeCurrent}\n\n${safeBlock}`;
}

function hasInsertedBlock(articleContent, block) {
  const safeArticle = String(articleContent || "");
  const safeBlock = String(block || "").trim();
  if (!safeBlock) return false;
  return safeArticle.includes(safeBlock);
}

function markSectionInserted(sections, sectionId) {
  return sections.map((item) =>
    item.id === sectionId ? { ...item, inserted: true } : item
  );
}

export function useDashboardTitleWorkbench() {
  const persisted = useMemo(() => loadPersistedState(), []);
  const didHydrateRemoteRef = useRef(false);

  const platformOptions = useMemo(() => PLATFORM_OPTIONS, []);
  const personaOptions = useMemo(() => PERSONA_OPTIONS, []);

  const [topic, setTopicState] = useState(persisted?.topic || "");
  const [platform, setPlatformState] = useState(
    persisted?.platform || DEFAULT_PLATFORM
  );
  const [persona, setPersonaState] = useState(
    persisted?.persona || DEFAULT_PERSONA
  );

  const [articleTitle, setArticleTitle] = useState(
    persisted?.articleTitle || ""
  );
  const [articleContent, setArticleContentState] = useState(
    persisted?.articleContent || ""
  );
  const [contentDraftMap, setContentDraftMap] = useState(
    persisted?.contentDraftMap || {}
  );

  const [titleLoading, setTitleLoading] = useState(false);
  const [titleAnalysisResult, setTitleAnalysisResult] = useState(null);
  const [titleAnalysisError, setTitleAnalysisError] = useState("");
  const [selectedTitle, setSelectedTitle] = useState(
    persisted?.selectedTitle || ""
  );

  const [contentLoading, setContentLoading] = useState(false);
  const [creationSessionKey, setCreationSessionKey] = useState(0);

  const [isSaving, setIsSaving] = useState(false);
  const [showRecoveredTip, setShowRecoveredTip] = useState(
    Boolean(
      persisted &&
        (persisted.topic ||
          persisted.articleTitle ||
          persisted.articleContent ||
          (persisted.outlineSections && persisted.outlineSections.length > 0))
    )
  );

  const [outlineSections, setOutlineSections] = useState(
    persisted?.outlineSections || []
  );
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [activeOutlineId, setActiveOutlineId] = useState(
    persisted?.activeOutlineId || ""
  );

  const [lastInsertedAt, setLastInsertedAt] = useState(0);
  const [draftId, setDraftId] = useState(persisted?.draftId || "");

  const candidates = useMemo(
    () => getTopThreeCandidates(titleAnalysisResult),
    [titleAnalysisResult]
  );

  const bestTitleItem = useMemo(() => {
    const normalized = normalizeTitleItem(getBestTitleItem(titleAnalysisResult));
    if (normalized?.title) return normalized;
    return candidates.length ? normalizeTitleItem(candidates[0]) : null;
  }, [titleAnalysisResult, candidates]);

  const setArticleContent = (value) => {
    setArticleContentState(value);

    if (articleTitle) {
      setContentDraftMap((prev) => ({
        ...prev,
        [articleTitle]: value,
      }));
    }
  };

  useEffect(() => {
    if (didHydrateRemoteRef.current) return;
    didHydrateRemoteRef.current = true;

    let cancelled = false;

    async function hydrateLatestDraft() {
      try {
        const remoteDraft = await aiService.getLatestDraft();
        if (!remoteDraft || cancelled) return;

        setTopicState(remoteDraft.topic || "");
        setPlatformState(remoteDraft.platform || DEFAULT_PLATFORM);
        setPersonaState(remoteDraft.persona || DEFAULT_PERSONA);
        setArticleTitle(remoteDraft.articleTitle || "");
        setArticleContentState(remoteDraft.articleContent || "");
        setSelectedTitle(remoteDraft.selectedTitle || "");
        setContentDraftMap(remoteDraft.contentDraftMap || {});
        setOutlineSections(remoteDraft.outlineSections || []);
        setActiveOutlineId(remoteDraft.activeOutlineId || "");
        setDraftId(remoteDraft.draftId || "");
        setShowRecoveredTip(
          Boolean(
            remoteDraft.topic ||
              remoteDraft.articleTitle ||
              remoteDraft.articleContent ||
              (remoteDraft.outlineSections &&
                remoteDraft.outlineSections.length > 0)
          )
        );
      } catch {
        // 后端不可用时，继续走本地恢复
      }
    }

    hydrateLatestDraft();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const payload = {
      topic,
      platform,
      persona,
      articleTitle,
      articleContent,
      selectedTitle,
      contentDraftMap,
      outlineSections,
      activeOutlineId,
      draftId,
    };

    setIsSaving(true);

    const timer = setTimeout(async () => {
      try {
        await aiService.saveDraft({
          draftId,
          topic,
          platform,
          persona,
          articleTitle,
          articleContent,
          selectedTitle,
          contentDraftMap,
          outlineSections,
          activeOutlineId,
        });
      } catch {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch {
          // ignore
        }
      } finally {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch {
          // ignore
        }
        setIsSaving(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    topic,
    platform,
    persona,
    articleTitle,
    articleContent,
    selectedTitle,
    contentDraftMap,
    outlineSections,
    activeOutlineId,
    draftId,
  ]);

  const resetOutline = () => {
    setOutlineSections([]);
    setOutlineLoading(false);
    setActiveOutlineId("");
  };

  const clearCurrentFlow = () => {
    setTitleAnalysisResult(null);
    setTitleAnalysisError("");
    setSelectedTitle("");
    setArticleTitle("");
    setArticleContentState("");
    setContentDraftMap({});
    resetOutline();
  };

  const handleStartNewCreation = () => {
    setTopicState("");
    setPlatformState(DEFAULT_PLATFORM);
    setPersonaState(DEFAULT_PERSONA);
    clearCurrentFlow();
    setCreationSessionKey((prev) => prev + 1);
    setShowRecoveredTip(false);
    setDraftId("");

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const setTopic = (next) => {
    setTopicState(next);
    clearCurrentFlow();
    setShowRecoveredTip(false);
  };

  const setPlatform = (next) => {
    setPlatformState(next);
    clearCurrentFlow();
    setShowRecoveredTip(false);
  };

  const setPersona = (next) => {
    setPersonaState(next);
    clearCurrentFlow();
    setShowRecoveredTip(false);
  };

  const switchToTitle = (title) => {
    setSelectedTitle(title);
    setArticleTitle(title);
    setArticleContentState(contentDraftMap[title] || "");
    resetOutline();
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    const isWeitoutiao = platform === "weitoutiao";

    if (isWeitoutiao) {
      setContentLoading(true);
      setTitleAnalysisError("");

      try {
        const result = await aiService.generateWeitoutiao({
          topic: topic.trim(),
          platform,
          persona,
        });

        setArticleTitle(topic.trim());
        setSelectedTitle("");
        setArticleContent(result.content || "");
        resetOutline();
        setLastInsertedAt(Date.now());
      } catch {
        setTitleAnalysisError("内容生成失败");
      } finally {
        setContentLoading(false);
      }

      return;
    }

    setTitleLoading(true);
    setTitleAnalysisError("");

    try {
      const result = await aiService.generateTitleAnalysis({
        topic: topic.trim(),
        platform,
        persona,
        candidateCount: FIXED_CANDIDATE_COUNT,
      });

      setTitleAnalysisResult(result);

      const first = getTitleCandidates(result)[0];
      if (first) {
        const title = getTitleText(first);
        switchToTitle(title);
      }
    } catch {
      setTitleAnalysisError("标题生成失败");
    } finally {
      setTitleLoading(false);
    }
  };

  const handlePickTitle = (item) => {
    const title = typeof item === "string" ? item : getTitleText(item);
    switchToTitle(title);
  };

  const handleUseBestTitle = () => {
    if (bestTitleItem?.title) {
      switchToTitle(bestTitleItem.title);
    }
  };

  const handleGenerateOpening = async () => {
    if (!articleTitle) return;

    setContentLoading(true);

    try {
      const opening = buildOpeningDraft({ articleTitle, persona });
      const merged = articleContent
        ? `${opening}\n\n${articleContent}`
        : opening;

      setArticleContent(merged);
      setLastInsertedAt(Date.now());
    } finally {
      setContentLoading(false);
    }
  };

  const generateOutlineByTitle = async (customTitle) => {
    const sourceTitle = String(customTitle || articleTitle || "").trim();
    if (!sourceTitle) return;

    setOutlineLoading(true);

    try {
      const result = await aiService.generateOutline({
        title: sourceTitle,
        platform,
        persona,
      });

      const sections = (result.sections || []).map((item, index) => ({
        ...item,
        id: item.id || `section_${index + 1}`,
        order: item.order || index + 1,
        inserted: false,
        content: item.content || "",
        status: item.status || "idle",
      }));

      setOutlineSections(sections);
      setActiveOutlineId(sections[0]?.id || "");
    } finally {
      setOutlineLoading(false);
    }
  };

  const generateSectionContent = async (sectionId) => {
    if (!sectionId) return;

    let targetSection = null;

    setOutlineSections((prev) =>
      prev.map((item) => {
        if (item.id === sectionId) {
          targetSection = item;
          return { ...item, status: "generating" };
        }
        return item;
      })
    );

    if (!targetSection) return;

    try {
      const result = await aiService.generateSection({
        articleTitle,
        platform,
        persona,
        section: {
          id: targetSection.id,
          order: targetSection.order,
          title: targetSection.title,
          summary: targetSection.summary,
        },
      });

      const content = result.content || "";

      setOutlineSections((prev) =>
        prev.map((item) =>
          item.id === sectionId
            ? { ...item, content, status: "done" }
            : item
        )
      );
    } catch {
      setOutlineSections((prev) =>
        prev.map((item) =>
          item.id === sectionId ? { ...item, status: "idle" } : item
        )
      );
    }
  };

  const insertSectionIntoArticle = (sectionId) => {
    if (!sectionId) return;

    const currentSection = outlineSections.find((item) => item.id === sectionId);
    if (!currentSection?.content) return;

    const block = String(currentSection.content || "").trim();
    if (!block) return;

    if (hasInsertedBlock(articleContent, block)) {
      setActiveOutlineId(sectionId);
      setOutlineSections((prev) => markSectionInserted(prev, sectionId));
      return;
    }

    const nextContent = mergeContentWithBlock(articleContent, block);

    setArticleContent(nextContent);
    setActiveOutlineId(sectionId);
    setOutlineSections((prev) => markSectionInserted(prev, sectionId));
    setLastInsertedAt(Date.now());
  };

  const generateAndInsertSection = async (sectionId) => {
    if (!sectionId) return;

    const section = outlineSections.find((item) => item.id === sectionId);
    if (!section) return;

    if (section.content) {
      insertSectionIntoArticle(sectionId);
      return;
    }

    let targetSection = null;

    setOutlineSections((prev) =>
      prev.map((item) => {
        if (item.id === sectionId) {
          targetSection = item;
          return { ...item, status: "generating" };
        }
        return item;
      })
    );

    if (!targetSection) return;

    try {
      const result = await aiService.generateSection({
        articleTitle,
        platform,
        persona,
        section: {
          id: targetSection.id,
          order: targetSection.order,
          title: targetSection.title,
          summary: targetSection.summary,
        },
      });

      const content = result.content || "";

      setOutlineSections((prev) =>
        prev.map((item) =>
          item.id === sectionId
            ? { ...item, content, status: "done" }
            : item
        )
      );

      if (hasInsertedBlock(articleContent, content)) {
        setActiveOutlineId(sectionId);
        setOutlineSections((prev) => markSectionInserted(prev, sectionId));
        return;
      }

      const nextContent = mergeContentWithBlock(articleContent, content);

      setArticleContent(nextContent);
      setActiveOutlineId(sectionId);
      setOutlineSections((prev) => markSectionInserted(prev, sectionId));
      setLastInsertedAt(Date.now());
    } catch {
      setOutlineSections((prev) =>
        prev.map((item) =>
          item.id === sectionId ? { ...item, status: "idle" } : item
        )
      );
    }
  };

  const generateStructuredArticle = async () => {
    if (!articleTitle) return;

    setContentLoading(true);

    try {
      const result = await aiService.generateArticle({
        title: articleTitle,
        platform,
        persona,
        withOutline: platform === "wechat",
      });

      const nextOutline = (result.outline || []).map((item, index) => ({
        ...item,
        id: item.id || `section_${index + 1}`,
        order: item.order || index + 1,
        inserted: true,
        content: item.content || "",
        status: "done",
      }));

      if (nextOutline.length) {
        setOutlineSections(nextOutline);
        setActiveOutlineId(nextOutline[0]?.id || "");
      }

      if (result.content) {
        setArticleContent(result.content);
        setLastInsertedAt(Date.now());
      }
    } finally {
      setContentLoading(false);
    }
  };

  return {
    topic,
    setTopic,
    platform,
    setPlatform,
    platformOptions,

    persona,
    setPersona,
    personaOptions,

    articleTitle,
    articleContent,
    setArticleContent,

    titleLoading,
    titleAnalysisError,
    selectedTitle,
    contentLoading,

    candidates,
    bestTitleItem,

    creationSessionKey,

    isSaving,
    showRecoveredTip,
    dismissRecoveredTip: () => setShowRecoveredTip(false),

    outlineSections,
    outlineLoading,
    activeOutlineId,
    setActiveOutlineId,

    handleGenerate,
    handlePickTitle,
    handleUseBestTitle,
    handleGenerateOpening,
    handleStartNewCreation,

    generateOutlineByTitle,
    generateSectionContent,
    generateAndInsertSection,
    generateStructuredArticle,
    resetOutline,

    lastInsertedAt,
  };
}