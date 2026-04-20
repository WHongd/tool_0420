import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';
import { usePersonaStore } from '../../stores/usePersonaStore';
import clsx from 'clsx';
import { PLATFORM_COLORS, PLATFORM_NAMES } from '../../constants/platforms';

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

export default function PersonaSwitcher() {
  const { personas, activePersonaId, setActivePersona } = usePersonaStore();

  const activePersona =
    personas.find((p) => String(p.id) === String(activePersonaId)) || null;

  if (!activePersona || personas.length === 0) return null;

  const activeRole =
    activePersona.role || activePersona.occupation || '未设置角色定位';
  const activePlatformName =
    PLATFORM_NAMES[activePersona.platform] ||
    activePersona.platform ||
    '未设置平台';

  return (
    <Menu as="div" className="relative inline-block text-left w-full">
      <Menu.Button className="inline-flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500">
        <div className="flex items-center space-x-2 truncate min-w-0">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              backgroundColor:
                PLATFORM_COLORS[activePersona.platform] || '#3b82f6',
            }}
          />
          <span className="truncate">{activePersona.name}</span>
          <span className="text-xs text-gray-400 truncate">
            ({activeRole})
          </span>
        </div>
        <ChevronDown size={16} className="ml-2 flex-shrink-0" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 mt-2 w-72 origin-top-left bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs text-gray-400">当前平台</p>
              <p className="text-sm font-medium text-gray-700">
                {activePlatformName}
              </p>
            </div>

            {personas.map((persona) => {
              const isActive =
                String(persona.id) === String(activePersonaId);
              const role =
                persona.role || persona.occupation || '未设置角色定位';
              const tone =
                persona.tone || persona.writingStyle?.tone || 'professional';
              const platformName =
                PLATFORM_NAMES[persona.platform] ||
                persona.platform ||
                '未设置平台';
              const platformColor =
                PLATFORM_COLORS[persona.platform] || '#3b82f6';

              return (
                <Menu.Item key={persona.id}>
                  {({ active }) => (
                    <button
                      onClick={() => setActivePersona(persona.id)}
                      className={clsx(
                        'block w-full text-left px-4 py-3 text-sm text-gray-700',
                        active ? 'bg-gray-50' : ''
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: platformColor }}
                            />
                            <span className="font-medium truncate">
                              {persona.name}
                            </span>
                          </div>

                          <div className="mt-1 text-xs text-gray-500 truncate">
                            {role}
                          </div>

                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-gray-100 text-xs rounded-full text-gray-600">
                              {platformName}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 text-xs rounded-full text-gray-600">
                              {getToneLabel(tone)}
                            </span>
                          </div>
                        </div>

                        {isActive && (
                          <span className="text-xs text-brand-600 shrink-0">
                            当前
                          </span>
                        )}
                      </div>
                    </button>
                  )}
                </Menu.Item>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}