// pages/answer-record/answer-record.js
const feedback = require('../../utils/feedback')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    answerRecords: [],
    loading: false,
    hasMore: true,
    currentPage: 1,
    pageSize: 10,
    refreshing: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadAnswerRecords();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    if (this.data.answerRecords.length === 0) {
      this.loadAnswerRecords();
    }
  },

  /**
   * 数据准确性校验
   */
  validateRecordAccuracy(record) {
    // 确保答对题数 + 答错题数 = 总题数
    const calculatedTotal = parseInt(record.correctCount) + parseInt(record.wrongCount);
    if (calculatedTotal !== parseInt(record.totalQuestions)) {
      console.warn('答题记录数据不准确，已修正:', record.id);
      // 修正数据，以correctCount和wrongCount为准
      record.totalQuestions = calculatedTotal;
      // 重新计算正确率
      record.accuracy = calculatedTotal > 0 ? ((record.correctCount / calculatedTotal) * 100).toFixed(1) + '%' : '0.0%';
    }
    return record;
  },

  /**
   * 加载答题记录
   */
  loadAnswerRecords() {
    if (this.data.loading || !this.data.hasMore) return;

    this.setData({
      loading: true
    });

    // 调用API获取真实数据
    const request = require('../../utils/request');
    const app = getApp();
    
    // 使用带认证的请求，确保只有当前用户的记录被返回
    request.authGet('/answer/list', {
      page: this.data.currentPage,
      pageSize: this.data.pageSize
    })
    .then(res => {
      let newRecords = [...this.data.answerRecords];
      
      if (res.records && res.records.length > 0) {
        // 数据准确性校验和处理
        const validatedRecords = res.records.map(record => {
          // 添加动画属性
          record.expanded = false;
          // 数据准确性校验
          return this.validateRecordAccuracy(record);
        });
        
        // 后端已经实现了数据隔离，只返回当前用户的记录，无需前端额外过滤
        newRecords = [...newRecords, ...validatedRecords];
        
        // 记录审计日志
        const app = getApp();
        const userId = app.globalData.userInfo?.id;
        if (userId) {
          console.log(`[审计日志] 用户 ${userId} 获取了 ${validatedRecords.length} 条答题记录`);
        }
        
        this.setData({
          answerRecords: newRecords,
          currentPage: this.data.currentPage + 1,
          hasMore: res.hasMore
        });
      } else {
        this.setData({
          hasMore: false
        });
      }

      this.setData({
        loading: false,
        refreshing: false
      });
    })
    .catch(err => {
      console.error('获取答题记录失败:', err);
      feedback.showFormattedError(err, '加载答题记录失败，请稍后重试');
      this.setData({
        loading: false,
        refreshing: false
      });
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({
      refreshing: true,
      answerRecords: [],
      currentPage: 1,
      hasMore: true
    });
    this.loadAnswerRecords();
  },

  /**
   * 上拉加载更多
   */
  loadMore() {
    this.loadAnswerRecords();
  },

  /**
   * 展开/收起答题记录
   */
  toggleRecord(e) {
    const id = e.currentTarget.dataset.id;
    const answerRecords = this.data.answerRecords.map(record => {
      if (record.id === id) {
        return {
          ...record,
          expanded: !record.expanded
        };
      }
      return record;
    });
    this.setData({
      answerRecords
    });
  },

  /**
   * 查看详情
   */
  viewDetail(e) {
    const id = e.currentTarget.dataset.id;
    
    // 从当前记录列表中找到对应的记录
    const record = this.data.answerRecords.find(r => r.id === id);
    
    if (!record) {
      console.error('[答题记录] 未找到对应的记录:', id);
      feedback.showWarning('该答题记录不存在');
      return;
    }
    
    console.log('[答题记录] 准备查看详情:', {
      id,
      topic: record.topic,
      totalQuestions: record.totalQuestions,
      correctCount: record.correctCount
    });
    
    // 将记录数据存储到全局，供报告页面使用
    const app = getApp();
    app.globalData.sessionReportData = {
      topic: record.topic,
      topicId: record.topicId,
      answerTime: record.answerTime,
      totalQuestions: record.totalQuestions,
      correctAnswers: record.correctCount,
      wrongAnswers: record.wrongCount,
      accuracy: parseFloat(record.accuracy.replace('%', '')),
      questions: record.questions || []
    };
    
    // 跳转到报告页面，使用 sessionId 标识这是历史会话报告
    wx.navigateTo({
      url: `/pages/report/report?sessionId=${id}`
    });
  },

  /**
   * 跳转到首页答题
   */
  goToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});