import PersonaSwitcher from '../business/PersonaSwitcher';

export default function Header({
  title = '创作工作台',
  activePersona,
  rightContent,
}) {
  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      {/* 左侧：页面标题 + 当前人设 */}
      <div className="flex items-center space-x-6 min-w-0">
        <h1 className="text-lg font-semibold text-gray-900 shrink-0">
          {title}
        </h1>

        <div className="w-72 max-w-full">
          {activePersona ? (
            <PersonaSwitcher />
          ) : (
            <div className="inline-flex items-center px-3 py-2 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-md">
              暂无人设
            </div>
          )}
        </div>
      </div>

      {/* 右侧：扩展区 */}
      <div className="flex items-center space-x-3 shrink-0">
        {rightContent || (
          <div className="text-sm text-gray-400">未登录</div>
        )}
      </div>
    </header>
  );
}