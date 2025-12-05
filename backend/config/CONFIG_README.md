# 后端配置文件使用说明

## 概述

`config.js` 是后端应用的统一配置文件，集中管理所有共用配置和重要配置。

## 配置文件位置

`backend/config/config.js`

## 配置项说明

### 1. 服务器配置 (`config.server`)

```javascript
server: {
  port: 3000,              // 服务器端口
  host: '0.0.0.0',         // 服务器地址
  env: 'development',      // 环境变量
  apiPrefix: '/api'        // API路径前缀
}
```

### 2. 数据库配置 (`config.database`)

支持多环境配置（development, test, production），每个环境可配置不同的数据库连接参数。

### 3. JWT配置 (`config.jwt`)

```javascript
jwt: {
  secret: 'your_jwt_secret_key',  // JWT密钥
  expiresIn: '7d'                 // Token过期时间
}
```

### 4. 微信登录配置 (`config.wechat`)

```javascript
wechat: {
  appid: '...',                    // 微信AppID
  secret: '...',                   // 微信Secret
  loginUrl: '...',                 // 微信登录API地址
  timeout: 10000                   // 请求超时时间（毫秒）
}
```

### 5. AI模型配置 (`config.ai`)

```javascript
ai: {
  qwen: {
    apiKey: '...',                 // API密钥
    apiUrl: '...',                 // API地址
    model: 'qwen-turbo',           // 模型名称
    defaultParams: {               // 默认生成参数
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 4048
    },
    retryParams: {                 // 重试生成参数
      temperature: 0.5,
      top_p: 0.9,
      max_tokens: 2048
    }
  }
}
```

### 6. AI模型与科目映射 (`config.aiSubjectMapping`)

配置不同科目使用的AI模型。

### 7. API请求配置 (`config.api`)

```javascript
api: {
  defaultTimeout: 60000,           // 默认超时时间（毫秒）
  ai: {
    baseTimeout: 60000,            // AI API基础超时时间
    perQuestionTimeout: 8000,      // 每道题目的超时时间增量
    maxTimeout: 120000,            // 最大超时时间
    retryTimeoutMultiplier: 0.75   // 重试时的超时时间倍数
  },
  retry: {
    maxRetries: 3,                 // 默认最大重试次数
    baseDelay: 2000,               // 基础延迟（毫秒）
    maxDelay: 10000,               // 最大延迟（毫秒）
    ai: { ... }                    // AI API重试配置
  }
}
```

### 8. 题目生成配置 (`config.question`)

```javascript
question: {
  minCount: 1,                     // 最小卡片数量
  maxCount: 50,                    // 最大卡片数量
  defaultCount: 5,                 // 默认卡片数量
  defaultDifficulty: '中等',       // 默认难度
  difficulties: ['简单', '中等', '困难'], // 可用难度选项
  batchSize: 100                   // 数据库批量保存批次大小
}
```

### 9. 内容验证配置 (`config.validation`)

```javascript
validation: {
  minOverallScore: 0.6,            // 综合得分阈值
  maxRetryCount: 10,               // 触发重新生成的最大题目数量
  minKnowledgeCoverage: 0.8,       // 知识点覆盖率阈值
  minDifficultyMatch: 0.7,         // 难度匹配度阈值
  minTypeMatch: 0.7,               // 题型符合度阈值
  minGoalRelevance: 0.7            // 学习目标相关性阈值
}
```

### 10. 任务管理配置 (`config.task`)

```javascript
task: {
  cleanupInterval: 300000,         // 任务清理间隔（毫秒）
  retentionTime: 300000,           // 任务保留时间（毫秒）
  progress: {
    aiStart: 30,                   // AI生成进度起始值
    aiEnd: 90,                     // AI生成进度结束值
    aiRange: 0.6                   // AI生成进度范围
  }
}
```

### 11. API监控配置 (`config.monitor`)

```javascript
monitor: {
  thresholds: {
    errorRate: 0.3,                // 错误率阈值
    averageResponseTime: 60000,    // 平均响应时间阈值（毫秒）
    timeoutRate: 0.2,              // 超时率阈值
    consecutiveFailures: 3         // 连续失败次数阈值
  },
  performance: {
    responseTimeWarningRatio: 0.8  // 响应时间警告阈值比例
  }
}
```

### 12. 日志配置 (`config.logging`)

```javascript
logging: {
  enableDebug: true,               // 是否启用调试日志
  enablePerformance: false,        // 是否启用性能日志
  jsonErrorPreviewLength: 500,     // JSON解析错误日志预览长度
  aiResponsePreviewLength: 2000    // AI响应内容预览长度
}
```

## 工具方法

### `config.getAiTimeout(questionCount)`

根据题目数量计算AI API超时时间。

**参数：**
- `questionCount` (number): 题目数量

**返回：**
- `number`: 超时时间（毫秒）

**示例：**
```javascript
const timeout = config.getAiTimeout(5); // 返回: 60000 (60秒)
const timeout = config.getAiTimeout(10); // 返回: 80000 (80秒)
```

### `config.getAiRetryTimeout(questionCount)`

根据题目数量计算AI API重试超时时间。

**参数：**
- `questionCount` (number): 题目数量

**返回：**
- `number`: 超时时间（毫秒）

### `config.isDevelopment()`

检查是否为开发环境。

**返回：**
- `boolean`: 是否为开发环境

### `config.isProduction()`

检查是否为生产环境。

**返回：**
- `boolean`: 是否为生产环境

## 使用示例

### 在路由中使用配置

```javascript
// routes/ai-qa.js
const config = require('../config/config');

// 使用AI模型配置
const aiConfig = config.ai.qwen;
const model = aiConfig.model; // 'qwen-turbo'

// 使用超时配置
const timeout = config.getAiTimeout(count);

// 使用验证配置
if (score < config.validation.minOverallScore) {
  // 重新生成
}
```

### 在工具函数中使用配置

```javascript
// utils/apiClient.js
const config = require('../config/config');

// 使用重试配置
const options = {
  maxRetries: config.api.retry.maxRetries,
  baseDelay: config.api.retry.baseDelay,
  timeout: config.api.defaultTimeout
};
```

## 环境变量支持

配置文件支持通过环境变量覆盖默认值：

- `PORT` - 服务器端口
- `NODE_ENV` - 环境变量
- `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_HOST`, `DB_PORT` - 数据库配置
- `JWT_SECRET`, `JWT_EXPIRES_IN` - JWT配置
- `WECHAT_APPID`, `WECHAT_SECRET` - 微信配置
- `QWEN_API_KEY`, `QWEN_API_URL` - AI模型配置

## 已更新的文件

以下文件已更新为使用配置文件：

- ✅ `config/config.js` - 统一配置文件
- ✅ `routes/ai-qa.js` - AI模型配置、超时配置、验证配置
- ✅ `routes/user.js` - 微信登录配置
- ✅ `utils/apiClient.js` - API请求配置、重试配置
- ✅ `utils/apiMonitor.js` - 监控告警配置
- ✅ `utils/taskManager.js` - 任务管理配置
- ✅ `app.js` - 服务器配置

## 注意事项

1. **敏感信息**：API密钥、数据库密码等敏感信息应通过环境变量配置，不要硬编码在配置文件中
2. **环境区分**：使用 `config.server.env` 区分不同环境
3. **配置更新**：修改配置后，确保所有使用该配置的地方都已更新
4. **向后兼容**：修改配置时注意保持向后兼容性

