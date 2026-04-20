import React, { useEffect, useMemo, useState } from "react";

const defaultForm = {
  name: "",
  role: "",
  intro: "",
  tone: "",
  audience: "",
  prompt: "",
  tags: "",
};

function buildPrompt(values) {
  const sections = [
    values.role ? `角色定位：${values.role}` : "",
    values.intro ? `角色简介：${values.intro}` : "",
    values.tone ? `语气风格：${values.tone}` : "",
    values.audience ? `目标受众：${values.audience}` : "",
  ];

  return sections.filter(Boolean).join("\n");
}

export default function PersonaFormModal({
  open,
  editingPersona,
  onClose,
  onSuccess,
}) {
  const isEdit = useMemo(() => Boolean(editingPersona?.id), [editingPersona]);

  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (editingPersona) {
      setForm({
        name: editingPersona.name || "",
        role: editingPersona.role || "",
        intro: editingPersona.intro || "",
        tone: editingPersona.tone || "",
        audience: editingPersona.audience || "",
        prompt: editingPersona.prompt || "",
        tags: editingPersona.tags || "",
      });
    } else {
      setForm(defaultForm);
    }

    setError("");
    setSaving(false);
  }, [open, editingPersona]);

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAutoGeneratePrompt = () => {
    const nextPrompt = buildPrompt(form);
    updateField("prompt", nextPrompt);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("请输入人设名称");
      return;
    }

    if (!form.role.trim()) {
      setError("请输入角色定位");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...form,
        name: form.name.trim(),
        role: form.role.trim(),
        intro: form.intro.trim(),
        tone: form.tone.trim(),
        audience: form.audience.trim(),
        prompt: form.prompt.trim() || buildPrompt(form),
        tags: form.tags.trim(),
      };

      const url = isEdit ? `/api/personas/${editingPersona.id}` : "/api/personas";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (isEdit ? "更新失败" : "创建失败"));
      }

      if (typeof onSuccess === "function") {
        onSuccess(data);
      }
    } catch (err) {
      setError(err.message || (isEdit ? "更新失败" : "创建失败"));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? "编辑人设" : "新建人设"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              维护人设名称、角色信息和生成提示词
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100"
          >
            关闭
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                人设名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="例如：爆款小红书成长博主"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                角色定位 <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={form.role}
                onChange={(e) => updateField("role", e.target.value)}
                placeholder="例如：一个擅长输出女性成长、自律、情绪疗愈内容的小红书博主"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                人设简介
              </label>
              <textarea
                rows={3}
                value={form.intro}
                onChange={(e) => updateField("intro", e.target.value)}
                placeholder="补充这个角色的背景、特点、擅长表达的方向"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                语气风格
              </label>
              <input
                type="text"
                value={form.tone}
                onChange={(e) => updateField("tone", e.target.value)}
                placeholder="例如：温暖、真诚、有力量"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                目标受众
              </label>
              <input
                type="text"
                value={form.audience}
                onChange={(e) => updateField("audience", e.target.value)}
                placeholder="例如：25-35岁女性成长用户"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                标签
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => updateField("tags", e.target.value)}
                placeholder="多个标签用英文逗号分隔，例如：职场,成长,小红书"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
              />
            </div>

            <div className="md:col-span-2">
              <div className="mb-1 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-gray-700">
                  Prompt
                </label>
                <button
                  type="button"
                  onClick={handleAutoGeneratePrompt}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  根据字段自动生成
                </button>
              </div>

              <textarea
                rows={8}
                value={form.prompt}
                onChange={(e) => updateField("prompt", e.target.value)}
                placeholder="这里填写最终用于生成内容的提示词；如果留空，保存时会根据上面的字段自动生成"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
              />
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              取消
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "保存中..." : isEdit ? "保存修改" : "创建人设"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}