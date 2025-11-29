// pages/user/user.js
const request = require('../../utils/request')
const feedback = require('../../utils/feedback')

Page({
  data: {
    userInfo: {},
    isLoggedIn: false,
    loginBtnDisabled: false,
    loginBtnDisabledTime: 0,
    checkinData: {
      isCheckedToday: false,
      continuousDays: 0,
      totalDays: 0,
      lastCheckinDate: '',
      todayReward: ''
    }
  },

  onLoad() {
    this.checkLoginStatus()
    this.loadCheckinData()
  },

  onShow() {
    this.checkLoginStatus()
    this.loadCheckinData()
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
      app.globalData.userInfo = res.user
      this.setData({
        userInfo: res.user,
        isLoggedIn: true
      })
      // 获取用户信息成功后加载签到数据
      this.loadCheckinData()
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
      
      // 更新登录状态
      this.setData({
        isLoggedIn: true,
        userInfo: serverRes.user
      })
      
      // 登录成功后加载签到数据
      this.loadCheckinData()
      
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

  // 加载签到数据
  loadCheckinData() {
    if (!this.data.isLoggedIn) {
      return
    }
    
    try {
      const userId = this.data.userInfo.id || 'default'
      const checkinKey = `checkin_${userId}`
      const storedData = wx.getStorageSync(checkinKey)
      
      const today = this.getTodayString()
      let checkinData = {
        isCheckedToday: false,
        continuousDays: 0,
        totalDays: 0,
        lastCheckinDate: '',
        todayReward: ''
      }
      
      if (storedData) {
        checkinData = JSON.parse(storedData)
        // 检查今天是否已签到
        checkinData.isCheckedToday = checkinData.lastCheckinDate === today
        
        // 如果上次签到不是昨天，重置连续签到天数
        const yesterday = this.getYesterdayString()
        if (!checkinData.isCheckedToday && checkinData.lastCheckinDate !== yesterday) {
          checkinData.continuousDays = 0
        }
      }
      
      // 计算今日奖励
      if (!checkinData.isCheckedToday) {
        checkinData.todayReward = this.calculateReward(checkinData.continuousDays)
      }
      
      this.setData({ checkinData })
    } catch (err) {
      console.error('加载签到数据失败', err)
    }
  },

  // 处理签到
  handleCheckin() {
    if (this.data.checkinData.isCheckedToday) {
      return
    }
    
    try {
      const userId = this.data.userInfo.id || 'default'
      const checkinKey = `checkin_${userId}`
      const today = this.getTodayString()
      const yesterday = this.getYesterdayString()
      
      let checkinData = { ...this.data.checkinData }
      
      // 判断是否连续签到
      if (checkinData.lastCheckinDate === yesterday) {
        // 连续签到
        checkinData.continuousDays = (checkinData.continuousDays || 0) + 1
      } else if (checkinData.lastCheckinDate !== today) {
        // 中断后重新开始
        checkinData.continuousDays = 1
      }
      
      checkinData.totalDays = (checkinData.totalDays || 0) + 1
      checkinData.lastCheckinDate = today
      checkinData.isCheckedToday = true
      // 使用更新后的连续签到天数计算奖励
      checkinData.todayReward = this.calculateReward(checkinData.continuousDays)
      
      // 保存到本地存储
      wx.setStorageSync(checkinKey, JSON.stringify(checkinData))
      
      // 更新UI
      this.setData({ checkinData })
      
      // 显示签到成功提示
      const rewardText = checkinData.todayReward || '鼓励'
      feedback.showSuccess(`签到成功！获得${rewardText} 🎉`)
      
      // 添加签到动画效果
      this.triggerCheckinAnimation()
    } catch (err) {
      console.error('签到失败', err)
      feedback.showError('签到失败，请稍后重试')
    }
  },

  // 计算奖励
  calculateReward(continuousDays) {
    if (continuousDays >= 30) {
      return '超级奖励'
    } else if (continuousDays >= 14) {
      return '丰厚奖励'
    } else if (continuousDays >= 7) {
      return '特别奖励'
    } else if (continuousDays >= 3) {
      return '额外奖励'
    } else {
      return '基础奖励'
    }
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

  // 触发签到动画
  triggerCheckinAnimation() {
    // 简单的动画效果，可以通过CSS实现
    this.setData({
      'checkinData.animation': true
    })
    setTimeout(() => {
      this.setData({
        'checkinData.animation': false
      })
    }, 1000)
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