/**
 * 性能缓存工具
 * 用于缓存参数解析结果、映射规则等，减少重复计算
 */

const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10分钟缓存

/**
 * 生成缓存键
 */
function generateCacheKey(type, ...args) {
  return `${type}_${args.map(arg => String(arg).replace(/\s+/g, '_')).join('_')}`;
}

/**
 * 获取缓存
 */
function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  
  // 检查是否过期
  if (Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
}

/**
 * 设置缓存
 */
function setCache(key, value) {
  cache.set(key, {
    value,
    timestamp: Date.now()
  });
}

/**
 * 缓存参数解析结果
 */
function cacheParameterParse(learningGoals, knowledgePoints, difficulty) {
  const key = generateCacheKey('parse', learningGoals, knowledgePoints, difficulty);
  let result = getCache(key);
  
  if (!result) {
    const { parseAllParameters } = require('./parameterParser');
    result = parseAllParameters(learningGoals, knowledgePoints, difficulty);
    setCache(key, result);
  }
  
  return result;
}

/**
 * 缓存映射规则
 */
function cacheMappingRules(parsedParams) {
  const key = generateCacheKey('rules', JSON.stringify(parsedParams));
  let result = getCache(key);
  
  if (!result) {
    const { mapParametersToRules } = require('./generationMapper');
    result = mapParametersToRules(parsedParams);
    setCache(key, result);
  }
  
  return result;
}

/**
 * 清除所有缓存
 */
function clearCache() {
  cache.clear();
}

/**
 * 清理过期缓存
 */
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (now - item.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

// 定期清理过期缓存（每5分钟）
setInterval(cleanExpiredCache, 5 * 60 * 1000);

module.exports = {
  getCache,
  setCache,
  cacheParameterParse,
  cacheMappingRules,
  clearCache,
  cleanExpiredCache
};

