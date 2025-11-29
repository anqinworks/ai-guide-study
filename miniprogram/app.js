// app.js
App({
  globalData: {
    userInfo: null,
    token: wx.getStorageSync('token') || '',
    currentTopic: null,
    qaCards: [],
    currentCardIndex: 0,
    answerResults: [],
    sessionReportData: null // 用于存储历史会话报告数据
  },
  
  onLaunch() {
    // 检查是否已经登录
    this.checkLoginStatus()
  },
  
  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
      // 验证token是否有效
      this.validateToken()
    }
  },
  
  // 验证token有效性
  validateToken() {
    wx.request({
      url: 'http://192.168.1.2:3000/api/user/validate',
      method: 'GET',
      header: {
        'Authorization': `Bearer ${this.globalData.token}`
      },
      success: res => {
        if (res.statusCode === 200) {
          // token有效，更新用户信息
          this.globalData.userInfo = res.data.user
        } else {
          // token无效，清除本地存储
          this.clearLoginInfo()
        }
      },
      fail: err => {
        console.error('验证token失败', err)
        this.clearLoginInfo()
      }
    })
  },
  
  // 清除登录信息
  clearLoginInfo() {
    this.globalData.token = ''
    this.globalData.userInfo = null
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
  },
  
  // 微信授权登录流程
  wxLogin() {
    return new Promise((resolve, reject) => {
      // 1. 获取登录凭证
      wx.login({
        success: loginRes => {
          if (loginRes.code) {
            // 2. 获取用户信息授权
            wx.getUserProfile({
              desc: '用于完善会员资料',
              success: userProfileRes => {
                // 3. 发送登录凭证和用户信息到服务器
                wx.request({
                  url: 'http://192.168.1.2:3000/api/user/wx-login',
                  method: 'POST',
                  data: {
                    code: loginRes.code,
                    userInfo: userProfileRes.userInfo
                  },
                  success: serverRes => {
                    if (serverRes.statusCode === 200 && serverRes.data.token) {
                      // 4. 保存登录状态
                      this.globalData.token = serverRes.data.token
                      this.globalData.userInfo = serverRes.data.user
                      wx.setStorageSync('token', serverRes.data.token)
                      wx.setStorageSync('userInfo', serverRes.data.user)
                      resolve(serverRes.data)
                    } else {
                      reject(new Error('登录失败：' + (serverRes.data.message || '服务器错误')))
                    }
                  },
                  fail: err => {
                    reject(new Error('登录请求失败：' + err.errMsg))
                  }
                })
              },
              fail: err => {
                // 用户拒绝授权
                reject(new Error('授权失败：' + err.errMsg))
              }
            })
          } else {
            reject(new Error('获取登录凭证失败：' + loginRes.errMsg))
          }
        },
        fail: err => {
          reject(new Error('登录失败：' + err.errMsg))
        }
      })
    })
  }
})
