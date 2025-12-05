/**
 * 应用配置文件
 * 集中管理所有共用配置和重要配置
 */

const config = {
  // ==================== API配置 ====================
  api: {
    // 后端API基础地址
    // 开发环境: http://localhost:3000
    // 生产环境: https://your-domain.com
    baseUrl: 'http://localhost:3000',

    // API路径前缀
    prefix: '/api',

    // 完整的API基础URL（自动拼接）
    get baseApiUrl() {
      return `${this.baseUrl}${this.prefix}`;
    },

    // 请求超时时间（毫秒）
    timeout: 60000, // 30秒

    // 请求重试配置
    retry: {
      maxRetries: 3, // 最大重试次数
      retryDelay: 1000, // 重试延迟（毫秒）
    }
  },

  // ==================== 认证配置 ====================
  auth: {
    // Token存储键名
    tokenKey: 'token',

    // 用户信息存储键名
    userInfoKey: 'userInfo',

    // 认证缓存时间（毫秒）
    cacheTime: 5 * 60 * 1000, // 5分钟

    // Token验证接口
    validateEndpoint: '/user/validate',

    // 微信登录接口
    wxLoginEndpoint: '/user/wx-login'
  },

  // ==================== 轮询配置 ====================
  polling: {
    // 进度轮询间隔（毫秒）
    progressInterval: 500,

    // 最大轮询次数（防止无限轮询）
    maxPollingCount: 600, // 5分钟（500ms * 600 = 300秒）

    // 轮询超时时间（毫秒）
    timeout: 5 * 60 * 1000 // 5分钟
  },

  // ==================== LaTeX渲染配置 ====================
  latex: {
    // LaTeX渲染服务提供商
    // 可选值: 'quicklatex', 'mathml', 'custom'
    provider: 'quicklatex',

    // QuickLaTeX API配置
    quicklatex: {
      baseUrl: 'https://quicklatex.com/latex3.f',
      params: {
        fsize: '20px', // 字体大小
        fcolor: '000000', // 字体颜色（黑色）
        mode: 0, // 渲染模式
        out: 1, // 输出格式
        remhost: 'quicklatex.com'
      }
    },

    // MathML API配置
    mathml: {
      baseUrl: 'https://api.mathml.cloud/api/v1/mathml'
    },

    // 自定义服务配置
    custom: {
      baseUrl: '', // 自定义服务地址
      endpoint: '/latex/render'
    }
  },

  // ==================== 题目生成配置 ====================
  question: {
    // 默认卡片数量
    defaultCardCount: 5,

    // 最小卡片数量
    minCardCount: 1,

    // 最大卡片数量
    maxCardCount: 10,

    // 默认难度
    defaultDifficulty: '中等',

    // 可用难度选项
    difficulties: ['简单', '中等', '困难']
  },

  // ==================== 数据验证配置 ====================
  validation: {
    // 学习目标描述最大长度
    goalDescriptionMaxLength: 500,

    // 主题名称最大长度
    topicNameMaxLength: 100,

    // 知识点范围最大长度
    knowledgePointsMaxLength: 200
  },

  // ==================== 缓存配置 ====================
  cache: {
    // 统计数据缓存过期时间（毫秒）
    statisticsExpiry: 5 * 60 * 1000, // 5分钟

    // 推荐主题缓存过期时间（毫秒）
    recommendTopicsExpiry: 10 * 60 * 1000, // 10分钟
  },

  // ==================== UI延迟配置 ====================
  ui: {
    // 页面跳转延迟（毫秒）
    navigationDelay: 500,

    // 错误提示显示延迟（毫秒）
    errorMessageDelay: 1500,

    // 成功提示显示延迟（毫秒）
    successMessageDelay: 500,

    // 加载动画延迟（毫秒）
    loadingDelay: 300
  },

  // ==================== 分页配置 ====================
  pagination: {
    // 默认每页数量
    defaultPageSize: 10,

    // 每页数量选项
    pageSizeOptions: [10, 20, 50, 100]
  },

  // ==================== 环境配置 ====================
  env: {
    // 当前环境
    // 可选值: 'development', 'production', 'test'
    current: 'development',

    // 是否启用调试日志
    enableDebugLog: true,

    // 是否启用性能监控
    enablePerformanceMonitor: false
  },

  // ==================== 错误消息配置 ====================
  errorMessages: {
    network: {
      timeout: '网络请求超时，请检查网络连接',
      connectionRefused: '服务器连接失败，请检查服务器是否运行',
      networkError: '网络连接异常，请检查网络设置',
      default: '网络请求失败，请稍后重试'
    },
    auth: {
      unauthorized: '未授权，请先登录',
      tokenExpired: '登录已过期，请重新登录',
      loginFailed: '登录失败，请重试'
    },
    api: {
      serverError: '服务器错误，请稍后重试',
      notFound: '请求的资源不存在',
      badRequest: '请求参数错误'
    }
  },

  // ==================== 工具方法 ====================

  /**
   * 获取完整的API URL
   * @param {string} endpoint - API端点
   * @returns {string} - 完整的API URL
   */
  getApiUrl(endpoint) {
    // 确保endpoint以/开头
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${config.api.baseApiUrl}${path}`;
  },

  /**
   * 获取LaTeX渲染URL
   * @param {string} formula - LaTeX公式
   * @param {boolean} isBlock - 是否为块级公式
   * @returns {string} - LaTeX渲染URL
   */
  getLatexRenderUrl(formula, isBlock = false) {
    const provider = config.latex.provider;

    switch (provider) {
      case 'quicklatex':
        const params = new URLSearchParams({
          formula: formula,
          ...config.latex.quicklatex.params
        });
        return `${config.latex.quicklatex.baseUrl}?${params.toString()}`;

      case 'mathml':
        return `${config.latex.mathml.baseUrl}?latex=${encodeURIComponent(formula)}`;

      case 'custom':
        return `${config.latex.custom.baseUrl}${config.latex.custom.endpoint}?formula=${encodeURIComponent(formula)}&block=${isBlock}`;

      default:
        console.warn(`未知的LaTeX渲染提供商: ${provider}`);
        return '';
    }
  },

  /**
   * 检查是否为开发环境
   * @returns {boolean}
   */
  isDevelopment() {
    return config.env.current === 'development';
  },

  /**
   * 检查是否为生产环境
   * @returns {boolean}
   */
  isProduction() {
    return config.env.current === 'production';
  }
};

// 导出配置对象
module.exports = config;

