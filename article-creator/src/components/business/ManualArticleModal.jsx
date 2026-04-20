import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { usePersonaStore, useActivePersona } from '../../stores/usePersonaStore';
import { useArticleStore } from '../../stores/useArticleStore';

// ✅ 抽离：内容转换
function formatContentToHTML(content) {
  return `<p>${content.replace(/\n/g, '</p><p>')}</p>`;
}

export default function ManualArticleModal({ isOpen, onClose }) {
  const { personas } = usePersonaStore();
  const activePersona = useActivePersona();
  const { publishArticle } = useArticleStore();

  // ✅ 统一 form state
  const [form, setForm] = useState({
    title: '',
    content: '',
    personaId: '',
    platform: 'toutiao',
  });

  // ✅ 同步 activePersona
  useEffect(() => {
    if (activePersona && isOpen) {
      setForm((prev) => ({
        ...prev,
        personaId: activePersona.id,
      }));
    }
  }, [activePersona, isOpen]);

  // ✅ 通用更新
  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ✅ reset 统一
  const resetForm = () => {
    setForm({
      title: '',
      content: '',
      personaId: activePersona?.id || '',
      platform: 'toutiao',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      // 这里后面可以替换成 toast
      alert('请填写标题和内容');
      return;
    }

    const newArticle = {
      id: Date.now().toString(),
      title: form.title,
      content: formatContentToHTML(form.content),
      personaId: form.personaId,
      platform: form.platform,
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    publishArticle(newArticle);

    // 👉 后面建议换 toast
    alert('文章已添加');

    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child as={Fragment}>
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment}>
              <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-lg font-semibold">
                    手动添加文章
                  </Dialog.Title>
                  <button onClick={handleClose}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* 标题 */}
                  <div>
                    <label className="text-sm text-gray-600">标题</label>
                    <input
                      value={form.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      className="mt-1 w-full border rounded-md p-2"
                    />
                  </div>

                  {/* 内容 */}
                  <div>
                    <label className="text-sm text-gray-600">内容</label>
                    <textarea
                      rows={6}
                      value={form.content}
                      onChange={(e) => updateField('content', e.target.value)}
                      className="mt-1 w-full border rounded-md p-2"
                    />
                  </div>

                  {/* 人设 */}
                  <div>
                    <label className="text-sm text-gray-600">人设</label>
                    <select
                      value={form.personaId}
                      onChange={(e) => updateField('personaId', e.target.value)}
                      className="mt-1 w-full border rounded-md p-2"
                    >
                      {personas.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 平台 */}
                  <div>
                    <label className="text-sm text-gray-600">平台</label>
                    <select
                      value={form.platform}
                      onChange={(e) => updateField('platform', e.target.value)}
                      className="mt-1 w-full border rounded-md p-2"
                    >
                      <option value="weitoutiao">微头条</option>
                      <option value="toutiao">今日头条</option>
                      <option value="baijiahao">百家号</option>
                    </select>
                  </div>

                  {/* 提交 */}
                  <button
                    type="submit"
                    className="w-full py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700"
                  >
                    添加文章
                  </button>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}