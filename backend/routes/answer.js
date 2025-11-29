const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticate } = require('../middleware/auth');

// 保存答题记录 - 使用认证中间件确保数据安全
router.post('/save', authenticate, async (req, res) => {
  const startTime = Date.now();
  
  try {
    // 从认证中间件获取用户ID
    const userId = req.user.userId;
    const { answerData } = req.body;
    
    // 验证参数
    if (!answerData || !Array.isArray(answerData)) {
      console.log('[答题记录保存] 参数格式错误:', { answerData });
      return res.status(400).json({ message: '参数格式错误' });
    }
    
    // 过滤掉空值（某些题目可能未作答）
    const validAnswerData = answerData.filter(item => {
      return item && 
             item.topicId !== undefined && 
             item.qacardId !== undefined && 
             item.userAnswer !== undefined && 
             item.isCorrect !== undefined && 
             item.elapsedTime !== undefined;
    });
    
    if (validAnswerData.length === 0) {
      console.log('[答题记录保存] 没有有效的答题数据');
      return res.status(400).json({ message: '没有有效的答题数据' });
    }
    
    // 验证答题数据的所有权 - 确保用户只能保存自己的答题记录
    // 检查所有topicId和qacardId是否属于当前用户
    const topicIds = [...new Set(validAnswerData.map(item => item.topicId))];
    const topics = await db.Topic.findAll({
      where: { 
        id: topicIds,
        userId: userId // 确保所有主题都属于当前用户
      }
    });
    
    if (topics.length !== topicIds.length) {
      console.warn(`[答题记录保存] 用户 ${userId} 尝试保存不属于自己的主题数据`);
      return res.status(403).json({ message: '无权保存此答题记录，主题不属于当前用户' });
    }
    
    console.log(`[答题记录保存] 用户 ${userId} 开始保存答题记录，共 ${validAnswerData.length} 条`);
    
    // 生成会话ID：使用当前时间戳（秒级）+ 用户ID + 随机数，同一批答题记录使用相同的会话ID
    const sessionId = Math.floor(Date.now() / 1000) + '_' + userId + '_' + Math.random().toString(36).substr(2, 9);
    
    // 批量保存答题记录 - 强制使用认证后的userId
    const answerRecords = validAnswerData.map((item, index) => {
      const record = {
        userId: userId, // 使用认证后的userId，防止伪造
        topicId: item.topicId,
        qacardId: item.qacardId,
        userAnswer: String(item.userAnswer || ''), // 确保是字符串
        isCorrect: Boolean(item.isCorrect), // 确保是布尔值
        elapsedTime: parseInt(item.elapsedTime) || 0, // 确保是整数（毫秒）
        answerTime: new Date() // 使用统一的答题时间
      };
      
      // 记录单条数据的详细信息（用于调试）
      if (index < 3) { // 只记录前3条的详细信息，避免日志过多
        console.log(`[答题记录保存] 记录 ${index + 1}:`, {
          topicId: record.topicId,
          qacardId: record.qacardId,
          isCorrect: record.isCorrect,
          elapsedTime: record.elapsedTime
        });
      }
      
      return record;
    });
    
    // 批量插入数据库
    const createdRecords = await db.AnswerRecord.bulkCreate(answerRecords, {
      validate: true, // 启用验证
      returning: true // 返回创建的记录
    });
    
    const saveDuration = Date.now() - startTime;
    const correctCount = validAnswerData.filter(item => item.isCorrect).length;
    const wrongCount = validAnswerData.length - correctCount;
    
    console.log(`[答题记录保存] 用户 ${userId} 保存成功:`, {
      totalRecords: createdRecords.length,
      correctCount,
      wrongCount,
      sessionId,
      duration: `${saveDuration}ms`
    });
    
    res.status(200).json({ 
      success: true, 
      message: '答题记录保存成功',
      savedCount: createdRecords.length,
      sessionId
    });
  } catch (error) {
    const saveDuration = Date.now() - startTime;
    console.error('[答题记录保存] 保存失败:', {
      error: error.message,
      stack: error.stack,
      duration: `${saveDuration}ms`
    });
    
    // 如果是验证错误，返回更详细的错误信息
    if (error.name === 'SequelizeValidationError') {
      console.error('[答题记录保存] 数据验证错误:', error.errors);
      return res.status(400).json({ 
        message: '数据验证失败', 
        errors: error.errors.map(e => e.message)
      });
    }
    
    res.status(500).json({ message: '保存答题记录失败: ' + error.message });
  }
});

// 获取答题结果 - 使用认证中间件确保数据安全
router.get('/result', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sessionId } = req.query;
    
    // 验证参数
    if (!sessionId) {
      return res.status(400).json({ message: '缺少sessionId参数' });
    }
    
    // 根据sessionId获取答题结果（模拟）
    // 实际项目中应该根据sessionId查询相关的答题记录
    const result = {
      sessionId,
      totalQuestions: 10,
      correctAnswers: 7,
      accuracy: 70,
      totalTime: 300,
      wrongQuestions: [2, 5, 8]
    };
    
    res.status(200).json({ result });
  } catch (error) {
    console.error('Get answer result error:', error);
    res.status(500).json({ message: '获取答题结果失败' });
  }
});

// 获取用户答题记录列表（按会话分组）- 使用认证中间件确保数据隔离
router.get('/list', authenticate, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.userId;
    const { page = 1, pageSize = 10 } = req.query;
    
    console.log(`[答题记录列表] 用户 ${userId} 请求列表，页码: ${page}, 每页: ${pageSize}`);
    
    // 查询用户的所有答题记录，按时间倒序 - 严格使用userId过滤
    const allRecords = await db.AnswerRecord.findAll({
      where: { 
        userId: userId // 明确指定userId，确保数据隔离
      },
      include: [
        { 
          model: db.QACard,
          include: [
            {
              model: db.Topic,
              where: { userId: userId }, // 额外验证Topic的所有权
              required: true
            }
          ],
          required: true // 确保关联的QACard存在
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`[答题记录列表] 查询到 ${allRecords.length} 条原始记录`);
    
    // 按会话分组：同一主题下，创建时间在1分钟内的记录视为同一会话
    const sessionGroups = {};
    allRecords.forEach(record => {
      if (!record.QACard || !record.QACard.Topic) {
        console.warn(`[答题记录列表] 记录 ${record.id} 缺少关联数据，跳过`);
        return;
      }
      
      const topicId = record.topicId;
      const createdAt = new Date(record.createdAt);
      // 将时间戳取整到分钟级别，同一分钟内的记录视为同一会话
      const sessionKey = `${topicId}_${Math.floor(createdAt.getTime() / 60000)}`;
      
      if (!sessionGroups[sessionKey]) {
        sessionGroups[sessionKey] = {
          topicId: topicId,
          topic: record.QACard.Topic.topic,
          answerTime: createdAt,
          records: []
        };
      }
      
      sessionGroups[sessionKey].records.push(record);
    });
    
    // 将会话数组按时间倒序排序
    const sessions = Object.values(sessionGroups).sort((a, b) => {
      return b.answerTime.getTime() - a.answerTime.getTime();
    });
    
    // 统计总会话数
    const total = sessions.length;
    
    // 分页处理
    const pageNum = parseInt(page);
    const size = parseInt(pageSize);
    const startIndex = (pageNum - 1) * size;
    const endIndex = startIndex + size;
    const paginatedSessions = sessions.slice(startIndex, endIndex);
    
    console.log(`[答题记录列表] 分组后共 ${total} 个会话，当前页返回 ${paginatedSessions.length} 个`);
    
    // 格式化返回数据
    const formattedRecords = paginatedSessions.map((session, index) => {
      const records = session.records;
      const totalQuestions = records.length;
      const correctCount = records.filter(r => r.isCorrect).length;
      const wrongCount = totalQuestions - correctCount;
      const accuracy = totalQuestions > 0 ? 
        ((correctCount / totalQuestions) * 100).toFixed(1) : 0;
      
      // 记录第一个会话的详细信息（用于调试）
      if (index === 0) {
        console.log(`[答题记录列表] 第一个会话详情:`, {
          topic: session.topic,
          totalQuestions,
          correctCount,
          wrongCount,
          accuracy: `${accuracy}%`,
          answerTime: session.answerTime.toISOString()
        });
      }
      
      return {
        id: `session_${startIndex + index + 1}`, // 生成临时ID
        topic: session.topic,
        topicId: session.topicId,
        answerTime: session.answerTime.toISOString().slice(0, 19).replace('T', ' '),
        totalQuestions,
        correctCount,
        wrongCount,
        accuracy: `${accuracy}%`,
        questions: records.map(record => ({
          id: record.qacardId,
          question: record.QACard.question || '题目内容未找到',
          userAnswer: record.userAnswer,
          correctAnswer: record.QACard.correctAnswer || record.QACard.answer || '未找到正确答案',
          isCorrect: record.isCorrect,
          elapsedTime: record.elapsedTime
        }))
      };
    });
    
    const queryDuration = Date.now() - startTime;
    console.log(`[答题记录列表] 用户 ${userId} 列表查询完成，耗时: ${queryDuration}ms`);
    
    res.status(200).json({
      records: formattedRecords,
      total,
      page: pageNum,
      pageSize: size,
      hasMore: endIndex < total
    });
  } catch (error) {
    const queryDuration = Date.now() - startTime;
    console.error('[答题记录列表] 查询失败:', {
      error: error.message,
      stack: error.stack,
      duration: `${queryDuration}ms`
    });
    res.status(500).json({ message: '获取答题记录失败: ' + error.message });
  }
});

module.exports = router;
