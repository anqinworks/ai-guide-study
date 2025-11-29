const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticate } = require('../middleware/auth');

// 获取主题历史 - 使用认证中间件确保数据隔离
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    // 获取用户的主题历史 - 严格使用userId过滤
    const topics = await db.Topic.findAll({
      where: { 
        userId: userId // 明确指定userId，确保数据隔离
      },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    res.status(200).json({ topics });
  } catch (error) {
    console.error('Get topic history error:', error);
    res.status(500).json({ message: '获取主题历史失败' });
  }
});

// 获取主题推荐
router.get('/recommend', async (req, res) => {
  try {
    // 模拟热门主题推荐
    const recommendTopics = [
      { id: 1, topic: 'Java基础', difficulty: '简单', cardCount: 10 },
      { id: 2, topic: '脑筋急转弯', difficulty: '困难', cardCount: 15 },
      { id: 4, topic: '奥数', difficulty: '中等', cardCount: 12 },
      { id: 5, topic: '数据结构与算法', difficulty: '困难', cardCount: 18 }
    ];

    res.status(200).json({ topics: recommendTopics });
  } catch (error) {
    console.error('Get topic recommend error:', error);
    res.status(500).json({ message: '获取主题推荐失败' });
  }
});

// 保存主题 - 使用认证中间件确保数据安全
router.post('/save', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { topic, difficulty, cardCount } = req.body;

    // 验证参数
    if (!topic || !difficulty || !cardCount) {
      return res.status(400).json({ message: '参数不全' });
    }

    // 保存主题 - 强制使用认证后的userId
    const savedTopic = await db.Topic.create({
      userId: userId, // 使用认证后的userId，防止伪造
      topic,
      difficulty,
      cardCount
    });

    res.status(200).json({
      success: true,
      message: '主题保存成功',
      topic: savedTopic
    });
  } catch (error) {
    console.error('Save topic error:', error);
    res.status(500).json({ message: '保存主题失败' });
  }
});

module.exports = router;
