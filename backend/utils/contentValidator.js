/**
 * 内容验证组件
 * 对生成的测试材料进行多维度检查
 */

/**
 * 验证知识点覆盖率
 */
function validateKnowledgeCoverage(cards, knowledgePoints) {
  if (!knowledgePoints.hasPoints) {
    return { valid: true, score: 1.0, details: [] };
  }

  const requiredPoints = [
    ...knowledgePoints.points,
    ...knowledgePoints.domains
  ];

  const coveredPoints = new Set();
  const coverageDetails = [];

  cards.forEach((card, index) => {
    const questionText = (card.question || '').toLowerCase();
    const explanationText = (card.explanation || '').toLowerCase();
    const combinedText = questionText + ' ' + explanationText;

    requiredPoints.forEach(point => {
      const pointLower = point.toLowerCase();
      // 检查知识点是否在题目或解析中出现
      if (combinedText.includes(pointLower) || 
          (card.relatedKnowledgePoint && card.relatedKnowledgePoint.toLowerCase().includes(pointLower))) {
        coveredPoints.add(point);
        coverageDetails.push({
          cardIndex: index,
          point: point,
          found: true
        });
      }
    });
  });

  const coverageRate = requiredPoints.length > 0 
    ? coveredPoints.size / requiredPoints.length 
    : 1.0;

  const missingPoints = requiredPoints.filter(p => !coveredPoints.has(p));

  return {
    valid: coverageRate >= 0.8, // 至少80%覆盖率
    score: coverageRate,
    details: coverageDetails,
    missingPoints: missingPoints,
    message: coverageRate >= 0.8 
      ? `知识点覆盖率：${(coverageRate * 100).toFixed(1)}%`
      : `知识点覆盖率不足：${(coverageRate * 100).toFixed(1)}%，缺失：${missingPoints.join('、')}`
  };
}

/**
 * 验证难度匹配度
 */
function validateDifficultyMatch(cards, difficulty) {
  const difficultyKeywords = {
    '简单': {
      required: ['基础', '简单', '基本', '入门'],
      avoid: ['复杂', '高级', '深入', '综合']
    },
    '中等': {
      required: ['应用', '理解', '分析'],
      avoid: ['基础', '简单', '复杂', '高级']
    },
    '困难': {
      required: ['复杂', '高级', '深入', '综合', '分析', '评估'],
      avoid: ['基础', '简单', '入门']
    }
  };

  const config = difficultyKeywords[difficulty] || difficultyKeywords['中等'];
  let matchCount = 0;
  const matchDetails = [];

  cards.forEach((card, index) => {
    const questionText = (card.question || '').toLowerCase();
    const explanationText = (card.explanation || '').toLowerCase();
    const combinedText = questionText + ' ' + explanationText;

    // 检查是否包含难度关键词
    const hasRequired = config.required.some(keyword => 
      combinedText.includes(keyword.toLowerCase())
    );
    const hasAvoid = config.avoid.some(keyword => 
      combinedText.includes(keyword.toLowerCase())
    );

    const matches = hasRequired && !hasAvoid;
    if (matches) {
      matchCount++;
    }

    matchDetails.push({
      cardIndex: index,
      matches: matches,
      hasRequired: hasRequired,
      hasAvoid: hasAvoid
    });
  }

  const matchRate = cards.length > 0 ? matchCount / cards.length : 0;

  return {
    valid: matchRate >= 0.7, // 至少70%匹配度
    score: matchRate,
    details: matchDetails,
    message: matchRate >= 0.7
      ? `难度匹配度：${(matchRate * 100).toFixed(1)}%`
      : `难度匹配度不足：${(matchRate * 100).toFixed(1)}%`
  };
}

/**
 * 验证题型符合度
 */
function validateQuestionTypeCompliance(cards, questionTypes) {
  if (!questionTypes.hasTypes) {
    return { valid: true, score: 1.0, details: [] };
  }

  const typeKeywords = {
    '代码阅读': ['代码', 'function', '代码片段', '程序', '代码执行'],
    '概念理解': ['概念', '定义', '原理', '机制', '是什么', '什么是'],
    '实际应用': ['应用', '场景', '实际', '案例', '使用', '如何'],
    '计算题': ['计算', '等于', '结果', '值', '多少', '求出'],
    '代码编写': ['编写', '实现', '代码', '函数', '程序']
  };

  const requiredTypes = questionTypes.types;
  const typeDistribution = {};
  const typeDetails = [];

  requiredTypes.forEach(type => {
    typeDistribution[type] = 0;
  });

  cards.forEach((card, index) => {
    const questionText = (card.question || '').toLowerCase();
    const explanationText = (card.explanation || '').toLowerCase();
    const combinedText = questionText + ' ' + explanationText;

    const cardTypes = [];
    requiredTypes.forEach(type => {
      const keywords = typeKeywords[type] || [];
      if (keywords.some(keyword => combinedText.includes(keyword.toLowerCase()))) {
        typeDistribution[type]++;
        cardTypes.push(type);
      }
    });

    typeDetails.push({
      cardIndex: index,
      types: cardTypes
    });
  });

  // 检查每种题型是否至少有一道题
  const allTypesCovered = requiredTypes.every(type => 
    typeDistribution[type] > 0
  );

  const avgDistribution = requiredTypes.length > 0
    ? requiredTypes.reduce((sum, type) => sum + typeDistribution[type], 0) / requiredTypes.length
    : 0;

  const complianceScore = allTypesCovered ? 1.0 : 0.5;

  return {
    valid: allTypesCovered,
    score: complianceScore,
    distribution: typeDistribution,
    details: typeDetails,
    message: allTypesCovered
      ? `题型符合度：100%，已覆盖所有要求的题型`
      : `题型符合度不足，缺失题型：${requiredTypes.filter(t => typeDistribution[t] === 0).join('、')}`
  };
}

/**
 * 验证与学习目标的相关性
 */
function validateGoalRelevance(cards, learningGoals) {
  if (!learningGoals.hasGoals) {
    return { valid: true, score: 1.0, details: [] };
  }

  const goals = learningGoals.goals;
  const capabilities = learningGoals.capabilities;
  const skills = learningGoals.skills;

  let relevantCount = 0;
  const relevanceDetails = [];

  cards.forEach((card, index) => {
    const questionText = (card.question || '').toLowerCase();
    const explanationText = (card.explanation || '').toLowerCase();
    const combinedText = questionText + ' ' + explanationText;

    // 检查是否与学习目标相关
    const hasGoalMatch = goals.some(goal => {
      const goalKeywords = goal.split(/[，,。\s]/).filter(w => w.length > 1);
      return goalKeywords.some(keyword => 
        combinedText.includes(keyword.toLowerCase())
      );
    });

    const hasCapabilityMatch = capabilities.some(capability => {
      const capKeywords = capability.split(/[，,。\s]/).filter(w => w.length > 1);
      return capKeywords.some(keyword => 
        combinedText.includes(keyword.toLowerCase())
      );
    });

    const hasSkillMatch = skills.some(skill => {
      const skillKeywords = skill.split(/[，,。\s]/).filter(w => w.length > 1);
      return skillKeywords.some(keyword => 
        combinedText.includes(keyword.toLowerCase())
      );
    });

    const isRelevant = hasGoalMatch || hasCapabilityMatch || hasSkillMatch || 
                      (card.relatedGoal && card.relatedGoal.trim());

    if (isRelevant) {
      relevantCount++;
    }

    relevanceDetails.push({
      cardIndex: index,
      relevant: isRelevant,
      hasGoalMatch,
      hasCapabilityMatch,
      hasSkillMatch,
      relatedGoal: card.relatedGoal || null
    });
  });

  const relevanceRate = cards.length > 0 ? relevantCount / cards.length : 0;

  return {
    valid: relevanceRate >= 0.8, // 至少80%相关性
    score: relevanceRate,
    details: relevanceDetails,
    message: relevanceRate >= 0.8
      ? `学习目标相关性：${(relevanceRate * 100).toFixed(1)}%`
      : `学习目标相关性不足：${(relevanceRate * 100).toFixed(1)}%`
  };
}

/**
 * 综合验证
 */
function validateAll(cards, parsedParams) {
  const validations = {
    knowledgeCoverage: validateKnowledgeCoverage(cards, parsedParams.knowledgePoints),
    difficultyMatch: validateDifficultyMatch(cards, parsedParams.difficulty),
    questionTypeCompliance: validateQuestionTypeCompliance(cards, parsedParams.questionTypes),
    goalRelevance: validateGoalRelevance(cards, parsedParams.learningGoals)
  };

  // 计算综合得分
  const scores = Object.values(validations).map(v => v.score);
  const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  // 判断是否全部通过
  const allValid = Object.values(validations).every(v => v.valid);

  return {
    valid: allValid,
    overallScore: overallScore,
    validations: validations,
    summary: {
      knowledgeCoverage: validations.knowledgeCoverage.message,
      difficultyMatch: validations.difficultyMatch.message,
      questionTypeCompliance: validations.questionTypeCompliance.message,
      goalRelevance: validations.goalRelevance.message
    }
  };
}

module.exports = {
  validateKnowledgeCoverage,
  validateDifficultyMatch,
  validateQuestionTypeCompliance,
  validateGoalRelevance,
  validateAll
};

