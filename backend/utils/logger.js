/**
 * 统一日志工具
 * 提供标准化的日志格式，便于问题排查与审计
 */

/**
 * 日志级别
 */
const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

/**
 * 格式化日志条目
 * @param {string} level - 日志级别
 * @param {string} category - 日志分类（如：AI请求、认证、数据库等）
 * @param {string} message - 日志消息
 * @param {Object} data - 附加数据
 * @returns {Object} 格式化的日志对象
 */
function formatLogEntry(level, category, message, data = {}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    ...data
  };
}

/**
 * 打印日志
 * @param {string} level - 日志级别
 * @param {string} category - 日志分类
 * @param {string} message - 日志消息
 * @param {Object} data - 附加数据
 */
function log(level, category, message, data = {}) {
  const logEntry = formatLogEntry(level, category, message, data);
  const logString = JSON.stringify(logEntry, null, 2);
  
  switch (level) {
    case LOG_LEVELS.DEBUG:
      console.log(`[${level}]`, logString);
      break;
    case LOG_LEVELS.INFO:
      console.log(`[${level}]`, logString);
      break;
    case LOG_LEVELS.WARN:
      console.warn(`[${level}]`, logString);
      break;
    case LOG_LEVELS.ERROR:
      console.error(`[${level}]`, logString);
      break;
    default:
      console.log(logString);
  }
}

/**
 * 记录AI配置信息
 * @param {Object} aiConfig - AI配置对象
 * @param {Object} requestConfig - 请求配置
 * @param {string} requestId - 请求ID
 */
function logAiConfig(aiConfig, requestConfig, requestId) {
  log(LOG_LEVELS.INFO, 'AI配置', 'AI服务配置信息', {
    requestId,
    config: {
      model: {
        type: aiConfig.model || 'unknown',
        name: aiConfig.model || 'unknown'
      },
      api: {
        endpoint: aiConfig.apiUrl || 'unknown',
        method: requestConfig.method || 'POST'
      },
      timeout: {
        value: requestConfig.timeout || 'unknown',
        unit: 'ms'
      },
      retry: {
        maxRetries: requestConfig.maxRetries || 'unknown',
        baseDelay: requestConfig.baseDelay || 'unknown',
        maxDelay: requestConfig.maxDelay || 'unknown',
        strategy: 'exponential-backoff'
      },
      parameters: {
        temperature: requestConfig.parameters?.temperature || 'unknown',
        top_p: requestConfig.parameters?.top_p || 'unknown',
        max_tokens: requestConfig.parameters?.max_tokens || 'unknown'
      }
    }
  });
}

/**
 * 记录AI请求详细信息
 * @param {Object} requestInfo - 请求信息
 */
function logAiRequest(requestInfo) {
  const {
    requestId,
    userId,
    topic,
    difficulty,
    count,
    subject,
    learningGoals,
    knowledgePoints,
    prompt,
    requestParams,
    timestamp
  } = requestInfo;

  log(LOG_LEVELS.INFO, 'AI请求', '发起AI服务请求', {
    requestId,
    userId,
    timestamp: timestamp || new Date().toISOString(),
    request: {
      topic,
      difficulty,
      count,
      subject,
      learningGoals: learningGoals || '',
      knowledgePoints: knowledgePoints || '',
      promptLength: prompt ? prompt.length : 0,
      promptPreview: prompt ? prompt.substring(0, 200) + '...' : '',
      parameters: requestParams || {}
    }
  });
}

/**
 * 记录AI响应信息
 * @param {Object} responseInfo - 响应信息
 */
function logAiResponse(responseInfo) {
  const {
    requestId,
    success,
    duration,
    statusCode,
    responseSize,
    error,
    retryCount
  } = responseInfo;

  const level = success ? LOG_LEVELS.INFO : LOG_LEVELS.ERROR;
  const message = success ? 'AI服务请求成功' : 'AI服务请求失败';

  log(level, 'AI响应', message, {
    requestId,
    success,
    duration: duration ? `${duration}ms` : 'unknown',
    statusCode: statusCode || 'unknown',
    responseSize: responseSize ? `${(responseSize / 1024).toFixed(2)}KB` : 'unknown',
    retryCount: retryCount || 0,
    error: error ? {
      code: error.code,
      message: error.message,
      responseStatus: error.response?.status,
      responseData: error.response?.data ? JSON.stringify(error.response.data).substring(0, 200) : null
    } : null
  });
}

/**
 * 记录认证信息
 * @param {string} userId - 用户ID
 * @param {string} action - 认证动作（如：success, failed, skipped）
 * @param {Object} details - 详细信息
 * @param {boolean} silent - 是否静默模式（不记录用户ID）
 */
function logAuth(userId, action, details = {}, silent = false) {
  // 静默模式下不记录任何用户相关信息
  if (silent) {
    return;
  }
  
  const level = action === 'success' ? LOG_LEVELS.INFO : 
                action === 'failed' ? LOG_LEVELS.WARN : 
                LOG_LEVELS.DEBUG;
  
  log(level, '认证', `用户认证${action === 'success' ? '成功' : action === 'failed' ? '失败' : '跳过'}`, {
    userId,
    action,
    ...details
  });
}

module.exports = {
  LOG_LEVELS,
  log,
  logAiConfig,
  logAiRequest,
  logAiResponse,
  logAuth,
  formatLogEntry
};

