// utils/request.js
const app = getApp()
const feedback = require('./feedback')

// 基础请求函数 - 必须先定义，因为其他函数会调用它
const request = (url, method, data = {}) => {
  return new Promise((resolve, reject) => {
    const fullUrl = `http://192.168.1.2:3000/api${url}`
    console.log(`[Request] ${method} ${fullUrl}`, { data })
    
    wx.request({
      url: fullUrl,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': app.globalData.token ? `Bearer ${app.globalData.token}` : ''
      },
      success: res => {
        console.log(`[Response] ${method} ${fullUrl} ${res.statusCode}`, { data: res.data })
        
        if (res.statusCode === 200 || res.statusCode === 202) {
          // 200: 成功, 202: 已接受（异步任务）
          resolve(res.data)
        } else if (res.statusCode === 401) {
          // 未授权，清除本地token和用户信息
          app.globalData.token = ''
          app.globalData.userInfo = null
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          
          // 显示登录提示弹窗
          feedback.showLoginPrompt().then(confirmed => {
            if (confirmed) {
              // 跳转到登录页面
              wx.switchTab({
                url: '/pages/user/user'
              })
            }
          })
          
          reject(new Error('未授权，请先登录'))
        } else {
          const errorMsg = res.data.message || `请求失败 (${res.statusCode})`
          console.error(`[Error] ${method} ${fullUrl} ${res.statusCode}`, { error: res.data })
          reject(new Error(errorMsg))
        }
      },
      fail: err => {
        console.error(`[Network Error] ${method} ${fullUrl}`, { error: err })
        
        // 处理常见网络错误
        let errorMsg = '网络请求失败，请稍后重试'
        if (err.errMsg && err.errMsg.includes('ERR_CONNECTION_REFUSED')) {
          errorMsg = '服务器连接失败，请检查服务器是否运行'
        } else if (err.errMsg && err.errMsg.includes('timeout')) {
          errorMsg = '网络请求超时，请检查网络连接'
        } else if (err.errMsg && err.errMsg.includes('network')) {
          errorMsg = '网络连接异常，请检查网络设置'
        }
        
        reject(new Error(errorMsg))
      }
    })
  })
}

// 检查用户是否登录 - 必须在request函数定义之后
const checkAuth = () => {
  return new Promise((resolve, reject) => {
    const token = app.globalData.token || wx.getStorageSync('token')
    if (token) {
      // 验证token是否有效，使用现有的 /user/info 接口
      request('/user/info', 'GET', {})
        .then(data => {
          // token有效，更新用户信息
          app.globalData.userInfo = data.user
          resolve(true)
        })
        .catch(err => {
          console.error('验证token失败', err)
          // token无效，清除本地存储
          app.globalData.token = ''
          app.globalData.userInfo = null
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          reject(new Error('未授权，请先登录'))
        })
    } else {
      reject(new Error('未授权，请先登录'))
    }
  })
}

// 带认证的请求 - 必须在request和checkAuth函数定义之后
const authRequest = async (url, method, data = {}) => {
  try {
    // 检查登录状态
    await checkAuth()
    // 发送请求
    return request(url, method, data)
  } catch (err) {
    // 显示登录提示弹窗
    feedback.showLoginPrompt().then(confirmed => {
      if (confirmed) {
        // 跳转到登录页面
        wx.switchTab({
          url: '/pages/user/user'
        })
      }
    })
    throw err
  }
}

module.exports = {
  get: (url, data) => request(url, 'GET', data),
  post: (url, data) => request(url, 'POST', data),
  put: (url, data) => request(url, 'PUT', data),
  delete: (url, data) => request(url, 'DELETE', data),
  // 带认证的请求方法
  authGet: (url, data) => authRequest(url, 'GET', data),
  authPost: (url, data) => authRequest(url, 'POST', data),
  authPut: (url, data) => authRequest(url, 'PUT', data),
  authDelete: (url, data) => authRequest(url, 'DELETE', data),
  // 检查登录状态
  checkAuth
}
