require('dotenv').config();

// 系统配置文件
// 集中管理所有共用配置和重要配置

const config = {
  // ==================== 服务器配置 ====================
  server: {
    // 服务器端口
    port: process.env.PORT || 3000,

    // 服务器地址（用于日志输出）
    host: process.env.HOST || '0.0.0.0',

    // 环境变量
    env: process.env.NODE_ENV || 'development',

    // API路径前缀
    apiPrefix: '/api'
  },

  // ==================== 数据库配置 ====================
  database: {
    development: {
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'anqincoder0822',
      database: process.env.DB_NAME || 'postgres',
      host: process.env.DB_HOST || 'db.iroifejpfqurkxkqmpxe.supabase.co',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false
    },
    test: {
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'anqincoder0822',
      database: process.env.DB_NAME || 'postgres',
      host: process.env.DB_HOST || 'db.iroifejpfqurkxkqmpxe.supabase.co',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false
    },
    production: {
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'anqincoder0822',
      database: process.env.DB_NAME || 'postgres',
      host: process.env.DB_HOST || 'db.iroifejpfqurkxkqmpxe.supabase.co',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false
    }
  },

  // ==================== JWT配置 ====================
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // ==================== 微信登录配置 ====================
  wechat: {
    appid: process.env.WECHAT_APPID || 'wxfe6971dcfbaa31f5',
    secret: process.env.WECHAT_SECRET || '8f725e53cc52cb6c8399e495197fd0b4',
    loginUrl: 'https://api.weixin.qq.com/sns/jscode2session',
    timeout: 10000 // 微信API请求超时时间（毫秒）
  },

  // ==================== AI模型配置 ====================
  ai: {
    // 阿里通义千问配置
    qwen: {
      // API密钥
      apiKey: process.env.QWEN_API_KEY || 'sk-cd5ba76c091e464788037b9681563434',

      // API地址
      apiUrl: process.env.QWEN_API_URL || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',

      // 模型名称
      model: 'qwen-plus-2025-01-25',

      // 默认生成参数
      defaultParams: {
        temperature: 0.7,  // 温度参数，控制随机性
        top_p: 0.95,       // 核采样参数
        max_tokens: 4048   // 最大token数
      },

      // 重试生成参数（用于内容质量不足时重新生成）
      retryParams: {
        temperature: 0.5,  // 降低温度，提高一致性
        top_p: 0.9,
        max_tokens: 2048
      }
    }

    // 其他AI模型配置可以继续添加
    // openai: {
    //   apiKey: process.env.OPENAI_API_KEY || 'your_openai_api_key',
    //   apiUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',
    //   model: 'gpt-3.5-turbo',
    //   defaultParams: { ... }
    // }
  },

  // ==================== AI模型与科目映射关系 ====================
  aiSubjectMapping: {
    'math': 'qwen',      // 数学使用阿里通义千问
    'physics': 'qwen',   // 物理使用阿里通义千问
    'chemistry': 'qwen', // 化学使用阿里通义千问
    'biology': 'qwen',   // 生物使用阿里通义千问
    'english': 'qwen',   // 英语使用阿里通义千问
    'chinese': 'qwen',   // 语文使用阿里通义千问
    'history': 'qwen',   // 历史使用阿里通义千问
    'geography': 'qwen', // 地理使用阿里通义千问
    'politics': 'qwen',  // 政治使用阿里通义千问
    'default': 'qwen'    // 默认使用阿里通义千问
  },

  // ==================== API请求配置 ====================
  api: {
    // 默认超时时间（毫秒）
    defaultTimeout: 60000, // 60秒

    // AI API超时配置
    ai: {
      // 基础超时时间（毫秒）
      baseTimeout: 60000, // 60秒

      // 每道题目的超时时间增量（毫秒）
      perQuestionTimeout: 8000, // 8秒/题

      // 最大超时时间（毫秒）
      maxTimeout: 120000, // 120秒（2分钟）

      // 重试时的超时时间倍数（相对于正常超时）
      retryTimeoutMultiplier: 0.75 // 重试时使用75%的超时时间
    },

    // 重试配置
    retry: {
      // 默认最大重试次数
      maxRetries: 3,

      // 基础延迟（毫秒）
      baseDelay: 2000, // 2秒

      // 最大延迟（毫秒）
      maxDelay: 10000, // 10秒

      // AI API重试配置
      ai: {
        maxRetries: 3,
        baseDelay: 2000,
        maxDelay: 10000
      }
    }
  },

  // ==================== 题目生成配置 ====================
  question: {
    // 卡片数量限制
    minCount: 1,   // 最小卡片数量
    maxCount: 50,  // 最大卡片数量（防止恶意请求）

    // 默认配置
    defaultCount: 5,
    defaultDifficulty: '中等',

    // 可用难度选项
    difficulties: ['简单', '中等', '困难'],

    // 批处理配置
    batchSize: 100, // 数据库批量保存时的批次大小

    // 用户等待时间配置（秒）
    waitTime: {
      enabled: process.env.QUESTION_WAIT_ENABLED === 'true' || false, // 是否启用等待时间
      defaultSeconds: parseInt(process.env.QUESTION_WAIT_SECONDS) || 0, // 默认等待时间（秒），0表示不等待
      minSeconds: 0,   // 最小等待时间（秒）
      maxSeconds: 60   // 最大等待时间（秒），防止恶意设置过长等待时间
    }
  },

  // ==================== 内容验证配置 ====================
  validation: {
    // 综合得分阈值（低于此值会触发重新生成）
    minOverallScore: 0.6,

    // 触发重新生成的最大题目数量（超过此数量不重新生成）
    maxRetryCount: 10,

    // 知识点覆盖率阈值
    minKnowledgeCoverage: 0.8, // 至少80%覆盖率

    // 难度匹配度阈值
    minDifficultyMatch: 0.7,

    // 题型符合度阈值
    minTypeMatch: 0.7,

    // 学习目标相关性阈值
    minGoalRelevance: 0.7
  },

  // ==================== 任务管理配置 ====================
  task: {
    // 任务清理间隔（毫秒）
    cleanupInterval: 5 * 60 * 1000, // 5分钟

    // 任务保留时间（毫秒）- 超过此时间的已完成/失败任务会被清理
    retentionTime: 5 * 60 * 1000, // 5分钟

    // 进度更新配置
    progress: {
      // AI生成进度范围（30% - 90%）
      aiStart: 30,
      aiEnd: 90,
      aiRange: 0.6 // 60%的进度范围
    }
  },

  // ==================== API监控配置 ====================
  monitor: {
    // 告警阈值
    thresholds: {
      // 错误率阈值（超过此值触发告警）
      errorRate: 0.3, // 30%

      // 平均响应时间阈值（毫秒）
      averageResponseTime: 60000, // 60秒

      // 超时率阈值
      timeoutRate: 0.2, // 20%

      // 连续失败次数阈值
      consecutiveFailures: 3
    },

    // 性能警告阈值
    performance: {
      // 响应时间警告阈值（相对于超时时间的百分比）
      responseTimeWarningRatio: 0.8 // 80%
    }
  },

  // ==================== 日志配置 ====================
  logging: {
    // 是否启用调试日志
    enableDebug: process.env.NODE_ENV === 'development',

    // 是否启用性能日志
    enablePerformance: false,

    // JSON解析错误日志预览长度
    jsonErrorPreviewLength: 500,

    // AI响应内容预览长度
    aiResponsePreviewLength: 2000
  },

  // ==================== 工具方法 ====================

  /**
   * 获取AI API超时时间
   * @param {number} questionCount - 题目数量
   * @returns {number} - 超时时间（毫秒）
   */
  getAiTimeout(questionCount) {
    const { baseTimeout, perQuestionTimeout, maxTimeout } = config.api.ai;
    const estimatedTimeout = Math.max(baseTimeout, questionCount * perQuestionTimeout);
    return Math.min(estimatedTimeout, maxTimeout);
  },

  /**
   * 获取AI重试超时时间
   * @param {number} questionCount - 题目数量
   * @returns {number} - 超时时间（毫秒）
   */
  getAiRetryTimeout(questionCount) {
    const normalTimeout = config.getAiTimeout(questionCount);
    return Math.floor(normalTimeout * config.api.ai.retryTimeoutMultiplier);
  },

  /**
   * 检查是否为开发环境
   * @returns {boolean}
   */
  isDevelopment() {
    return config.server.env === 'development';
  },

  /**
   * 检查是否为生产环境
   * @returns {boolean}
   */
  isProduction() {
    return config.server.env === 'production';
  }
};

module.exports = config;
