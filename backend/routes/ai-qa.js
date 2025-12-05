const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticate } = require('../middleware/auth');
const axios = require('axios');
const config = require('../config/config');
const taskManager = require('../utils/taskManager');
const { v4: uuidv4 } = require('uuid');
const { parseAllParameters } = require('../utils/parameterParser');
const { mapParametersToRules, generateEnhancedPrompt } = require('../utils/generationMapper');
const { validateAll } = require('../utils/contentValidator');
const { cacheParameterParse, cacheMappingRules } = require('../utils/performanceCache');
const { extractAndParseJson, parseJsonSafely } = require('../utils/jsonParser');
const { requestWithRetry, healthCheck } = require('../utils/apiClient');
const apiMonitor = require('../utils/apiMonitor');
const { logAiConfig, logAiRequest, logAiResponse } = require('../utils/logger');

// 生成问答卡片 - 使用认证中间件确保数据安全，支持异步任务和进度跟踪
router.post('/generate', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      topic,
      difficulty,
      count,
      subject = 'default',
      learningGoals = '',      // 学习目标
      knowledgePoints = '',    // 知识点范围
      waitSeconds = null       // 用户等待时间（秒），如果为null则使用配置的默认值
    } = req.body;

    // 验证参数
    if (!topic || !difficulty || !count) {
      return res.status(400).json({ message: '参数不全' });
    }

    // 验证count参数范围，防止恶意请求
    const cardCount = parseInt(count);
    if (isNaN(cardCount) || cardCount < config.question.minCount || cardCount > config.question.maxCount) {
      return res.status(400).json({ 
        message: `卡片数量必须在${config.question.minCount}-${config.question.maxCount}之间` 
      });
    }

    // 生成任务ID
    const taskId = `generate_${userId}_${Date.now()}_${uuidv4()}`;

    // 创建任务
    taskManager.createTask(taskId, {
      userId: userId,
      topic: topic,
      difficulty: difficulty,
      count: cardCount
    });

    // 立即返回任务ID，让前端开始轮询进度
    res.status(202).json({
      taskId: taskId,
      message: '生成任务已创建，请使用taskId查询进度'
    });

    // 计算等待时间（秒）
    let waitTimeSeconds = 0;
    if (config.question.waitTime.enabled) {
      // 如果请求中指定了等待时间，使用请求中的值；否则使用配置的默认值
      const requestedWaitTime = waitSeconds !== null ? parseInt(waitSeconds) : config.question.waitTime.defaultSeconds;
      // 限制在允许的范围内
      waitTimeSeconds = Math.max(
        config.question.waitTime.minSeconds,
        Math.min(config.question.waitTime.maxSeconds, requestedWaitTime || 0)
      );
    }

    // 异步执行生成任务
    generateCardsAsync(taskId, userId, topic, difficulty, cardCount, subject, learningGoals, knowledgePoints, waitTimeSeconds)
      .catch(error => {
        console.error(`[生成任务] 任务 ${taskId} 执行失败:`, error);
        taskManager.failTask(taskId, error.message || '生成失败');
      });

  } catch (error) {
    console.error('Generate QA cards error:', error);
    res.status(500).json({ message: '创建生成任务失败: ' + error.message });
  }
});

// 异步生成卡片任务 - 增强版，支持学习目标、知识点范围、用户等待时间
async function generateCardsAsync(taskId, userId, topic, difficulty, count, subject, learningGoals = '', knowledgePoints = '', waitSeconds = 0) {
  try {
    // 如果配置了等待时间，在开始生成前等待
    if (waitSeconds > 0) {
      const waitTimeMs = waitSeconds * 1000;
      taskManager.updateProgress(taskId, 5, `正在准备生成任务，请稍候 ${waitSeconds} 秒...`);
      console.log(`[生成任务] 任务 ${taskId} 等待 ${waitSeconds} 秒后开始生成`);
      
      // 分段更新等待进度，提升用户体验
      const progressInterval = Math.max(1000, Math.floor(waitTimeMs / 10)); // 每10%更新一次进度，最少1秒
      const startTime = Date.now();
      
      while (Date.now() - startTime < waitTimeMs) {
        const elapsed = Date.now() - startTime;
        const remaining = Math.ceil((waitTimeMs - elapsed) / 1000);
        const progress = 5 + Math.floor((elapsed / waitTimeMs) * 5); // 5%到10%的进度范围
        
        if (remaining > 0) {
          taskManager.updateProgress(taskId, progress, `正在准备生成任务，请稍候 ${remaining} 秒...`);
        }
        
        await new Promise(resolve => setTimeout(resolve, progressInterval));
      }
      
      taskManager.updateProgress(taskId, 10, '等待完成，开始初始化生成任务...');
    } else {
      taskManager.updateProgress(taskId, 5, '正在初始化生成任务...');
    }

    // 保存主题
    taskManager.updateProgress(taskId, 10, '正在保存学习主题...');
    const savedTopic = await db.Topic.create({
      userId: userId,
      topic,
      difficulty,
      cardCount: count
    });

    taskManager.updateProgress(taskId, 20, '正在准备智能生成引擎...');

    // 根据科目选择AI模型
    const aiModel = config.aiSubjectMapping[subject] || config.aiSubjectMapping.default;
    const aiConfig = config.ai[aiModel];

    // 调用AI接口生成问答内容
    let generatedCards = [];

    try {
      taskManager.updateProgress(taskId, 30, '正在调用AI智能生成题目内容...');

      // 根据不同的AI模型调用不同的API
      switch (aiModel) {
        case 'qwen':
          // 调用阿里通义千问API（系统性增强版）
          let aiCards = await callQwenAPI(topic, difficulty, count, aiConfig, learningGoals, knowledgePoints, (progress, message) => {
            // AI生成进度回调：使用配置的进度范围
            const progressRange = config.task.progress.aiEnd - config.task.progress.aiStart;
            const overallProgress = config.task.progress.aiStart + Math.floor(progress * (progressRange / 100));
            taskManager.updateProgress(taskId, overallProgress, message);
          }, userId);

          // 检查AI返回的卡片数量
          if (aiCards && aiCards.length > 0) {
            taskManager.updateProgress(taskId, 70, `已生成 ${aiCards.length} 道题目，正在优化内容...`);

            // 为每张卡片添加topicId字段
            generatedCards = aiCards.map(card => ({
              ...card,
              topicId: savedTopic.id
            }));

            // 如果AI生成的卡片数量不足，记录警告但继续使用已生成的卡片
            if (generatedCards.length < count) {
              console.warn(`AI只生成了${generatedCards.length}张卡片，请求数量为${count}张`);
              taskManager.updateProgress(taskId, 75, `已生成 ${generatedCards.length} 道题目（请求 ${count} 道）`);
            }
          } else {
            // AI返回空数组时，抛出错误
            throw new Error('AI返回空卡片，无法生成题目');
          }
          break;
        default:
          // 不支持的AI模型，抛出错误
          throw new Error(`不支持的AI模型: ${aiModel}`);
      }
    } catch (aiError) {
      console.error('AI API call error:', aiError);
      taskManager.updateProgress(taskId, 50, 'AI接口调用失败，任务终止');
      // AI接口调用失败时，抛出错误，不再使用模拟数据
      throw new Error(`AI接口调用失败: ${aiError.message}`);
    }

    taskManager.updateProgress(taskId, 80, '正在批量保存题目到学习库...');

    // 优化：分批保存到数据库，提升性能
    const BATCH_SIZE = config.question.batchSize;
    const savedCards = [];

    if (generatedCards.length > BATCH_SIZE) {
      // 大批量数据分批处理
      for (let i = 0; i < generatedCards.length; i += BATCH_SIZE) {
        const batch = generatedCards.slice(i, i + BATCH_SIZE);
        const batchSaved = await db.QACard.bulkCreate(batch);
        savedCards.push(...batchSaved);
        const progress = 80 + Math.floor((i / generatedCards.length) * 10);
        taskManager.updateProgress(taskId, progress, `正在保存题目 ${Math.min(i + BATCH_SIZE, generatedCards.length)}/${generatedCards.length}...`);
      }
    } else {
      // 小批量数据直接保存
      const batchSaved = await db.QACard.bulkCreate(generatedCards);
      savedCards.push(...batchSaved);
    }

    taskManager.updateProgress(taskId, 90, '正在整理题目数据...');

    // 转换数据格式，确保返回给前端的卡片数据包含所有必要字段
    const cardsToReturn = savedCards.map(card => {
      // 确保options是数组，处理PostgreSQL ARRAY类型的序列化问题
      let options = card.options;
      if (typeof options === 'string') {
        try {
          // 首先尝试解析为JSON数组
          options = JSON.parse(options);
        } catch (jsonError) {
          try {
            // 如果JSON解析失败，尝试解析PostgreSQL ARRAY格式 '{option1,option2}'
            if (options.startsWith('{') && options.endsWith('}')) {
              // 移除首尾的大括号，然后按逗号分割
              const optionsStr = options.slice(1, -1);
              // 处理可能的引号
              options = optionsStr.split(',').map(opt => opt.trim().replace(/^"|"$/g, ''));
            } else {
              // 如果不是PostgreSQL ARRAY格式，使用默认选项
              options = ['A. 选项1', 'B. 选项2', 'C. 选项3', 'D. 选项4'];
            }
          } catch (pgError) {
            // 如果所有解析都失败，使用默认选项
            options = ['A. 选项1', 'B. 选项2', 'C. 选项3', 'D. 选项4'];
          }
        }
      } else if (!Array.isArray(options)) {
        // 如果options不是数组，使用默认选项
        options = ['A. 选项1', 'B. 选项2', 'C. 选项3', 'D. 选项4'];
      }

      // 确保correctAnswer是完整的选项文本，而不仅仅是选项字母
      let correctAnswer = card.correctAnswer;

      // 处理correctAnswer为空的情况
      if (!correctAnswer) {
        console.warn('correctAnswer为空，使用第一个选项作为默认正确答案');
        correctAnswer = options[0] || '无正确答案';
      } else if (correctAnswer.length === 1) {
        // 如果correctAnswer只是一个字母（如"A"），查找对应的完整选项
        const optionLetter = correctAnswer.toUpperCase();
        const matchingOption = options.find(opt =>
          opt.startsWith(`${optionLetter}.`) ||
          opt === optionLetter ||
          opt.startsWith(optionLetter)
        );
        if (matchingOption) {
          correctAnswer = matchingOption;
        } else {
          // 如果找不到匹配的选项，使用第一个选项作为默认正确答案
          console.warn('找不到匹配的选项，使用第一个选项作为默认正确答案');
          correctAnswer = options[0] || '无正确答案';
        }
      }

      return {
        id: card.id,
        topicId: card.topicId,
        question: card.question,
        options: options,
        correctAnswer: correctAnswer,
        explanation: card.explanation,
        difficulty: card.difficulty,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt
      };
    });

    taskManager.updateProgress(taskId, 100, '题目生成完成，准备开始学习！');

    // 完成任务并保存结果
    taskManager.completeTask(taskId, {
      cards: cardsToReturn
    });

    console.log(`[生成任务] 任务 ${taskId} 成功完成，生成了 ${cardsToReturn.length} 张卡片`);
  } catch (error) {
    console.error(`[生成任务] 任务 ${taskId} 执行失败:`, error);
    taskManager.failTask(taskId, error.message || '生成失败');
    throw error;
  }
}

// API监控端点 - 获取API调用统计信息
router.get('/monitor/stats', authenticate, async (req, res) => {
  try {
    const stats = apiMonitor.getStats();
    const health = apiMonitor.getHealthStatus();
    res.json({
      stats,
      health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取API监控统计失败:', error);
    res.status(500).json({ message: '获取监控统计失败' });
  }
});

// 查询生成任务进度
router.get('/progress/:taskId', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { taskId } = req.params;

    const task = taskManager.getTask(taskId);

    if (!task) {
      return res.status(404).json({ message: '任务不存在或已过期' });
    }

    // 验证任务所有权
    if (task.userId !== userId) {
      return res.status(403).json({ message: '无权访问此任务' });
    }

    // 返回任务状态
    res.status(200).json({
      taskId: taskId,
      status: task.status,
      progress: task.progress,
      message: task.message,
      result: task.result,
      error: task.error
    });
  } catch (error) {
    // 静默记录错误，不包含任何用户信息
    console.error('[进度查询] 查询失败:', {
      path: '/progress/:taskId',
      taskId: req.params.taskId,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: '查询任务进度失败' });
  }
});

// 调用阿里通义千问API生成问答卡片 - 系统性增强版
async function callQwenAPI(topic, difficulty, count, aiConfig, learningGoals = '', knowledgePoints = '', progressCallback, userId = null) {
  // 生成请求ID用于追踪
  const requestId = `ai_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const requestStartTime = Date.now();

  if (progressCallback) {
    progressCallback(10, '正在解析输入参数...');
  }

  // 1. 参数解析（使用缓存优化性能）
  const parsedParams = cacheParameterParse(learningGoals, knowledgePoints, difficulty);
  console.log('[参数解析] 解析结果:', JSON.stringify(parsedParams, null, 2));

  if (progressCallback) {
    progressCallback(15, '正在建立参数映射规则...');
  }

  // 2. 映射机制（使用缓存优化性能）
  const rules = cacheMappingRules(parsedParams);
  console.log('[映射机制] 生成规则:', JSON.stringify(rules, null, 2));

  if (progressCallback) {
    progressCallback(20, '正在构建增强的生成提示词...');
  }

  // 3. 生成增强的提示词
  const prompt = generateEnhancedPrompt(topic, difficulty, count, parsedParams, rules);

  if (progressCallback) {
    progressCallback(25, '正在连接AI智能服务...');
  }

  try {
    if (progressCallback) {
      progressCallback(30, '正在向AI发送增强的生成请求...');
    }

    // 根据题目数量动态调整超时时间
    const requestTimeout = config.getAiTimeout(count);

    // 准备请求配置
    const requestParams = {
      ...config.ai.qwen.defaultParams
    };
    
    const requestConfig = {
      method: 'POST',
      url: aiConfig.apiUrl,
      data: {
        model: aiConfig.model || config.ai.qwen.model,
        input: {
          prompt: prompt
        },
        parameters: requestParams
      },
      headers: {
        'Authorization': `Bearer ${aiConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: requestTimeout
    };

    const retryConfig = {
      maxRetries: config.api.retry.ai.maxRetries,
      baseDelay: config.api.retry.ai.baseDelay,
      maxDelay: config.api.retry.ai.maxDelay,
      timeout: requestTimeout,
      progressCallback: progressCallback,
      onRetry: (attempt, error, delay) => {
        console.log(`[API重试] 第${attempt}次重试，延迟${delay}ms，错误: ${error.message}`);
      }
    };

    // 记录AI配置信息
    logAiConfig(aiConfig, {
      ...requestConfig,
      ...retryConfig
    }, requestId);

    // 记录AI请求详细信息
    logAiRequest({
      requestId,
      userId: userId || 'unknown',
      topic,
      difficulty,
      count,
      subject: 'default',
      learningGoals,
      knowledgePoints,
      prompt,
      requestParams,
      timestamp: new Date().toISOString()
    });

    // 调用阿里通义千问API（使用带重试机制的请求）
    let retryCount = 0;
    const response = await requestWithRetry(requestConfig, {
      ...retryConfig,
      onRetry: (attempt, error, delay) => {
        retryCount = attempt;
        if (retryConfig.onRetry) {
          retryConfig.onRetry(attempt, error, delay);
        }
      }
    });

    if (progressCallback) {
      progressCallback(60, '正在接收并解析AI生成的内容...');
    }

    // 记录AI响应信息
    const requestDuration = Date.now() - requestStartTime;
    const responseSize = response.data ? JSON.stringify(response.data).length : 0;
    
    logAiResponse({
      requestId,
      success: true,
      duration: requestDuration,
      statusCode: response.status,
      responseSize,
      retryCount
    });

    // 解析AI响应
    const aiResponse = response.data;

    if (aiResponse.output && aiResponse.output.text) {
      // 使用增强的JSON解析工具提取和解析JSON内容
      let generatedCards;
      try {
        generatedCards = extractAndParseJson(aiResponse.output.text, {
          maxRetries: 3,
          enablePreprocessing: true,
          enableRecovery: true,
          logErrors: true
        });
        
        // 确保解析结果是数组
        if (!Array.isArray(generatedCards)) {
          console.warn('[JSON解析] 解析结果不是数组，尝试转换...');
          if (typeof generatedCards === 'object' && generatedCards !== null) {
            // 如果解析结果是对象，尝试提取其中的数组字段
            const possibleArrayFields = ['cards', 'data', 'items', 'results'];
            for (const field of possibleArrayFields) {
              if (Array.isArray(generatedCards[field])) {
                generatedCards = generatedCards[field];
                break;
              }
            }
            // 如果仍然不是数组，包装成数组
            if (!Array.isArray(generatedCards)) {
              generatedCards = [generatedCards];
            }
          } else {
            throw new Error('解析结果格式不正确，期望数组或对象');
          }
        }
      } catch (parseError) {
        console.error('[JSON解析] 解析AI响应JSON失败:', parseError);
        console.error('[JSON解析] 错误详情:', {
          message: parseError.message,
          stack: parseError.stack
        });
        
        // 记录完整的AI响应内容（用于调试）
        const previewLength = config.logging?.aiResponsePreviewLength || 1000;
        const responsePreview = aiResponse.output.text.substring(0, previewLength);
        console.error(`[JSON解析] AI响应内容预览 (前${previewLength}字符):`, responsePreview);
        console.error(`[JSON解析] AI响应内容总长度: ${aiResponse.output.text.length} 字符`);
        
        // 如果错误信息包含位置信息，显示该位置附近的文本
        if (parseError.message && parseError.message.includes('position')) {
          const positionMatch = parseError.message.match(/position (\d+)/);
          if (positionMatch) {
            const pos = parseInt(positionMatch[1]);
            const start = Math.max(0, pos - 100);
            const end = Math.min(aiResponse.output.text.length, pos + 100);
            console.error(`[JSON解析] 错误位置: ${pos}`);
            console.error('[JSON解析] 错误位置附近的文本:', aiResponse.output.text.substring(start, end));
            console.error(`[JSON解析] 错误位置的字符: "${aiResponse.output.text[pos]}" (字符码: ${aiResponse.output.text.charCodeAt(pos)})`);
          }
        }
        
        // 尝试提取可能的JSON片段用于分析
        const jsonErrorPreviewLength = config.logging?.jsonErrorPreviewLength || 500;
        const jsonArrayMatch = aiResponse.output.text.match(/\[\s*\{[\s\S]{0,500}\}/);
        if (jsonArrayMatch) {
          console.error('[JSON解析] 检测到的JSON片段 (前500字符):', jsonArrayMatch[0].substring(0, jsonErrorPreviewLength));
        }
        
        // 检查是否包含LaTeX公式
        const latexMatches = aiResponse.output.text.match(/\$[^$]+\$/g);
        if (latexMatches && latexMatches.length > 0) {
          console.warn('[JSON解析] 检测到LaTeX公式，可能影响JSON解析:', latexMatches.slice(0, 5));
        }
        
        // 检查是否包含未转义的反斜杠
        const unescapedBackslashMatches = aiResponse.output.text.match(/[^\\]\\(?![\\"\/bfnrtux0-9])/g);
        if (unescapedBackslashMatches && unescapedBackslashMatches.length > 0) {
          console.warn('[JSON解析] 检测到可能的未转义反斜杠:', unescapedBackslashMatches.slice(0, 10));
        }
        
        throw new Error(`AI响应JSON格式错误: ${parseError.message}`);
      }
      
      if (generatedCards && Array.isArray(generatedCards) && generatedCards.length > 0) {

        if (progressCallback) {
          progressCallback(80, '正在验证题目内容质量...');
        }

        // 基础验证和修复
        let validCards = generatedCards.map(card => {
          // 确保options是数组且有4个选项
          let options = card.options || [];
          if (!Array.isArray(options) || options.length < 4) {
            // 如果options无效，生成默认选项
            options = [
              'A. 选项1',
              'B. 选项2',
              'C. 选项3',
              'D. 选项4'
            ];
          }

          return {
            ...card,
            options,
            difficulty
          };
        });

        // 4. 内容验证 - 多维度检查
        if (progressCallback) {
          progressCallback(85, '正在进行多维度内容验证...');
        }

        const validationResult = validateAll(validCards, parsedParams);
        console.log('[内容验证] 验证结果:', JSON.stringify(validationResult, null, 2));

        // 如果验证不通过，记录警告但继续使用生成的卡片
        if (!validationResult.valid) {
          console.warn('[内容验证] 验证未完全通过:', validationResult.summary);

          // 如果综合得分太低，尝试重新生成
          if (validationResult.overallScore < config.validation.minOverallScore && count <= config.validation.maxRetryCount) {
            console.log('[内容验证] 综合得分过低，尝试重新生成...');
            if (progressCallback) {
              progressCallback(50, '内容质量不足，正在重新生成...');
            }

            // 重新生成一次（最多重试1次）
            try {
              const retryPrompt = prompt + `\n\n【重要提醒】\n上一轮生成的内容与要求匹配度不足，请确保：\n1. 每道题目必须明确关联学习目标\n2. 必须覆盖所有指定的知识点\n3. 难度必须匹配${difficulty}级别\n\n请重新生成，确保严格符合要求。`;

              // 使用带重试机制的请求
              const retryResponse = await requestWithRetry({
                method: 'POST',
                url: aiConfig.apiUrl,
                data: {
                  model: aiConfig.model || config.ai.qwen.model,
                  input: { prompt: retryPrompt },
                  parameters: {
                    ...config.ai.qwen.retryParams
                  }
                },
                headers: {
                  'Authorization': `Bearer ${aiConfig.apiKey}`,
                  'Content-Type': 'application/json'
                }
              }, {
                maxRetries: Math.max(1, config.api.retry.ai.maxRetries - 1), // 重试时减少重试次数
                baseDelay: config.api.retry.ai.baseDelay,
                maxDelay: Math.floor(config.api.retry.ai.maxDelay * 0.8),
                timeout: config.getAiRetryTimeout(count),
                progressCallback: progressCallback
              });

              if (retryResponse.data.output && retryResponse.data.output.text) {
                try {
                  let retryCards = extractAndParseJson(retryResponse.data.output.text, {
                    maxRetries: 3,
                    enablePreprocessing: true,
                    enableRecovery: true,
                    logErrors: true
                  });
                  
                  // 确保解析结果是数组
                  if (!Array.isArray(retryCards)) {
                    if (typeof retryCards === 'object' && retryCards !== null) {
                      const possibleArrayFields = ['cards', 'data', 'items', 'results'];
                      for (const field of possibleArrayFields) {
                        if (Array.isArray(retryCards[field])) {
                          retryCards = retryCards[field];
                          break;
                        }
                      }
                      if (!Array.isArray(retryCards)) {
                        retryCards = [retryCards];
                      }
                    } else {
                      throw new Error('重试解析结果格式不正确');
                    }
                  }
                  
                  const retryValidCards = retryCards.map(card => {
                    let options = card.options || [];
                    if (!Array.isArray(options) || options.length < 4) {
                      options = ['A. 选项1', 'B. 选项2', 'C. 选项3', 'D. 选项4'];
                    }
                    return { ...card, options, difficulty };
                  });

                  const retryValidation = validateAll(retryValidCards, parsedParams);
                  console.log('[内容验证] 重试验证结果:', JSON.stringify(retryValidation, null, 2));

                  // 如果重试结果更好，使用重试结果
                  if (retryValidation.overallScore > validationResult.overallScore) {
                    validCards = retryValidCards;
                    console.log('[内容验证] 使用重试生成的结果');
                  }
                } catch (retryParseError) {
                  console.error('[内容验证] 重试解析失败:', retryParseError);
                  // 继续使用原始结果
                }
              }
            } catch (retryError) {
              console.error('[内容验证] 重试生成失败:', retryError);
              // 继续使用原始结果
            }
          }
        } else {
          console.log('[内容验证] 验证通过:', validationResult.summary);
        }

        // 记录验证信息到卡片（用于后续分析）
        validCards = validCards.map((card, index) => ({
          ...card,
          _validation: {
            knowledgeCoverage: validationResult.validations.knowledgeCoverage.details.find(d => d.cardIndex === index),
            goalRelevance: validationResult.validations.goalRelevance.details.find(d => d.cardIndex === index)
          }
        }));

        if (progressCallback) {
          progressCallback(95, `验证完成，综合得分：${(validationResult.overallScore * 100).toFixed(1)}%`);
        }

        return validCards;
      } else {
        throw new Error('AI响应格式错误，无法提取JSON');
      }
    } else {
      throw new Error('AI响应缺少output字段');
    }
  } catch (error) {
    // 记录AI响应错误信息
    const requestDuration = Date.now() - requestStartTime;
    const responseSize = error.response?.data ? JSON.stringify(error.response.data).length : 0;
    
    logAiResponse({
      requestId,
      success: false,
      duration: requestDuration,
      statusCode: error.response?.status,
      responseSize,
      retryCount: error.attempts || retryCount || 0,
      error: {
        code: error.code,
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : null
      }
    });
    
    console.error('[API调用失败] 阿里通义千问API调用失败:', error);
    
    // 记录详细的错误信息
    const errorDetails = {
      requestId,
      message: error.message,
      code: error.code,
      attempts: error.attempts || 1,
      duration: error.duration || requestDuration,
      originalError: error.originalError ? {
        message: error.originalError.message,
        code: error.originalError.code,
        response: error.originalError.response ? {
          status: error.originalError.response.status,
          statusText: error.originalError.response.statusText,
          data: error.originalError.response.data
        } : null
      } : null,
      topic,
      difficulty,
      count,
      timestamp: new Date().toISOString()
    };
    
    console.error('[API调用失败] 详细错误信息:', JSON.stringify(errorDetails, null, 2));
    
    // 如果进度回调存在，更新进度信息
    if (progressCallback) {
      if (error.message && error.message.includes('超时')) {
        progressCallback(95, '请求超时，请检查网络连接或稍后重试');
      } else if (error.message && error.message.includes('连接')) {
        progressCallback(95, '无法连接到AI服务，请检查网络设置');
      } else {
        progressCallback(95, `AI服务调用失败: ${error.message.substring(0, 50)}`);
      }
    }
    
    // AI接口调用失败时，抛出错误
    throw error;
  }
}


module.exports = router;
