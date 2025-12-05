// pages/topic-setting/topic-setting.js
const request = require('../../utils/request')
const feedback = require('../../utils/feedback')
const config = require('../../utils/config')

Page({
  data: {
    topic: '',
    difficulty: config.question.defaultDifficulty,
    cardCount: config.question.defaultCardCount,
    loading: false,
    // 进度相关
    showProgress: false,
    progress: 0,
    progressMessage: '',
    taskId: null,
    progressTimer: null,
    // 等待时间相关
    waitTime: 0,        // 已等待时间（秒）
    waitTimer: null,    // 等待时间计时器
    waitTimeText: '0秒', // 格式化的等待时间文本
    // 高级选项
    showAdvancedOptions: false,
    learningGoals: '',
    knowledgePoints: ''
  },

  onLoad() {
    const app = getApp()
    this.setData({
      topic: app.globalData.currentTopic
    })
  },

  selectDifficulty(e) {
    const difficulty = e.currentTarget.dataset.difficulty
    this.setData({
      difficulty
    })
  },

  onCardCountChange(e) {
    this.setData({
      cardCount: e.detail.value
    })
  },

  async generateCards() {
    const app = getApp()
    
    // 验证输入
    if (!this.data.topic || this.data.topic.trim() === '') {
      feedback.showWarning('请先输入学习主题')
      return
    }
    
    // 设置loading和进度状态
    this.setData({
      loading: true,
      showProgress: true,
      progress: 0,
      progressMessage: '正在准备生成任务...',
      taskId: null,
      waitTime: 0,
      waitTimeText: '0秒'
    })
    
    // 启动等待时间计时器
    this.startWaitTimer()
    
    try {
      // 使用带认证的请求，自动检查登录状态
      // 保存主题
      await request.authPost('/topic/save', {
        topic: this.data.topic,
        difficulty: this.data.difficulty,
        cardCount: this.data.cardCount
      })
      
      // 启动生成任务（异步）- 包含高级选项
      const res = await request.authPost('/ai-qa/generate', {
        topic: this.data.topic,
        difficulty: this.data.difficulty,
        count: this.data.cardCount,
        learningGoals: this.data.learningGoals || '',
        knowledgePoints: this.data.knowledgePoints || ''
      })
      
      // 获取任务ID
      if (res.taskId) {
        this.setData({
          taskId: res.taskId,
          progressMessage: '任务已创建，正在生成题目...'
        })
        
        // 开始轮询进度
        this.startProgressPolling(res.taskId)
      } else {
        throw new Error('创建生成任务失败，请重试')
      }
    } catch (err) {
      console.error('生成卡片失败', err)
      this.stopProgressPolling()
      
      // 认证失败的情况已经在request.js中处理，这里只处理其他错误
      if (err.message !== '未授权，请先登录') {
        feedback.showFormattedError(err, '生成题目失败，请稍后重试')
      }
      
      this.setData({
        loading: false,
        showProgress: false,
        progress: 0,
        progressMessage: '',
        waitTime: 0,
        waitTimeText: '0秒'
      })
      this.stopWaitTimer()
    }
  },

  // 开始轮询进度
  startProgressPolling(taskId) {
    // 清除之前的定时器
    if (this.data.progressTimer) {
      clearInterval(this.data.progressTimer)
    }
    
    // 立即查询一次
    this.queryProgress(taskId)
    
    // 使用配置的轮询间隔
    const config = require('../../utils/config')
    const timer = setInterval(() => {
      this.queryProgress(taskId)
    }, config.polling.progressInterval)
    
    this.setData({
      progressTimer: timer
    })
  },

  // 停止轮询进度
  stopProgressPolling() {
    if (this.data.progressTimer) {
      clearInterval(this.data.progressTimer)
      this.setData({
        progressTimer: null
      })
    }
  },

  // 启动等待时间计时器
  startWaitTimer() {
    // 清除之前的计时器
    this.stopWaitTimer()
    
    // 重置等待时间
    this.setData({
      waitTime: 0,
      waitTimeText: '0秒'
    })
    
    // 每秒更新一次等待时间
    const timer = setInterval(() => {
      const newWaitTime = this.data.waitTime + 1
      this.setData({
        waitTime: newWaitTime,
        waitTimeText: this.formatWaitTime(newWaitTime)
      })
    }, 1000)
    
    this.setData({
      waitTimer: timer
    })
  },

  // 停止等待时间计时器
  stopWaitTimer() {
    if (this.data.waitTimer) {
      clearInterval(this.data.waitTimer)
      this.setData({
        waitTimer: null
      })
    }
  },

  // 格式化等待时间
  formatWaitTime(seconds) {
    if (seconds < 60) {
      return `${seconds}秒`
    } else {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      if (remainingSeconds === 0) {
        return `${minutes}分钟`
      } else {
        return `${minutes}分${remainingSeconds}秒`
      }
    }
  },

  // 查询任务进度
  async queryProgress(taskId) {
    try {
      const res = await request.authGet(`/ai-qa/progress/${taskId}`)
      
      // 更新进度
      this.setData({
        progress: res.progress || 0,
        progressMessage: res.message || '正在处理中，请稍候...'
      })
      
      // 检查任务状态
      if (res.status === 'completed') {
        // 任务完成
        this.stopProgressPolling()
        this.stopWaitTimer()
        
        if (res.result && res.result.cards && res.result.cards.length > 0) {
            const app = getApp()
            app.globalData.qaCards = res.result.cards
            app.globalData.currentCardIndex = 0
            // 初始化answerResults数组为空数组，让它随答题进度增长
            app.globalData.answerResults = []
            
            // 显示完成提示（包含等待时间）
            const waitTimeText = this.data.waitTimeText
            feedback.showSuccess(`成功生成 ${res.result.cards.length} 道题目！用时 ${waitTimeText}`)
          
          // 延迟跳转，让用户看到完成提示
          const config = require('../../utils/config')
          setTimeout(() => {
            this.setData({
              loading: false,
              showProgress: false,
              progress: 0,
              progressMessage: '',
              waitTime: 0,
              waitTimeText: '0秒'
            })
            
            wx.navigateTo({
              url: '/pages/answer/answer'
            })
          }, config.ui.navigationDelay)
        } else {
          throw new Error('未能生成题目，请重新尝试')
        }
      } else if (res.status === 'failed') {
        // 任务失败
        this.stopProgressPolling()
        this.stopWaitTimer()
        
        // 根据错误类型提供更友好的提示
        let errorMessage = res.error || '生成失败，请重试'
        if (res.error && res.error.includes('超时')) {
          errorMessage = '请求超时，可能是网络连接不稳定或AI服务响应较慢。建议：\n1. 检查网络连接\n2. 减少题目数量\n3. 稍后重试'
        } else if (res.error && res.error.includes('连接')) {
          errorMessage = '无法连接到AI服务，请检查网络设置或稍后重试'
        }
        
        throw new Error(errorMessage)
      }
      // 如果状态是pending或processing，继续轮询
    } catch (err) {
      console.error('查询进度失败', err)
      
      // 如果是404，说明任务不存在或已过期
      if (err.message && (err.message.includes('404') || err.message.includes('不存在') || err.message.includes('已过期'))) {
        this.stopProgressPolling()
        this.stopWaitTimer()
        this.setData({
          loading: false,
          showProgress: false,
          progress: 0,
          progressMessage: '',
          waitTime: 0,
          waitTimeText: '0秒'
        })
        
        feedback.showWarning('生成任务已过期，请重新生成')
      } else if (err.message && err.message.includes('无权')) {
        // 权限错误，停止轮询
        this.stopProgressPolling()
        this.stopWaitTimer()
        this.setData({
          loading: false,
          showProgress: false,
          progress: 0,
          progressMessage: '',
          waitTime: 0,
          waitTimeText: '0秒'
        })
        feedback.showFormattedError(err)
      }
      // 其他错误继续轮询，可能是网络问题
    }
  },

  // 切换高级选项显示
  toggleAdvancedOptions() {
    this.setData({
      showAdvancedOptions: !this.data.showAdvancedOptions
    })
  },

  // 学习目标输入
  onLearningGoalsInput(e) {
    this.setData({
      learningGoals: e.detail.value
    })
  },

  // 知识点范围输入
  onKnowledgePointsInput(e) {
    this.setData({
      knowledgePoints: e.detail.value
    })
  },

  // 页面卸载时清理定时器
  onUnload() {
    this.stopProgressPolling()
    this.stopWaitTimer()
  }
})