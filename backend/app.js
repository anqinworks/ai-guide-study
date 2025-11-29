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

const app = express();
const PORT = process.env.PORT || 3000;

// 配置中间件
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['Cross-Origin-Embedder-Policy', 'Cross-Origin-Opener-Policy']
}));

// 添加跨域隔离头以支持 SharedArrayBuffer
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置路由
app.use('/api/user', userRoutes);
app.use('/api/topic', topicRoutes);
app.use('/api/ai-qa', aiQaRoutes);
app.use('/api/answer', answerRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/statistics', statisticsRoutes);

// 健康检查路由
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
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
    app.listen(PORT, () => {
      console.log(`Server is running on http://192.168.1.2:${PORT}`);
    });
  } catch (error) {
    console.error('Server start error:', error);
    process.exit(1);
  }
};

// 启动服务器
startServer();
