/**
 * API调用客户端工具
 * 提供重试机制、错误处理、性能监控等功能
 */

const axios = require('axios');
const apiMonitor = require('./apiMonitor');
const appConfig = require('../config/config');

/**
 * 指数退避延迟计算
 * @param {number} attempt - 当前尝试次数（从0开始）
 * @param {number} baseDelay - 基础延迟（毫秒）
 * @param {number} maxDelay - 最大延迟（毫秒）
 * @returns {number} - 延迟时间（毫秒）
 */

function calculateBackoffDelay(attempt, baseDelay = 1000, maxDelay = 30000) {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // 添加随机抖动，避免所有请求同时重试
  const jitter = Math.random() * 0.3 * delay; // 最多30%的随机抖动
  return Math.floor(delay + jitter);
}

/**
 * 判断错误是否应该重试
 * @param {Error} error - 错误对象
 * @returns {boolean} - 是否应该重试
 */
function shouldRetry(error) {
  if (!error) return false;

  // 网络超时错误
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return true;
  }

  // 网络连接错误
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // 5xx服务器错误（可重试）
  if (error.response) {
    const status = error.response.status;
    if (status >= 500 && status < 600) {
      return true;
    }
    // 429 Too Many Requests
    if (status === 429) {
      return true;
    }
  }

  return false;
}

/**
 * 记录API调用日志
 * @param {Object} logData - 日志数据
 */
function logApiCall(logData) {
  const {
    method = 'POST',
    url,
    attempt,
    maxRetries,
    success,
    duration,
    error,
    requestSize,
    responseSize,
    statusCode
  } = logData;

  const logEntry = {
    timestamp: new Date().toISOString(),
    method,
    url: url ? new URL(url).pathname : 'unknown',
    attempt: attempt + 1,
    maxRetries: maxRetries + 1,
    success,
    duration: duration ? `${duration}ms` : 'N/A',
    requestSize: requestSize ? `${(requestSize / 1024).toFixed(2)}KB` : 'N/A',
    responseSize: responseSize ? `${(responseSize / 1024).toFixed(2)}KB` : 'N/A',
    statusCode: statusCode || 'N/A',
    error: error ? {
      code: error.code,
      message: error.message,
      responseStatus: error.response?.status,
      responseData: error.response?.data ? JSON.stringify(error.response.data).substring(0, 200) : 'N/A'
    } : null
  };

  if (success) {
    console.log('[API调用成功]', JSON.stringify(logEntry, null, 2));
  } else {
    console.error('[API调用失败]', JSON.stringify(logEntry, null, 2));
  }

  // 如果失败且是最后一次尝试，记录完整错误信息
  if (!success && attempt >= maxRetries) {
    console.error('[API调用最终失败]', {
      url,
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : null,
        request: error.config ? {
          method: error.config.method,
          url: error.config.url,
          timeout: error.config.timeout,
          data: error.config.data ? JSON.stringify(error.config.data).substring(0, 500) : null
        } : null
      }
    });
  }
}

/**
 * 带重试机制的API调用
 * @param {Object} config - Axios请求配置
 * @param {Object} options - 重试选项
 * @param {number} options.maxRetries - 最大重试次数（默认3次）
 * @param {number} options.baseDelay - 基础延迟（毫秒，默认1000）
 * @param {number} options.maxDelay - 最大延迟（毫秒，默认30000）
 * @param {number} options.timeout - 请求超时时间（毫秒，默认60000）
 * @param {Function} options.onRetry - 重试回调函数 (attempt, error, delay) => void
 * @param {Function} options.progressCallback - 进度回调函数 (progress, message) => void
 * @returns {Promise} - Axios响应
 */
async function requestWithRetry(requestConfig, options = {}) {
  const {
    maxRetries = appConfig.api.retry.maxRetries,
    baseDelay = appConfig.api.retry.baseDelay,
    maxDelay = appConfig.api.retry.maxDelay,
    timeout = appConfig.api.defaultTimeout,
    onRetry = null,
    progressCallback = null
  } = options;

  // 合并超时配置
  const finalRequestConfig = {
    ...requestConfig,
    timeout: requestConfig.timeout || timeout
  };

  const startTime = Date.now();
  let lastError = null;
  const url = finalRequestConfig.url || (typeof finalRequestConfig === 'string' ? finalRequestConfig : 'unknown');

  // 计算请求大小
  const requestSize = finalRequestConfig.data ? JSON.stringify(finalRequestConfig.data).length : 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // 计算延迟时间
        const delay = calculateBackoffDelay(attempt - 1, baseDelay, maxDelay);
        
        if (progressCallback) {
          progressCallback(
            30 + (attempt * 5), // 30% + 每次重试增加5%
            `请求超时，${delay / 1000}秒后重试 (${attempt}/${maxRetries})...`
          );
        }

        if (onRetry) {
          onRetry(attempt, lastError, delay);
        }

        console.log(`[API重试] 第${attempt}次重试，延迟${delay}ms后执行...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // 执行请求
      const response = await axios(finalRequestConfig);
      const duration = Date.now() - startTime;
      const responseSize = response.data ? JSON.stringify(response.data).length : 0;

      // 记录成功日志
      logApiCall({
        method: finalRequestConfig.method || 'POST',
        url,
        attempt,
        maxRetries,
        success: true,
        duration,
        requestSize,
        responseSize,
        statusCode: response.status
      });

      // 记录到监控系统
      apiMonitor.recordCall({
        success: true,
        duration,
        url,
        statusCode: response.status
      });

      // 性能监控：如果响应时间过长，记录警告
      const warningThreshold = timeout * appConfig.monitor.performance.responseTimeWarningRatio;
      if (duration > warningThreshold) {
        console.warn(`[API性能警告] 请求耗时${duration}ms，接近超时阈值${timeout}ms`);
      }

      return response;

    } catch (error) {
      lastError = error;
      const duration = Date.now() - startTime;

      // 记录失败日志
      logApiCall({
        method: finalRequestConfig.method || 'POST',
        url,
        attempt,
        maxRetries,
        success: false,
        duration,
        requestSize,
        error,
        statusCode: error.response?.status
      });

      // 记录到监控系统（只在最后一次尝试失败时记录，避免重复记录）
      if (attempt >= maxRetries) {
        apiMonitor.recordCall({
          success: false,
          duration,
          url,
          error,
          statusCode: error.response?.status
        });
      }

      // 判断是否应该重试
      const canRetry = attempt < maxRetries && shouldRetry(error);

      if (!canRetry) {
        // 最后一次尝试也失败了，抛出错误
        const errorMessage = buildErrorMessage(error, attempt, maxRetries);
        const enhancedError = new Error(errorMessage);
        enhancedError.originalError = error;
        enhancedError.attempts = attempt + 1;
        enhancedError.duration = duration;
        throw enhancedError;
      }

      // 如果不是超时错误，但可以重试，记录信息
      if (!error.code === 'ECONNABORTED' && !error.message.includes('timeout')) {
        console.log(`[API重试] 遇到可重试错误: ${error.message}，准备重试...`);
      }
    }
  }
}

/**
 * 构建友好的错误消息
 * @param {Error} error - 错误对象
 * @param {number} attempts - 尝试次数
 * @param {number} maxRetries - 最大重试次数
 * @returns {string} - 错误消息
 */
function buildErrorMessage(error, attempts, maxRetries) {
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return `API请求超时：已重试${attempts}次，请检查网络连接或稍后重试`;
  }

  if (error.code === 'ECONNREFUSED') {
    return `无法连接到API服务器，请检查网络连接`;
  }

  if (error.response) {
    const status = error.response.status;
    if (status === 429) {
      return `API请求频率过高，请稍后重试`;
    }
    if (status >= 500) {
      return `API服务器错误 (${status})，已重试${attempts}次，请稍后重试`;
    }
    if (status === 401) {
      return `API认证失败，请检查API密钥`;
    }
    if (status === 403) {
      return `API访问被拒绝，请检查权限`;
    }
    return `API请求失败 (${status}): ${error.response.data?.message || error.message}`;
  }

  return `API请求失败: ${error.message} (已重试${attempts}次)`;
}

/**
 * 健康检查：测试API连接
 * @param {string} apiUrl - API地址
 * @param {Object} headers - 请求头
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<Object>} - 健康检查结果
 */
async function healthCheck(apiUrl, headers = {}, timeout = 5000) {
  try {
    const startTime = Date.now();
    // 发送一个轻量级的请求来测试连接
    const response = await axios.get(apiUrl, {
      headers,
      timeout,
      validateStatus: () => true // 接受任何状态码
    });
    const duration = Date.now() - startTime;

    return {
      healthy: response.status < 500,
      status: response.status,
      duration,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      duration: Date.now() - Date.now(),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  requestWithRetry,
  calculateBackoffDelay,
  shouldRetry,
  logApiCall,
  buildErrorMessage,
  healthCheck
};

