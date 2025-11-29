const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../models');

// 获取统计数据 - 使用认证中间件确保数据隔离
router.get('/', authenticate, async (req, res) => {
  const startTime = Date.now();
  
  try {
    // 从认证中间件获取用户ID
    const userId = req.user.userId;
    console.log(`[统计数据] 用户 ${userId} 请求统计数据`);
    
    // 查询用户的所有答题记录 - 严格使用userId过滤，确保数据隔离
    const allRecords = await db.AnswerRecord.findAll({
      where: { 
        userId: userId // 明确指定userId，防止SQL注入和越权访问
      },
      include: [
        {
          model: db.QACard,
          include: [
            {
              model: db.Topic,
              where: { userId: userId }, // 额外验证Topic的所有权
              required: false // 允许关联数据为空
            }
          ],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`[统计数据] 查询到 ${allRecords.length} 条答题记录`);
    
    if (allRecords.length === 0) {
      // 如果没有答题记录，返回空统计数据
      const emptyStats = {
        totalQuestions: 0,
        accuracy: 0,
        averageTime: 0,
        totalStudyTime: 0,
        correctQuestions: 0,
        wrongQuestions: 0,
        trendData: [],
        typeData: [],
        accuracyData: [],
        wrongQuestionsData: [],
        knowledgePointsData: [],
        studyTimeData: []
      };
      
      console.log(`[统计数据] 用户 ${userId} 暂无答题记录，返回空数据`);
      return res.status(200).json(emptyStats);
    }
    
    // 计算核心统计指标
    const validRecords = allRecords.filter(record => record && record.isCorrect !== undefined);
    const totalQuestions = validRecords.length;
    const correctQuestions = validRecords.filter(record => record.isCorrect === true).length;
    const wrongQuestions = totalQuestions - correctQuestions;
    const accuracy = totalQuestions > 0 ? 
      parseFloat(((correctQuestions / totalQuestions) * 100).toFixed(1)) : 0;
    
    // 计算总学习时长（秒）- elapsedTime 是毫秒，需要转换为秒
    const totalStudyTimeMs = validRecords.reduce((sum, record) => {
      return sum + (parseInt(record.elapsedTime) || 0);
    }, 0);
    const totalStudyTime = Math.round(totalStudyTimeMs / 1000); // 转换为秒
    
    // 计算平均答题时间（秒）
    const averageTime = totalQuestions > 0 ? 
      parseFloat((totalStudyTime / totalQuestions).toFixed(1)) : 0;
    
    console.log(`[统计数据] 核心指标计算完成:`, {
      totalQuestions,
      correctQuestions,
      wrongQuestions,
      accuracy: `${accuracy}%`,
      totalStudyTime: `${totalStudyTime}秒`,
      averageTime: `${averageTime}秒`
    });
    
    // 计算学习趋势数据（最近7天）
    const trendData = calculateTrendData(validRecords);
    
    // 计算题型分布（按主题）
    const typeData = calculateTypeData(validRecords);
    
    // 计算正确率分布
    const accuracyData = calculateAccuracyData(validRecords);
    
    // 计算错题分布（按主题）
    const wrongQuestionsData = calculateWrongQuestionsData(validRecords);
    
    // 计算知识点掌握程度（按主题）
    const knowledgePointsData = calculateKnowledgePointsData(validRecords);
    
    // 计算最近7天学习时长
    const studyTimeData = calculateStudyTimeData(validRecords);
    
    const statsData = {
      totalQuestions,
      accuracy,
      averageTime,
      totalStudyTime,
      correctQuestions,
      wrongQuestions,
      trendData,
      typeData,
      accuracyData,
      wrongQuestionsData,
      knowledgePointsData,
      studyTimeData
    };
    
    const queryDuration = Date.now() - startTime;
    console.log(`[统计数据] 用户 ${userId} 统计计算完成，耗时: ${queryDuration}ms`);
    
    res.status(200).json(statsData);
  } catch (error) {
    const queryDuration = Date.now() - startTime;
    console.error('[统计数据] 计算失败:', {
      error: error.message,
      stack: error.stack,
      duration: `${queryDuration}ms`
    });
    res.status(500).json({ message: '获取统计数据失败: ' + error.message });
  }
});

// 计算学习趋势数据（最近7天）
function calculateTrendData(records) {
  const trendMap = {};
  const now = new Date();
  
  // 初始化最近7天的数据
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = formatDate(date);
    trendMap[dateKey] = {
      date: formatDateShort(date),
      questions: 0,
      correct: 0,
      time: 0
    };
  }
  
  // 统计每天的答题数据
  records.forEach(record => {
    if (!record.createdAt) return;
    
    const recordDate = new Date(record.createdAt);
    const dateKey = formatDate(recordDate);
    
    // 只统计最近7天的数据
    const daysDiff = Math.floor((now - recordDate) / (1000 * 60 * 60 * 24));
    if (daysDiff >= 0 && daysDiff < 7) {
      if (trendMap[dateKey]) {
        trendMap[dateKey].questions++;
        if (record.isCorrect) {
          trendMap[dateKey].correct++;
        }
        trendMap[dateKey].time += Math.round((parseInt(record.elapsedTime) || 0) / 1000); // 转换为秒
      }
    }
  });
  
  return Object.values(trendMap);
}

// 计算题型分布（按主题）
function calculateTypeData(records) {
  const typeMap = {};
  
  records.forEach(record => {
    const topicName = record.QACard?.Topic?.topic || '未知主题';
    
    if (!typeMap[topicName]) {
      typeMap[topicName] = {
        type: topicName,
        count: 0,
        correct: 0,
        accuracy: 0
      };
    }
    
    typeMap[topicName].count++;
    if (record.isCorrect) {
      typeMap[topicName].correct++;
    }
  });
  
  // 计算每个主题的正确率
  return Object.values(typeMap).map(item => {
    item.accuracy = item.count > 0 ? 
      parseFloat(((item.correct / item.count) * 100).toFixed(1)) : 0;
    return item;
  }).sort((a, b) => b.count - a.count); // 按答题数量排序
}

// 计算正确率分布
function calculateAccuracyData(records) {
  // 按会话分组计算正确率
  const sessionGroups = {};
  
  records.forEach(record => {
    if (!record.createdAt) return;
    
    const createdAt = new Date(record.createdAt);
    const sessionKey = `${record.topicId}_${Math.floor(createdAt.getTime() / 60000)}`;
    
    if (!sessionGroups[sessionKey]) {
      sessionGroups[sessionKey] = [];
    }
    
    sessionGroups[sessionKey].push(record);
  });
  
  const accuracyRanges = {
    '0-60': 0,
    '61-70': 0,
    '71-80': 0,
    '81-90': 0,
    '91-100': 0
  };
  
  Object.values(sessionGroups).forEach(sessionRecords => {
    if (sessionRecords.length === 0) return;
    
    const correctCount = sessionRecords.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctCount / sessionRecords.length) * 100);
    
    if (accuracy <= 60) {
      accuracyRanges['0-60']++;
    } else if (accuracy <= 70) {
      accuracyRanges['61-70']++;
    } else if (accuracy <= 80) {
      accuracyRanges['71-80']++;
    } else if (accuracy <= 90) {
      accuracyRanges['81-90']++;
    } else {
      accuracyRanges['91-100']++;
    }
  });
  
  return Object.entries(accuracyRanges).map(([range, count]) => ({
    range,
    count
  }));
}

// 计算错题分布（按主题）
function calculateWrongQuestionsData(records) {
  const wrongMap = {};
  
  records.filter(record => !record.isCorrect).forEach(record => {
    const topicName = record.QACard?.Topic?.topic || '未知主题';
    
    if (!wrongMap[topicName]) {
      wrongMap[topicName] = {
        knowledgePoint: topicName,
        count: 0
      };
    }
    
    wrongMap[topicName].count++;
  });
  
  return Object.values(wrongMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // 只返回前10个
}

// 计算知识点掌握程度（按主题）
function calculateKnowledgePointsData(records) {
  const topicMap = {};
  
  records.forEach(record => {
    const topicName = record.QACard?.Topic?.topic || '未知主题';
    
    if (!topicMap[topicName]) {
      topicMap[topicName] = {
        name: topicName,
        total: 0,
        correct: 0,
        mastery: 0
      };
    }
    
    topicMap[topicName].total++;
    if (record.isCorrect) {
      topicMap[topicName].correct++;
    }
  });
  
  // 计算掌握程度（正确率）
  return Object.values(topicMap).map(item => {
    item.mastery = item.total > 0 ? 
      Math.round((item.correct / item.total) * 100) : 0;
    return item;
  }).sort((a, b) => b.mastery - a.mastery); // 按掌握程度排序
}

// 计算最近7天学习时长
function calculateStudyTimeData(records) {
  const timeMap = {};
  const now = new Date();
  
  // 初始化最近7天的数据
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = formatDate(date);
    timeMap[dateKey] = {
      date: formatDateShort(date),
      time: 0
    };
  }
  
  // 统计每天的学习时长（秒）
  records.forEach(record => {
    if (!record.createdAt) return;
    
    const recordDate = new Date(record.createdAt);
    const dateKey = formatDate(recordDate);
    
    const daysDiff = Math.floor((now - recordDate) / (1000 * 60 * 60 * 24));
    if (daysDiff >= 0 && daysDiff < 7) {
      if (timeMap[dateKey]) {
        timeMap[dateKey].time += Math.round((parseInt(record.elapsedTime) || 0) / 1000); // 转换为秒
      }
    }
  });
  
  return Object.values(timeMap);
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 格式化日期为 MM-DD
function formatDateShort(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

module.exports = router;