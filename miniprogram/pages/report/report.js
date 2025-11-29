// pages/report/report.js
const feedback = require('../../utils/feedback')

Page({
  data: {
    totalQuestions: 0,
    correctAnswers: 0,
    accuracy: 0,
    totalTime: 0,
    learningSuggestions: '',
    wrongQuestions: [],
    loading: false,
    isHistoryReport: false // 标识是否为历史会话报告
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
    
    // 收集错题
    const wrongQuestions = [];
    sessionData.questions.forEach(question => {
      if (!question.isCorrect) {
        wrongQuestions.push({
          question: question.question || '题目内容未找到',
          correctAnswer: question.correctAnswer || '未找到正确答案'
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
    
    // 设置CSS变量
    this.setScoreCircleStyle(Math.round(accuracy));
    
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
    
    // 收集错题
    const wrongQuestions = [];
    validResults.forEach((result, index) => {
      if (result && !result.isCorrect && qaCards[index]) {
        wrongQuestions.push({
          question: qaCards[index].question || '题目内容未找到',
          correctAnswer: qaCards[index].correctAnswer || '未找到正确答案'
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
    
    // 设置CSS变量
    this.setScoreCircleStyle(accuracy);
  },

  /**
   * 生成学习建议
   */
  generateLearningSuggestions(accuracy) {
    if (accuracy >= 90) {
      return '恭喜你！你已经掌握了这个主题的大部分知识。建议你尝试更高难度的学习内容，或者探索相关的扩展主题。';
    } else if (accuracy >= 70) {
      return '你已经掌握了这个主题的基本内容，但还有提升空间。建议你重点复习错题，加深对相关知识点的理解。';
    } else if (accuracy >= 50) {
      return '你对这个主题有了初步的了解，但需要加强学习。建议你重新学习相关内容，重点关注基础知识点。';
    } else {
      return '建议你重新学习这个主题的基础内容，逐步掌握相关知识点。可以尝试降低学习难度，循序渐进地提高。';
    }
  },

  /**
   * 设置分数圆圈的样式
   */
  setScoreCircleStyle(accuracy) {
    wx.createSelectorQuery().select('.score-circle').boundingClientRect().exec((rects) => {
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