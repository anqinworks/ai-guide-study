/**
 * 映射机制模块
 * 在输入参数与测试内容生成规则之间建立明确的关联逻辑
 */

const { parseAllParameters } = require('./parameterParser');

/**
 * 将解析的参数映射为生成规则
 */
function mapParametersToRules(parsedParams) {
  const rules = {
    topicFocus: [],
    questionDistribution: {},
    contentRequirements: [],
    validationCriteria: []
  };

  // 1. 根据学习目标映射题目重点
  if (parsedParams.learningGoals.hasGoals) {
    const goals = parsedParams.learningGoals;
    
    // 能力要求映射
    goals.capabilities.forEach(capability => {
      if (capability.includes('理解') || capability.includes('掌握')) {
        rules.topicFocus.push({
          type: 'concept',
          weight: 0.4,
          description: '重点考察概念理解'
        });
      }
      if (capability.includes('应用') || capability.includes('使用')) {
        rules.topicFocus.push({
          type: 'application',
          weight: 0.5,
          description: '重点考察实际应用'
        });
      }
      if (capability.includes('分析') || capability.includes('评估')) {
        rules.topicFocus.push({
          type: 'analysis',
          weight: 0.6,
          description: '重点考察分析能力'
        });
      }
    });

    // 技能点映射
    goals.skills.forEach(skill => {
      if (skill.includes('代码') || skill.includes('编程')) {
        rules.contentRequirements.push({
          requirement: '必须包含代码示例',
          priority: 'high'
        });
      }
      if (skill.includes('算法') || skill.includes('数据结构')) {
        rules.contentRequirements.push({
          requirement: '必须涉及算法或数据结构',
          priority: 'high'
        });
      }
      if (skill.includes('计算') || skill.includes('推导')) {
        rules.contentRequirements.push({
          requirement: '必须包含计算或推导过程',
          priority: 'medium'
        });
      }
    });
  }

  // 2. 根据知识点范围映射题目分布
  if (parsedParams.knowledgePoints.hasPoints) {
    const points = parsedParams.knowledgePoints;
    
    // 计算每个知识点的权重
    const totalPoints = points.points.length + points.domains.length;
    const weightPerPoint = totalPoints > 0 ? 1.0 / totalPoints : 0;

    // 为每个知识点分配题目
    points.points.forEach((point, index) => {
      rules.questionDistribution[point] = {
        weight: weightPerPoint,
        minQuestions: 1,
        description: `必须包含关于"${point}"的题目`
      };
    });

    points.domains.forEach((domain, index) => {
      rules.questionDistribution[domain] = {
        weight: weightPerPoint * 1.5, // 知识域权重更高
        minQuestions: 1,
        description: `必须包含关于"${domain}"的题目`
      };
    });

    // 排除边界
    if (points.boundaries.length > 0) {
      rules.contentRequirements.push({
        requirement: `明确排除以下内容：${points.boundaries.join('、')}`,
        priority: 'high'
      });
    }
  }

  // 3. 根据难度映射验证标准
  const difficultyLevels = {
    '简单': { complexity: 'low', depth: 'surface', scope: 'single' },
    '中等': { complexity: 'medium', depth: 'moderate', scope: 'multiple' },
    '困难': { complexity: 'high', depth: 'deep', scope: 'comprehensive' }
  };

  const difficultyConfig = difficultyLevels[parsedParams.difficulty] || difficultyLevels['中等'];
  
  rules.validationCriteria.push({
    criterion: 'difficulty',
    level: parsedParams.difficulty,
    config: difficultyConfig,
    description: `题目难度必须符合${parsedParams.difficulty}级别要求`
  });

  return rules;
}

/**
 * 将规则转换为AI提示词片段
 */
function rulesToPromptSections(rules) {
  const sections = [];

  // 题目重点要求
  if (rules.topicFocus.length > 0) {
    const focusDescriptions = rules.topicFocus.map(f => f.description).join('、');
    sections.push(`【题目重点】\n必须重点考察：${focusDescriptions}`);
  }

  // 知识点分布要求
  if (Object.keys(rules.questionDistribution).length > 0) {
    const distributionList = Object.entries(rules.questionDistribution)
      .map(([point, config]) => `- "${point}"：${config.description}`)
      .join('\n');
    sections.push(`【知识点分布】\n题目必须覆盖以下知识点，确保每个知识点至少有一道题：\n${distributionList}`);
  }

  // 内容要求
  if (rules.contentRequirements.length > 0) {
    const highPriority = rules.contentRequirements
      .filter(r => r.priority === 'high')
      .map(r => `- [必须] ${r.requirement}`)
      .join('\n');
    const mediumPriority = rules.contentRequirements
      .filter(r => r.priority === 'medium')
      .map(r => `- [建议] ${r.requirement}`)
      .join('\n');
    
    if (highPriority || mediumPriority) {
      sections.push(`【内容要求】\n${highPriority}${mediumPriority ? '\n' + mediumPriority : ''}`);
    }
  }

  // 验证标准
  if (rules.validationCriteria.length > 0) {
    const criteriaDescriptions = rules.validationCriteria
      .map(c => `- ${c.description}`)
      .join('\n');
    sections.push(`【验证标准】\n生成的内容必须满足以下标准：\n${criteriaDescriptions}`);
  }

  return sections;
}

/**
 * 生成增强的提示词
 */
function generateEnhancedPrompt(topic, difficulty, count, parsedParams, rules) {
  let prompt = `请为"${topic}"主题生成${count}道${difficulty}难度的选择题。\n\n`;

  // 添加学习目标
  if (parsedParams.learningGoals.hasGoals) {
    prompt += `【学习目标】\n`;
    parsedParams.learningGoals.goals.forEach((goal, index) => {
      prompt += `${index + 1}. ${goal}\n`;
    });
    prompt += `\n重要：每道题目必须直接评估上述学习目标的达成情况。题目内容必须与学习目标高度相关，不能生成无关的题目。\n\n`;
  }

  // 添加知识点范围
  if (parsedParams.knowledgePoints.hasPoints) {
    prompt += `【知识点范围】\n`;
    if (parsedParams.knowledgePoints.points.length > 0) {
      prompt += `必须包含的知识点：\n`;
      parsedParams.knowledgePoints.points.forEach((point, index) => {
        prompt += `${index + 1}. ${point}\n`;
      });
    }
    if (parsedParams.knowledgePoints.domains.length > 0) {
      prompt += `\n必须包含的知识域：\n`;
      parsedParams.knowledgePoints.domains.forEach((domain, index) => {
        prompt += `${index + 1}. ${domain}\n`;
      });
    }
    if (parsedParams.knowledgePoints.boundaries.length > 0) {
      prompt += `\n明确排除的内容：\n`;
      parsedParams.knowledgePoints.boundaries.forEach((boundary, index) => {
        prompt += `${index + 1}. ${boundary}\n`;
      });
    }
    prompt += `\n重要：每道题目必须明确涉及上述知识点之一，不能生成超出范围或无关的题目。\n\n`;
  }

  // 添加规则映射的要求
  const ruleSections = rulesToPromptSections(rules);
  if (ruleSections.length > 0) {
    prompt += ruleSections.join('\n\n') + '\n\n';
  }

  // 添加格式要求
  prompt += `【格式要求】
- 代码使用Markdown代码块格式
- 数学公式使用LaTeX语法
- 重要概念使用加粗强调
- 步骤说明使用有序列表

【输出格式】
请按照以下JSON格式返回，不要添加任何额外内容：
[
  {
    "question": "问题内容（必须与学习目标和知识点相关）",
    "options": ["A. 选项内容", "B. 选项内容", "C. 选项内容", "D. 选项内容"],
    "correctAnswer": "A",
    "explanation": "详细的答案解析（必须说明与学习目标和知识点的关联）",
    "relatedGoal": "关联的学习目标",
    "relatedKnowledgePoint": "关联的知识点"
  }
]`;

  return prompt;
}

module.exports = {
  mapParametersToRules,
  rulesToPromptSections,
  generateEnhancedPrompt
};

