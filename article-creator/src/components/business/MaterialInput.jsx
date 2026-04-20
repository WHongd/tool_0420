export default function MaterialInput({ value, onChange, maxLength = 500 }) {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="简述你的故事或趣事，比如：周五晚上正在吃火锅，突然收到服务器告警..."
        maxLength={maxLength}
        rows={5}
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 resize-none"
      />
      <div className="absolute bottom-2 right-3 text-xs text-gray-400">
        {value.length}/{maxLength}
      </div>
    </div>
  );
}