import { MoreHorizontal, Edit, Trash2, Star } from 'lucide-react';
import clsx from 'clsx';
import { PLATFORM_NAMES, PLATFORM_COLORS } from '../../constants/platforms';

function getToneLabel(tone) {
  const toneMap = {
    casual: '口语化',
    professional: '专业理性',
    emotional: '情绪表达',
    sharp: '直接犀利',
    humorous: '幽默',
    sarcastic: '讽刺',
  };

  return toneMap[tone] || '自然风格';
}

export default function PersonaCard({
  persona,
  isActive,
  onSetActive,
  onEdit,
  onDelete,
}) {
  if (!persona || !persona.id) return null;

  const platformColor = PLATFORM_COLORS[persona.platform] || '#3b82f6';
  const firstChar = persona.name?.charAt(0) || '?';

  const role = persona.role || persona.occupation || '未设置角色定位';
  const tone =
    persona.tone || persona.writingStyle?.tone || 'professional';
  const bio = persona.bio || '暂无简介';
  const platformName =
    PLATFORM_NAMES[persona.platform] || persona.platform || '未设置平台';

  return (
    <div className="bg-white rounded-lg shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden">
      <div className="h-1" style={{ backgroundColor: platformColor }} />

      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg shrink-0">
              {persona.avatar ? (
                <img
                  src={persona.avatar}
                  alt={persona.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                firstChar
              )}
            </div>

            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {persona.name || '未命名'}
              </h3>
              <p className="text-sm text-gray-500 truncate">{role}</p>
            </div>
          </div>

          <button className="text-gray-400 hover:text-gray-600 shrink-0">
            <MoreHorizontal size={18} />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-700">
            {platformName}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-700">
            {getToneLabel(tone)}
          </span>
        </div>

        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
          {bio}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={onSetActive}
            className={clsx(
              'text-sm flex items-center space-x-1',
              isActive
                ? 'text-brand-600'
                : 'text-gray-500 hover:text-brand-600'
            )}
          >
            <Star size={16} fill={isActive ? 'currentColor' : 'none'} />
            <span>{isActive ? '活跃中' : '设为活跃'}</span>
          </button>

          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="text-gray-400 hover:text-gray-600"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={onDelete}
              className="text-gray-400 hover:text-danger"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}