require('dotenv').config();

// 系统配置文件
module.exports = {

  // 服务器配置
  server: {
    port: process.env.URL || 'http://127.0.0.1:3000',
    env: process.env.NODE_ENV || 'development'
  },
  // 数据库配置
  database: {
    development: {
      username: 'postgres',
      password: 'anqincoder0822',
      database: 'postgres',
      host: 'db.upwzmryloexiwkcynnoz.supabase.co',
      port: 5432,
      dialect: 'postgres',
      logging: false
    },
    test: {
      username: 'postgres',
      password: 'anqincoder0822',
      database: 'postgres',
      host: 'db.upwzmryloexiwkcynnoz.supabase.co',
      port: 5432,
      dialect: 'postgres',
      logging: false
    },
    production: {
      username: 'postgres',
      password: 'anqincoder0822',
      database: 'postgres',
      host: 'db.upwzmryloexiwkcynnoz.supabase.co',
      port: 5432,
      dialect: 'postgres',
      logging: false
    }
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // 微信登录配置
  wechat: {
    appid: process.env.WECHAT_APPID || 'wxfe6971dcfbaa31f5',
    secret: process.env.WECHAT_SECRET || '8f725e53cc52cb6c8399e495197fd0b4',
    loginUrl: 'https://api.weixin.qq.com/sns/jscode2session'
  },

  // AI模型配置
  ai: {
    // 阿里通义千问配置
    qwen: {
      apiKey: process.env.QWEN_API_KEY || 'sk-ba8e92e5e33b4e0ca8e8c0bff83f4f95',
      apiUrl: process.env.QWEN_API_URL || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
    },

    // 其他AI模型配置可以继续添加
    // openai: {
    //   apiKey: process.env.OPENAI_API_KEY || 'your_openai_api_key',
    //   apiUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions'
    // }
  },

  // AI模型与科目映射关系
  aiSubjectMapping: {
    'math': 'qwen', // 数学使用阿里通义千问
    'physics': 'qwen', // 物理使用阿里通义千问
    'chemistry': 'qwen', // 化学使用阿里通义千问
    'biology': 'qwen', // 生物使用阿里通义千问
    'english': 'qwen', // 英语使用阿里通义千问
    'chinese': 'qwen', // 语文使用阿里通义千问
    'history': 'qwen', // 历史使用阿里通义千问
    'geography': 'qwen', // 地理使用阿里通义千问
    'politics': 'qwen', // 政治使用阿里通义千问
    'default': 'qwen' // 默认使用阿里通义千问
  }
};
