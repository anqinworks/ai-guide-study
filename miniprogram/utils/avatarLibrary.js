/**
 * 学习相关头像图片库
 * 包含至少20张高质量的学习、教育、知识相关图片
 */

// 学习相关头像图片URL列表
// 注意：实际项目中应该使用真实的图片URL或本地图片路径
const AVATAR_LIBRARY = [
  // 书籍和阅读类
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=200&fit=crop', // 书籍
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', // 阅读
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=200&fit=crop', // 笔记本
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=200&h=200&fit=crop', // 学习笔记
  
  // 科学和数学类
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=200&h=200&fit=crop', // 数学公式
  'https://images.unsplash.com/photo-1532619675605-1ede6c4ed025?w=200&h=200&fit=crop', // 科学实验
  'https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=200&h=200&fit=crop', // 化学
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop', // 物理
  
  // 编程和技术类
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=200&h=200&fit=crop', // 编程
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=200&fit=crop', // 代码
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=200&fit=crop', // 技术
  
  // 艺术和创意类
  'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=200&fit=crop', // 艺术
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&h=200&fit=crop', // 创意
  'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=200&fit=crop', // 设计
  
  // 语言学习类
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=200&h=200&fit=crop', // 语言
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', // 翻译
  
  // 教育和学习场景
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200&h=200&fit=crop', // 学习小组
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop', // 教室
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&h=200&fit=crop', // 在线学习
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=200&h=200&fit=crop', // 学习环境
  
  // 知识探索类
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=200&fit=crop', // 探索
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=200&fit=crop', // 发现
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=200&fit=crop', // 研究
];

/**
 * 根据用户ID获取随机头像
 * 使用用户ID作为种子，确保同一用户始终获得相同头像
 * @param {string|number} userId - 用户ID
 * @returns {string} 头像URL
 */
function getAvatarByUserId(userId) {
  if (!userId) {
    // 如果没有用户ID，返回随机头像
    const randomIndex = Math.floor(Math.random() * AVATAR_LIBRARY.length);
    return AVATAR_LIBRARY[randomIndex];
  }
  
  // 使用用户ID作为种子，确保同一用户始终获得相同头像
  const seed = typeof userId === 'string' 
    ? userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    : userId;
  
  const index = seed % AVATAR_LIBRARY.length;
  return AVATAR_LIBRARY[index];
}

/**
 * 获取随机头像（不基于用户ID）
 * @returns {string} 头像URL
 */
function getRandomAvatar() {
  const randomIndex = Math.floor(Math.random() * AVATAR_LIBRARY.length);
  return AVATAR_LIBRARY[randomIndex];
}

/**
 * 预加载头像图片（用于优化加载速度）
 * @param {string} url - 图片URL
 * @returns {Promise} 加载Promise
 */
function preloadAvatar(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error('Failed to load avatar'));
    img.src = url;
  });
}

/**
 * 批量预加载头像
 * @param {Array<string>} urls - 图片URL数组
 * @returns {Promise} 加载Promise
 */
function preloadAvatars(urls) {
  return Promise.all(urls.map(url => preloadAvatar(url).catch(() => null)));
}

module.exports = {
  AVATAR_LIBRARY,
  getAvatarByUserId,
  getRandomAvatar,
  preloadAvatar,
  preloadAvatars
};

