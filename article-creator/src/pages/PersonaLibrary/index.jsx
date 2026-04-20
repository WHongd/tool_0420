import React, { useEffect, useState } from "react";
import PersonaFormModal from "../../components/PersonaFormModal";

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PersonaLibrary({ onUsePersona }) {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState(null);

  const fetchPersonas = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/personas");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "获取人设失败");
      }

      setPersonas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "获取人设失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  const handleCreate = () => {
    setEditingPersona(null);
    setModalOpen(true);
  };

  const handleEdit = (persona) => {
    setEditingPersona(persona);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("确认删除这个人设吗？");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/personas/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "删除失败");
      }

      await fetchPersonas();
    } catch (err) {
      window.alert(err.message || "删除失败");
    }
  };

  const handleUsePersona = (persona) => {
    if (typeof onUsePersona === "function") {
      onUsePersona(persona);
      return;
    }

    try {
      localStorage.setItem("selectedPersona", JSON.stringify(persona));
      window.alert("已带入人设，可在生成页读取 selectedPersona 使用。");
    } catch (error) {
      console.error(error);
    }
  };

  const handleModalSuccess = async () => {
    setModalOpen(false);
    setEditingPersona(null);
    await fetchPersonas();
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingPersona(null);
  };

  return (
    <div className="min-h-full bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">人设库</h1>
            <p className="mt-1 text-sm text-gray-500">
              展示全部人设，支持快速编辑与带入生成
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            className="shrink-0 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            新建人设
          </button>
        </div>

        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white py-10 text-center text-sm text-gray-500">
            正在加载人设...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && personas.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center text-sm text-gray-500">
            暂无人设，先创建一个吧
          </div>
        )}

        {!loading && !error && personas.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {personas.map((persona) => (
              <div
                key={persona.id}
                className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-gray-900">
                      {persona.name || "未命名人设"}
                    </h3>
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {persona.role || "暂无角色描述"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {persona.tone ? (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                      {persona.tone}
                    </span>
                  ) : null}

                  {persona.audience ? (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                      {persona.audience}
                    </span>
                  ) : null}

                  {persona.tags
                    ? String(persona.tags)
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700"
                          >
                            {tag}
                          </span>
                        ))
                    : null}
                </div>

                <div className="mt-3 text-[11px] text-gray-400">
                  更新于：{formatDateTime(persona.updatedAt)}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleUsePersona(persona)}
                    className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
                  >
                    带入生成
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEdit(persona)}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    编辑
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(persona.id)}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PersonaFormModal
        open={modalOpen}
        editingPersona={editingPersona}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}