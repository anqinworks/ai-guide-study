// pages/report/report.js
const feedback = require('../../utils/feedback')
const richTextParser = require('../../utils/richTextParser')

Page({
    data: {
    totalQuestions: 0,
    correctAnswers: 0,
    accuracy: 0,
    totalTime: 0,
    learningSuggestions: null,
    wrongQuestions: [],
    loading: false,
    isHistoryReport: false, // 标识是否为历史会话报告
    accuracyAngle: 0, // 环形图角度
    accuracyProgress: 0 // 环形图进度
  },

  onLoad(options) {
    console.log('[报告页面] onLoad options:', options);
    
    // 如果传入了 sessionId，说明是从答题记录列表跳转过来的历史会话报告
    if (options.sessionId) {
      this.loadHistoryReport(options.sessionId);
    } else {
      // 否则生成当前答题的报告
      this.generateReport();
    }
  },

  /**
   * 加载历史会话报告
   */
  loadHistoryReport(sessionId) {
    console.log('[报告页面] 加载历史会话报告:', sessionId);
    
    this.setData({ loading: true, isHistoryReport: true });
    
    const app = getApp();
    const sessionData = app.globalData.sessionReportData;
    
    if (!sessionData) {
      console.error('[报告页面] 未找到会话数据');
      feedback.showError('报告数据不存在，请重新答题');
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    // 使用会话数据生成报告
    const totalQuestions = sessionData.totalQuestions || 0;
    const correctAnswers = sessionData.correctAnswers || 0;
    const wrongAnswers = sessionData.wrongAnswers || 0;
    const accuracy = sessionData.accuracy || 0;
    
    // 计算总耗时（从题目列表中累加）
    const totalTime = sessionData.questions.reduce((sum, q) => {
      return sum + (parseInt(q.elapsedTime) || 0);
    }, 0) / 1000; // 转换为秒
    
    // 收集错题，并解析Markdown格式
    const wrongQuestions = [];
    sessionData.questions.forEach(question => {
      if (!question.isCorrect) {
        const questionText = question.question || '题目内容未找到';
        const correctAnswerText = question.correctAnswer || '未找到正确答案';
        const explanationText = question.explanation || '';
        
        wrongQuestions.push({
          question: questionText,
          questionHtml: richTextParser.parseRichText(questionText),
          correctAnswer: correctAnswerText,
          correctAnswerHtml: richTextParser.parseRichText(correctAnswerText),
          explanation: explanationText,
          explanationHtml: explanationText ? richTextParser.parseRichText(explanationText) : ''
        });
      }
    });
    
    // 生成学习建议
    const learningSuggestions = this.generateLearningSuggestions(accuracy);
    
    this.setData({
      totalQuestions,
      correctAnswers,
      accuracy: Math.round(accuracy),
      totalTime: Math.round(totalTime * 10) / 10,
      learningSuggestions,
      wrongQuestions,
      loading: false
    });
    
    console.log('[报告页面] 历史会话报告加载完成:', {
      totalQuestions,
      correctAnswers,
      accuracy,
      totalTime
    });
    
    // 设置CSS变量（用于环形图）
    this.setAccuracyChartStyle(Math.round(accuracy));
    
    // 清理临时数据
    app.globalData.sessionReportData = null;
  },

  /**
   * 生成当前答题报告
   */
  generateReport() {
    const app = getApp()
    const qaCards = app.globalData.qaCards || []
    const answerResults = app.globalData.answerResults || []
    
    if (!qaCards || qaCards.length === 0) {
      console.error('[报告页面] 题目数据为空');
      feedback.showError('报告数据不存在，请重新开始学习');
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    console.log('[报告页面] 生成当前答题报告:', {
      qaCardsCount: qaCards.length,
      answerResultsCount: answerResults.length
    });
    
    // 计算统计数据
    const totalQuestions = qaCards.length;
    const validResults = answerResults.filter(result => result !== null && result !== undefined);
    const correctAnswers = validResults.filter(result => result.isCorrect).length;
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    
    // 计算总耗时，转换为秒并保留一位小数
    const totalTimeMs = validResults.reduce((sum, result) => {
      return sum + (parseInt(result.elapsedTime) || 0);
    }, 0);
    const totalTime = Math.round((totalTimeMs / 1000) * 10) / 10;
    
    // 收集错题，并解析Markdown格式
    const wrongQuestions = [];
    validResults.forEach((result, index) => {
      if (result && !result.isCorrect && qaCards[index]) {
        const questionText = qaCards[index].question || '题目内容未找到';
        const correctAnswerText = qaCards[index].correctAnswer || '未找到正确答案';
        const explanationText = qaCards[index].explanation || '';
        
        wrongQuestions.push({
          question: questionText,
          questionHtml: richTextParser.parseRichText(questionText),
          correctAnswer: correctAnswerText,
          correctAnswerHtml: richTextParser.parseRichText(correctAnswerText),
          explanation: explanationText,
          explanationHtml: explanationText ? richTextParser.parseRichText(explanationText) : ''
        });
      }
    });
    
    // 生成学习建议
    const learningSuggestions = this.generateLearningSuggestions(accuracy);
    
    // 设置数据，包括CSS变量--accuracy用于圆形成绩显示
    this.setData({
      totalQuestions,
      correctAnswers,
      accuracy,
      totalTime,
      learningSuggestions,
      wrongQuestions,
      loading: false,
      isHistoryReport: false
    });
    
    // 设置CSS变量（用于环形图）
    this.setAccuracyChartStyle(accuracy);
  },

  /**
   * 生成学习建议
   */
  generateLearningSuggestions(accuracy) {
    let suggestions = {
      level: '',
      icon: '',
      title: '',
      description: '',
      tips: [],
      progress: 0,
      color: ''
    };
    
    if (accuracy >= 90) {
      suggestions = {
        level: '优秀',
        icon: '🌟',
        title: '恭喜你！表现优秀',
        description: '你已经掌握了这个主题的大部分知识，继续保持！',
        tips: [
          '尝试更高难度的学习内容',
          '探索相关的扩展主题',
          '帮助其他学习者解答问题',
          '总结学习经验，形成知识体系'
        ],
        progress: accuracy,
        color: '#52C41A'
      };
    } else if (accuracy >= 70) {
      suggestions = {
        level: '良好',
        icon: '💪',
        title: '表现良好，继续加油',
        description: '你已经掌握了这个主题的基本内容，但还有提升空间。',
        tips: [
          '重点复习错题，加深理解',
          '回顾相关知识点，查漏补缺',
          '多做练习，巩固基础',
          '尝试总结错题规律'
        ],
        progress: accuracy,
        color: '#1890FF'
      };
    } else if (accuracy >= 50) {
      suggestions = {
        level: '需加强',
        icon: '📚',
        title: '需要加强学习',
        description: '你对这个主题有了初步的了解，但需要加强学习。',
        tips: [
          '重新学习相关内容',
          '重点关注基础知识点',
          '多做基础练习',
          '寻求帮助，不要放弃'
        ],
        progress: accuracy,
        color: '#FAAD14'
      };
    } else {
      suggestions = {
        level: '需努力',
        icon: '🎯',
        title: '需要更多努力',
        description: '建议你重新学习这个主题的基础内容，逐步掌握相关知识点。',
        tips: [
          '重新学习基础内容',
          '降低学习难度，循序渐进',
          '多花时间理解概念',
          '保持学习热情，不要气馁'
        ],
        progress: accuracy,
        color: '#FF4D4F'
      };
    }
    
    return suggestions;
  },

  /**
   * 设置学习率图表的样式
   */
  setAccuracyChartStyle(accuracy) {
    // 计算环形图的进度角度
    const progress = Math.min(100, Math.max(0, accuracy));
    const angle = (progress / 100) * 360;
    
    // 设置环形图进度
    this.setData({
      accuracyAngle: angle,
      accuracyProgress: progress
    });
    
    wx.createSelectorQuery().select('.accuracy-ring-chart').boundingClientRect().exec((rects) => {
      if (rects[0]) {
        wx.setNavigationBarColor({ backgroundColor: '#FF7A45' });
      }
    });
  },

  restartLearning() {
    const app = getApp()
    app.globalData.currentCardIndex = 0
    app.globalData.answerResults = []
    
    wx.navigateTo({
      url: '/pages/answer/answer'
    })
  },

  goToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})