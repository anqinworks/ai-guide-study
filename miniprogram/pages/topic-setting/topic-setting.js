// pages/topic-setting/topic-setting.js
const request = require('../../utils/request')
const feedback = require('../../utils/feedback')

Page({
  data: {
    topic: '',
    difficulty: '简单',
    cardCount: 10,
    autoPlay: false,
    voicePrompt: true,
    loading: false,
    // 进度相关
    showProgress: false,
    progress: 0,
    progressMessage: '',
    taskId: null,
    progressTimer: null
  },

  onLoad() {
    const app = getApp()
    this.setData({
      topic: app.globalData.currentTopic,
      // 从本地存储恢复设置
      autoPlay: wx.getStorageSync('autoPlay') || false,
      voicePrompt: wx.getStorageSync('voicePrompt') || true
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

  onAutoPlayChange(e) {
    const autoPlay = e.detail.value
    this.setData({ autoPlay })
    wx.setStorageSync('autoPlay', autoPlay)
  },

  onVoicePromptChange(e) {
    const voicePrompt = e.detail.value
    this.setData({ voicePrompt })
    wx.setStorageSync('voicePrompt', voicePrompt)
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
      taskId: null
    })
    
    try {
      // 使用带认证的请求，自动检查登录状态
      // 保存主题
      await request.authPost('/topic/save', {
        topic: this.data.topic,
        difficulty: this.data.difficulty,
        cardCount: this.data.cardCount
      })
      
      // 启动生成任务（异步）
      const res = await request.authPost('/ai-qa/generate', {
        topic: this.data.topic,
        difficulty: this.data.difficulty,
        count: this.data.cardCount
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
        progressMessage: ''
      })
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
    
    // 每500ms轮询一次进度
    const timer = setInterval(() => {
      this.queryProgress(taskId)
    }, 500)
    
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
        
        if (res.result && res.result.cards && res.result.cards.length > 0) {
          const app = getApp()
          app.globalData.qaCards = res.result.cards
          app.globalData.currentCardIndex = 0
          // 初始化answerResults数组，确保长度与qaCards一致
          app.globalData.answerResults = new Array(res.result.cards.length).fill(null)
          
          // 显示完成提示
          feedback.showSuccess(`成功生成 ${res.result.cards.length} 道题目！`)
          
          // 延迟跳转，让用户看到完成提示
          setTimeout(() => {
            this.setData({
              loading: false,
              showProgress: false,
              progress: 0,
              progressMessage: ''
            })
            
            wx.navigateTo({
              url: '/pages/answer/answer'
            })
          }, 500)
        } else {
          throw new Error('未能生成题目，请重新尝试')
        }
      } else if (res.status === 'failed') {
        // 任务失败
        this.stopProgressPolling()
        throw new Error(res.error || '生成失败，请重试')
      }
      // 如果状态是pending或processing，继续轮询
    } catch (err) {
      console.error('查询进度失败', err)
      
      // 如果是404，说明任务不存在或已过期
      if (err.message && (err.message.includes('404') || err.message.includes('不存在') || err.message.includes('已过期'))) {
        this.stopProgressPolling()
        this.setData({
          loading: false,
          showProgress: false,
          progress: 0,
          progressMessage: ''
        })
        
        feedback.showWarning('生成任务已过期，请重新生成')
      } else if (err.message && err.message.includes('无权')) {
        // 权限错误，停止轮询
        this.stopProgressPolling()
        this.setData({
          loading: false,
          showProgress: false,
          progress: 0,
          progressMessage: ''
        })
        feedback.showFormattedError(err)
      }
      // 其他错误继续轮询，可能是网络问题
    }
  },

  // 页面卸载时清理定时器
  onUnload() {
    this.stopProgressPolling()
  }
})