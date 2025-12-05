const express = require('express');
const cors = require('cors');
const db = require('./models');

// 导入路由
const userRoutes = require('./routes/user');
const topicRoutes = require('./routes/topic');
const aiQaRoutes = require('./routes/ai-qa');
const answerRoutes = require('./routes/answer');
const reportRoutes = require('./routes/report');
const statisticsRoutes = require('./routes/statistics');
const learningGoalRoutes = require('./routes/learning-goal');

const config = require('./config/config');

const app = express();
const PORT = config.server.port;

// 配置中间件
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['Cross-Origin-Embedder-Policy', 'Cross-Origin-Opener-Policy'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 添加跨域隔离头以支持 SharedArrayBuffer（仅在需要时添加）
app.use((req, res, next) => {
  // 对于POST请求，可能需要更宽松的策略
  if (req.method === 'POST') {
    // 可选：对于POST请求，可以放宽跨域隔离策略
    // res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    // res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  } else {
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  }
  next();
});

// 增加请求体大小限制（默认100kb，增加到10mb以支持大请求）
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 添加请求日志中间件（用于调试）
app.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log(`[POST Request] ${req.method} ${req.path}`, {
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      userAgent: req.headers['user-agent'],
      origin: req.headers['origin'],
      timestamp: new Date().toISOString()
    });
  }
  next();
});

// 配置路由
app.use('/api/user', userRoutes);
app.use('/api/topic', topicRoutes);
app.use('/api/ai-qa', aiQaRoutes);
app.use('/api/answer', answerRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/learning-goal', learningGoalRoutes);

// 健康检查路由
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// POST健康检查路由（用于测试POST请求）
app.post('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    method: 'POST',
    body: req.body,
    headers: req.headers
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('[Server Error]', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    body: req.body,
    headers: req.headers
  });

  // 处理请求体过大错误
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: '请求体过大，请减小请求数据大小'
    });
  }

  // 处理JSON解析错误
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: '请求体格式错误，请检查JSON格式'
    });
  }

  // 默认错误响应
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `路由不存在: ${req.method} ${req.path}`
  });
});

// 同步数据库模型
const syncDatabase = async () => {
  try {
    await db.sequelize.sync({ force: false }); // force: false 表示不强制删除已存在的表
    console.log('Database synced successfully');
  } catch (error) {
    console.error('Database sync error:', error);
    process.exit(1);
  }
};

// 启动服务器
const startServer = async () => {
  try {
    // 同步数据库
    await syncDatabase();
    
    // 启动服务器
    app.listen(PORT, config.server.host, () => {
      const host = config.server.host === '0.0.0.0' ? 'localhost' : config.server.host;
      console.log(`Server is running on http://${host}:${PORT}`);
      console.log(`Environment: ${config.server.env}`);
    });
  } catch (error) {
    console.error('Server start error:', error);
    process.exit(1);
  }
};

// 启动服务器
startServer();
