import { useMemo, useState } from 'react';
import { Sparkles, Wand2, AlertCircle, CheckCircle2 } from 'lucide-react';

function getScoreLevel(score) {
  if (score >= 80) {
    return {
      label: '可直接发布',
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: CheckCircle2,
    };
  }

  if (score >= 60) {
    return {
      label: '建议优化后发布',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: AlertCircle,
    };
  }

  return {
    label: '建议继续打磨',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertCircle,
  };
}

function getDimensionLabel(key) {
  const map = {
    naturalLanguage: '真人感',
    specificDetails: '细节密度',
    emotionalAuthenticity: '情绪真实',
    platformFit: '平台适配',
  };

  return map[key] || key;
}

function getDimensionBarClass(score) {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getQuickActions(score) {
  if (!score?.dimensions) {
    return [];
  }

  const actions = [];
  const d = score.dimensions;

  if ((d.naturalLanguage ?? 100) < 70) {
    actions.push('去掉AI腔，让表达更像真人');
  }

  if ((d.specificDetails ?? 100) < 70) {
    actions.push('增加具体案例、场景或细节');
  }

  if ((d.emotionalAuthenticity ?? 100) < 70) {
    actions.push('增强真实感和情绪温度');
  }

  if ((d.platformFit ?? 100) < 70) {
    actions.push('让内容更贴合当前平台风格');
  }

  return actions.slice(0, 4);
}

export default function AIScorePanel({
  score,
  onAnalyze,
  onOptimize,
  isAnalyzing,
  isOptimizing,
  disabled = false,
}) {
  const [customSuggestions, setCustomSuggestions] = useState('');
  const [showOptimizeBox, setShowOptimizeBox] = useState(false);

  const hasScore =
    score &&
    typeof score.overall === 'number' &&
    score.overall > 0 &&
    score.dimensions;

  const scoreLevel = useMemo(
    () => getScoreLevel(score?.overall || 0),
    [score]
  );

  const quickActions = useMemo(() => getQuickActions(score), [score]);

  const defaultSuggestions = Array.isArray(score?.suggestions)
    ? score.suggestions
    : [];

  const mergedSuggestions = useMemo(() => {
    const merged = [...quickActions, ...defaultSuggestions];
    return [...new Set(merged)].slice(0, 5);
  }, [quickActions, defaultSuggestions]);

  const handleOptimizeSubmit = () => {
    const manualList = customSuggestions
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

    const finalSuggestions =
      manualList.length > 0 ? manualList : mergedSuggestions;

    if (finalSuggestions.length === 0) {
      alert('请至少填写一条优化建议');
      return;
    }

    onOptimize(finalSuggestions);
    setShowOptimizeBox(false);
    setCustomSuggestions('');
  };

  if (!hasScore) {
    return (
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">文章质量评分</h3>
          <span className="text-xs text-gray-400">发布前诊断</span>
        </div>

        <div className="text-center py-8 text-gray-400 text-sm">
          暂无文章诊断结果，请先撰写或生成文章
        </div>

        <button
          onClick={onAnalyze}
          disabled={disabled || isAnalyzing}
          className="w-full py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <Sparkles size={16} />
          <span>{isAnalyzing ? '诊断中...' : '开始诊断'}</span>
        </button>
      </div>
    );
  }

  const StatusIcon = scoreLevel.icon;

  return (
    <div className="bg-white rounded-lg shadow-card p-4">
      {/* 顶部概览 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">文章质量评分</h3>
          <p className="text-xs text-gray-400 mt-1">发布前诊断</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-brand-600">
            {score.overall}
          </div>
          <div className="text-xs text-gray-400">综合分</div>
        </div>
      </div>

      {/* 发布建议 */}
      <div
        className={`mb-4 rounded-lg border px-3 py-3 ${scoreLevel.bg} ${scoreLevel.border}`}
      >
        <div className="flex items-center space-x-2">
          <StatusIcon size={16} className={scoreLevel.color} />
          <span className={`text-sm font-medium ${scoreLevel.color}`}>
            {scoreLevel.label}
          </span>
        </div>
      </div>

      {/* 维度评分 */}
      <div className="space-y-3">
        {Object.entries(score.dimensions).map(([key, value]) => (
          <div key={key}>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{getDimensionLabel(key)}</span>
              <span>{value}</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getDimensionBarClass(value)}`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 问题诊断 */}
      <div className="mt-5">
        <h4 className="text-sm font-medium text-gray-900 mb-2">问题诊断</h4>

        {mergedSuggestions.length > 0 ? (
          <div className="bg-gray-50 rounded-lg p-3">
            <ul className="space-y-2 text-sm text-gray-600">
              {mergedSuggestions.map((item, index) => (
                <li key={`${item}-${index}`} className="flex items-start gap-2">
                  <span className="mt-[2px] text-brand-500">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-500">
            暂无明显问题，可直接微调后发布。
          </div>
        )}
      </div>

      {/* 快捷优化 */}
      {!showOptimizeBox ? (
        <div className="mt-4 space-y-2">
          <button
            onClick={onAnalyze}
            disabled={disabled || isAnalyzing}
            className="w-full py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={16} />
            <span>{isAnalyzing ? '诊断中...' : '重新诊断'}</span>
          </button>

          <button
            onClick={() => {
              setShowOptimizeBox(true);
              setCustomSuggestions(mergedSuggestions.join('\n'));
            }}
            disabled={disabled || isOptimizing}
            className="w-full py-2 bg-white border border-brand-600 text-brand-600 rounded-lg hover:bg-brand-50 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wand2 size={16} />
            <span>{isOptimizing ? '优化中...' : '按建议优化'}</span>
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            优化建议
          </label>

          <textarea
            value={customSuggestions}
            onChange={(e) => setCustomSuggestions(e.target.value)}
            placeholder={
              '每行一条建议，例如：\n强化开头\n增加具体案例\n更贴合当前平台风格'
            }
            rows={5}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
          />

          <div className="flex space-x-2 mt-3">
            <button
              onClick={() => {
                setShowOptimizeBox(false);
                setCustomSuggestions('');
              }}
              className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              取消
            </button>

            <button
              onClick={handleOptimizeSubmit}
              disabled={isOptimizing}
              className="flex-1 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {isOptimizing ? '优化中...' : '提交优化'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}