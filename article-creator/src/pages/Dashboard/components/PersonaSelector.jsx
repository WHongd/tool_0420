import React from "react";

export default function PersonaSelector({
  persona,
  setPersona,
  personaOptions,
}) {
  return (
    <div className="mt-4 bg-white border rounded-xl p-3">
      <div className="text-xs text-gray-500 mb-2">创作人设</div>

      <div className="flex flex-wrap gap-2">
        {personaOptions.map((item) => {
          const active = persona === item.value;

          return (
            <button
              key={item.value}
              onClick={() => setPersona(item.value)}
              className={`text-xs px-3 py-1.5 rounded-md border transition ${
                active
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}