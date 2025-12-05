# 配置文件使用说明

## 概述

`config.js` 是前端应用的统一配置文件，集中管理所有共用配置和重要配置。

## 配置文件位置

`miniprogram/utils/config.js`

## 配置项说明

### 1. API配置 (`config.api`)

```javascript
api: {
  baseUrl: 'http://localhost:3000',  // 后端API基础地址
  prefix: '/api',                     // API路径前缀
  timeout: 30000,                     // 请求超时时间（毫秒）
  retry: {
    maxRetries: 3,                    // 最大重试次数
    retryDelay: 1000                  // 重试延迟（毫秒）
  }
}
```

**使用方法：**
```javascript
const config = require('../../utils/config')
const apiUrl = config.getApiUrl('/user/info')  // 返回: http://localhost:3000/api/user/info
```

### 2. 认证配置 (`config.auth`)

```javascript
auth: {
  tokenKey: 'token',                  // Token存储键名
  userInfoKey: 'userInfo',            // 用户信息存储键名
  cacheTime: 5 * 60 * 1000,          // 认证缓存时间（5分钟）
  validateEndpoint: '/user/validate', // Token验证接口
  wxLoginEndpoint: '/user/wx-login'   // 微信登录接口
}
```

### 3. 轮询配置 (`config.polling`)

```javascript
polling: {
  progressInterval: 500,              // 进度轮询间隔（毫秒）
  maxPollingCount: 600,               // 最大轮询次数
  timeout: 5 * 60 * 1000              // 轮询超时时间（5分钟）
}
```

### 4. LaTeX渲染配置 (`config.latex`)

```javascript
latex: {
  provider: 'quicklatex',             // 渲染服务提供商
  quicklatex: { ... },                // QuickLaTeX配置
  mathml: { ... },                    // MathML配置
  custom: { ... }                     // 自定义服务配置
}
```

**使用方法：**
```javascript
const config = require('../../utils/config')
const latexUrl = config.getLatexRenderUrl('\\sum_{i=1}^{n} i', false)
```

### 5. 题目生成配置 (`config.question`)

```javascript
question: {
  defaultCardCount: 5,                // 默认卡片数量
  minCardCount: 1,                    // 最小卡片数量
  maxCardCount: 10,                   // 最大卡片数量
  defaultDifficulty: '简单',          // 默认难度
  difficulties: ['简单', '中等', '困难'] // 可用难度选项
}
```

### 6. 数据验证配置 (`config.validation`)

```javascript
validation: {
  goalDescriptionMaxLength: 500,      // 学习目标描述最大长度
  topicNameMaxLength: 100,            // 主题名称最大长度
  knowledgePointsMaxLength: 200      // 知识点范围最大长度
}
```

### 7. 缓存配置 (`config.cache`)

```javascript
cache: {
  statisticsExpiry: 5 * 60 * 1000,    // 统计数据缓存过期时间（5分钟）
  recommendTopicsExpiry: 10 * 60 * 1000 // 推荐主题缓存过期时间（10分钟）
}
```

### 8. UI延迟配置 (`config.ui`)

```javascript
ui: {
  navigationDelay: 500,               // 页面跳转延迟（毫秒）
  errorMessageDelay: 1500,            // 错误提示显示延迟（毫秒）
  successMessageDelay: 500,           // 成功提示显示延迟（毫秒）
  loadingDelay: 300                   // 加载动画延迟（毫秒）
}
```

### 9. 环境配置 (`config.env`)

```javascript
env: {
  current: 'development',             // 当前环境: 'development' | 'production' | 'test'
  enableDebugLog: true,               // 是否启用调试日志
  enablePerformanceMonitor: false     // 是否启用性能监控
}
```

### 10. 错误消息配置 (`config.errorMessages`)

集中管理所有错误提示消息，便于统一维护和多语言支持。

## 工具方法

### `config.getApiUrl(endpoint)`

获取完整的API URL。

**参数：**
- `endpoint` (string): API端点路径

**返回：**
- `string`: 完整的API URL

**示例：**
```javascript
const url = config.getApiUrl('/user/info')
// 返回: http://localhost:3000/api/user/info
```

### `config.getLatexRenderUrl(formula, isBlock)`

获取LaTeX公式渲染URL。

**参数：**
- `formula` (string): LaTeX公式
- `isBlock` (boolean): 是否为块级公式

**返回：**
- `string`: LaTeX渲染URL

### `config.isDevelopment()`

检查是否为开发环境。

**返回：**
- `boolean`: 是否为开发环境

### `config.isProduction()`

检查是否为生产环境。

**返回：**
- `boolean`: 是否为生产环境

## 使用示例

### 在页面中使用配置

```javascript
// pages/example/example.js
const config = require('../../utils/config')

Page({
  data: {
    cardCount: config.question.defaultCardCount,
    maxLength: config.validation.goalDescriptionMaxLength
  },
  
  onLoad() {
    // 使用配置
    if (config.isDevelopment()) {
      console.log('开发环境')
    }
  }
})
```

### 在工具函数中使用配置

```javascript
// utils/example.js
const config = require('./config')

function makeRequest(endpoint, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: config.getApiUrl(endpoint),
      timeout: config.api.timeout,
      // ...
    })
  })
}
```

## 环境切换

### 开发环境

```javascript
env: {
  current: 'development',
  baseUrl: 'http://localhost:3000'
}
```

### 生产环境

```javascript
env: {
  current: 'production',
  baseUrl: 'https://your-domain.com'
}
```

## 注意事项

1. **不要硬编码配置值**：所有配置都应该从 `config.js` 中读取
2. **环境区分**：使用 `config.env.current` 区分不同环境
3. **配置更新**：修改配置后，确保所有使用该配置的地方都已更新
4. **向后兼容**：修改配置时注意保持向后兼容性

## 已更新的文件

以下文件已更新为使用配置文件：

- ✅ `utils/request.js` - API请求配置
- ✅ `app.js` - 应用配置和认证配置
- ✅ `pages/topic-setting/topic-setting.js` - 题目生成配置、轮询配置
- ✅ `pages/answer/answer.js` - UI延迟配置
- ✅ `pages/result/result.js` - UI延迟配置
- ✅ `pages/goal-setting/goal-setting.js` - 验证配置
- ✅ `pages/statistics/statistics.js` - 缓存配置
- ✅ `utils/latexRenderer.js` - LaTeX渲染配置

## 待更新项

以下项可以考虑进一步配置化（如需要）：

- WXML中的硬编码值（如slider的min/max，可通过data动态设置）
- 样式相关的配置（如颜色、字体大小等）
- 页面路径配置

