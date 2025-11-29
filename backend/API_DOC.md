# 学习An-AI后端API文档

## 1. 接口概述

学习An-AI后端API采用RESTful设计风格，使用JSON格式进行数据交互。所有API请求均需要在请求头中包含Authorization字段，值为Bearer {token}（除了登录接口和主题推荐接口）。

## 2. 基础URL

```
http://192.168.1.2:3000/api
```

## 3. 认证机制

- 使用JWT（JSON Web Token）进行身份认证
- 登录成功后，服务器会返回一个token，有效期为7天
- 后续请求需要在请求头中携带该token

## 4. 错误响应格式

```json
{
  "message": "错误描述"
}
```

## 5. API列表

### 5.1 用户相关接口

#### 5.1.1 微信登录

**接口路径**：`/user/login`

**请求方法**：`POST`

**功能描述**：微信登录，获取用户信息和token

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| code | string | 是 | 微信登录临时凭证 |

**响应数据**：

```json
{
  "token": "string",
  "user": {
    "id": number,
    "openid": "string",
    "nickname": "string",
    "avatar": "string"
  }
}
```

**示例请求**：

```bash
curl -X POST -H "Content-Type: application/json" -d '{"code":"test_code"}' http://192.168.1.2:3000/api/user/login
```

#### 5.1.2 获取用户信息

**接口路径**：`/user/info`

**请求方法**：`GET`

**功能描述**：获取当前登录用户的信息

**请求头**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| Authorization | string | 是 | Bearer {token} |

**响应数据**：

```json
{
  "user": {
    "id": number,
    "openid": "string",
    "nickname": "string",
    "avatar": "string"
  }
}
```

**示例请求**：

```bash
curl -X GET -H "Authorization: Bearer {token}" http://192.168.1.2:3000/api/user/info
```

### 5.2 主题相关接口

#### 5.2.1 获取主题历史

**接口路径**：`/topic/history`

**请求方法**：`GET`

**功能描述**：获取用户的主题历史记录

**请求头**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| Authorization | string | 是 | Bearer {token} |

**响应数据**：

```json
{
  "topics": [
    {
      "id": number,
      "userId": number,
      "topic": "string",
      "difficulty": "string",
      "cardCount": number,
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

**示例请求**：

```bash
curl -X GET -H "Authorization: Bearer {token}" http://192.168.1.2:3000/api/topic/history
```

#### 5.2.2 获取主题推荐

**接口路径**：`/topic/recommend`

**请求方法**：`GET`

**功能描述**：获取热门主题推荐

**响应数据**：

```json
{
  "topics": [
    {
      "id": number,
      "topic": "string",
      "difficulty": "string",
      "cardCount": number
    }
  ]
}
```

**示例请求**：

```bash
curl -X GET http://192.168.1.2:3000/api/topic/recommend
```

#### 5.2.3 保存主题

**接口路径**：`/topic/save`

**请求方法**：`POST`

**功能描述**：保存用户设置的主题

**请求头**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| Authorization | string | 是 | Bearer {token} |

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| topic | string | 是 | 主题内容 |
| difficulty | string | 是 | 难度（简单、中等、困难） |
| cardCount | number | 是 | 卡片数量 |

**响应数据**：

```json
{
  "success": boolean,
  "message": "string",
  "topic": {
    "id": number,
    "userId": number,
    "topic": "string",
    "difficulty": "string",
    "cardCount": number,
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**示例请求**：

```bash
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer {token}" -d '{"topic":"JavaScript基础","difficulty":"简单","cardCount":10}' http://192.168.1.2:3000/api/topic/save
```

### 5.3 AI问答相关接口

#### 5.3.1 生成问答卡片

**接口路径**：`/ai-qa/generate`

**请求方法**：`POST`

**功能描述**：根据主题生成问答卡片

**请求头**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| Authorization | string | 是 | Bearer {token} |

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| topic | string | 是 | 主题内容 |
| difficulty | string | 是 | 难度（简单、中等、困难） |
| count | number | 是 | 卡片数量 |

**响应数据**：

```json
{
  "cards": [
    {
      "id": number,
      "topicId": number,
      "question": "string",
      "options": ["string"],
      "correctAnswer": "string",
      "explanation": "string",
      "difficulty": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

**示例请求**：

```bash
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer {token}" -d '{"topic":"JavaScript基础","difficulty":"简单","count":5}' http://192.168.1.2:3000/api/ai-qa/generate
```

### 5.4 答题相关接口

#### 5.4.1 保存答题记录

**接口路径**：`/answer/save`

**请求方法**：`POST`

**功能描述**：保存用户的答题记录

**请求头**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| Authorization | string | 是 | Bearer {token} |

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| answerData | array | 是 | 答题记录数组 |

**answerData数组项**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| topicId | number | 是 | 主题ID |
| qacardId | number | 是 | 问答卡片ID |
| userAnswer | string | 是 | 用户答案 |
| isCorrect | boolean | 是 | 是否正确 |
| elapsedTime | number | 是 | 答题耗时（秒） |

**响应数据**：

```json
{
  "success": boolean,
  "message": "string"
}
```

**示例请求**：

```bash
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer {token}" -d '{"answerData":[{"topicId":1,"qacardId":1,"userAnswer":"选项A-1","isCorrect":true,"elapsedTime":10},{"topicId":1,"qacardId":2,"userAnswer":"选项B-2","isCorrect":false,"elapsedTime":15}]}' http://192.168.1.2:3000/api/answer/save
```

#### 5.4.2 获取答题结果

**接口路径**：`/answer/result`

**请求方法**：`GET`

**功能描述**：获取答题结果

**请求头**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| Authorization | string | 是 | Bearer {token} |

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | string | 是 | 会话ID |

**响应数据**：

```json
{
  "result": {
    "sessionId": "string",
    "totalQuestions": number,
    "correctAnswers": number,
    "accuracy": number,
    "totalTime": number,
    "wrongQuestions": [number]
  }
}
```

**示例请求**：

```bash
curl -X GET -H "Authorization: Bearer {token}" http://192.168.1.2:3000/api/answer/result?sessionId=test_session
```

### 5.5 学习报告相关接口

#### 5.5.1 生成学习报告

**接口路径**：`/report/generate`

**请求方法**：`POST`

**功能描述**：生成学习报告

**请求头**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| Authorization | string | 是 | Bearer {token} |

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| topicId | number | 是 | 主题ID |

**响应数据**：

```json
{
  "report": {
    "id": number,
    "userId": number,
    "topicId": number,
    "totalQuestions": number,
    "correctAnswers": number,
    "accuracy": number,
    "totalTime": number,
    "wrongQuestions": [number],
    "learningSuggestions": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**示例请求**：

```bash
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer {token}" -d '{"topicId":1}' http://192.168.1.2:3000/api/report/generate
```

## 6. 数据模型

### 6.1 用户模型（User）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | number | 用户ID |
| openid | string | 微信openid |
| nickname | string | 用户昵称 |
| avatar | string | 用户头像 |
| createdAt | date | 创建时间 |
| updatedAt | date | 更新时间 |

### 6.2 主题模型（Topic）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | number | 主题ID |
| userId | number | 用户ID |
| topic | string | 主题内容 |
| difficulty | string | 难度 |
| cardCount | number | 卡片数量 |
| createdAt | date | 创建时间 |
| updatedAt | date | 更新时间 |

### 6.3 问答卡片模型（QACard）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | number | 卡片ID |
| topicId | number | 主题ID |
| question | string | 问题 |
| options | array | 选项 |
| correctAnswer | string | 正确答案 |
| explanation | string | 答案解析 |
| difficulty | string | 难度 |
| createdAt | date | 创建时间 |
| updatedAt | date | 更新时间 |

### 6.4 答题记录模型（AnswerRecord）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | number | 记录ID |
| userId | number | 用户ID |
| topicId | number | 主题ID |
| qacardId | number | 卡片ID |
| userAnswer | string | 用户答案 |
| isCorrect | boolean | 是否正确 |
| answerTime | date | 答题时间 |
| elapsedTime | number | 答题耗时（秒） |
| createdAt | date | 创建时间 |
| updatedAt | date | 更新时间 |

### 6.5 学习报告模型（LearningReport）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | number | 报告ID |
| userId | number | 用户ID |
| topicId | number | 主题ID |
| totalQuestions | number | 总题目数 |
| correctAnswers | number | 正确答案数 |
| accuracy | number | 正确率 |
| totalTime | number | 总耗时（秒） |
| wrongQuestions | array | 错题ID列表 |
| learningSuggestions | string | 学习建议 |
| createdAt | date | 创建时间 |
| updatedAt | date | 更新时间 |

## 7. 开发环境

- Node.js版本：16.x+
- Express版本：4.x+
- Sequelize版本：6.x+
- PostgreSQL版本：13.x+

## 8. 部署说明

1. 安装依赖：`npm install`
2. 启动服务：`npm start`
3. 服务将运行在：`http://192.168.1.2:3000`

## 9. 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2025-11-28 | 初始版本，实现了所有核心功能 |
