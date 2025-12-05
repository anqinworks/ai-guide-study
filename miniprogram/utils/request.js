// utils/request.js
const app = getApp()
const feedback = require('./feedback')
const config = require('./config')

// 基础请求函数 - 必须先定义，因为其他函数会调用它
const request = (url, method, data = {}) => {
  return new Promise((resolve, reject) => {
    const fullUrl = config.getApiUrl(url)
    if (config.env.enableDebugLog) {
      console.log(`[Request] ${method} ${fullUrl}`, { data })
    }
    
    wx.request({
      url: fullUrl,
      method,
      data,
      timeout: config.api.timeout,
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
          wx.removeStorageSync(config.auth.tokenKey)
          wx.removeStorageSync(config.auth.userInfoKey)
          
          // 显示登录提示弹窗
          feedback.showLoginPrompt().then(confirmed => {
            if (confirmed) {
              // 跳转到登录页面
              wx.switchTab({
                url: '/pages/user/user'
              })
            }
          })
          
          reject(new Error(config.errorMessages.auth.unauthorized))
        } else {
          const errorMsg = res.data.message || `请求失败 (${res.statusCode})`
          console.error(`[Error] ${method} ${fullUrl} ${res.statusCode}`, { error: res.data })
          reject(new Error(errorMsg))
        }
      },
      fail: err => {
        console.error(`[Network Error] ${method} ${fullUrl}`, { error: err })
        
        // 处理常见网络错误
        let errorMsg = config.errorMessages.network.default
        if (err.errMsg && err.errMsg.includes('ERR_CONNECTION_REFUSED')) {
          errorMsg = config.errorMessages.network.connectionRefused
        } else if (err.errMsg && err.errMsg.includes('timeout')) {
          errorMsg = config.errorMessages.network.timeout
        } else if (err.errMsg && err.errMsg.includes('network')) {
          errorMsg = config.errorMessages.network.networkError
        }
        
        reject(new Error(errorMsg))
      }
    })
  })
}

// 认证状态缓存，避免重复验证
let authCheckPromise = null;
let authCheckTime = 0;

// 检查用户是否登录 - 优化版，避免循环认证
const checkAuth = () => {
  return new Promise((resolve, reject) => {
    const token = app.globalData.token || wx.getStorageSync('token')
    
    if (!token) {
          reject(new Error(config.errorMessages.auth.unauthorized))
      return
    }
    
    // 检查缓存：如果最近验证过且仍在有效期内，直接返回
    const now = Date.now()
    if (authCheckPromise && (now - authCheckTime) < config.auth.cacheTime) {
      authCheckPromise.then(resolve).catch(reject)
      return
    }
    
    // 创建新的验证Promise并缓存
    authCheckPromise = request('/user/info', 'GET', {})
      .then(data => {
        // token有效，更新用户信息和缓存时间
        app.globalData.userInfo = data.user
        authCheckTime = Date.now()
        return true
      })
      .catch(err => {
        console.error('验证token失败', err)
        // token无效，清除本地存储和缓存
        app.globalData.token = ''
        app.globalData.userInfo = null
        authCheckPromise = null
        authCheckTime = 0
        wx.removeStorageSync(config.auth.tokenKey)
        wx.removeStorageSync(config.auth.userInfoKey)
        throw new Error(config.errorMessages.auth.unauthorized)
      })
    
    authCheckTime = now
    authCheckPromise.then(resolve).catch(reject)
  })
}

// 清除认证缓存（用于登出等情况）
const clearAuthCache = () => {
  authCheckPromise = null
  authCheckTime = 0
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
  checkAuth,
  // 清除认证缓存
  clearAuthCache
}
