// pages/user/user.js
const request = require('../../utils/request')
const feedback = require('../../utils/feedback')

Page({
  data: {
    userInfo: {},
    isLoggedIn: false,
    loginBtnDisabled: false,
    loginBtnDisabledTime: 0
  },

  onLoad() {
    this.checkLoginStatus()
  },

  onShow() {
    this.checkLoginStatus()
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

  goToHistory() {
    feedback.showInfo('该功能正在开发中，敬请期待')
  },

  goToSettings() {
    feedback.showInfo('该功能正在开发中，敬请期待')
  },

  logout() {
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