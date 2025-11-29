const express = require('express');
const router = express.Router();
const db = require('../models');
const { verifyToken } = require('../config/jwt');

// 生成学习报告
router.post('/generate', async (req, res) => {
  try {
    // 从请求头获取token
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }
    
    // 验证token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: '无效的token' });
    }
    
    const { topicId } = req.body;
    
    // 验证参数
    if (!topicId) {
      return res.status(400).json({ message: '缺少topicId参数' });
    }
    
    // 查询该主题下的所有答题记录
    const answerRecords = await db.AnswerRecord.findAll({
      where: {
        userId: decoded.userId,
        topicId
      },
      include: [{ model: db.QACard }]
    });
    
    if (answerRecords.length === 0) {
      return res.status(404).json({ message: '未找到答题记录' });
    }
    
    // 统计答题数据
    const totalQuestions = answerRecords.length;
    const correctAnswers = answerRecords.filter(record => record.isCorrect).length;
    const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
    const totalTime = answerRecords.reduce((sum, record) => sum + record.elapsedTime, 0);
    const wrongQuestions = answerRecords
      .filter(record => !record.isCorrect)
      .map(record => record.qacardId);
    
    // 生成学习建议
    let learningSuggestions = '';
    if (accuracy >= 90) {
      learningSuggestions = '您的表现非常优秀，建议尝试更高难度的题目以进一步提升自己。';
    } else if (accuracy >= 70) {
      learningSuggestions = '您的表现良好，建议重点复习错题，加强薄弱知识点的学习。';
    } else if (accuracy >= 50) {
      learningSuggestions = '您的表现一般，建议系统复习相关知识点，多做练习。';
    } else {
      learningSuggestions = '您的表现有待提高，建议从基础知识点开始学习，逐步提升。';
    }
    
    // 保存学习报告
    const report = await db.LearningReport.create({
      userId: decoded.userId,
      topicId,
      totalQuestions,
      correctAnswers,
      accuracy,
      totalTime,
      wrongQuestions,
      learningSuggestions
    });
    
    res.status(200).json({ report });
  } catch (error) {
    console.error('Generate learning report error:', error);
    res.status(500).json({ message: '生成学习报告失败' });
  }
});

module.exports = router;
