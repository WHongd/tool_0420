import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Check } from 'lucide-react';

export default function StyleAnalysisModal({ isOpen, onClose, analysis, onApply, isApplying = false }) {
  if (!analysis) return null;

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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-lg bg-white p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-lg font-semibold">文章风格分析</Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-700">整体语气</h4>
                    <p className="text-sm text-gray-600">{analysis.tone}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">关键词</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {analysis.keywords.map((kw, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-xs rounded-full">{kw}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">风格描述</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{analysis.styleDescription}</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onApply}
                    disabled={isApplying}
                    className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50 flex items-center space-x-1"
                  >
                    <Check size={16} />
                    <span>{isApplying ? '应用中...' : '应用为人设风格'}</span>
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