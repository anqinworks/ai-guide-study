# 学习An-AI问答引导式学习微信小程序 - 技术架构文档

## 1. 系统总体架构设计

学习An-AI微信小程序采用前后端分离的架构设计，主要分为三个层次：

- **前端层**：微信小程序客户端，负责用户界面展示和交互
- **后端层**：Node.js服务器，负责业务逻辑处理和API接口提供
- **AI服务层**：调用第三方AI接口，负责生成问答内容
- **数据层**：Supabase(PostgreSQL). 链接信息：postgresql://postgres:anqincoder0822@db.iroifejpfqurkxkqmpxe.supabase.co:5432/postgres

## 2. 技术栈选型

### 2.1 前端技术栈

| 技术/框架 | 版本 | 用途 |
|---------|------|------|
| 微信小程序原生框架 | 最新稳定版 | 小程序开发基础框架 |
| WXML | - | 页面结构描述 |
| WXSS | - | 页面样式描述 |
| JavaScript | ES6+ | 业务逻辑实现 |
| wx.request | - | 网络请求 |
| 微信登录API | - | 用户身份认证 |

### 2.2 后端技术栈

| 技术/框架 | 版本 | 用途 |
|---------|------|------|
| Node.js | 16.x+ | 后端运行环境 |
| Express | 4.x+ | Web框架 |
| Mongoose | 6.x+ | MongoDB ODM |
| Axios | 0.27.x+ | HTTP客户端，调用AI接口 |
| JWT | 8.x+ | 用户身份验证 |

### 2.3 数据库

| 数据库 |  | 用途Supabase(PostgreSQL). 链接信息：postgresql://postgres:anqincoder0822@db.iroifejpfqurkxkqmpxe.supabase.co:5432/postgres |
|-------|------|------|
|  |  | 存储用户数据、问答内容、学习记录等 |

### 2.4 AI服务

| AI服务 | 用途 |
|-------|------|
|  |  |
| 阿里通义千问 | 生成问答内容 |

### 2.5 开发工具

| 工具 | 用途 |
|-----|------|
| 微信开发者工具 | 小程序开发、调试、预览 |
| VS Code | 后端代码开发 |
| Postman | API测试 |
| Supabase(PostgreSQL). 链接信息：postgresql://postgres:anqincoder0822@db.iroifejpfqurkxkqmpxe.supabase.co:5432/postgres | 数据库管理 |

## 3. 模块划分

### 3.1 前端模块划分

| 模块名称 | 主要功能 | 文件位置 |
|---------|---------|---------|
| 首页模块 | 主题输入、热门主题推荐 | pages/index/ |
| 主题设置模块 | 主题确认、难度设置、卡片数量设置 | pages/topic-setting/ |
| 答题模块 | 问题展示、选项选择、答案提交 | pages/answer/ |
| 结果展示模块 | 答题结果、答案解析 | pages/result/ |
| 学习报告模块 | 学习统计、错题集、学习建议 | pages/report/ |
| 用户中心模块 | 用户信息、学习历史 | pages/user/ |
| 公共组件模块 | 通用组件（如卡片、按钮、加载动画等） | components/ |
| 工具函数模块 | 通用工具函数 | utils/ |
| 网络请求模块 | API请求封装 | utils/request.js |

### 3.2 后端模块划分

| 模块名称 | 主要功能 | 文件位置 |
|---------|---------|---------|
| 用户模块 | 用户注册、登录、信息管理 | routes/user.js |
| 主题模块 | 主题管理、历史记录 | routes/topic.js |
| AI问答模块 | 调用AI接口生成问答内容 | routes/ai-qa.js |
| 答题模块 | 答题记录、结果统计 | routes/answer.js |
| 学习报告模块 | 学习数据统计、报告生成 | routes/report.js |
| 模型模块 | 数据库模型定义 | models/ |

## 4. 接口设计

### 4.1 用户相关接口

| 接口路径 | 方法 | 功能描述 | 请求参数 | 响应数据 |
|---------|------|---------|---------|---------|
| /api/user/login | POST | 微信登录 | code: string | { token: string, user: object } |
| /api/user/info | GET | 获取用户信息 | - | { user: object } |

### 4.2 主题相关接口

| 接口路径 | 方法 | 功能描述 | 请求参数 | 响应数据 |
|---------|------|---------|---------|---------|
| /api/topic/history | GET | 获取主题历史 | - | { topics: array } |
| /api/topic/recommend | GET | 获取主题推荐 | - | { topics: array } |
| /api/topic/save | POST | 保存主题 | topic: string | { success: boolean, message: string } |

### 4.3 AI问答相关接口

| 接口路径 | 方法 | 功能描述 | 请求参数 | 响应数据 |
|---------|------|---------|---------|---------|
| /api/ai-qa/generate | POST | 生成问答卡片 | topic: string, difficulty: string, count: number | { cards: array } |

### 4.4 答题相关接口

| 接口路径 | 方法 | 功能描述 | 请求参数 | 响应数据 |
|---------|------|---------|---------|---------|
| /api/answer/save | POST | 保存答题记录 | answerData: object | { success: boolean, message: string } |
| /api/answer/result | GET | 获取答题结果 | sessionId: string | { result: object } |

### 4.5 学习报告相关接口

| 接口路径 | 方法 | 功能描述 | 请求参数 | 响应数据 |
|---------|------|---------|---------|---------|
| /api/report/generate | POST | 生成学习报告 | sessionId: string | { report: object } |

## 5. 数据流程图

### 5.1 主题设置与问答生成流程

```
用户输入主题 → 小程序前端 → 后端API → 调用AI接口 → 生成问答内容 → 后端处理 → 返回问答卡片 → 小程序前端展示
```

### 5.2 答题流程

```
用户选择答案 → 小程序前端 → 后端API → 验证答案 → 保存答题记录 → 返回结果 → 小程序前端展示结果
```

### 5.3 学习报告生成流程

```
用户完成答题 → 小程序前端 → 后端API → 统计答题数据 → 生成学习报告 → 保存报告 → 返回报告 → 小程序前端展示报告
```

## 6. 数据模型设计

### 6.1 用户模型（User）

```javascript
{
  _id: ObjectId,
  openid: String,           // 微信openid
  nickname: String,         // 用户昵称
  avatar: String,           // 用户头像
  createdAt: Date,          // 创建时间
  updatedAt: Date           // 更新时间
}
```

### 6.2 主题模型（Topic）

```javascript
{
  _id: ObjectId,
  userId: ObjectId,         // 关联用户ID
  topic: String,            // 主题内容
  createdAt: Date,          // 创建时间
  difficulty: String,       // 难度
  cardCount: Number         // 卡片数量
}
```

### 6.3 问答卡片模型（QACard）

```javascript
{
  _id: ObjectId,
  topicId: ObjectId,        // 关联主题ID
  question: String,         // 问题
  options: [String],        // 选项
  correctAnswer: String,    // 正确答案
  explanation: String,      // 答案解析
  difficulty: String,       // 难度
  createdAt: Date           // 创建时间
}
```

### 6.4 答题记录模型（AnswerRecord）

```javascript
{
  _id: ObjectId,
  userId: ObjectId,         // 关联用户ID
  topicId: ObjectId,        // 关联主题ID
  qacardId: ObjectId,       // 关联问答卡片ID
  userAnswer: String,       // 用户答案
  isCorrect: Boolean,       // 是否正确
  answerTime: Date,         // 答题时间
  elapsedTime: Number       // 答题耗时（秒）
}
```

### 6.5 学习报告模型（LearningReport）

```javascript
{
  _id: ObjectId,
  userId: ObjectId,         // 关联用户ID
  topicId: ObjectId,        // 关联主题ID
  totalQuestions: Number,   // 总题目数
  correctAnswers: Number,   // 正确答案数
  accuracy: Number,         // 正确率
  totalTime: Number,        // 总耗时（秒）
  wrongQuestions: [ObjectId], // 错题ID列表
  learningSuggestions: String, // 学习建议
  createdAt: Date           // 创建时间
}
```

## 7. 安全策略

### 7.1 数据安全

- **数据加密**：敏感数据在传输和存储过程中进行加密
- **HTTPS**：所有API接口使用HTTPS协议，确保数据传输安全

### 7.2 用户认证与授权

- **微信登录**：使用微信官方登录API，确保用户身份真实性
- **JWT认证**：后端使用JWT进行用户身份验证

## 8. 性能优化方案

### 8.1 前端优化

- **小程序分包加载**：将小程序代码分为主包和分包，减少主包大小，提高加载速度
- **缓存策略**：合理使用小程序缓存，减少网络请求
- **减少重渲染**：优化数据绑定和页面渲染逻辑，减少不必要的重渲染

### 8.2 后端优化

- **接口响应优化**：优化数据库查询，减少接口响应时间
- **异步处理**：使用异步编程，提高并发处理能力

### 8.3 数据库优化

- **索引优化**：为常用查询字段添加索引，提高查询速度

### 8.4 AI接口优化

- **请求缓存**：对相同主题和参数的AI请求进行缓存，减少重复调用
- **异步调用**：异步调用AI接口，避免阻塞主线程

## 9. 开发与测试流程

### 9.1 开发流程

1. **需求分析**：根据PRD理解需求
2. **技术设计**：设计技术方案和接口
3. **编码实现**：前后端并行开发
4. **单元测试**：编写单元测试，确保功能正确性
5. **集成测试**：进行前后端集成测试
6. **系统测试**：进行系统级测试
7. **验收测试**：根据PRD进行验收测试

### 9.2 测试方法

- **功能测试**：测试各功能模块是否正常工作
- **性能测试**：测试系统性能，如响应时间等
- **兼容性测试**：测试小程序在不同设备和微信版本上的兼容性
- **用户体验测试**：测试用户体验，如界面美观度、操作流畅性等
