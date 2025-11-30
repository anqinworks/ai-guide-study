// pages/statistics/statistics.js
const request = require('../../utils/request')

Page({
  data: {
    // 今日学习统计
    todayStats: {
      todayMinutes: 0,
      targetMinutes: 30,
      progress: 0
    },
    
    // 核心统计数据
    totalQuestions: 0,
    accuracy: 0,
    averageTime: 0,
    totalStudyTime: 0, // 总学习时长（秒）
    totalStudyTimeMinutes: 0, // 总学习时长（分钟），用于显示
    correctQuestions: 0, // 正确题数
    wrongQuestions: 0, // 错题数
    
    // 图表数据
    trendData: [], // 学习趋势数据
    typeData: [], // 题型分布数据
    accuracyData: [], // 正确率分布数据
    wrongQuestionsData: [], // 错题分布数据
    knowledgePointsData: [], // 知识点掌握程度数据
    studyTimeData: [], // 学习时长数据
    
    // 状态管理
    loading: true,
    error: '',
    refreshing: false,
    isDataValid: false,
    dataValidationErrors: [], // 数据验证错误列表
    dataLastUpdated: null, // 数据最后更新时间
    
    // 筛选和视图
    activeTab: 'overview', // 当前激活的标签: overview, trend, type, knowledge
    selectedTimeRange: '7days', // 选择的时间范围: 7days, 30days, all
    
    // 图表状态
    chartsReady: false,
    chartAnimating: false,
    
    // 缓存相关
    cacheTime: 0,
    cacheExpiry: 5 * 60 * 1000, // 5分钟缓存过期
    
    // 性能监控
    loadStartTime: 0,
    dataValidationTime: 0
  },

  onLoad() {
    this.loadStatisticsData()
  },

  onShow() {
    // 页面显示时检查缓存是否过期
    const now = Date.now()
    if (now - this.data.cacheTime > this.data.cacheExpiry) {
      this.loadStatisticsData()
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ refreshing: true })
    this.loadStatisticsData(true)
  },

  // 加载今日学习统计
  async loadTodayStats() {
    try {
      const res = await request.get('/statistics/summary')
      
      if (res.success && res.data) {
        const data = res.data
        
        // 只保留今日相关的数据
        let todayMinutes = parseInt(data.todayMinutes) || 0
        if (isNaN(todayMinutes) || todayMinutes < 0) {
          todayMinutes = 0
        }
        
        let targetMinutes = parseInt(data.targetMinutes) || 30
        if (isNaN(targetMinutes) || targetMinutes <= 0) {
          targetMinutes = 30
        }
        
        // 计算今日进度
        let progress = targetMinutes > 0 
          ? Math.min(100, Math.max(0, Math.round((todayMinutes / targetMinutes) * 100)))
          : 0
        
        if (isNaN(progress) || progress < 0 || progress > 100) {
          progress = Math.max(0, Math.min(100, progress || 0))
        }
        
        // 计算剩余时间（距离目标还差多少分钟）
        let remainingMinutes = Math.max(0, targetMinutes - todayMinutes)
        
        this.setData({
          todayStats: {
            todayMinutes: todayMinutes,
            targetMinutes: targetMinutes,
            progress: progress,
            remainingMinutes: remainingMinutes
          }
        })
        
        console.log('[今日统计] 数据加载成功:', this.data.todayStats)
      } else {
        // 使用默认值
        this.setData({
          todayStats: {
            todayMinutes: 0,
            targetMinutes: 30,
            progress: 0,
            remainingMinutes: 30
          }
        })
      }
    } catch (err) {
      console.error('加载今日学习统计失败', err)
      // 出错时使用默认值
      this.setData({
        todayStats: {
          todayMinutes: 0,
          targetMinutes: 30,
          progress: 0
        }
      })
    }
  },

  // 加载统计数据
  async loadStatisticsData(forceRefresh = false) {
    this.data.loadStartTime = Date.now()
    
    try {
      // 显示加载状态
      this.setData({ 
        loading: true, 
        error: '',
        dataValidationErrors: [],
        chartsReady: false
      })
      
      // 加载今日学习统计
      await this.loadTodayStats()
      
      // 检查缓存
      if (!forceRefresh) {
        const cachedData = this.getCachedData()
        if (cachedData) {
          console.log('[统计数据] 使用缓存数据')
          this.setData({
            ...cachedData,
            loading: false,
            refreshing: false
          })
          this.validateData()
          this.prepareChartData()
          wx.stopPullDownRefresh()
          return
        }
      }
      
      // 从服务器获取数据
      const statsData = await request.authGet('/statistics')
      console.log('[统计数据] 获取到服务器数据:', {
        totalQuestions: statsData.totalQuestions,
        trendDataLength: statsData.trendData?.length || 0,
        typeDataLength: statsData.typeData?.length || 0
      })
      
      // 计算核心指标
      this.calculateStats(statsData)
      
      // 保存图表数据，并处理学习时长数据（转换为分钟）
      const studyTimeData = (statsData.studyTimeData || []).map(item => ({
        ...item,
        timeMinutes: Math.round((item.time || 0) / 60) // 添加分钟数属性
      }))
      
      this.setData({
        trendData: statsData.trendData || [],
        typeData: statsData.typeData || [],
        accuracyData: statsData.accuracyData || [],
        wrongQuestionsData: statsData.wrongQuestionsData || [],
        knowledgePointsData: statsData.knowledgePointsData || [],
        studyTimeData: studyTimeData
      })
      
      // 数据验证
      const validationStart = Date.now()
      this.validateData()
      this.data.dataValidationTime = Date.now() - validationStart
      
      // 准备图表数据
      this.prepareChartData()
      
      // 更新今日统计（确保下拉刷新时也更新）
      await this.loadTodayStats()
      
      // 更新数据
      const loadTime = Date.now() - this.data.loadStartTime
      this.setData({
        loading: false,
        refreshing: false,
        cacheTime: Date.now(),
        dataLastUpdated: new Date().toLocaleTimeString('zh-CN'),
        chartsReady: true
      })
      
      console.log(`[统计数据] 加载完成，耗时: ${loadTime}ms, 验证耗时: ${this.data.dataValidationTime}ms`)
      
      // 缓存数据
      this.cacheData(this.data)
      
      // 数据异常监控
      this.monitorDataAnomalies()
    } catch (err) {
      console.error('[统计数据] 加载失败:', err)
      this.setData({
        error: err.message || '加载数据失败，请重试',
        loading: false,
        refreshing: false
      })
      
      // 尝试使用缓存数据
      const cachedData = this.getCachedData()
      if (cachedData) {
        console.log('[统计数据] 使用缓存数据作为降级方案')
        this.setData({
          ...cachedData,
          loading: false,
          refreshing: false
        })
        this.validateData()
        this.prepareChartData()
      }
    } finally {
      wx.stopPullDownRefresh()
    }
  },

  // 计算核心统计指标
  calculateStats(statsData) {
    // 从服务器数据计算，确保数据精确无误
    const correctQuestions = parseInt(statsData.correctQuestions || 0)
    const wrongQuestions = parseInt(statsData.wrongQuestions || 0)
    const total = correctQuestions + wrongQuestions
    const accuracy = total > 0 ? parseFloat(((correctQuestions / total) * 100).toFixed(1)) : 0
    const averageTime = parseFloat((statsData.averageTime || 0).toFixed(1))
    const totalStudyTime = parseInt(statsData.totalStudyTime || 0)
    // 计算学习时长（分钟），用于显示
    const totalStudyTimeMinutes = Math.round(totalStudyTime / 60)

    this.setData({
      totalQuestions: total,
      accuracy: accuracy,
      averageTime: averageTime,
      totalStudyTime: totalStudyTime,
      totalStudyTimeMinutes: totalStudyTimeMinutes, // 添加分钟数属性
      correctQuestions: correctQuestions,
      wrongQuestions: wrongQuestions
    })
    
    console.log('[统计数据] 核心指标计算完成:', {
      totalQuestions: total,
      correctQuestions,
      wrongQuestions,
      accuracy: `${accuracy}%`,
      averageTime: `${averageTime}s`,
      totalStudyTime: `${totalStudyTime}s`
    })
  },

  // 增强的数据验证机制
  validateData() {
    const validationErrors = []
    const { totalQuestions, correctQuestions, wrongQuestions, accuracy, averageTime, totalStudyTime } = this.data
    
    // 验证1: 总数 = 正确数 + 错误数
    const calculatedTotal = correctQuestions + wrongQuestions
    if (totalQuestions !== calculatedTotal) {
      validationErrors.push(`总数不一致: ${totalQuestions} ≠ ${calculatedTotal}`)
      // 自动修正
      this.setData({ totalQuestions: calculatedTotal })
    }
    
    // 验证2: 正确率计算
    const calculatedAccuracy = totalQuestions > 0 ? 
      parseFloat(((correctQuestions / totalQuestions) * 100).toFixed(1)) : 0
    if (Math.abs(accuracy - calculatedAccuracy) > 0.1) {
      validationErrors.push(`正确率不一致: ${accuracy}% ≠ ${calculatedAccuracy}%`)
      // 自动修正
      this.setData({ accuracy: calculatedAccuracy })
    }
    
    // 验证3: 平均时间合理性（应该在0到合理范围内）
    if (averageTime < 0) {
      validationErrors.push(`平均时间为负数: ${averageTime}`)
      this.setData({ averageTime: 0 })
    }
    if (averageTime > 3600) { // 超过1小时可能异常
      validationErrors.push(`平均时间异常: ${averageTime}s (超过1小时)`)
    }
    
    // 验证4: 总学习时长合理性
    if (totalStudyTime < 0) {
      validationErrors.push(`总学习时长为负数: ${totalStudyTime}`)
      this.setData({ totalStudyTime: 0 })
    }
    
    // 验证5: 图表数据完整性
    if (this.data.trendData.length > 0) {
      const hasInvalidTrendData = this.data.trendData.some(item => 
        !item.date || item.questions === undefined || item.correct === undefined
      )
      if (hasInvalidTrendData) {
        validationErrors.push('趋势数据中存在无效项')
      }
    }
    
    // 验证6: 数据一致性检查（图表数据总和应与核心指标一致）
    if (this.data.typeData.length > 0) {
      const totalFromTypeData = this.data.typeData.reduce((sum, item) => sum + (item.count || 0), 0)
      if (totalQuestions > 0 && Math.abs(totalQuestions - totalFromTypeData) > 1) {
        validationErrors.push(`题型数据总和(${totalFromTypeData})与总数(${totalQuestions})不一致`)
      }
    }
    
    const isDataValid = validationErrors.length === 0
    
    this.setData({ 
      isDataValid,
      dataValidationErrors: validationErrors
    })
    
    if (!isDataValid) {
      console.warn('[统计数据] 数据验证发现问题:', validationErrors)
    } else {
      console.log('[统计数据] 数据验证通过')
    }
  },
  
  // 数据异常监控告警
  monitorDataAnomalies() {
    const anomalies = []
    const { totalQuestions, accuracy, averageTime } = this.data
    
    // 异常1: 正确率异常低
    if (totalQuestions >= 10 && accuracy < 20) {
      anomalies.push({
        type: 'low_accuracy',
        message: `正确率较低(${accuracy}%)，建议加强学习`,
        severity: 'warning'
      })
    }
    
    // 异常2: 答题数量异常多（可能是数据异常）
    if (totalQuestions > 10000) {
      anomalies.push({
        type: 'excessive_questions',
        message: `答题数量异常(${totalQuestions})，请检查数据`,
        severity: 'error'
      })
    }
    
    // 异常3: 平均时间异常
    if (averageTime > 300) { // 超过5分钟
      anomalies.push({
        type: 'long_average_time',
        message: `平均答题时间较长(${averageTime}s)`,
        severity: 'info'
      })
    }
    
    if (anomalies.length > 0) {
      console.warn('[统计数据] 检测到数据异常:', anomalies)
      // 可以在这里发送告警或显示提示
    }
  },
  
  // 准备图表数据
  prepareChartData() {
    // 计算正确率分布的最大值用于百分比计算
    if (this.data.accuracyData && this.data.accuracyData.length > 0) {
      const maxCount = Math.max(...this.data.accuracyData.map(item => item.count || 0))
      const accuracyDataWithPercentage = this.data.accuracyData.map(item => ({
        ...item,
        percentage: maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0
      }))
      this.setData({ accuracyData: accuracyDataWithPercentage })
    }
    
    console.log('[统计数据] 图表数据准备完成')
  },

  // 缓存数据
  cacheData(data) {
    const app = getApp()
    const userId = app.globalData.userInfo?.id || 'anonymous'
    const cacheKey = `statisticsCache_${userId}`
    
    const cacheData = {
      totalQuestions: data.totalQuestions,
      accuracy: data.accuracy,
      averageTime: data.averageTime,
      totalStudyTime: data.totalStudyTime,
      totalStudyTimeMinutes: data.totalStudyTimeMinutes || Math.round((data.totalStudyTime || 0) / 60), // 缓存时也计算分钟数
      correctQuestions: data.correctQuestions,
      wrongQuestions: data.wrongQuestions,
      trendData: data.trendData || [],
      typeData: data.typeData || [],
      accuracyData: data.accuracyData || [],
      wrongQuestionsData: data.wrongQuestionsData || [],
      knowledgePointsData: data.knowledgePointsData || [],
      studyTimeData: (data.studyTimeData || []).map(item => ({
        ...item,
        timeMinutes: item.timeMinutes || Math.round((item.time || 0) / 60) // 确保缓存数据也有分钟数
      })),
      cacheTime: data.cacheTime,
      dataLastUpdated: data.dataLastUpdated
    }
    
    try {
      wx.setStorageSync(cacheKey, cacheData)
      console.log('[统计数据] 数据已缓存')
    } catch (err) {
      console.error('[统计数据] 缓存失败:', err)
    }
  },

  // 获取缓存数据
  getCachedData() {
    const app = getApp()
    const userId = app.globalData.userInfo?.id || 'anonymous'
    const cacheKey = `statisticsCache_${userId}`
    
    try {
      const cacheData = wx.getStorageSync(cacheKey)
      if (cacheData) {
        const now = Date.now()
        if (now - cacheData.cacheTime < this.data.cacheExpiry) {
          return cacheData
        }
      }
    } catch (err) {
      console.error('[统计数据] 读取缓存失败:', err)
    }
    return null
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.activeTab) return
    
    this.setData({
      activeTab: tab,
      chartAnimating: true
    })
    
    // 图表切换动画
    setTimeout(() => {
      this.setData({ chartAnimating: false })
    }, 300)
    
    console.log('[统计数据] 切换到标签:', tab)
  },

  // 切换时间范围
  switchTimeRange(e) {
    const range = e.currentTarget.dataset.range
    if (range === this.data.selectedTimeRange) return
    
    this.setData({
      selectedTimeRange: range,
      chartAnimating: true
    })
    
    // 根据时间范围重新加载数据
    this.loadStatisticsData(true)
    
    console.log('[统计数据] 切换到时间范围:', range)
  },

  // 查看图表详情（数据下钻）
  viewChartDetail(e) {
    const type = e.currentTarget.dataset.type
    const item = e.currentTarget.dataset.item
    
    console.log('[统计数据] 查看图表详情:', type, item)
    
    // 可以根据不同类型显示不同的详情页面
    wx.showModal({
      title: '详细信息',
      content: JSON.stringify(item, null, 2),
      showCancel: false
    })
  },

  // 格式化时间显示
  formatTime(seconds) {
    if (seconds < 60) {
      return `${seconds}秒`
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)}分钟`
    } else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.round((seconds % 3600) / 60)
      return `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`
    }
  },

  // 格式化日期显示
  formatDate(dateStr) {
    if (!dateStr) return ''
    // dateStr 格式为 MM-DD
    return dateStr
  },

  // 获取图表最大值的百分比
  getChartPercentage(value, maxValue) {
    if (!maxValue || maxValue === 0) return 0
    return Math.round((value / maxValue) * 100)
  },

  // 重试加载数据
  retryLoadData() {
    this.loadStatisticsData(true)
  }
})
