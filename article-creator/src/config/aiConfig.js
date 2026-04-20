// src/config/aiConfig.js

// 选择使用哪个服务：'deepseek' 或 'doubao'
export const AI_SERVICE = 'deepseek'; // 或 'doubao'

// DeepSeek 配置
export const DEEPSEEK_CONFIG = {
  apiKey: import.meta.env.sk-dd1ccdb8384c4f92ad7ed7c2a6a162e9,  // 替换为真实密钥
  baseUrl: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat',
};

// 豆包配置（待您提供后填入）
export const DOUBAO_CONFIG = {
  apiKey: 'your-doubao-api-key-here',
  baseUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', // 示例 URL
  model: 'doubao-pro-32k', // 示例模型名
};