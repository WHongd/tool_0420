import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { PLATFORM_NAMES, PLATFORM_COLORS } from '../../constants/platforms';

export default function PersonaSelectorModal({
  isOpen,
  onClose,
  personas = [],
  activeId,
  currentPersonaId,
  onSelect,
}) {
  const selectedId = currentPersonaId ?? activeId ?? null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold text-gray-900"
                  >
                    选择人设
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                </div>

                {personas.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-500">
                    暂无人设，请先去人设库创建
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {personas.map((persona) => {
                      const isActive = String(selectedId) === String(persona.id);
                      const role =
                        persona.role || persona.occupation || '未设置角色定位';
                      const platformName =
                        PLATFORM_NAMES[persona.platform] ||
                        persona.platform ||
                        '未设置平台';
                      const platformColor =
                        PLATFORM_COLORS[persona.platform] || '#3b82f6';

                      return (
                        <button
                          key={persona.id}
                          onClick={() => {
                            onSelect(persona.id);
                            onClose();
                          }}
                          className={`w-full text-left p-3 rounded-lg border transition ${
                            isActive
                              ? 'border-brand-500 bg-brand-50'
                              : 'border-gray-200 hover:border-brand-500 hover:bg-brand-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: platformColor }}
                                />
                                <p className="font-medium text-gray-900 truncate">
                                  {persona.name || '未命名人设'}
                                </p>
                              </div>

                              <p className="text-xs text-gray-500 mt-1 truncate">
                                {role}
                              </p>

                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 bg-gray-100 text-xs rounded-full text-gray-600">
                                  {platformName}
                                </span>
                                {persona.tone && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-xs rounded-full text-gray-600">
                                    {persona.tone}
                                  </span>
                                )}
                              </div>
                            </div>

                            {isActive && (
                              <span className="text-xs text-brand-600 shrink-0">
                                当前
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-6">
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    onClick={onClose}
                  >
                    取消
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}