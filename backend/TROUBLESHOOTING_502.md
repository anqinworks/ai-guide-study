# 502 Bad Gateway 错误排查和解决方案

## 问题描述

当通过POST请求访问API时，返回502 Bad Gateway错误，但浏览器直接访问（GET请求）可以正常工作。

**错误信息**：
- Status Code: 502 Bad Gateway
- Remote Address: 127.0.0.1:7890
- Referrer Policy: strict-origin-when-cross-origin

## 问题分析

### 1. 代理问题（最可能的原因）

**Remote Address: 127.0.0.1:7890** 表明请求经过了本地代理服务器（通常是科学上网代理，如Clash、V2Ray等）。

**可能的原因**：
- 代理服务器配置不支持POST请求转发
- 代理服务器对POST请求体大小有限制
- 代理服务器配置了错误的转发规则
- 代理服务器本身出现故障

### 2. 请求体大小限制

Express默认的请求体大小限制是100kb，如果POST请求包含大量数据，可能超过限制。

### 3. CORS和跨域隔离头问题

`Cross-Origin-Embedder-Policy` 和 `Cross-Origin-Opener-Policy` 头可能被代理服务器拒绝或修改。

### 4. 网络配置问题

本地开发环境应该直接访问 `localhost:3000`，不应该经过代理。

## 解决方案

### 方案1：绕过代理（推荐用于本地开发）

#### Windows系统
1. 打开"设置" → "网络和Internet" → "代理"
2. 在"手动代理设置"中，添加以下例外：
   ```
   127.0.0.1;localhost;*.local
   ```

#### macOS系统
1. 打开"系统偏好设置" → "网络" → "高级" → "代理"
2. 在"忽略这些主机和域的代理设置"中添加：
   ```
   127.0.0.1, localhost, *.local
   ```

#### 浏览器设置
- Chrome/Edge: 设置 → 高级 → 系统 → 打开代理设置
- Firefox: 设置 → 网络设置 → 手动代理配置 → 添加例外

### 方案2：配置代理支持POST请求

如果必须使用代理，需要确保代理配置支持POST请求：

#### Clash配置示例
```yaml
# config.yaml
port: 7890
allow-lan: true
mode: rule
log-level: info

# 确保支持所有HTTP方法
```

#### 环境变量配置
```bash
# 设置NO_PROXY环境变量
export NO_PROXY=localhost,127.0.0.1,*.local
```

### 方案3：修改后端配置（已实现）

已对后端进行以下优化：

1. **增加请求体大小限制**：从默认100kb增加到10mb
2. **优化CORS配置**：明确允许POST方法和必要的请求头
3. **添加请求日志**：记录POST请求的详细信息，便于调试
4. **改进错误处理**：提供更详细的错误信息
5. **添加POST健康检查**：`POST /health` 用于测试POST请求

### 方案4：使用直接IP地址

如果代理问题无法解决，可以尝试：

1. 使用本地IP地址而不是localhost
2. 检查 `miniprogram/utils/config.js` 中的 `baseUrl` 配置
3. 确保使用 `http://192.168.x.x:3000` 而不是 `http://localhost:3000`

## 测试步骤

### 1. 测试后端POST接口

```bash
# 测试POST健康检查
curl -X POST http://localhost:3000/health \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# 测试API POST接口
curl -X POST http://localhost:3000/api/user/wx-login \
  -H "Content-Type: application/json" \
  -d '{"code": "test_code", "userInfo": {}}'
```

### 2. 检查后端日志

查看后端控制台输出，确认：
- POST请求是否到达服务器
- 请求体是否正确解析
- 是否有错误信息

### 3. 检查网络请求

在浏览器开发者工具中：
1. 打开"网络"标签
2. 找到失败的POST请求
3. 查看请求详情：
   - 请求URL
   - 请求方法
   - 请求头
   - 请求体
   - 响应状态码
   - 响应头

## 常见错误和解决方法

### 错误1：请求体过大
**症状**：413 Payload Too Large
**解决**：已增加请求体大小限制到10mb

### 错误2：JSON解析错误
**症状**：400 Bad Request，错误信息包含"JSON"
**解决**：检查请求体格式，确保是有效的JSON

### 错误3：CORS错误
**症状**：浏览器控制台显示CORS相关错误
**解决**：已优化CORS配置，确保允许POST请求

### 错误4：代理拒绝连接
**症状**：502 Bad Gateway，Remote Address是代理端口
**解决**：按照方案1配置代理例外

## 预防措施

1. **开发环境配置**：
   - 始终将 `localhost` 和 `127.0.0.1` 添加到代理例外列表
   - 使用环境变量管理API地址

2. **错误监控**：
   - 添加请求日志记录
   - 监控502错误频率
   - 设置告警机制

3. **代码优化**：
   - 限制请求体大小
   - 添加请求验证
   - 提供清晰的错误信息

## 相关文件

- `backend/app.js` - Express服务器配置
- `miniprogram/utils/config.js` - 前端API配置
- `miniprogram/utils/request.js` - 前端请求封装

## 联系支持

如果问题仍然存在，请提供以下信息：
1. 操作系统和版本
2. 使用的代理软件和版本
3. 完整的错误日志
4. 网络请求详情（从浏览器开发者工具）

