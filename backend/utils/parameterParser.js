/**
 * 参数解析模块
 * 准确理解和提取学习目标中的核心能力要求、知识点范围的具体内容边界以及问题类型的格式与难度特征
 */

/**
 * 解析学习目标
 * 提取核心能力要求、技能点、评估标准
 */
function parseLearningGoals(learningGoals) {
  if (!learningGoals || !learningGoals.trim()) {
    return {
      hasGoals: false,
      goals: [],
      capabilities: [],
      skills: [],
      assessmentCriteria: []
    };
  }

  const text = learningGoals.trim();
  const result = {
    hasGoals: true,
    goals: [],
    capabilities: [],      // 核心能力
    skills: [],          // 技能点
    assessmentCriteria: [] // 评估标准
  };

  // 提取能力关键词（常见能力词汇）
  const capabilityKeywords = [
    '理解', '掌握', '应用', '分析', '评估', '创造',
    '记忆', '理解', '应用', '分析', '综合', '评价',
    '熟悉', '精通', '熟练', '了解', '认识', '识别'
  ];

  // 提取技能关键词
  const skillKeywords = [
    '编程', '代码', '算法', '数据结构', '函数', '类', '对象',
    '语法', '语义', '逻辑', '设计', '实现', '调试', '测试',
    '计算', '推导', '证明', '分析', '解决', '优化'
  ];

  // 按行或句号分割
  const sentences = text.split(/[。\n\r；;]/).filter(s => s.trim());

  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    if (!trimmed) return;

    result.goals.push(trimmed);

    // 检测能力要求
    capabilityKeywords.forEach(keyword => {
      if (trimmed.includes(keyword)) {
        const match = trimmed.match(new RegExp(`(${keyword}[^，,。\n]*?)`, 'g'));
        if (match) {
          result.capabilities.push(...match.map(m => m.trim()));
        }
      }
    });

    // 检测技能点
    skillKeywords.forEach(keyword => {
      if (trimmed.includes(keyword)) {
        const match = trimmed.match(new RegExp(`([^，,。\n]*?${keyword}[^，,。\n]*?)`, 'g'));
        if (match) {
          result.skills.push(...match.map(m => m.trim()));
        }
      }
    });

    // 检测评估标准（包含"能够"、"可以"、"应该"等）
    if (trimmed.match(/能够|可以|应该|必须|需要/)) {
      result.assessmentCriteria.push(trimmed);
    }
  });

  // 去重
  result.capabilities = [...new Set(result.capabilities)];
  result.skills = [...new Set(result.skills)];
  result.assessmentCriteria = [...new Set(result.assessmentCriteria)];

  return result;
}

/**
 * 解析知识点范围
 * 提取具体知识点、知识域、知识边界
 */
function parseKnowledgePoints(knowledgePoints) {
  if (!knowledgePoints || !knowledgePoints.trim()) {
    return {
      hasPoints: false,
      points: [],
      domains: [],
      boundaries: []
    };
  }

  const text = knowledgePoints.trim();
  const result = {
    hasPoints: true,
    points: [],      // 具体知识点
    domains: [],     // 知识域
    boundaries: []   // 知识边界（排除的内容）
  };

  // 按逗号、分号、换行分割
  const items = text.split(/[，,；;\n\r]/).filter(item => item.trim());

  items.forEach(item => {
    const trimmed = item.trim();
    if (!trimmed) return;

    // 检测排除标记（如"不包括"、"排除"、"除了"）
    if (trimmed.match(/不包括|排除|除了|不涉及|不包含/)) {
      result.boundaries.push(trimmed.replace(/不包括|排除|除了|不涉及|不包含/g, '').trim());
      return;
    }

    // 检测知识域（如"JavaScript基础"、"数据结构"）
    const domainPatterns = [
      /(.+?)(基础|进阶|高级|入门|深入)/,
      /(.+?)(原理|机制|实现|应用)/,
      /(.+?)(设计|架构|模式)/
    ];

    let isDomain = false;
    for (const pattern of domainPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        result.domains.push(trimmed);
        isDomain = true;
        break;
      }
    }

    if (!isDomain) {
      result.points.push(trimmed);
    }
  });

  // 去重
  result.points = [...new Set(result.points)];
  result.domains = [...new Set(result.domains)];
  result.boundaries = [...new Set(result.boundaries)];

  return result;
}

/**
 * 解析题型要求
 * 提取题型类型、格式特征、难度特征
 */
function parseQuestionTypes(questionTypes) {
  if (!questionTypes || !questionTypes.trim()) {
    return {
      hasTypes: false,
      types: [],
      formats: [],
      difficultyFeatures: []
    };
  }

  const text = questionTypes.trim();
  const result = {
    hasTypes: true,
    types: [],              // 题型类型
    formats: [],            // 格式特征
    difficultyFeatures: [] // 难度特征
  };

  // 常见题型关键词
  const typeKeywords = {
    '代码阅读': ['代码阅读', '代码理解', '代码分析', '阅读代码'],
    '概念理解': ['概念理解', '概念题', '理论题', '概念'],
    '实际应用': ['实际应用', '应用题', '实践题', '应用场景'],
    '计算题': ['计算', '计算题', '数学计算', '数值计算'],
    '判断题': ['判断', '判断题', '对错题'],
    '填空题': ['填空', '填空题', '补全'],
    '代码编写': ['代码编写', '编程题', '实现题', '编写代码']
  };

  // 格式特征关键词
  const formatKeywords = [
    '选择题', '多选题', '单选题', '代码题', '图表题',
    '案例分析', '场景题', '综合题', '组合题'
  ];

  // 难度特征关键词
  const difficultyKeywords = {
    '基础': ['基础', '简单', '入门', '初级'],
    '进阶': ['进阶', '中等', '中级', '提高'],
    '高级': ['高级', '困难', '复杂', '深入', '综合']
  };

  // 按句号、换行分割
  const sentences = text.split(/[。\n\r；;]/).filter(s => s.trim());

  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    if (!trimmed) return;

    // 检测题型
    for (const [type, keywords] of Object.entries(typeKeywords)) {
      if (keywords.some(keyword => trimmed.includes(keyword))) {
        if (!result.types.includes(type)) {
          result.types.push(type);
        }
      }
    }

    // 检测格式特征
    formatKeywords.forEach(keyword => {
      if (trimmed.includes(keyword)) {
        result.formats.push(keyword);
      }
    });

    // 检测难度特征
    for (const [level, keywords] of Object.entries(difficultyKeywords)) {
      if (keywords.some(keyword => trimmed.includes(keyword))) {
        if (!result.difficultyFeatures.includes(level)) {
          result.difficultyFeatures.push(level);
        }
      }
    }
  });

  // 去重
  result.types = [...new Set(result.types)];
  result.formats = [...new Set(result.formats)];
  result.difficultyFeatures = [...new Set(result.difficultyFeatures)];

  return result;
}

/**
 * 综合解析所有参数
 */
function parseAllParameters(learningGoals, knowledgePoints, questionTypes, difficulty) {
  const parsed = {
    learningGoals: parseLearningGoals(learningGoals),
    knowledgePoints: parseKnowledgePoints(knowledgePoints),
    questionTypes: parseQuestionTypes(questionTypes),
    difficulty: difficulty || '中等'
  };

  // 计算参数完整性
  parsed.completeness = {
    hasLearningGoals: parsed.learningGoals.hasGoals,
    hasKnowledgePoints: parsed.knowledgePoints.hasPoints,
    hasQuestionTypes: parsed.questionTypes.hasTypes,
    score: (parsed.learningGoals.hasGoals ? 1 : 0) +
           (parsed.knowledgePoints.hasPoints ? 1 : 0) +
           (parsed.questionTypes.hasTypes ? 1 : 0)
  };

  return parsed;
}

module.exports = {
  parseLearningGoals,
  parseKnowledgePoints,
  parseQuestionTypes,
  parseAllParameters
};

