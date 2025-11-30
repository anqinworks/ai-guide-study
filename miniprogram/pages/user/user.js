// pages/user/user.js
const request = require('../../utils/request')
const feedback = require('../../utils/feedback')
const avatarLibrary = require('../../utils/avatarLibrary')

Page({
  data: {
    userInfo: {},
    isLoggedIn: false,
    loginBtnDisabled: false,
    loginBtnDisabledTime: 0,
    learningStats: {
      todayMinutes: 0,
      totalMinutes: 0,
      targetMinutes: 30,
      continuousDays: 0,
      progress: 0
    },
    learningGoals: []
  },

  onLoad() {
    this.checkLoginStatus()
    this.loadLearningStats()
    this.loadLearningGoals()
  },

  onShow() {
    this.checkLoginStatus()
    this.loadLearningStats()
    this.loadLearningGoals()
  },

  // 检查登录状态
  checkLoginStatus() {
    const app = getApp()
    const token = app.globalData.token || wx.getStorageSync('token')
    
    if (token) {
      // 有token，获取用户信息
      this.getUserInfo()
    } else {
      // 无token，设置为未登录状态
      this.setData({
        isLoggedIn: false,
        userInfo: {}
      })
    }
  },

  async getUserInfo() {
    const app = getApp()
    try {
      const res = await request.get('/user/info')
      const userInfo = res.user
      
      // 如果用户没有头像或头像为空，从图片库中分配
      if (!userInfo.avatar || userInfo.avatar === '') {
        userInfo.avatar = avatarLibrary.getAvatarByUserId(userInfo.id)
      }
      
      app.globalData.userInfo = userInfo
      this.setData({
        userInfo: userInfo,
        isLoggedIn: true
      })
      // 获取用户信息成功后加载学习数据
      this.loadLearningStats()
      this.loadLearningGoals()
    } catch (err) {
      console.error('获取用户信息失败', err)
      // 获取用户信息失败，清除token
      this.logout()
    }
  },

  // 微信授权登录 - 直接在点击事件中调用getUserProfile
  async wxLogin() {
    try {
      // 防止频繁点击
      if (this.data.loginBtnDisabled) {
        return
      }
      
      // 设置按钮禁用状态，防止重复调用
      this.setData({
        loginBtnDisabled: true
      })
      
      // 1. 首先获取用户信息授权 - 必须在用户点击事件的直接上下文执行
      const userProfileRes = await new Promise((resolve, reject) => {
        wx.getUserProfile({
          desc: '用于完善会员资料',
          success: resolve,
          fail: reject
        })
      })
      
      feedback.showLoading('正在登录，请稍候...')
      
      // 2. 获取登录凭证
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        })
      })
      
      if (!loginRes.code) {
        throw new Error('获取登录凭证失败')
      }
      
      // 3. 发送登录凭证和用户信息到服务器
      const serverRes = await request.post('/user/wx-login', {
        code: loginRes.code,
        userInfo: userProfileRes.userInfo
      })
      
      // 4. 保存登录状态
      const app = getApp()
      app.globalData.token = serverRes.token
      app.globalData.userInfo = serverRes.user
      wx.setStorageSync('token', serverRes.token)
      wx.setStorageSync('userInfo', serverRes.user)
      
      // 如果用户没有头像，从图片库中分配
      const userInfo = serverRes.user
      if (!userInfo.avatar || userInfo.avatar === '') {
        userInfo.avatar = avatarLibrary.getAvatarByUserId(userInfo.id)
      }
      
      // 更新登录状态
      this.setData({
        isLoggedIn: true,
        userInfo: userInfo
      })
      
      // 登录成功后加载学习数据
      this.loadLearningStats()
      this.loadLearningGoals()
      
      feedback.hideLoading()
      feedback.showSuccess('登录成功！')
    } catch (err) {
      feedback.hideLoading()
      console.error('微信登录失败', err)
      
      // 处理用户取消授权的情况
      if (err.errMsg && err.errMsg.includes('cancel')) {
        feedback.showInfo('已取消授权')
      } else {
        feedback.showFormattedError(err, '登录失败，请稍后重试')
      }
    } finally {
      // 无论成功失败，5秒后恢复按钮可用状态
      setTimeout(() => {
        this.setData({
          loginBtnDisabled: false
        })
      }, 5000)
    }
  },

  // 加载学习统计数据（从后端API获取真实数据）
  async loadLearningStats() {
    if (!this.data.isLoggedIn) {
      return
    }
    
    try {
      // 从后端API获取统计数据
      const res = await request.get('/statistics/summary')
      
      if (res.success && res.data) {
        const data = res.data
        
        // 数据验证
        const validationErrors = []
        
        // 验证今日学习时长
        let todayMinutes = parseInt(data.todayMinutes) || 0
        if (isNaN(todayMinutes) || todayMinutes < 0) {
          validationErrors.push('今日学习时长数据异常')
          todayMinutes = 0
        }
        
        // 验证总学习时长
        let totalMinutes = parseInt(data.totalMinutes) || 0
        if (isNaN(totalMinutes) || totalMinutes < 0) {
          validationErrors.push('总学习时长数据异常')
          totalMinutes = 0
        }
        
        // 验证每日目标
        let targetMinutes = parseInt(data.targetMinutes) || 30
        if (isNaN(targetMinutes) || targetMinutes <= 0) {
          validationErrors.push('每日目标数据异常，使用默认值30分钟')
          targetMinutes = 30
        }
        
        // 验证连续学习天数
        let continuousDays = parseInt(data.continuousDays) || 0
        if (isNaN(continuousDays) || continuousDays < 0) {
          validationErrors.push('连续学习天数数据异常')
          continuousDays = 0
        }
        
        // 计算今日进度（确保进度在0-100之间）
        let progress = targetMinutes > 0 
          ? Math.min(100, Math.max(0, Math.round((todayMinutes / targetMinutes) * 100)))
          : 0
        
        // 如果进度计算异常，进行修正
        if (isNaN(progress) || progress < 0 || progress > 100) {
          validationErrors.push('进度计算异常，已自动修正')
          progress = Math.max(0, Math.min(100, progress || 0))
        }
        
        // 记录验证错误（如果有）
        if (validationErrors.length > 0) {
          console.warn('[学习统计] 数据验证警告:', validationErrors)
        }
        
        // 如果后端返回了验证错误，也记录
        if (data.validationErrors && data.validationErrors.length > 0) {
          console.warn('[学习统计] 后端数据验证警告:', data.validationErrors)
        }
        
        const learningStats = {
          todayMinutes: todayMinutes,
          totalMinutes: totalMinutes,
          targetMinutes: targetMinutes,
          continuousDays: continuousDays,
          progress: progress,
          lastUpdated: data.lastUpdated || new Date().toISOString()
        }
        
        this.setData({ learningStats })
        
        console.log('[学习统计] 数据加载成功:', learningStats)
      } else {
        // API返回失败，使用默认值
        console.warn('[学习统计] API返回失败，使用默认值')
        this.setData({
          learningStats: {
            todayMinutes: 0,
            totalMinutes: 0,
            targetMinutes: 30,
            continuousDays: 0,
            progress: 0
          }
        })
      }
    } catch (err) {
      console.error('加载学习统计数据失败', err)
      // 出错时使用默认值，避免页面显示错误
      this.setData({
        learningStats: {
          todayMinutes: 0,
          totalMinutes: 0,
          targetMinutes: 30,
          continuousDays: 0,
          progress: 0
        }
      })
    }
  },

  // 加载学习目标（从数据库）
  async loadLearningGoals() {
    if (!this.data.isLoggedIn) {
      return
    }
    
    try {
      const res = await request.get('/learning-goal')
      
      if (res.success && res.goals) {
        // 格式化日期显示并重新计算进度
        const learningGoals = res.goals.map(goal => {
          // 确保进度值在0-100之间
          let progress = parseInt(goal.progress) || 0
          if (isNaN(progress) || progress < 0) {
            progress = 0
          } else if (progress > 100) {
            progress = 100
          }
          
          return {
            ...goal,
            progress: progress, // 确保进度值正确
            targetDate: goal.targetDate ? this.formatGoalDate(goal.targetDate) : null
          }
        })
        
        this.setData({ learningGoals })
        console.log('[学习目标] 加载成功，共', learningGoals.length, '个目标')
      } else {
        // 如果获取失败，设置为空数组
        this.setData({ learningGoals: [] })
      }
    } catch (err) {
      console.error('加载学习目标失败', err)
      // 出错时设置为空数组，避免页面显示错误
      this.setData({ learningGoals: [] })
    }
  },

  // 格式化目标日期
  formatGoalDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 编辑学习目标
  editGoal() {
    wx.navigateTo({
      url: '/pages/goal-setting/goal-setting'
    })
  },

  // 获取今天的日期字符串
  getTodayString() {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  },

  // 获取昨天的日期字符串
  getYesterdayString() {
    const date = new Date()
    date.setDate(date.getDate() - 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  },

  logout() {
    // 清除认证缓存
    const request = require('../../utils/request')
    if (request.clearAuthCache) {
      request.clearAuthCache()
    }
    const app = getApp()
    app.globalData.userInfo = null
    app.globalData.token = ''
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    
    feedback.showSuccess('已退出登录')
    
    this.setData({
      isLoggedIn: false,
      userInfo: {}
    })
  }
})