// 文件作用：统一平台常量定义，并兼容旧平台值
export const PLATFORM_NAMES = {
  // 当前标准平台
  weitoutiao: '微头条',
  toutiao: '今日头条',
  baijiahao: '百家号',

  // 兼容历史旧值，避免旧数据展示错乱
  xiaohongshu: '微头条',
  wechat: '今日头条',
  zhihu: '百家号',
};

export const PLATFORM_COLORS = {
  // 当前标准平台
  weitoutiao: '#FF5A5F',
  toutiao: '#FF0000',
  baijiahao: '#3388FF',

  // 兼容历史旧值
  xiaohongshu: '#FF5A5F',
  wechat: '#FF0000',
  zhihu: '#3388FF',
};

export const PLATFORMS = [
  { value: 'weitoutiao', label: '微头条' },
  { value: 'toutiao', label: '今日头条' },
  { value: 'baijiahao', label: '百家号' },
];