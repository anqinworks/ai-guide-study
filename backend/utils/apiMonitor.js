/**
 * API性能监控和告警工具
 * 用于跟踪API调用性能指标，并在异常时发出告警
 */

const config = require('../config/config');

/**
 * API调用统计信息
 */
class ApiMonitor {
  constructor() {
    this.stats = {
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
      timeoutCalls: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      recentCalls: [], // 最近100次调用的记录
      errorRate: 0,
      lastError: null,
      lastSuccess: null
    };

    // 告警阈值配置（从配置文件读取）
    this.thresholds = {
      errorRate: config.monitor.thresholds.errorRate,
      averageResponseTime: config.monitor.thresholds.averageResponseTime,
      timeoutRate: config.monitor.thresholds.timeoutRate,
      consecutiveFailures: config.monitor.thresholds.consecutiveFailures
    };

    this.consecutiveFailures = 0;
    this.alerts = []; // 告警历史记录
  }

  /**
   * 记录API调用
   * @param {Object} callInfo - 调用信息
   * @param {boolean} callInfo.success - 是否成功
   * @param {number} callInfo.duration - 响应时间（毫秒）
   * @param {Error} callInfo.error - 错误对象（如果失败）
   * @param {string} callInfo.url - API地址
   * @param {number} callInfo.statusCode - HTTP状态码
   */
  recordCall(callInfo) {
    const { success, duration, error, url, statusCode } = callInfo;

    this.stats.totalCalls++;
    
    if (success) {
      this.stats.successCalls++;
      this.stats.lastSuccess = new Date().toISOString();
      this.consecutiveFailures = 0;
    } else {
      this.stats.failedCalls++;
      this.stats.lastError = {
        message: error?.message || 'Unknown error',
        code: error?.code,
        timestamp: new Date().toISOString()
      };
      this.consecutiveFailures++;

      // 检查是否是超时错误
      if (error && (error.code === 'ECONNABORTED' || error.message?.includes('timeout'))) {
        this.stats.timeoutCalls++;
      }
    }

    // 更新响应时间统计
    if (duration !== undefined && duration !== null) {
      // 更新平均响应时间
      const totalDuration = this.stats.averageResponseTime * (this.stats.totalCalls - 1) + duration;
      this.stats.averageResponseTime = totalDuration / this.stats.totalCalls;

      // 更新最大和最小响应时间
      if (duration > this.stats.maxResponseTime) {
        this.stats.maxResponseTime = duration;
      }
      if (duration < this.stats.minResponseTime) {
        this.stats.minResponseTime = duration;
      }
    }

    // 更新错误率
    this.stats.errorRate = this.stats.failedCalls / this.stats.totalCalls;

    // 记录最近100次调用
    this.stats.recentCalls.push({
      success,
      duration,
      timestamp: new Date().toISOString(),
      url: url ? new URL(url).pathname : 'unknown',
      statusCode
    });

    // 只保留最近100次调用记录
    if (this.stats.recentCalls.length > 100) {
      this.stats.recentCalls.shift();
    }

    // 检查是否需要发出告警
    this.checkAlerts();
  }

  /**
   * 检查告警条件
   */
  checkAlerts() {
    const alerts = [];

    // 检查错误率
    if (this.stats.errorRate > this.thresholds.errorRate) {
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        message: `API错误率过高: ${(this.stats.errorRate * 100).toFixed(1)}% (阈值: ${this.thresholds.errorRate * 100}%)`,
        severity: 'warning',
        timestamp: new Date().toISOString()
      });
    }

    // 检查平均响应时间
    if (this.stats.averageResponseTime > this.thresholds.averageResponseTime) {
      alerts.push({
        type: 'SLOW_RESPONSE',
        message: `API平均响应时间过长: ${(this.stats.averageResponseTime / 1000).toFixed(1)}秒 (阈值: ${this.thresholds.averageResponseTime / 1000}秒)`,
        severity: 'warning',
        timestamp: new Date().toISOString()
      });
    }

    // 检查超时率
    const timeoutRate = this.stats.timeoutCalls / this.stats.totalCalls;
    if (timeoutRate > this.thresholds.timeoutRate) {
      alerts.push({
        type: 'HIGH_TIMEOUT_RATE',
        message: `API超时率过高: ${(timeoutRate * 100).toFixed(1)}% (阈值: ${this.thresholds.timeoutRate * 100}%)`,
        severity: 'error',
        timestamp: new Date().toISOString()
      });
    }

    // 检查连续失败
    if (this.consecutiveFailures >= this.thresholds.consecutiveFailures) {
      alerts.push({
        type: 'CONSECUTIVE_FAILURES',
        message: `API连续失败${this.consecutiveFailures}次`,
        severity: 'error',
        timestamp: new Date().toISOString()
      });
    }

    // 记录告警
    if (alerts.length > 0) {
      this.alerts.push(...alerts);
      // 只保留最近50条告警
      if (this.alerts.length > 50) {
        this.alerts = this.alerts.slice(-50);
      }

      // 输出告警日志
      alerts.forEach(alert => {
        if (alert.severity === 'error') {
          console.error(`[API告警] ${alert.type}: ${alert.message}`);
        } else {
          console.warn(`[API告警] ${alert.type}: ${alert.message}`);
        }
      });
    }
  }

  /**
   * 获取统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      timeoutRate: this.stats.totalCalls > 0 ? this.stats.timeoutCalls / this.stats.totalCalls : 0,
      successRate: this.stats.totalCalls > 0 ? this.stats.successCalls / this.stats.totalCalls : 0,
      recentAlerts: this.alerts.slice(-10) // 最近10条告警
    };
  }

  /**
   * 重置统计信息
   */
  reset() {
    this.stats = {
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
      timeoutCalls: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      recentCalls: [],
      errorRate: 0,
      lastError: null,
      lastSuccess: null
    };
    this.consecutiveFailures = 0;
    this.alerts = [];
  }

  /**
   * 获取健康状态
   * @returns {Object} - 健康状态
   */
  getHealthStatus() {
    const stats = this.getStats();
    const isHealthy = 
      stats.errorRate < this.thresholds.errorRate &&
      stats.averageResponseTime < this.thresholds.averageResponseTime &&
      stats.timeoutRate < this.thresholds.timeoutRate &&
      this.consecutiveFailures < this.thresholds.consecutiveFailures;

    return {
      healthy: isHealthy,
      stats,
      recommendations: this.getRecommendations()
    };
  }

  /**
   * 获取优化建议
   * @returns {Array} - 建议列表
   */
  getRecommendations() {
    const recommendations = [];
    const stats = this.getStats();

    if (stats.errorRate > 0.1) {
      recommendations.push('错误率较高，建议检查网络连接和API服务状态');
    }

    if (stats.averageResponseTime > 30000) {
      recommendations.push('响应时间较长，建议优化请求参数或考虑使用更快的模型');
    }

    if (stats.timeoutRate > 0.1) {
      recommendations.push('超时率较高，建议增加超时时间或减少请求复杂度');
    }

    if (this.consecutiveFailures >= 2) {
      recommendations.push('连续失败，建议检查API服务是否正常运行');
    }

    return recommendations;
  }
}

// 创建全局监控实例
const apiMonitor = new ApiMonitor();

module.exports = apiMonitor;

