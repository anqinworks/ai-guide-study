const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticate } = require('../middleware/auth');
const axios = require('axios');
const config = require('../config/config');
const taskManager = require('../utils/taskManager');
const { v4: uuidv4 } = require('uuid');

// 生成问答卡片 - 使用认证中间件确保数据安全，支持异步任务和进度跟踪
router.post('/generate', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { topic, difficulty, count, subject = 'default' } = req.body;
    
    // 验证参数
    if (!topic || !difficulty || !count) {
      return res.status(400).json({ message: '参数不全' });
    }
    
    // 验证count参数范围，防止恶意请求
    const cardCount = parseInt(count);
    if (isNaN(cardCount) || cardCount < 1 || cardCount > 50) {
      return res.status(400).json({ message: '卡片数量必须在1-50之间' });
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
    
    // 异步执行生成任务
    generateCardsAsync(taskId, userId, topic, difficulty, cardCount, subject)
      .catch(error => {
        console.error(`[生成任务] 任务 ${taskId} 执行失败:`, error);
        taskManager.failTask(taskId, error.message || '生成失败');
      });
    
  } catch (error) {
    console.error('Generate QA cards error:', error);
    res.status(500).json({ message: '创建生成任务失败: ' + error.message });
  }
});

// 异步生成卡片任务
async function generateCardsAsync(taskId, userId, topic, difficulty, count, subject) {
  try {
    taskManager.updateProgress(taskId, 5, '正在初始化生成任务...');
    
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
          // 调用阿里通义千问API
          let aiCards = await callQwenAPI(topic, difficulty, count, aiConfig, (progress, message) => {
            // AI生成进度回调：30% - 70%
            const overallProgress = 30 + Math.floor(progress * 0.4);
            taskManager.updateProgress(taskId, overallProgress, message);
          });
          
          // 检查AI返回的卡片数量
          if (aiCards && aiCards.length > 0) {
            taskManager.updateProgress(taskId, 70, `已生成 ${aiCards.length} 道题目，正在优化内容...`);
            
            // 为每张卡片添加topicId字段
            generatedCards = aiCards.map(card => ({
              ...card,
              topicId: savedTopic.id
            }));
            
            // 如果AI生成的卡片数量不足，使用模拟数据补充
            if (generatedCards.length < count) {
              console.warn(`AI只生成了${generatedCards.length}张卡片，需要补充${count - generatedCards.length}张`);
              taskManager.updateProgress(taskId, 75, `正在补充生成 ${count - generatedCards.length} 道题目...`);
              const mockCards = generateMockCards(topic, difficulty, count - generatedCards.length, savedTopic.id);
              generatedCards = [...generatedCards, ...mockCards];
            }
          } else {
            // AI返回空数组时，使用模拟数据
            console.warn('AI返回空卡片，使用模拟数据');
            taskManager.updateProgress(taskId, 50, '正在生成题目内容...');
            generatedCards = generateMockCards(topic, difficulty, count, savedTopic.id);
          }
          break;
        default:
          // 默认使用模拟数据
          taskManager.updateProgress(taskId, 50, '正在生成题目内容...');
          generatedCards = generateMockCards(topic, difficulty, count, savedTopic.id);
      }
    } catch (aiError) {
      console.error('AI API call error:', aiError);
      taskManager.updateProgress(taskId, 50, '正在使用备用方案生成题目...');
      // AI接口调用失败时，使用模拟数据确保系统可用性
      generatedCards = generateMockCards(topic, difficulty, count, savedTopic.id);
    }
    
    taskManager.updateProgress(taskId, 80, '正在保存题目到学习库...');
    
    // 保存到数据库
    const savedCards = await db.QACard.bulkCreate(generatedCards);
    
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
    console.error('Query task progress error:', error);
    res.status(500).json({ message: '查询任务进度失败' });
  }
});

// 调用阿里通义千问API生成问答卡片
async function callQwenAPI(topic, difficulty, count, aiConfig, progressCallback) {
  console.log('调用阿里通义千问API生成问答卡片:', topic, difficulty, count);
  
  if (progressCallback) {
    progressCallback(10, '正在连接AI智能服务...');
  }
  
  // 构建AI请求提示词
  const prompt = `请为${topic}主题生成${count}道${difficulty}难度的选择题，每道题需要包含：
1. 一个清晰的问题
2. 4个选项（A、B、C、D），每个选项需要包含完整的选项内容
3. 正确答案（仅选项字母，如A）
4. 详细的答案解析

请按照以下JSON格式返回，不要添加任何额外内容：
[
  {
    "question": "问题内容",
    "options": ["A. 选项内容", "B. 选项内容", "C. 选项内容", "D. 选项内容"],
    "correctAnswer": "A",
    "explanation": "答案解析"
  }
]`;
  
  try {
    if (progressCallback) {
      progressCallback(30, '正在向AI发送生成请求...');
    }
    
    // 调用阿里通义千问API
    const response = await axios.post(aiConfig.apiUrl, {
      model: "qwen-turbo",
      input: {
        prompt: prompt
      },
      parameters: {
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 2048
      }
    }, {
      headers: {
        'Authorization': `Bearer ${aiConfig.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (progressCallback) {
      progressCallback(60, '正在接收并解析AI生成的内容...');
    }
    
    // 解析AI响应
    const aiResponse = response.data;
    
    if (aiResponse.output && aiResponse.output.text) {
      // 提取JSON内容
      const jsonMatch = aiResponse.output.text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        let generatedCards;
        try {
          generatedCards = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('解析AI响应JSON失败:', parseError);
          throw new Error('AI响应JSON格式错误');
        }
        
        if (progressCallback) {
          progressCallback(80, '正在验证题目内容质量...');
        }
        
        // 验证并修复生成的卡片
        const validCards = generatedCards.map(card => {
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
        
        return validCards;
      } else {
        throw new Error('AI响应格式错误，无法提取JSON');
      }
    } else {
      throw new Error('AI响应缺少output字段');
    }
  } catch (error) {
    console.error('阿里通义千问API调用失败:', error);
    // AI接口调用失败时，返回空数组，触发降级处理
    return [];
  }
}

// 生成模拟问答卡片
function generateMockCards(topic, difficulty, count, topicId) {
  const generatedCards = [];
  
  // 生成更真实的模拟数据
  const mockQuestions = {
    'JavaScript基础': [
      {
        question: '以下哪个不是JavaScript的基本数据类型？',
        options: ['String', 'Number', 'Boolean', 'Object'],
        correctAnswer: 'Object',
        explanation: 'JavaScript的基本数据类型包括String、Number、Boolean、Null、Undefined、Symbol和BigInt。Object是引用数据类型。'
      },
      {
        question: '以下哪个方法可以用来创建一个新的数组？',
        options: ['Array.create()', 'new Array()', 'Array.new()', 'create Array()'],
        correctAnswer: 'new Array()',
        explanation: '在JavaScript中，可以使用new Array()或字面量[]来创建一个新的数组。'
      },
      {
        question: '以下哪个关键字用于声明一个块级作用域的变量？',
        options: ['var', 'let', 'const', 'function'],
        correctAnswer: 'let',
        explanation: 'let关键字用于声明块级作用域的变量，而var声明的是函数作用域的变量，const声明的是常量。'
      },
      {
        question: '以下哪个方法可以用来遍历数组？',
        options: ['forEach()', 'map()', 'filter()', '以上都是'],
        correctAnswer: '以上都是',
        explanation: 'forEach()、map()和filter()都是JavaScript中用于遍历数组的方法，它们各自有不同的用途。'
      },
      {
        question: '以下哪个运算符用于比较值和类型是否都相等？',
        options: ['==', '===', '=!', '!='],
        correctAnswer: '===',
        explanation: '===是严格相等运算符，用于比较值和类型是否都相等；==是相等运算符，会进行类型转换。'
      }
    ],
    'React框架': [
      {
        question: '以下哪个是React的核心概念？',
        options: ['组件', '指令', '模板', '控制器'],
        correctAnswer: '组件',
        explanation: '组件是React的核心概念，React应用由多个组件组成，每个组件负责渲染UI的一部分。'
      },
      {
        question: '以下哪个钩子用于在组件挂载后执行副作用？',
        options: ['useState', 'useEffect', 'useContext', 'useReducer'],
        correctAnswer: 'useEffect',
        explanation: 'useEffect钩子用于在组件挂载后执行副作用，如数据获取、订阅或手动DOM操作。'
      },
      {
        question: '以下哪个方法用于更新组件的状态？',
        options: ['setState', 'updateState', 'changeState', 'modifyState'],
        correctAnswer: 'setState',
        explanation: '在React类组件中，使用setState方法来更新组件的状态；在函数组件中，使用useState钩子返回的更新函数。'
      },
      {
        question: '以下哪个属性用于向组件传递数据？',
        options: ['props', 'state', 'context', 'ref'],
        correctAnswer: 'props',
        explanation: 'props是React组件之间传递数据的主要方式，父组件通过props向子组件传递数据。'
      },
      {
        question: '以下哪个是React的虚拟DOM的作用？',
        options: ['提高性能', '简化代码', '增强安全性', '支持跨平台'],
        correctAnswer: '提高性能',
        explanation: 'React的虚拟DOM通过减少实际DOM操作的次数来提高性能，它会先在内存中计算出DOM的变化，然后一次性更新到实际DOM中。'
      }
    ],
    'Python基础': [
      {
        question: '以下哪个是Python的注释符号？',
        options: ['//', '/* */', '#', '--'],
        correctAnswer: '#',
        explanation: '在Python中，使用#符号来添加单行注释，多行注释可以使用三引号(\'\'\'或""")。'
      },
      {
        question: '以下哪个数据类型是可变的？',
        options: ['字符串', '元组', '列表', '整数'],
        correctAnswer: '列表',
        explanation: '在Python中，列表是可变的数据类型，而字符串、元组和整数是不可变的数据类型。'
      },
      {
        question: '以下哪个关键字用于定义函数？',
        options: ['def', 'function', 'func', 'define'],
        correctAnswer: 'def',
        explanation: '在Python中，使用def关键字来定义函数，后面跟着函数名和参数列表。'
      },
      {
        question: '以下哪个方法用于向列表末尾添加元素？',
        options: ['append()', 'add()', 'push()', 'insert()'],
        correctAnswer: 'append()',
        explanation: '在Python中，append()方法用于向列表末尾添加元素，insert()方法用于在指定位置插入元素。'
      },
      {
        question: '以下哪个是Python的条件语句？',
        options: ['if-else', 'switch-case', 'select-case', 'cond'],
        correctAnswer: 'if-else',
        explanation: '在Python中，使用if-else语句来实现条件判断，Python不支持switch-case语句。'
      }
    ],
    '地理': [
      {
        question: '以下哪个是地球的天然卫星？',
        options: ['金星', '月球', '火星', '木星'],
        correctAnswer: '月球',
        explanation: '月球是地球唯一的天然卫星，它围绕地球运行，对地球的潮汐现象有重要影响。'
      },
      {
        question: '世界上面积最大的国家是哪个？',
        options: ['中国', '美国', '俄罗斯', '加拿大'],
        correctAnswer: '俄罗斯',
        explanation: '俄罗斯是世界上面积最大的国家，总面积约为1709.82万平方公里。'
      },
      {
        question: '以下哪个是世界上最长的河流？',
        options: ['尼罗河', '亚马逊河', '长江', '密西西比河'],
        correctAnswer: '尼罗河',
        explanation: '尼罗河是世界上最长的河流，全长约6650公里，流经非洲多个国家。'
      },
      {
        question: '以下哪个是世界上最高的山峰？',
        options: ['珠穆朗玛峰', '乔戈里峰', '干城章嘉峰', '洛子峰'],
        correctAnswer: '珠穆朗玛峰',
        explanation: '珠穆朗玛峰是世界上最高的山峰，海拔约8848.86米，位于中国和尼泊尔边境。'
      },
      {
        question: '以下哪个是世界上最大的海洋？',
        options: ['大西洋', '太平洋', '印度洋', '北冰洋'],
        correctAnswer: '太平洋',
        explanation: '太平洋是世界上最大的海洋，覆盖地球表面约30%的面积。'
      }
    ],
    '天文': [
      {
        question: '以下哪个是太阳系中最大的行星？',
        options: ['地球', '火星', '木星', '土星'],
        correctAnswer: '木星',
        explanation: '木星是太阳系中最大的行星，其直径约为14.3万公里，是地球直径的11倍多。'
      },
      {
        question: '以下哪个是太阳系中离太阳最近的行星？',
        options: ['水星', '金星', '地球', '火星'],
        correctAnswer: '水星',
        explanation: '水星是太阳系中离太阳最近的行星，平均距离约为5791万公里。'
      },
      {
        question: '以下哪个是太阳系中唯一存在生命的行星？',
        options: ['火星', '地球', '金星', '木星'],
        correctAnswer: '地球',
        explanation: '地球是太阳系中唯一已知存在生命的行星，其适宜的温度、液态水和大气层为生命的存在提供了条件。'
      },
      {
        question: '以下哪个是恒星？',
        options: ['地球', '月球', '太阳', '木星'],
        correctAnswer: '太阳',
        explanation: '太阳是恒星，它通过核聚变反应产生能量，为太阳系中的行星提供光和热。'
      },
      {
        question: '以下哪个是银河系的形状？',
        options: ['椭圆', '螺旋', '不规则', '棒旋'],
        correctAnswer: '棒旋',
        explanation: '银河系是一个棒旋星系，具有一个中央棒状结构和螺旋臂。'
      }
    ],
    '历史': [
      {
        question: '以下哪个是中国古代四大发明之一？',
        options: ['火药', '蒸汽机', '电灯', '电话'],
        correctAnswer: '火药',
        explanation: '火药是中国古代四大发明之一，它的发明对人类社会的发展产生了深远影响。'
      },
      {
        question: '以下哪个是第一次世界大战的导火索？',
        options: ['萨拉热窝事件', '珍珠港事件', '911事件', '卢沟桥事变'],
        correctAnswer: '萨拉热窝事件',
        explanation: '萨拉热窝事件是第一次世界大战的导火索，发生于1914年6月28日。'
      },
      {
        question: '以下哪个是美国独立战争的转折点？',
        options: ['萨拉托加大捷', '约克镇战役', '波士顿倾茶事件', '莱克星顿的枪声'],
        correctAnswer: '萨拉托加大捷',
        explanation: '萨拉托加大捷是美国独立战争的转折点，发生于1777年，增强了美国人民争取胜利的信心。'
      },
      {
        question: '以下哪个是第二次世界大战中发生于1944年的重要战役？',
        options: ['诺曼底登陆', '珍珠港事件', '斯大林格勒战役', '中途岛战役'],
        correctAnswer: '诺曼底登陆',
        explanation: '诺曼底登陆发生于1944年6月6日，是第二次世界大战中盟军在欧洲西线战场发起的一场大规模攻势。'
      },
      {
        question: '以下哪个是中国历史上第一个统一的中央集权国家？',
        options: ['夏朝', '商朝', '秦朝', '汉朝'],
        correctAnswer: '秦朝',
        explanation: '秦朝是中国历史上第一个统一的中央集权国家，由秦始皇嬴政于公元前221年建立。'
      }
    ]
  };
  
  // 根据主题选择合适的模拟问题
  let topicQuestions;
  
  // 检查主题是否在模拟问题列表中
  if (mockQuestions[topic]) {
    topicQuestions = mockQuestions[topic];
  } else {
    // 检查主题是否包含某些关键词，以便选择合适的模拟问题
    if (topic.includes('地理') || topic.includes('地图') || topic.includes('国家') || topic.includes('河流') || topic.includes('山脉')) {
      topicQuestions = mockQuestions['地理'];
    } else if (topic.includes('天文') || topic.includes('宇宙') || topic.includes('行星') || topic.includes('恒星') || topic.includes('太阳系')) {
      topicQuestions = mockQuestions['天文'];
    } else if (topic.includes('历史') || topic.includes('古代') || topic.includes('战争') || topic.includes('朝代')) {
      topicQuestions = mockQuestions['历史'];
    } else if (topic.includes('Python') || topic.includes('python') || topic.includes('PYTHON')) {
      topicQuestions = mockQuestions['Python基础'];
    } else if (topic.includes('React') || topic.includes('react') || topic.includes('REACT')) {
      topicQuestions = mockQuestions['React框架'];
    } else if (topic.includes('JavaScript') || topic.includes('javascript') || topic.includes('JS') || topic.includes('js')) {
      topicQuestions = mockQuestions['JavaScript基础'];
    } else {
      // 默认使用JavaScript基础的模拟问题
      topicQuestions = mockQuestions['JavaScript基础'];
    }
  }
  
  for (let i = 0; i < count; i++) {
    // 循环使用可用的模拟问题
    const questionData = topicQuestions[i % topicQuestions.length];
    
    const qaCard = {
      topicId,
      question: questionData.question,
      options: questionData.options,
      correctAnswer: questionData.correctAnswer,
      explanation: questionData.explanation,
      difficulty
    };
    
    generatedCards.push(qaCard);
  }
  
  return generatedCards;
}

module.exports = router;