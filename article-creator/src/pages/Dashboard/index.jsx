import React, { useEffect, useRef, useState } from "react";
import { useDashboardTitleWorkbench } from "./hooks/useDashboardTitleWorkbench";

import TitleBriefForm from "./components/TitleBriefForm";
import TitleResultPanel from "./components/TitleResultPanel";
import ContentWorkspace from "./components/ContentWorkspace";
import OutlinePlanner from "./components/OutlinePlanner";
import PersonaSelector from "./components/PersonaSelector";

export default function Dashboard() {
  const {
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
    dismissRecoveredTip,

    handleGenerate,
    handlePickTitle,
    handleUseBestTitle,
    handleGenerateOpening,
    handleStartNewCreation,

    outlineSections,
    outlineLoading,
    activeOutlineId,
    setActiveOutlineId,
    generateOutlineByTitle,
    generateSectionContent,
    generateAndInsertSection,
    generateStructuredArticle,
    resetOutline,

    lastInsertedAt,
  } = useDashboardTitleWorkbench();

  const isWeitoutiao = platform === "weitoutiao";

  const contentRef = useRef(null);
  const [flashEditor, setFlashEditor] = useState(false);

  useEffect(() => {
    if (!lastInsertedAt) return;

    contentRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setFlashEditor(true);
    const timer = setTimeout(() => setFlashEditor(false), 1400);

    return () => clearTimeout(timer);
  }, [lastInsertedAt]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {showRecoveredTip && (
          <div className="mb-4 text-xs bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded">
            已恢复上次编辑内容
            <button onClick={dismissRecoveredTip} className="ml-3 underline">
              知道了
            </button>
          </div>
        )}

        <TitleBriefForm
          topic={topic}
          setTopic={setTopic}
          platform={platform}
          setPlatform={setPlatform}
          platformOptions={platformOptions}
          loading={titleLoading}
          onGenerate={handleGenerate}
          onReset={handleStartNewCreation}
        />

        <PersonaSelector
          persona={persona}
          setPersona={setPersona}
          personaOptions={personaOptions}
        />

        {!isWeitoutiao && (
          <TitleResultPanel
            candidates={candidates}
            bestTitleItem={bestTitleItem}
            selectedTitle={selectedTitle}
            onPickTitle={handlePickTitle}
            onUseBest={handleUseBestTitle}
            error={titleAnalysisError}
          />
        )}

        {!isWeitoutiao && platform === "wechat" && (
          <OutlinePlanner
            articleTitle={articleTitle}
            outlineSections={outlineSections}
            outlineLoading={outlineLoading}
            activeOutlineId={activeOutlineId}
            setActiveOutlineId={setActiveOutlineId}
            generateOutlineByTitle={generateOutlineByTitle}
            generateSectionContent={generateSectionContent}
            generateAndInsertSection={generateAndInsertSection}
            generateStructuredArticle={generateStructuredArticle}
            resetOutline={resetOutline}
          />
        )}

        <div
          ref={contentRef}
          className={`mt-6 rounded-2xl transition-all duration-500 ${
            flashEditor ? "ring-2 ring-green-400 ring-offset-2" : ""
          }`}
        >
          <ContentWorkspace
            key={creationSessionKey}
            articleTitle={isWeitoutiao ? topic : articleTitle}
            articleContent={articleContent}
            setArticleContent={setArticleContent}
            contentLoading={contentLoading}
            onGenerateOpening={handleGenerateOpening}
             onGenerateFullArticle={generateStructuredArticle} // ✅ 新增
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
}